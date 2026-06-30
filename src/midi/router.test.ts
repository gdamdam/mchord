import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLOCK, START, STOP } from './messages'
import {
  MidiOutput,
  MidiRouter,
  type MidiAccessLike,
  type MidiInputPort,
  type MidiOutputPort,
} from './router'

// ── Fakes ────────────────────────────────────────────────────────────────────

class FakeOutput implements MidiOutputPort {
  readonly sent: number[][] = []
  state = 'connected'
  constructor(
    readonly id: string,
    readonly name: string,
  ) {}
  send(data: number[] | Uint8Array): void {
    this.sent.push([...data])
  }
}

class FakeInput implements MidiInputPort {
  onmidimessage: ((event: { data: Uint8Array | null }) => void) | null = null
  state = 'connected'
  constructor(
    readonly id: string,
    readonly name: string,
  ) {}
  /** Simulate the device delivering a message. */
  emit(data: number[]): void {
    this.onmidimessage?.({ data: new Uint8Array(data) })
  }
}

class FakePortMap<T extends { id: string }> {
  private readonly map = new Map<string, T>()
  add(port: T): void {
    this.map.set(port.id, port)
  }
  delete(id: string): void {
    this.map.delete(id)
  }
  get(id: string): T | undefined {
    return this.map.get(id)
  }
  forEach(cb: (value: T) => void): void {
    this.map.forEach((v) => cb(v))
  }
}

class FakeAccess implements MidiAccessLike {
  readonly inputs = new FakePortMap<FakeInput>()
  readonly outputs = new FakePortMap<FakeOutput>()
  onstatechange: ((event: unknown) => void) | null = null
  fireStateChange(): void {
    this.onstatechange?.(undefined)
  }
}

/** Install a fake navigator.requestMIDIAccess returning the given access. */
function installNavigator(access: FakeAccess | null): void {
  const requestMIDIAccess =
    access === null
      ? undefined
      : vi.fn(async () => access as unknown as Awaited<ReturnType<NonNullable<Navigator['requestMIDIAccess']>>>)
  vi.stubGlobal('navigator', { requestMIDIAccess })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── MidiOutput (no router) ─────────────────────────────────────────────────

describe('MidiOutput: byte generation & ownership', () => {
  let out: MidiOutput
  let port: FakeOutput
  beforeEach(() => {
    out = new MidiOutput()
    port = new FakeOutput('o1', 'Synth')
    out.setPort(port)
  })

  it('sends a Note On with the voiced midi and scaled velocity', () => {
    out.noteOn({ midi: 67, velocity: 1 }, 0)
    expect(port.sent).toEqual([[0x90, 67, 127]])
  })

  it('sends the ACTUAL voiced notes, not root position', () => {
    // A voiced (e.g. smooth-leading) Cmaj: E3 G3 C4 — not root-position C E G.
    out.noteOn({ midi: 52, velocity: 0.5 }, 0)
    out.noteOn({ midi: 55, velocity: 0.5 }, 0)
    out.noteOn({ midi: 60, velocity: 0.5 }, 0)
    expect(port.sent.map((m) => m[1])).toEqual([52, 55, 60])
  })

  it('sends a Note Off on release', () => {
    out.noteOn({ midi: 60, velocity: 1 }, 0)
    out.noteOff(60, 0)
    expect(port.sent).toEqual([
      [0x90, 60, 127],
      [0x80, 60, 0],
    ])
  })

  it('ref-counts overlapping holds: one On, one Off', () => {
    out.noteOn({ midi: 60, velocity: 1 }, 0)
    out.noteOn({ midi: 60, velocity: 1 }, 0) // second holder, no extra On
    out.noteOff(60, 0) // still one holder, no Off
    expect(port.sent).toEqual([[0x90, 60, 127]])
    out.noteOff(60, 0) // last holder → Off
    expect(port.sent).toEqual([
      [0x90, 60, 127],
      [0x80, 60, 0],
    ])
  })

  it('late/duplicate Note Off never emits a spurious message', () => {
    out.noteOff(60, 0)
    expect(port.sent).toEqual([])
  })

  it('respects channel selection', () => {
    out.setChannel(9)
    out.noteOn({ midi: 36, velocity: 1 }, 0)
    expect(port.sent).toEqual([[0x99, 36, 127]])
  })

  it('flushes held notes when the channel changes (no hung notes)', () => {
    out.noteOn({ midi: 60, velocity: 1 }, 0)
    out.setChannel(5)
    // Note Off goes out on the OLD channel (0) before switching.
    expect(port.sent).toEqual([
      [0x90, 60, 127],
      [0x80, 60, 0],
    ])
  })

  it('allNotesOff sends a Note Off for every held note', () => {
    out.noteOn({ midi: 60, velocity: 1 }, 0)
    out.noteOn({ midi: 64, velocity: 1 }, 0)
    port.sent.length = 0
    out.allNotesOff()
    const offs = port.sent.map((m) => m[1]).sort((a, b) => a - b)
    expect(offs).toEqual([60, 64])
    expect(port.sent.every((m) => m[0] === 0x80)).toBe(true)
  })

  it('flushes to the OLD port on port change', () => {
    out.noteOn({ midi: 60, velocity: 1 }, 0)
    const port2 = new FakeOutput('o2', 'Other')
    out.setPort(port2)
    // Note Off emitted on the old port; new port stays silent.
    expect(port.sent).toEqual([
      [0x90, 60, 127],
      [0x80, 60, 0],
    ])
    expect(port2.sent).toEqual([])
  })

  it('does nothing when no port is bound', () => {
    const orphan = new MidiOutput()
    expect(() => orphan.noteOn({ midi: 60, velocity: 1 }, 0)).not.toThrow()
    expect(() => orphan.allNotesOff()).not.toThrow()
  })
})

describe('MidiOutput: MIDI clock', () => {
  let out: MidiOutput
  let port: FakeOutput
  beforeEach(() => {
    out = new MidiOutput()
    port = new FakeOutput('o1', 'Synth')
    out.setPort(port)
  })

  it('sends nothing when clock is disabled', () => {
    out.sendClockTick()
    expect(port.sent).toEqual([])
  })

  it('sends START then CLOCK on the first tick, CLOCK after', () => {
    out.setClockEnabled(true)
    out.sendClockTick()
    out.sendClockTick()
    expect(port.sent).toEqual([[START], [CLOCK], [CLOCK]])
  })

  it('sends STOP on sendClockStop after running', () => {
    out.setClockEnabled(true)
    out.sendClockTick()
    out.sendClockStop()
    expect(port.sent).toEqual([[START], [CLOCK], [STOP]])
  })

  it('disabling clock mid-transport sends STOP', () => {
    out.setClockEnabled(true)
    out.sendClockTick()
    out.setClockEnabled(false)
    expect(port.sent).toEqual([[START], [CLOCK], [STOP]])
  })
})

// ── MidiRouter ───────────────────────────────────────────────────────────────

describe('MidiRouter: init', () => {
  it('returns false when Web MIDI is unsupported', async () => {
    installNavigator(null)
    const r = new MidiRouter()
    expect(await r.init()).toBe(false)
  })

  it('returns false (never throws) when access is denied', async () => {
    vi.stubGlobal('navigator', {
      requestMIDIAccess: vi.fn(async () => {
        throw new Error('denied')
      }),
    })
    const r = new MidiRouter()
    await expect(r.init()).resolves.toBe(false)
  })

  it('returns true and enumerates ports on success', async () => {
    const access = new FakeAccess()
    access.outputs.add(new FakeOutput('o1', 'Synth'))
    access.inputs.add(new FakeInput('i1', 'Keys'))
    installNavigator(access)
    const r = new MidiRouter()
    expect(await r.init()).toBe(true)
    expect(r.getOutputs()).toEqual([{ id: 'o1', name: 'Synth' }])
    expect(r.getInputs()).toEqual([{ id: 'i1', name: 'Keys' }])
  })
})

describe('MidiRouter: output selection routes to the bound port', () => {
  it('setOutput binds the port; voiced notes are sent to it', async () => {
    const access = new FakeAccess()
    const port = new FakeOutput('o1', 'Synth')
    access.outputs.add(port)
    installNavigator(access)
    const r = new MidiRouter()
    await r.init()
    r.setOutput('o1')
    r.setOutputChannel(2)
    r.output.noteOn({ midi: 60, velocity: 1 }, 0)
    expect(port.sent).toEqual([[0x92, 60, 127]])
  })

  it('changing output flushes notes held on the previous port', async () => {
    const access = new FakeAccess()
    const a = new FakeOutput('a', 'A')
    const b = new FakeOutput('b', 'B')
    access.outputs.add(a)
    access.outputs.add(b)
    installNavigator(access)
    const r = new MidiRouter()
    await r.init()
    r.setOutput('a')
    r.output.noteOn({ midi: 60, velocity: 1 }, 0)
    r.setOutput('b')
    expect(a.sent).toEqual([
      [0x90, 60, 127],
      [0x80, 60, 0], // flushed to old port
    ])
    expect(b.sent).toEqual([])
  })
})

describe('MidiRouter: input routing', () => {
  it('decodes inbound messages and fans them to onNote listeners', async () => {
    const access = new FakeAccess()
    const input = new FakeInput('i1', 'Keys')
    access.inputs.add(input)
    installNavigator(access)
    const r = new MidiRouter()
    await r.init()
    const events: unknown[] = []
    r.onNote((e) => events.push(e))
    r.setInput('i1')
    input.emit([0x90, 60, 100])
    input.emit([0xf8])
    expect(events).toEqual([
      { type: 'noteon', channel: 0, midi: 60, velocity: 100 },
      { type: 'clock' },
    ])
  })

  it('onNote unsubscribe stops delivery', async () => {
    const access = new FakeAccess()
    const input = new FakeInput('i1', 'Keys')
    access.inputs.add(input)
    installNavigator(access)
    const r = new MidiRouter()
    await r.init()
    const events: unknown[] = []
    const off = r.onNote((e) => events.push(e))
    r.setInput('i1')
    off()
    input.emit([0x90, 60, 100])
    expect(events).toEqual([])
  })
})

describe('MidiRouter: hot-plug & disconnect', () => {
  it('releases the selected output notes when the device disconnects', async () => {
    const access = new FakeAccess()
    const port = new FakeOutput('o1', 'Synth')
    access.outputs.add(port)
    installNavigator(access)
    const r = new MidiRouter()
    await r.init()
    r.setOutput('o1')
    r.output.noteOn({ midi: 60, velocity: 1 }, 0)
    // Device vanishes.
    access.outputs.delete('o1')
    access.fireStateChange()
    // Held note flushed (best-effort Note Off) and port unbound.
    expect(port.sent).toEqual([
      [0x90, 60, 127],
      [0x80, 60, 0],
    ])
    expect(r.output.getPort()).toBeNull()
  })

  it('fires onPortsChanged on statechange', async () => {
    const access = new FakeAccess()
    installNavigator(access)
    const r = new MidiRouter()
    await r.init()
    const cb = vi.fn()
    r.onPortsChanged(cb)
    access.fireStateChange()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('attaches a handler to a newly connected selected input', async () => {
    const access = new FakeAccess()
    installNavigator(access)
    const r = new MidiRouter()
    await r.init()
    r.setInput('i1') // not present yet
    const events: unknown[] = []
    r.onNote((e) => events.push(e))
    const input = new FakeInput('i1', 'Late Keys')
    access.inputs.add(input)
    access.fireStateChange()
    input.emit([0x90, 64, 90])
    expect(events).toEqual([{ type: 'noteon', channel: 0, midi: 64, velocity: 90 }])
  })
})

describe('MidiRouter: panic & dispose', () => {
  it('panic releases all sounding output notes', async () => {
    const access = new FakeAccess()
    const port = new FakeOutput('o1', 'Synth')
    access.outputs.add(port)
    installNavigator(access)
    const r = new MidiRouter()
    await r.init()
    r.setOutput('o1')
    r.output.noteOn({ midi: 60, velocity: 1 }, 0)
    r.output.noteOn({ midi: 64, velocity: 1 }, 0)
    port.sent.length = 0
    r.panic()
    const offs = port.sent.map((m) => m[1]).sort((a, b) => a - b)
    expect(offs).toEqual([60, 64])
  })

  it('dispose flushes notes, detaches inputs, and clears access', async () => {
    const access = new FakeAccess()
    const port = new FakeOutput('o1', 'Synth')
    const input = new FakeInput('i1', 'Keys')
    access.outputs.add(port)
    access.inputs.add(input)
    installNavigator(access)
    const r = new MidiRouter()
    await r.init()
    r.setOutput('o1')
    r.setInput('i1')
    r.output.noteOn({ midi: 60, velocity: 1 }, 0)
    r.dispose()
    expect(port.sent).toContainEqual([0x80, 60, 0]) // flushed
    expect(input.onmidimessage).toBeNull() // detached
    expect(access.onstatechange).toBeNull()
    expect(r.getOutputs()).toEqual([]) // access cleared
  })
})
