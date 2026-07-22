/**
 * Smoke tests for the vendored mbus-client (src/transport/mbus). The library
 * itself is tested upstream (mbus/packages/mbus-client, 24 tests); these only
 * guard the vendoring — that the module graph resolves under mchord's tsconfig
 * and the protocol layer round-trips — so a bad re-sync fails fast.
 */

import { describe, expect, it, vi } from 'vitest'
import { createMbusClient, MBUS_VERSION, outbound, parseServerMessage } from './mbus'
import type { PeerConnectionLike, WebSocketLike } from './mbus'

/** Hand-driven WebSocket stub: records every instance and fires no events on
 *  its own, so tests control open/message/close/error timing exactly. */
class FakeWS implements WebSocketLike {
  static instances: FakeWS[] = []
  static reset(): void {
    FakeWS.instances = []
  }
  readyState = 0
  sent: string[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: unknown }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(readonly url: string) {
    FakeWS.instances.push(this)
  }
  send(data: string): void {
    this.sent.push(data)
  }
  close(): void {
    this.readyState = 3
  }
}

/** Minimal peer-connection stub with a hand-resolved setRemoteDescription so a
 *  test can interleave ICE arrival with the SDP round-trip. */
class FakePC implements PeerConnectionLike {
  connectionState = 'new'
  added: Array<RTCIceCandidateInit | undefined> = []
  onicecandidate: PeerConnectionLike['onicecandidate'] = null
  ontrack: PeerConnectionLike['ontrack'] = null
  onconnectionstatechange: (() => void) | null = null
  private srdResolve: (() => void) | null = null
  addTrack(): unknown {
    return null
  }
  createOffer(): Promise<RTCSessionDescriptionInit> {
    return Promise.resolve({ type: 'offer', sdp: 'v=0\r\n' })
  }
  createAnswer(): Promise<RTCSessionDescriptionInit> {
    return Promise.resolve({ type: 'answer', sdp: 'a=rtpmap:111 opus/48000/2\r\n' })
  }
  setLocalDescription(): Promise<void> {
    return Promise.resolve()
  }
  setRemoteDescription(): Promise<void> {
    return new Promise((r) => {
      this.srdResolve = r
    })
  }
  /** Resolve the pending setRemoteDescription so ICE can flush. */
  resolveRemote(): void {
    this.srdResolve?.()
  }
  addIceCandidate(candidate?: RTCIceCandidateInit): Promise<void> {
    this.added.push(candidate)
    return Promise.resolve()
  }
  close(): void {
    this.connectionState = 'closed'
  }
}

const flush = () => new Promise((r) => setTimeout(r, 0))
const dummyNode = {} as unknown as AudioNode
const fakeCtx = { createGain: () => ({ connect() {}, disconnect() {} }) } as unknown as AudioContext

describe('vendored mbus-client', () => {
  it('exposes the client factory', () => {
    expect(typeof createMbusClient).toBe('function')
  })

  it('builds outbound frames that parse back as JSON', () => {
    expect(JSON.parse(outbound.hello())).toEqual({ type: 'mbus/hello', mbus: MBUS_VERSION })
    expect(JSON.parse(outbound.announce('mchord'))).toEqual({
      type: 'mbus/announce',
      name: 'mchord',
    })
  })

  it('parses a welcome frame and ignores non-mbus traffic', () => {
    const welcome = JSON.stringify({
      type: 'mbus/welcome',
      clientId: 'c1',
      mbus: MBUS_VERSION,
      sources: [{ sourceId: 's1', name: 'mchord', clientId: 'c2' }],
    })
    expect(parseServerMessage(welcome)).toEqual({
      type: 'welcome',
      clientId: 'c1',
      mbus: MBUS_VERSION,
      sources: [{ sourceId: 's1', name: 'mchord', clientId: 'c2' }],
    })
    expect(parseServerMessage(JSON.stringify({ type: 'link/tempo', bpm: 120 }))).toBeNull()
    expect(parseServerMessage('not json')).toBeNull()
  })
})

describe('mbus-client lifecycle', () => {
  const welcome = (clientId: string, sources: unknown[] = []) =>
    JSON.stringify({ type: 'mbus/welcome', clientId, mbus: MBUS_VERSION, sources })

  it('B1: a stale socket close after reconnect neither tears down the new socket nor spawns a duplicate', () => {
    vi.useFakeTimers()
    try {
      FakeWS.reset()
      const client = createMbusClient({
        webSocketFactory: (u) => new FakeWS(u),
        autoRetry: true,
        retryMs: 1000,
        helloTimeoutMs: 2000,
      })
      client.connect()
      expect(FakeWS.instances).toHaveLength(1)
      const s1 = FakeWS.instances[0]!
      s1.readyState = 1
      s1.onopen?.()

      // Rapid disconnect→connect leaves s1 superseded by s2.
      client.disconnect()
      client.connect()
      expect(FakeWS.instances).toHaveLength(2)
      const s2 = FakeWS.instances[1]!

      // s1's close event arrives late: it must be ignored entirely.
      s1.onclose?.()

      // s2 is still the current socket — welcome flows through it.
      s2.readyState = 1
      s2.onopen?.()
      s2.onmessage?.({ data: welcome('c1') })
      expect(client.getState()).toBe('connected')
      expect(client.getClientId()).toBe('c1')

      // The stale close must not have scheduled a retry that spawns a 3rd socket.
      vi.advanceTimersByTime(5000)
      expect(FakeWS.instances).toHaveLength(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('buffers inbound ICE candidates until setRemoteDescription resolves, then flushes them in arrival order', async () => {
    FakeWS.reset()
    const pcs: FakePC[] = []
    const client = createMbusClient({
      webSocketFactory: (u) => new FakeWS(u),
      peerConnectionFactory: () => {
        const pc = new FakePC()
        pcs.push(pc)
        return pc
      },
    })
    client.connect()
    const ws = FakeWS.instances[0]!
    ws.readyState = 1
    ws.onopen?.()
    ws.onmessage?.({ data: welcome('c1', [{ sourceId: 'src1', name: 'x', clientId: 'c2' }]) })

    client.subscribe('src1', fakeCtx)

    // Publisher offers; setRemoteDescription is left pending.
    ws.onmessage?.({
      data: JSON.stringify({
        type: 'mbus/signal',
        from: 'c2',
        payload: { kind: 'offer', sourceId: 'src1', sdp: 'v=0\r\n' },
      }),
    })
    await flush()
    expect(pcs).toHaveLength(1)
    const pc = pcs[0]!

    // Two ICE candidates arrive before the remote description is set.
    for (const c of ['cand-a', 'cand-b']) {
      ws.onmessage?.({
        data: JSON.stringify({
          type: 'mbus/signal',
          from: 'c2',
          payload: { kind: 'ice', sourceId: 'src1', candidate: { candidate: c } },
        }),
      })
    }
    await flush()
    // Applying a candidate before setRemoteDescription would be dropped by the
    // browser, so they must still be buffered.
    expect(pc.added).toHaveLength(0)

    pc.resolveRemote()
    await flush()
    expect(pc.added.map((c) => c?.candidate)).toEqual(['cand-a', 'cand-b'])
  })

  it('B5: an announce error consumes the ack queue so later announces map to the right publication', () => {
    FakeWS.reset()
    const client = createMbusClient({ webSocketFactory: (u) => new FakeWS(u) })
    client.connect()
    const ws = FakeWS.instances[0]!
    ws.readyState = 1
    ws.onopen?.()
    ws.onmessage?.({ data: welcome('c1') })

    const pubA = client.publishOutput(dummyNode, 'A')
    const pubB = client.publishOutput(dummyNode, 'B')

    // Bridge rejects A's announce, then confirms B's.
    ws.onmessage?.({
      data: JSON.stringify({ type: 'mbus/error', code: 'bad-name', message: '', re: 'mbus/announce' }),
    })
    ws.onmessage?.({ data: JSON.stringify({ type: 'mbus/announced', sourceId: 'sB', name: 'B' }) })

    expect(pubB.getSourceId()).toBe('sB')
    expect(pubA.getSourceId()).toBeNull()
  })
})
