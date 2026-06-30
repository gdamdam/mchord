import {
  SCENE_VERSION,
  SLOT_COUNT,
  type SceneState,
  type Slot,
} from '../types'

/**
 * Pitch classes for a C major scale's I–V–vi–IV progression: C, G, Am, F.
 * Kept inline (rather than computed) so the default is a fixed, reviewable
 * value and never depends on the harmony engine.
 */
const C = 0
const F = 5
const G = 7
const A = 9

/** An empty slot at the default duration (1 bar). */
function emptySlot(): Slot {
  return { chord: null, durationBars: 1 }
}

/**
 * A pleasant, immediately-playable default scene used both on first run and as
 * the fallback skeleton for sanitisation. C major, a I–V–vi–IV progression in
 * the first four slots, the rest empty.
 *
 * Returns a fresh object every call (no shared mutable state across callers).
 */
export function createDefaultScene(): SceneState {
  const slots: Slot[] = [
    { chord: { root: C, family: 'maj' }, durationBars: 1 }, // I  (C)
    { chord: { root: G, family: 'maj' }, durationBars: 1 }, // V  (G)
    { chord: { root: A, family: 'min' }, durationBars: 1 }, // vi (Am)
    { chord: { root: F, family: 'maj' }, durationBars: 1 }, // IV (F)
  ]
  while (slots.length < SLOT_COUNT) slots.push(emptySlot())

  return {
    version: SCENE_VERSION,
    keyRoot: C,
    mode: 'major',
    slots,
    voicingMode: 'smooth',
    direction: 'forward',
    rhythm: 'hold',
    bpm: 100,
    swing: 0,
    preset: 'warm-poly',
    macros: { tension: 0.4, spread: 0.4, motion: 0.4, color: 0.4 },
    // Fixed, arbitrary deterministic seed so the default scene is reproducible.
    seed: 0x5eed,
  }
}
