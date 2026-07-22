/**
 * linkBridge — WebSocket client for the mpump Link Bridge companion app.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Derivation / attribution
 * ------------------------
 * This file is adapted (near-verbatim) from the mdrone project's
 * `src/engine/linkBridge.ts`, which is itself lifted from mpump
 * (`server/src/utils/linkBridge.ts`). The same companion app, WebSocket
 * server (ws://localhost:19876) and message protocol serve mpump, mdrone and
 * mchord. Original sources are AGPL-3.0; see github.com/gdamdam/mpump and
 * github.com/gdamdam/mdrone. Changes here are limited to mchord naming
 * conventions; the protocol and connection strategy are unchanged.
 *
 * Browsers can't speak Ableton Link directly (no UDP / multicast), so this
 * bridge is the only practical way to sync tempo with Ableton Live, Logic,
 * Bitwig, etc. No internet connections are made — all traffic stays on
 * localhost.
 */

export interface LinkState {
  tempo: number // BPM from the Link session
  beat: number // current beat position
  phase: number // phase within a bar (0..3.999 for 4/4)
  playing: boolean // whether the Link session is playing
  peers: number // other Link peers (Ableton Live, Bitwig, …)
  clients: number // browser clients connected to the bridge
  connected: boolean // whether we're connected to the bridge
}

type LinkListener = (state: LinkState) => void

/** Keep a numeric field from an untrusted bridge message only if it's a
 *  finite number, clamped to [min, max]; otherwise fall back to prev. */
function clampFinite(value: unknown, prev: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : prev
}

/** Build the next LinkState from an untrusted "link" message + the previous
 *  state. The bridge WebSocket is loopback-only, so this is defense-in-depth.
 *  Exported for unit testing. */
export function sanitizeLinkMessage(
  msg: Record<string, unknown>,
  prev: LinkState,
): LinkState {
  return {
    tempo: clampFinite(msg.tempo, prev.tempo, 20, 999),
    beat: clampFinite(msg.beat, prev.beat, 0, 1e9),
    phase: clampFinite(msg.phase, prev.phase, 0, 16),
    playing: typeof msg.playing === 'boolean' ? msg.playing : prev.playing,
    peers: Math.floor(clampFinite(msg.peers, prev.peers, 0, 9999)),
    clients: Math.floor(clampFinite(msg.clients, prev.clients, 0, 9999)),
    connected: true,
  }
}

// `localhost` must come first: Firefox blocks insecure ws:// to IP literals
// (127.0.0.1, [::1]) from an HTTPS page as mixed content and only exempts the
// `localhost` hostname (bug 1376309). Same order/reasoning as mbus/protocol.ts.
const WS_URLS = ['ws://localhost:19876', 'ws://127.0.0.1:19876', 'ws://[::1]:19876']
const RETRY_MS = 5000
let wsUrlIdx = 0
// Bounds the auto-detect URL sweep to one pass over WS_URLS (no retry loop).
let autoAttempts = 0

let ws: WebSocket | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let listeners: LinkListener[] = []
let lastState: LinkState = {
  tempo: 120,
  beat: 0,
  phase: 0,
  playing: false,
  peers: 0,
  clients: 0,
  connected: false,
}
let enabled = false
let autoMode = false

function notify(): void {
  for (const fn of listeners) fn(lastState)
}

function connect(): void {
  if (ws) return
  // Guard for non-DOM environments (tests / SSR): no WebSocket → no-op.
  if (typeof WebSocket === 'undefined') return
  try {
    // Capture the socket locally so every handler can verify it is still the
    // current one. A rapid enable→disable→enable (or an auto-detect URL sweep)
    // can leave a superseded socket whose late close/error events would
    // otherwise null the *new* ws and schedule a duplicate live connection.
    const socket = new WebSocket(WS_URLS[wsUrlIdx])
    ws = socket
    let opened = false

    socket.onopen = () => {
      if (socket !== ws) return // superseded before it opened
      opened = true
      enabled = true
      lastState = { ...lastState, connected: true }
      notify()
    }

    socket.onmessage = (e) => {
      if (socket !== ws) return
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'link') {
          lastState = sanitizeLinkMessage(msg, lastState)
          notify()
        }
      } catch {
        /* ignore malformed JSON */
      }
    }

    socket.onclose = () => {
      if (socket !== ws) return // stale socket; a newer one is now current
      ws = null
      if (lastState.connected) {
        lastState = { ...lastState, connected: false, peers: 0 }
        notify()
      }
      if (enabled && !autoMode) {
        scheduleRetry()
      } else if (autoMode && !opened && autoAttempts < WS_URLS.length - 1) {
        // Auto-detect sweeps the whole URL list once (bounded, no retry loop).
        // onerror already rotated wsUrlIdx, so just try the next candidate;
        // without this the rotation was dead and only one URL was ever tried.
        autoAttempts++
        connect()
      }
    }

    socket.onerror = () => {
      if (socket !== ws) return
      wsUrlIdx = (wsUrlIdx + 1) % WS_URLS.length
      socket.close()
    }
  } catch {
    wsUrlIdx = (wsUrlIdx + 1) % WS_URLS.length
    if (enabled && !autoMode) scheduleRetry()
  }
}

function scheduleRetry(): void {
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = setTimeout(connect, RETRY_MS)
}

export function enableLinkBridge(on: boolean): void {
  enabled = on
  autoMode = false
  if (on) {
    connect()
  } else {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    lastState = { ...lastState, connected: false, peers: 0 }
    notify()
  }
}

export function onLinkState(fn: LinkListener): () => void {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

export function sendLinkTempo(tempo: number): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'set_tempo', tempo }))
  }
}

export function sendLinkPlaying(playing: boolean): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'set_playing', playing }))
  }
}

export function getLinkState(): LinkState {
  return lastState
}

/**
 * Auto-detect on page load: sweep the URL list once (localhost, then the IP
 * literals) so a bridge bound to any loopback variant is found. If one
 * connects, stays connected; if none do, silently gives up. Does not retry
 * after the single pass — use enableLinkBridge(true) for a persistent
 * connection.
 */
export function autoDetectLinkBridge(): void {
  if (enabled || ws) return
  autoMode = true
  autoAttempts = 0
  wsUrlIdx = 0 // start the one-pass sweep at localhost (Firefox mixed-content)
  connect()
}
