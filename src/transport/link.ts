/**
 * link — thin adapter over the adapted Link bridge client + pure link clock.
 *
 * Keeps Ableton Link isolated from the Scheduler: the transport plays fully
 * without the bridge present. This module exposes a small, mchord-flavoured API
 * and owns the single LinkClockSnapshot built from each bridge message, so
 * callers can ask for quantize delays without touching bridge internals.
 */
import {
  enableLinkBridge,
  autoDetectLinkBridge,
  onLinkState as onBridgeState,
  sendLinkTempo as sendBridgeTempo,
  sendLinkPlaying as sendBridgePlaying,
  getLinkState as getBridgeState,
  type LinkState,
} from './linkBridge'
import {
  makeLinkClockSnapshot,
  quantizeDelaySec,
  type LinkClockSnapshot,
  type QuantizeGrid,
} from './linkClock'

export type { LinkState, LinkClockSnapshot, QuantizeGrid }

/** Latest snapshot, rebuilt on every Link state message. null until first msg. */
let snapshot: LinkClockSnapshot | null = null

// Maintain the snapshot internally; uses performance.now()/0 as the message
// arrival time when no audio clock is supplied. Callers that need sample-accurate
// quantization should pass their own `now` to linkQuantizeDelay.
onBridgeState((state: LinkState) => {
  if (!state.connected) {
    snapshot = null
    return
  }
  const tAtMsg = typeof performance !== 'undefined' ? performance.now() / 1000 : 0
  snapshot = makeLinkClockSnapshot(state, tAtMsg)
})

export function enableLink(on: boolean): void {
  enableLinkBridge(on)
}

export function autoDetectLink(): void {
  autoDetectLinkBridge()
}

export function onLinkState(cb: (state: LinkState) => void): () => void {
  return onBridgeState(cb)
}

export function sendLinkTempo(bpm: number): void {
  sendBridgeTempo(bpm)
}

export function sendLinkPlaying(playing: boolean): void {
  sendBridgePlaying(playing)
}

export function getLinkState(): LinkState {
  return getBridgeState()
}

/**
 * Seconds to defer a quantized action to the next `grid` boundary, or 0 when
 * Link is absent/disconnected. `now` should be an AudioContext currentTime if
 * available, else falls back to performance.now() seconds.
 */
export function linkQuantizeDelay(grid: QuantizeGrid | 'off', now?: number): number {
  const t = now ?? (typeof performance !== 'undefined' ? performance.now() / 1000 : 0)
  const connected = getLinkState().connected
  return quantizeDelaySec(snapshot, grid, connected, t)
}

/** Current snapshot (for callers that want their own boundary math). */
export function getLinkSnapshot(): LinkClockSnapshot | null {
  return snapshot
}
