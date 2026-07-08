/**
 * useInstrument — the bridge between reducer state and the real-time machinery
 * (audio engine, MIDI, scheduler, Ableton Link). All sample-accurate timing
 * lives below React here; the hook only mirrors transient playback state
 * (started / playing / active+queued slot / device lists) back up for the UI.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAudioEngine } from '../audio'
import { MidiRouter, type MidiEvent, type MidiPortInfo } from '../midi'
import {
  Scheduler,
  autoDetectLink,
  enableLink,
  followTransport,
  getLinkState,
  linkQuantizeDelay,
  onLinkState,
  playStyleEvents,
  swingBeatSeconds,
  secondsPerBeat,
  sendLinkPlaying,
  sendLinkTempo,
  shouldSendPlaying,
  type LinkState,
} from '../transport'
import { voiceProgression } from '../harmony'
import type { SceneState, Voicing, VoicingOptions } from '../types'
import { SLOT_COUNT } from '../types'
import { FanOutSink, TimedMidiSink } from './sinks'

/** MIDI input notes from this note up trigger slots 1..8 (C2 = 36). */
const MIDI_TRIGGER_BASE = 36

export interface MidiControls {
  ready: boolean
  inputs: MidiPortInfo[]
  outputs: MidiPortInfo[]
  outputId: string | null
  inputId: string | null
  channel: number
  clock: boolean
  enable: () => Promise<void>
  setOutput: (id: string | null) => void
  setInput: (id: string | null) => void
  setChannel: (ch: number) => void
  setClock: (on: boolean) => void
}

export interface LinkControls {
  state: LinkState
  enabled: boolean
  enable: (on: boolean) => void
}

export interface Instrument {
  started: boolean
  start: () => Promise<void>
  playing: boolean
  togglePlay: () => void
  triggerSlot: (index: number) => void
  panic: () => void
  activeSlot: number | null
  queuedSlot: number | null
  effectiveBpm: number
  voicings: (Voicing | null)[]
  getOutputLevel: () => number
  localMuted: boolean
  toggleLocalMute: () => void
  mbusPublishing: boolean
  toggleMbusPublish: () => void
  masterVolume: number
  setMasterVolume: (volume: number) => void
  midi: MidiControls
  link: LinkControls
}

export function resolveEffectiveBpm(
  sceneBpm: number,
  link: Pick<LinkState, 'connected' | 'tempo'>,
): number {
  return link.connected ? link.tempo : sceneBpm
}

function voicingOptionsFor(scene: SceneState): VoicingOptions {
  // A global octave shift moves the whole register window (anchor + bounds)
  // together — shifting only the center would just get folded back into the
  // fixed [minMidi, maxMidi] range by the voice-leading pass.
  const offset = scene.octaveShift * 12
  return {
    mode: scene.voicingMode,
    center: 60 + offset,
    minMidi: 40 + offset,
    maxMidi: 84 + offset,
    tension: scene.macros.tension,
    spread: scene.macros.spread,
    color: scene.macros.color,
  }
}

export function useInstrument(scene: SceneState): Instrument {
  const engine = useMemo(() => getAudioEngine(), [])
  const schedulerRef = useRef<Scheduler | null>(null)
  const midiRef = useRef<MidiRouter | null>(null)
  const dispatchSinkRef = useRef<FanOutSink | null>(null)

  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [queuedSlot, setQueuedSlot] = useState<number | null>(null)
  const [linkState, setLinkState] = useState<LinkState>(() => getLinkState())
  const [linkEnabled, setLinkEnabled] = useState(false)
  const [localMuted, setLocalMuted] = useState(false)
  const [mbusPublishing, setMbusPublishing] = useState(false)
  const [masterVolume, setMasterVolumeState] = useState(0.9)

  const [midiReady, setMidiReady] = useState(false)
  const [midiInputs, setMidiInputs] = useState<MidiPortInfo[]>([])
  const [midiOutputs, setMidiOutputs] = useState<MidiPortInfo[]>([])
  const [midiOutputId, setMidiOutputId] = useState<string | null>(null)
  const [midiInputId, setMidiInputId] = useState<string | null>(null)
  const [midiChannel, setMidiChannel] = useState(0)
  const [midiClock, setMidiClock] = useState(false)

  // The voiced progression. Recomputed only when the inputs that affect voicing
  // change. Components also use this to display note spellings.
  const voicings = useMemo(
    () => voiceProgression(scene.slots.map((s) => s.chord), voicingOptionsFor(scene)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      scene.slots,
      scene.voicingMode,
      scene.keyRoot,
      scene.octaveShift,
      scene.macros.tension,
      scene.macros.spread,
      scene.macros.color,
    ],
  )

  const effectiveBpm = resolveEffectiveBpm(scene.bpm, linkState)

  // Keep the latest scene/voicings reachable from stable callbacks. Synced in an
  // effect (not during render) — the callbacks that read them run after commit.
  const sceneRef = useRef(scene)
  const voicingsRef = useRef(voicings)
  useEffect(() => {
    sceneRef.current = scene
    voicingsRef.current = voicings
  })

  // --- Push scene → scheduler / engine whenever the relevant fields change ---

  useEffect(() => {
    const sched = schedulerRef.current
    if (!sched) return
    const steps = voicings.map((v, i) => ({
      voicing: v,
      root: scene.slots[i]?.chord?.root ?? null,
      durationBars: scene.slots[i]?.durationBars ?? 1,
    }))
    // Note-offs are keyed by midi and derived from the *current* steps, so when
    // the voicing changes mid-play (e.g. a key or octave shift) the sounding
    // pitches disappear from the step list and never get a matching noteOff —
    // they hang and accumulate. Release everything before swapping steps; the
    // next tick re-attacks the new voicing cleanly (same as stop()'s flush).
    if (sched.playing) dispatchSinkRef.current?.allNotesOff()
    sched.setSteps(steps, { seed: scene.seed })
  }, [voicings, scene.slots, scene.seed])

  useEffect(() => {
    schedulerRef.current?.setTempo(effectiveBpm)
  }, [effectiveBpm])

  useEffect(() => {
    schedulerRef.current?.setSwing(scene.swing)
  }, [scene.swing])

  useEffect(() => {
    schedulerRef.current?.setRhythm(scene.rhythm)
  }, [scene.rhythm])

  useEffect(() => {
    schedulerRef.current?.setDirection(scene.direction)
  }, [scene.direction])

  useEffect(() => {
    schedulerRef.current?.setMotion(scene.macros.motion)
  }, [scene.macros.motion])

  useEffect(() => {
    schedulerRef.current?.setLoopLength(scene.loopLength)
  }, [scene.loopLength])

  useEffect(() => {
    if (started) engine.setPreset(scene.preset)
  }, [engine, started, scene.preset])

  useEffect(() => {
    if (started) engine.setMacros(scene.macros)
  }, [engine, started, scene.macros])

  useEffect(() => {
    if (started) engine.setTuning(scene.tuning.centsOffset)
  }, [engine, started, scene.tuning])

  // --- Link ---

  useEffect(() => {
    const unsub = onLinkState((s) => setLinkState(s))
    autoDetectLink()
    return unsub
  }, [])

  const linkEnable = useCallback((on: boolean) => {
    setLinkEnabled(on)
    enableLink(on)
  }, [])

  // Follow the shared Link transport. We act only on a genuine *edge* in the
  // session's playing flag (tracked in lastLinkPlayingRef), never on every 20Hz
  // state message, so joining/stopping happens once. A local Play/Stop sets
  // sched.playing synchronously and its own broadcast is absorbed here as a
  // no-op (followTransport is idempotent) — that plus the edge guard prevents an
  // echo loop. Following never re-sends a command to the bridge.
  const lastLinkPlayingRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (!linkState.connected) {
      // Link gone: reset the guard so a later reconnection re-syncs cleanly.
      // Local playback is untouched (transport runs fine without the bridge).
      lastLinkPlayingRef.current = null
      return
    }
    const next = linkState.playing
    const sched = schedulerRef.current
    if (!sched) return // Do not consume the initial state before audio exists.
    if (lastLinkPlayingRef.current === next) return // no shared-transport edge
    lastLinkPlayingRef.current = next
    const action = followTransport(next, sched.playing)
    if (action === 'start') {
      // Join the running session on the next shared bar; do NOT send Play back.
      const delay = linkQuantizeDelay('bar')
      sched.start(delay > 0 ? engine.now() + delay : undefined)
      setPlaying(true)
    } else if (action === 'stop') {
      // Remote stop: halt immediately and flush notes; do NOT send Stop back.
      sched.stop()
      midiRef.current?.output.sendClockStop()
      setPlaying(false)
      setActiveSlot(null)
      setQueuedSlot(null)
    }
  }, [linkState.connected, linkState.playing, engine, started])

  // When we own tempo (no Link peer), advertise it to the bridge if present.
  useEffect(() => {
    if (!linkState.connected) sendLinkTempo(scene.bpm)
  }, [scene.bpm, linkState.connected])

  // --- MIDI clock out (24 PPQN) while playing ---
  // The first tick auto-sends START; STOP is sent explicitly on stop/panic/hide.
  // Tempo changes only re-create the interval (START is not re-sent), so a synced
  // device follows the new tempo without restarting its transport.
  useEffect(() => {
    if (!started || !playing || !midiClock) return
    const router = midiRef.current
    if (!router) return
    const periodMs = 60000 / effectiveBpm / 24
    const id = setInterval(() => router.output.sendClockTick(), periodMs)
    return () => clearInterval(id)
  }, [started, playing, midiClock, effectiveBpm])

  // --- Flush notes + stop MIDI clock on page hide so nothing hangs/free-runs ---
  useEffect(() => {
    const flush = () => {
      dispatchSinkRef.current?.allNotesOff()
      midiRef.current?.output.sendClockStop()
    }
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      schedulerRef.current?.dispose()
      midiRef.current?.dispose()
    }
  }, [])

  // --- Public actions ---

  // Coalesced, idempotent start. Called lazily on the first user gesture (Play
  // or a slot trigger) — no separate "Start audio" splash needed.
  const startPromiseRef = useRef<Promise<void> | null>(null)
  const start = useCallback((): Promise<void> => {
    if (schedulerRef.current) return Promise.resolve()
    if (startPromiseRef.current) return startPromiseRef.current
    startPromiseRef.current = (async () => {
      await engine.start()
      if (!midiRef.current) midiRef.current = new MidiRouter()
    const midiSink = new TimedMidiSink(midiRef.current.output, () => engine.now())
    const sink = new FanOutSink([engine, midiSink])
    dispatchSinkRef.current = sink
    const sched = new Scheduler({ now: () => engine.now(), dispatch: sink })
    sched.onStep(({ index, queued }) => {
      setActiveSlot(index)
      setQueuedSlot(queued)
    })
    const s = sceneRef.current
    // Read the bridge synchronously: Link may have connected before the audio
    // scheduler existed, in which case the effective-BPM effect has already run.
    sched.setTempo(resolveEffectiveBpm(s.bpm, getLinkState()))
    sched.setSwing(s.swing)
    sched.setRhythm(s.rhythm)
    sched.setDirection(s.direction)
    sched.setMotion(s.macros.motion)
    sched.setLoopLength(s.loopLength)
    sched.setSteps(
      voicingsRef.current.map((v, i) => ({
        voicing: v,
        root: s.slots[i]?.chord?.root ?? null,
        durationBars: s.slots[i]?.durationBars ?? 1,
      })),
      { seed: s.seed },
    )
    schedulerRef.current = sched
    engine.setPreset(s.preset)
    engine.setMacros(s.macros)
    engine.setTuning(s.tuning.centsOffset)
    setStarted(true)
    })()
    return startPromiseRef.current
  }, [engine])

  const togglePlay = useCallback(async () => {
    await start()
    const sched = schedulerRef.current
    if (!sched) return
    if (sched.playing) {
      // Absorb the currently-observed shared state while our command travels to
      // the bridge; otherwise the synchronization effect can undo this local
      // action using a stale Link message.
      if (linkState.connected) lastLinkPlayingRef.current = linkState.playing
      sched.stop()
      midiRef.current?.output.sendClockStop()
      setPlaying(false)
      setActiveSlot(null)
      setQueuedSlot(null)
      // Only forward Stop if it changes the shared state (no echo / redundancy).
      if (shouldSendPlaying(linkState.playing, false)) sendLinkPlaying(false)
    } else {
      if (linkState.connected) lastLinkPlayingRef.current = linkState.playing
      // Quantize the start to the next bar when a Link session is running.
      // linkQuantizeDelay() returns a *duration* (seconds to the next bar, on the
      // performance clock); adding that duration to engine.now() (the audio clock)
      // lands at the same wall-clock bar boundary since both run in real seconds.
      const delay = linkState.connected ? linkQuantizeDelay('bar') : 0
      sched.start(delay > 0 ? engine.now() + delay : undefined)
      setPlaying(true)
      // Send Play only if the session isn't already playing — joining a running
      // peer must not re-issue a redundant command (bridge treats it as a no-op,
      // but suppressing it here keeps the transport echo-free).
      if (shouldSendPlaying(linkState.playing, true)) sendLinkPlaying(true)
    }
  }, [start, engine, linkState.connected, linkState.playing])

  const triggerSlot = useCallback(
    (index: number) => {
      if (index < 0 || index >= SLOT_COUNT) return
      const run = () => {
        const sched = schedulerRef.current
        const sink = dispatchSinkRef.current
        if (!sched || !sink) return
        if (sched.playing) {
          sched.triggerSlot(index, 'bar')
          return
        }
      // Stopped: preview ~1 bar of the current play style so you hear the
      // actual performance (bass + melody etc.), not just a block chord.
      const v = voicingsRef.current[index]
      sink.allNotesOff()
      if (!v || v.length === 0) return
      const s = sceneRef.current
      const bpm = linkState.connected ? linkState.tempo : s.bpm
      const spb = secondsPerBeat(bpm)
      const root = s.slots[index]?.chord?.root ?? null
      const evs = playStyleEvents(root, v, s.rhythm, {
        durationBars: 1,
        beatsPerBar: 4,
        swing: s.swing,
        motion: s.macros.motion,
        seed: s.seed,
      })
      const t0 = engine.now()
      for (const e of evs) {
        const on = t0 + swingBeatSeconds(e.startBeat, s.swing, spb)
        sink.noteOn({ midi: e.midi, velocity: e.velocity }, on)
        sink.noteOff(e.midi, on + e.durBeats * spb)
      }
      }
      if (schedulerRef.current) run()
      else void start().then(run)
    },
    [start, engine, linkState.connected, linkState.tempo],
  )

  const panic = useCallback(() => {
    schedulerRef.current?.stop()
    dispatchSinkRef.current?.allNotesOff()
    midiRef.current?.output.sendClockStop()
    engine.panic()
    midiRef.current?.panic()
    setPlaying(false)
    setActiveSlot(null)
    setQueuedSlot(null)
  }, [engine])

  const toggleLocalMute = useCallback(() => {
    setLocalMuted((muted) => {
      const next = !muted
      engine.setLocalMuted(next)
      return next
    })
  }, [engine])

  const toggleMbusPublish = useCallback(() => {
    setMbusPublishing((publishing) => {
      const next = !publishing
      engine.setMbusPublish(next)
      return next
    })
  }, [engine])

  const setMasterVolume = useCallback(
    (volume: number) => {
      engine.setMasterVolume(volume)
      setMasterVolumeState(volume)
    },
    [engine],
  )

  // --- MIDI controls ---

  const triggerSlotRef = useRef(triggerSlot)
  useEffect(() => {
    triggerSlotRef.current = triggerSlot
  })

  const refreshMidiPorts = useCallback(() => {
    const router = midiRef.current
    if (!router) return
    setMidiInputs(router.getInputs())
    setMidiOutputs(router.getOutputs())
  }, [])

  const midiEnable = useCallback(async () => {
    if (!midiRef.current) midiRef.current = new MidiRouter()
    const router = midiRef.current
    const ok = await router.init()
    setMidiReady(ok)
    if (!ok) return
    refreshMidiPorts()
    router.onPortsChanged(refreshMidiPorts)
    router.onNote((e: MidiEvent) => {
      if (e.type !== 'noteon') return
      const idx = e.midi - MIDI_TRIGGER_BASE
      if (idx >= 0 && idx < SLOT_COUNT) triggerSlotRef.current(idx)
    })
  }, [refreshMidiPorts])

  const midi = useMemo<MidiControls>(
    () => ({
      ready: midiReady,
      inputs: midiInputs,
      outputs: midiOutputs,
      outputId: midiOutputId,
      inputId: midiInputId,
      channel: midiChannel,
      clock: midiClock,
      enable: midiEnable,
      setOutput: (id) => {
        midiRef.current?.setOutput(id)
        setMidiOutputId(id)
      },
      setInput: (id) => {
        midiRef.current?.setInput(id)
        setMidiInputId(id)
      },
      setChannel: (ch) => {
        midiRef.current?.setOutputChannel(ch)
        setMidiChannel(ch)
      },
      setClock: (on) => {
        midiRef.current?.setClockEnabled(on)
        setMidiClock(on)
      },
    }),
    [midiReady, midiInputs, midiOutputs, midiOutputId, midiInputId, midiChannel, midiClock, midiEnable],
  )

  const link = useMemo<LinkControls>(
    () => ({ state: linkState, enabled: linkEnabled, enable: linkEnable }),
    [linkState, linkEnabled, linkEnable],
  )

  return {
    started,
    start,
    playing,
    togglePlay,
    triggerSlot,
    panic,
    activeSlot,
    queuedSlot,
    effectiveBpm,
    voicings,
    getOutputLevel: () => engine.getOutputLevel(),
    localMuted,
    toggleLocalMute,
    mbusPublishing,
    toggleMbusPublish,
    masterVolume,
    setMasterVolume,
    midi,
    link,
  }
}
