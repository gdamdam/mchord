// Web MIDI output sink + input router for mchord. AGPL-3.0.
//
// The device hot-plug / cleanup handling and the ref-counted active-note
// ownership are adapted from mpumpit's src/midi/router.ts (AGPL-3.0). The
// output side (MidiOutput as a NoteSink, channel selection, MIDI clock) is
// original work — mpumpit deliberately never created a MIDIOutput.
//
// Design notes:
//   * MidiOutput is the NoteSink the scheduler dispatches to. It owns a single
//     output port + channel and uses NoteOwnership so overlapping holds of the
//     same midi only emit one Note Off when the last holder releases.
//   * On any port change, allNotesOff, or device disconnect we flush every held
//     note with a real Note Off so nothing hangs on the old device.
//   * MIDI is never required: init() resolves false (never throws) when Web MIDI
//     is unsupported or permission is denied.

import type { Midi, NoteSink, VoicedNote } from '../types'
import { CLOCK, START, STOP, noteOffBytes, noteOnBytes, velocityToMidi } from './messages'
import { NoteOwnership } from './ownership'
import { parseMidiMessage, type MidiEvent } from './parse'

// ── Minimal structural Web MIDI shapes ──────────────────────────────────────
// We depend on a structural subset rather than the global DOM MIDI types so the
// router compiles in a `node` test environment and can be driven by a fake.

/** The subset of MIDIOutput we use. */
export interface MidiOutputPort {
  readonly id: string
  readonly name?: string | null
  readonly state?: string
  send(data: number[] | Uint8Array, timestamp?: number): void
}

/** The subset of MIDIInput we use. */
export interface MidiInputPort {
  readonly id: string
  readonly name?: string | null
  readonly state?: string
  onmidimessage: ((event: { data: Uint8Array | null }) => void) | null
}

/** Iterable-or-Map port collection, as the spec exposes (a MIDIInputMap). */
interface PortMap<T> {
  forEach(cb: (value: T) => void): void
  get(id: string): T | undefined
}

/** The subset of MIDIAccess we use. */
export interface MidiAccessLike {
  readonly inputs: PortMap<MidiInputPort>
  readonly outputs: PortMap<MidiOutputPort>
  onstatechange: ((event: unknown) => void) | null
}

export interface MidiPortInfo {
  id: string
  name: string
}

// ── MidiOutput ───────────────────────────────────────────────────────────────

/**
 * Wraps a chosen MIDIOutput and implements {@link NoteSink}. The scheduler
 * broadcasts the *same* voiced notes here that the audio engine receives, so
 * the ACTUAL voiced chord (not root position) is sent over MIDI.
 *
 * `time` from the NoteSink contract is an AudioContext seconds value; MIDI has
 * no sample clock, so we treat all times as "now" and call send() immediately.
 */
export class MidiOutput implements NoteSink {
  private port: MidiOutputPort | null = null
  private channel = 0
  private clockEnabled = false
  private clockRunning = false
  private readonly owned = new NoteOwnership()

  /** Swap the output port. Flushes held notes to the OLD port to avoid hangs. */
  setPort(port: MidiOutputPort | null): void {
    if (port === this.port) return
    this.flushHeld() // release everything sounding on the current port first
    this.port = port
  }

  /** Currently bound port (diagnostics/tests). */
  getPort(): MidiOutputPort | null {
    return this.port
  }

  /** Set output channel 0..15 (clamped). */
  setChannel(ch: number): void {
    const next = Math.max(0, Math.min(15, Math.round(ch)))
    if (next === this.channel) return
    // A channel change must not strand notes sounding on the previous channel.
    this.flushHeld()
    this.channel = next
  }

  getChannel(): number {
    return this.channel
  }

  noteOn(note: VoicedNote, _time: number): void {
    // Ref-count first: only the first holder of this midi triggers a Note On.
    if (this.owned.on(note.midi)) {
      this.port?.send(noteOnBytes(this.channel, note.midi, velocityToMidi(note.velocity)))
    }
  }

  noteOff(midi: Midi, _time: number): void {
    // Only the last holder releasing emits the Note Off.
    if (this.owned.off(midi)) {
      this.port?.send(noteOffBytes(this.channel, midi))
    }
  }

  /** Immediately release everything currently sounding. */
  allNotesOff(): void {
    this.flushHeld()
  }

  /** Send Note Offs for every held note and reset ownership. */
  private flushHeld(): void {
    const sounding = this.owned.clear()
    if (!this.port) return
    for (const midi of sounding) {
      this.port.send(noteOffBytes(this.channel, midi))
    }
  }

  // ── MIDI clock ─────────────────────────────────────────────────────────────

  setClockEnabled(enabled: boolean): void {
    if (enabled === this.clockEnabled) return
    this.clockEnabled = enabled
    // If we were mid-transport and clock is turned off, send STOP so a synced
    // device doesn't keep running off our last START.
    if (!enabled && this.clockRunning) {
      this.port?.send([STOP])
      this.clockRunning = false
    }
  }

  isClockEnabled(): boolean {
    return this.clockEnabled
  }

  /**
   * Send one timing tick (0xF8). On the first tick after enabling we send START
   * so the downstream device begins its transport in sync; sendClockStop()
   * emits STOP. No-op when clock is disabled or no port is bound.
   */
  sendClockTick(_time?: number): void {
    if (!this.clockEnabled || !this.port) return
    if (!this.clockRunning) {
      this.port.send([START])
      this.clockRunning = true
    }
    this.port.send([CLOCK])
  }

  /** Emit STOP and end the transport (clock stays enabled for next start). */
  sendClockStop(): void {
    if (!this.clockRunning) return
    this.clockRunning = false
    this.port?.send([STOP])
  }
}

// ── MidiRouter ───────────────────────────────────────────────────────────────

type PortsChangedCb = () => void
type NoteCb = (event: MidiEvent) => void

/**
 * Top-level MIDI manager: requests access, enumerates ports, owns the
 * {@link MidiOutput} sink, routes inbound messages, and handles hot-plug.
 */
export class MidiRouter {
  /** The NoteSink the scheduler dispatches voiced notes to. */
  readonly output = new MidiOutput()

  private access: MidiAccessLike | null = null
  private disposed = false

  private selectedOutputId: string | null = null
  private selectedInputId: string | null = null

  // inputId -> attached handler (so we can detach exactly what we attached)
  private readonly inputHandlers = new Map<string, (event: { data: Uint8Array | null }) => void>()

  private readonly noteCbs = new Set<NoteCb>()
  private readonly portsChangedCbs = new Set<PortsChangedCb>()

  /** True when Web MIDI is reachable in this environment. */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function'
  }

  /**
   * Request MIDI access. Resolves true on success, false (never throws) when
   * unsupported or permission denied — MIDI is always optional.
   */
  async init(): Promise<boolean> {
    if (this.access) return true
    if (!MidiRouter.isSupported()) return false
    let access: MidiAccessLike
    try {
      // sysex:false — never needed, and avoids an extra permission prompt.
      access = (await navigator.requestMIDIAccess!({ sysex: false })) as unknown as MidiAccessLike
    } catch {
      return false
    }
    // React StrictMode mount→unmount→mount: bail if disposed mid-request.
    if (this.disposed) return false
    this.access = access
    access.onstatechange = () => this.handleStateChange()
    this.reconcileOutput()
    this.reconcileInput()
    return true
  }

  getInputs(): MidiPortInfo[] {
    return this.collect(this.access?.inputs)
  }

  getOutputs(): MidiPortInfo[] {
    return this.collect(this.access?.outputs)
  }

  private collect(map: PortMap<MidiInputPort | MidiOutputPort> | undefined): MidiPortInfo[] {
    if (!map) return []
    const out: MidiPortInfo[] = []
    map.forEach((p) => out.push({ id: p.id, name: p.name ?? 'Unknown' }))
    return out
  }

  // ── Output selection ─────────────────────────────────────────────────────

  setOutput(id: string | null): void {
    if (id === this.selectedOutputId) return
    this.selectedOutputId = id
    this.reconcileOutput()
  }

  setOutputChannel(ch: number): void {
    this.output.setChannel(ch)
  }

  setClockEnabled(enabled: boolean): void {
    this.output.setClockEnabled(enabled)
  }

  private reconcileOutput(): void {
    const port =
      this.selectedOutputId && this.access
        ? this.access.outputs.get(this.selectedOutputId) ?? null
        : null
    // MidiOutput.setPort flushes held notes to the old port — no hung notes.
    this.output.setPort(port)
  }

  // ── Input selection / routing ──────────────────────────────────────────────

  setInput(id: string | null): void {
    if (id === this.selectedInputId) return
    this.selectedInputId = id
    this.reconcileInput()
  }

  onNote(cb: NoteCb): () => void {
    this.noteCbs.add(cb)
    return () => {
      this.noteCbs.delete(cb)
    }
  }

  onPortsChanged(cb: PortsChangedCb): () => void {
    this.portsChangedCbs.add(cb)
    return () => {
      this.portsChangedCbs.delete(cb)
    }
  }

  private reconcileInput(): void {
    this.detachInputs()
    if (!this.access || this.selectedInputId === null) return
    this.access.inputs.forEach((input) => {
      if (input.id !== this.selectedInputId) return
      if (input.state !== undefined && input.state !== 'connected') return
      const handler = (event: { data: Uint8Array | null }): void => {
        if (event.data) this.handleInputData(event.data)
      }
      // Setting `onmidimessage` (not addEventListener) implicitly OPENS the
      // port — Chrome only delivers from an open port (per Web MIDI spec).
      input.onmidimessage = handler
      this.inputHandlers.set(input.id, handler)
    })
  }

  private detachInputs(): void {
    if (this.access) {
      this.access.inputs.forEach((input) => {
        if (this.inputHandlers.has(input.id)) input.onmidimessage = null
      })
    }
    this.inputHandlers.clear()
  }

  /** Decode an inbound buffer and fan it out to listeners. Public for tests. */
  handleInputData(data: Uint8Array | number[]): void {
    const event = parseMidiMessage(data)
    for (const cb of this.noteCbs) cb(event)
  }

  // ── Hot-plug ───────────────────────────────────────────────────────────────

  private handleStateChange(): void {
    if (!this.access) return
    // If a listened input vanished, drop its handler so it isn't a zombie.
    const presentInputs = new Set<string>()
    this.access.inputs.forEach((i) => {
      if (i.state === undefined || i.state === 'connected') presentInputs.add(i.id)
    })
    for (const id of [...this.inputHandlers.keys()]) {
      if (!presentInputs.has(id)) this.inputHandlers.delete(id)
    }

    // If the selected output vanished, release its notes (flush) and unbind.
    if (this.selectedOutputId) {
      const stillThere = this.access.outputs.get(this.selectedOutputId)
      const usable = stillThere && (stillThere.state === undefined || stillThere.state === 'connected')
      if (!usable) {
        // setPort(null) flushes held notes — but the device is gone, so the
        // Note Offs are best-effort. Ownership is reset either way: no hang.
        this.output.setPort(null)
      }
    }

    // Re-attach inputs (newly connected ones become audible) and refresh UI.
    this.reconcileInput()
    this.reconcileOutput()
    for (const cb of this.portsChangedCbs) cb()
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /** Release everything sounding on the output immediately. */
  panic(): void {
    this.output.allNotesOff()
  }

  dispose(): void {
    this.disposed = true
    this.detachInputs()
    if (this.access) this.access.onstatechange = null
    this.output.allNotesOff()
    this.output.setPort(null)
    this.noteCbs.clear()
    this.portsChangedCbs.clear()
    this.access = null
  }
}
