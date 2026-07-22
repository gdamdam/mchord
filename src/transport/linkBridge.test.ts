/**
 * Lifecycle tests for the Link-bridge WebSocket client. The bridge protocol
 * itself is covered upstream (mpump/mdrone); these guard mchord's connection
 * lifecycle — the stale-socket race (B2) and the auto-detect URL sweep (B3/B4).
 * Environment is node, so a global WebSocket stub is installed per test.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  autoDetectLinkBridge,
  enableLinkBridge,
  getLinkState,
} from './linkBridge'

/** Hand-driven WebSocket stub: records instances, fires no events on its own. */
class FakeWS {
  static instances: FakeWS[] = []
  static readonly OPEN = 1
  readyState = 0
  onopen: (() => void) | null = null
  onmessage: ((e: { data: unknown }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(readonly url: string) {
    FakeWS.instances.push(this)
  }
  send(): void {}
  close(): void {
    this.readyState = 3
  }
}

const originalWS = (globalThis as { WebSocket?: unknown }).WebSocket

beforeEach(() => {
  ;(globalThis as { WebSocket?: unknown }).WebSocket = FakeWS
  enableLinkBridge(false) // clear any socket/state left by a prior test
  FakeWS.instances = []
})

afterEach(() => {
  enableLinkBridge(false)
  ;(globalThis as { WebSocket?: unknown }).WebSocket = originalWS
})

describe('linkBridge lifecycle', () => {
  it('B2: a stale socket close after re-enable does not null the new socket or schedule a duplicate', () => {
    vi.useFakeTimers()
    try {
      enableLinkBridge(true)
      expect(FakeWS.instances).toHaveLength(1)
      const s1 = FakeWS.instances[0]!
      s1.readyState = 1
      s1.onopen?.()
      expect(getLinkState().connected).toBe(true)

      // Rapid disable→enable supersedes s1 with s2.
      enableLinkBridge(false)
      enableLinkBridge(true)
      expect(FakeWS.instances).toHaveLength(2)
      const s2 = FakeWS.instances[1]!

      // s1's late close must be ignored.
      s1.onclose?.()

      // s2 is still current and usable.
      s2.readyState = 1
      s2.onopen?.()
      expect(getLinkState().connected).toBe(true)

      // No retry socket spawned by the stale close.
      vi.advanceTimersByTime(5000)
      expect(FakeWS.instances).toHaveLength(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('B3/B4: auto-detect sweeps the whole URL list once, starting at localhost', () => {
    autoDetectLinkBridge()
    expect(FakeWS.instances[0]!.url).toBe('ws://localhost:19876')

    // Each failing candidate advances the sweep to the next URL.
    FakeWS.instances[0]!.onerror?.()
    FakeWS.instances[0]!.onclose?.()
    expect(FakeWS.instances[1]!.url).toBe('ws://127.0.0.1:19876')

    FakeWS.instances[1]!.onerror?.()
    FakeWS.instances[1]!.onclose?.()
    expect(FakeWS.instances[2]!.url).toBe('ws://[::1]:19876')

    // After the third URL the one-pass sweep stops — no retry loop.
    FakeWS.instances[2]!.onerror?.()
    FakeWS.instances[2]!.onclose?.()
    expect(FakeWS.instances).toHaveLength(3)
  })
})
