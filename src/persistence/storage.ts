/**
 * localStorage-backed scene library + JSON export/import.
 *
 * Every localStorage access is wrapped in try/catch so the app degrades
 * gracefully in private-mode browsers, when quota is exceeded, or when
 * localStorage is entirely absent (e.g. the node test environment without a
 * stub). All reads pass loaded data through `migrateScene`/`sanitizeScene`, so
 * nothing untrusted ever reaches the rest of the app.
 */
import { type SceneState } from '../types'
import { migrateScene, sanitizeScene } from './scene'

/** Namespaced, versioned storage key. Bump the suffix on a storage-shape change. */
const STORAGE_KEY = 'mchord:scenes:v1'
const AUTOSAVE_KEY = 'mchord:autosave:v1'

/** A named, timestamped saved scene. */
export interface SavedScene {
  name: string
  scene: SceneState
  savedAt: number
}

/** The most recent working scene, maintained automatically while the app is open. */
export interface AutosavedScene {
  scene: SceneState
  savedAt: number
}

// ---------------------------------------------------------------------------
// localStorage access (all guarded)
// ---------------------------------------------------------------------------

/** Return the global localStorage if usable, else null. Never throws. */
function getStore(): Storage | null {
  try {
    const ls = globalThis.localStorage
    return ls ?? null
  } catch {
    // Accessing the property can itself throw in some sandboxed contexts.
    return null
  }
}

function readRaw(): unknown {
  const store = getStore()
  if (!store) return null
  try {
    const text = store.getItem(STORAGE_KEY)
    if (text === null) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

function writeAll(entries: SavedScene[]): void {
  const store = getStore()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Quota exceeded / private mode — silently drop. Callers treat persistence
    // as best-effort.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Parse a single stored entry into a SavedScene, or null if unrecoverable. */
function parseEntry(raw: unknown): SavedScene | null {
  if (!isRecord(raw)) return null
  if (typeof raw.name !== 'string' || raw.name.length === 0) return null
  const savedAt =
    typeof raw.savedAt === 'number' && Number.isFinite(raw.savedAt) ? raw.savedAt : 0
  // Always migrate+sanitise the stored scene; a corrupt scene is still salvaged
  // into a valid default-ish scene rather than dropping the named entry.
  const scene = migrateScene(raw.scene)
  return { name: raw.name, scene, savedAt }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * All saved scenes, newest first. Corrupt entries are skipped rather than
 * throwing. Returns [] if storage is unavailable or empty.
 */
export function listScenes(): SavedScene[] {
  const raw = readRaw()
  if (!Array.isArray(raw)) return []
  const out: SavedScene[] = []
  for (const entry of raw) {
    const parsed = parseEntry(entry)
    if (parsed) out.push(parsed)
  }
  // Newest first, then name for stable ordering of same-timestamp entries.
  out.sort((a, b) => b.savedAt - a.savedAt || a.name.localeCompare(b.name))
  return out
}

/**
 * Save (or overwrite, by name) a scene. The scene is sanitised before storing,
 * so the library can never contain invalid state. No-op if storage is
 * unavailable.
 */
export function saveScene(name: string, scene: SceneState): void {
  const trimmed = name.trim()
  if (trimmed.length === 0) return
  const entries = listScenes()
  const next: SavedScene = {
    name: trimmed,
    scene: sanitizeScene(scene),
    savedAt: Date.now(),
  }
  const without = entries.filter((e) => e.name !== trimmed)
  without.push(next)
  writeAll(without)
}

/** Load a scene by name, or null if not found / storage unavailable. */
export function loadScene(name: string): SceneState | null {
  const entry = listScenes().find((e) => e.name === name)
  return entry ? entry.scene : null
}

/** Delete a scene by name. No-op if absent or storage unavailable. */
export function deleteScene(name: string): void {
  const entries = listScenes()
  const without = entries.filter((e) => e.name !== name)
  if (without.length !== entries.length) writeAll(without)
}

/**
 * Persist the current working scene for the next launch. Returns false when
 * browser storage is unavailable or rejects the write.
 */
export function saveAutosavedScene(scene: SceneState): boolean {
  const store = getStore()
  if (!store) return false
  try {
    const snapshot: AutosavedScene = {
      scene: sanitizeScene(scene),
      savedAt: Date.now(),
    }
    store.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot))
    return true
  } catch {
    return false
  }
}

/** Load the last working scene, validating it at the storage boundary. */
export function loadAutosavedScene(): AutosavedScene | null {
  const store = getStore()
  if (!store) return null
  try {
    const text = store.getItem(AUTOSAVE_KEY)
    if (text === null) return null
    const raw: unknown = JSON.parse(text)
    if (!isRecord(raw)) return null
    const savedAt =
      typeof raw.savedAt === 'number' && Number.isFinite(raw.savedAt) ? raw.savedAt : 0
    return { scene: migrateScene(raw.scene), savedAt }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// JSON export / import (readable, human-editable)
// ---------------------------------------------------------------------------

/** Serialise a scene to pretty, human-readable JSON. Sanitised first. */
export function exportSceneJSON(scene: SceneState): string {
  return JSON.stringify(sanitizeScene(scene), null, 2)
}

/**
 * Parse exported JSON back into a valid scene: parse → migrate → sanitise.
 * Returns null only on JSON-parse failure; any structurally-valid JSON is
 * salvaged into a valid scene.
 */
export function importSceneJSON(text: string): SceneState | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  return migrateScene(parsed)
}
