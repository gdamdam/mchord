import { useEffect, useReducer, useRef, useState } from 'react'
import { useInstrument } from './app/useInstrument'
import { AdvancedPanel } from './components/AdvancedPanel'
import { ChordPalette } from './components/ChordPalette'
import { ChordSlots } from './components/ChordSlots'
import { HarmonyControls } from './components/HarmonyControls'
import { Macros } from './components/Macros'
import { Modal } from './components/Modal'
import { ProgressionBrowser } from './components/ProgressionBrowser'
import { ChordEntryModal } from './components/ChordEntryModal'
import { StartGate } from './components/StartGate'
import { TopBar } from './components/TopBar'
import { Transport } from './components/Transport'
import {
  createDefaultScene,
  loadAutosavedScene,
  saveAutosavedScene,
  type AutosavedScene,
} from './persistence'
import { sceneFromUrl } from './sharing'
import {
  createInitialState,
  isEditableTarget,
  isInteractiveTarget,
  keyToCommand,
  sceneReducer,
} from './state'
import type { Chord, MacroValues } from './types'

export default function App() {
  const [startup] = useState<{
    sharedScene: ReturnType<typeof sceneFromUrl>
    lastScene: AutosavedScene | null
  }>(() => {
    try {
      const sharedScene = sceneFromUrl(window.location.hash)
      return { sharedScene, lastScene: sharedScene ? null : loadAutosavedScene() }
    } catch {
      return { sharedScene: null, lastScene: loadAutosavedScene() }
    }
  })

  // Load a shared scene from the URL fragment once, at mount, via the reducer's
  // lazy initializer (falls back to the default scene on any malformed input).
  const [state, dispatch] = useReducer(sceneReducer, undefined, () => {
    return createInitialState(startup.sharedScene ?? createDefaultScene())
  })
  const instrument = useInstrument(state.scene)
  const [hasStarted, setHasStarted] = useState(startup.sharedScene !== null)
  const [currentSessionName, setCurrentSessionName] = useState<string | null>(null)

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteSlot, setPaletteSlot] = useState<number | null>(null)
  const [progressionsOpen, setProgressionsOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [chordsOpen, setChordsOpen] = useState(false)

  // Drop a share fragment after loading so a refresh doesn't clobber edits.
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  // Keep the latest values reachable from the one stable keydown listener.
  // Synced in an effect; the listener only reads them inside an event callback.
  const refs = useRef({ instrument, state, paletteOpen, progressionsOpen, advancedOpen, hasStarted })
  useEffect(() => {
    refs.current = { instrument, state, paletteOpen, progressionsOpen, advancedOpen, hasStarted }
  })

  const openPaletteFor = (index: number) => {
    setPaletteSlot(index)
    setPaletteOpen(true)
    dispatch({ type: 'selectSlot', index })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const {
        instrument: inst,
        state: st,
        paletteOpen: pOpen,
        progressionsOpen: prOpen,
        advancedOpen: advOpen,
        hasStarted: ready,
      } = refs.current
      if (!ready) return
      const overlay = pOpen || prOpen || advOpen
      const cmd = keyToCommand(
        { key: e.key, code: e.code, shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey },
        { typing: isEditableTarget(e.target), overlayOpen: overlay },
      )
      if (!cmd) return
      // While a modal is open, only let Escape (closeOverlay) through.
      if (overlay && cmd.kind !== 'closeOverlay') return
      // A focused control (button, field, our Select's listbox, details menu)
      // owns Space/Enter/Arrows; don't let the global shortcut also fire (G1/G2).
      if (
        (cmd.kind === 'toggleTransport' ||
          cmd.kind === 'openOrCommitChord' ||
          cmd.kind === 'moveSelection') &&
        isInteractiveTarget(e.target)
      ) {
        return
      }
      e.preventDefault()
      switch (cmd.kind) {
        case 'triggerSlot':
          dispatch({ type: 'selectSlot', index: cmd.slot })
          inst.triggerSlot(cmd.slot)
          break
        case 'toggleTransport':
          inst.togglePlay()
          break
        case 'moveSelection':
          dispatch({ type: 'moveSelection', delta: cmd.delta })
          break
        case 'openOrCommitChord':
          openPaletteFor(st.selectedSlot)
          break
        case 'generateOrVary':
          dispatch(cmd.fresh ? { type: 'generate' } : { type: 'vary' })
          break
        case 'undo':
          dispatch({ type: 'undo' })
          break
        case 'redo':
          dispatch({ type: 'redo' })
          break
        case 'closeOverlay':
          setPaletteOpen(false)
          setProgressionsOpen(false)
          setAdvancedOpen(false)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const { scene } = state

  const sceneRef = useRef(scene)
  useEffect(() => {
    sceneRef.current = scene
  }, [scene])

  // Mirror mdrone's last-session behavior: save periodically and flush when
  // the page is hidden, but never overwrite the previous session while the
  // launch choice is still on screen.
  useEffect(() => {
    if (!hasStarted) return
    const save = () => saveAutosavedScene(sceneRef.current)
    const id = window.setInterval(save, 3000)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save()
    }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onVisibility)
      save()
    }
  }, [hasStarted])

  if (!hasStarted) {
    return (
      <StartGate
        lastScene={startup.lastScene}
        onStart={(mode) => {
          dispatch({
            type: 'loadScene',
            scene: mode === 'continue' && startup.lastScene
              ? startup.lastScene.scene
              : createDefaultScene(),
          })
          setCurrentSessionName(null)
          setHasStarted(true)
        }}
      />
    )
  }

  return (
    <main className="app">
      <TopBar
        getLevel={instrument.getOutputLevel}
        link={instrument.link}
        effectiveBpm={instrument.effectiveBpm}
        scene={scene}
        currentSessionName={currentSessionName}
        onSaveSession={setCurrentSessionName}
        localMuted={instrument.localMuted}
        onToggleLocalMute={instrument.toggleLocalMute}
        mbusPublishing={instrument.mbusPublishing}
        onToggleMbusPublish={instrument.toggleMbusPublish}
        masterVolume={instrument.masterVolume}
        onMasterVolume={instrument.setMasterVolume}
        midi={instrument.midi}
        onOpenAdvanced={() => setAdvancedOpen(true)}
        onOpenChords={() => setChordsOpen(true)}
        onLoadSession={(name, loaded) => {
          dispatch({ type: 'loadScene', scene: loaded })
          setCurrentSessionName(name)
        }}
      />

      <Transport
        playing={instrument.playing}
        onToggle={instrument.togglePlay}
        bpm={scene.bpm}
        onBpm={(bpm, transient) => dispatch({ type: 'setBpm', bpm, transient })}
        bpmLocked={instrument.link.state.connected}
        effectiveBpm={instrument.effectiveBpm}
        onGenerate={() => dispatch({ type: 'generate' })}
        onVary={() => dispatch({ type: 'vary' })}
        octaveShift={scene.octaveShift}
        onOctaveShift={(delta) => dispatch({ type: 'shiftOctave', delta })}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        onOpenLibrary={() => setProgressionsOpen(true)}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
      />

      <ChordSlots
        slots={scene.slots}
        keyRoot={scene.keyRoot}
        mode={scene.mode}
        loopLength={scene.loopLength}
        selectedSlot={state.selectedSlot}
        activeSlot={instrument.activeSlot}
        queuedSlot={instrument.queuedSlot}
        onSelect={(index) => dispatch({ type: 'selectSlot', index })}
        onTrigger={(index) => instrument.triggerSlot(index)}
        onOpen={openPaletteFor}
        onCycleDuration={(index, duration) => dispatch({ type: 'setSlotDuration', index, duration })}
      />

      <Macros
        macros={scene.macros}
        onChange={(macro: keyof MacroValues, value, transient) =>
          dispatch({ type: 'setMacro', macro, value, transient })
        }
      />

      <HarmonyControls
        keyRoot={scene.keyRoot}
        mode={scene.mode}
        voicingMode={scene.voicingMode}
        rhythm={scene.rhythm}
        direction={scene.direction}
        preset={scene.preset}
        tuning={scene.tuning}
        swing={scene.swing}
        loopLength={scene.loopLength}
        onKey={(root) => dispatch({ type: 'setKey', root })}
        onMode={(mode) => dispatch({ type: 'setMode', mode })}
        onVoicing={(mode) => dispatch({ type: 'setVoicingMode', mode })}
        onRhythm={(style) => dispatch({ type: 'setRhythm', style })}
        onDirection={(dir) => dispatch({ type: 'setDirection', dir })}
        onPreset={(preset) => dispatch({ type: 'setPreset', preset })}
        onTuning={(tuning) => dispatch({ type: 'setTuning', tuning })}
        onSwing={(swing, transient) => dispatch({ type: 'setSwing', swing, transient })}
        onLoopLength={(length) => dispatch({ type: 'setLoopLength', length })}
      />

      <Modal open={advancedOpen} onClose={() => setAdvancedOpen(false)} title="Advanced">
        <AdvancedPanel
          scene={scene}
          onLoadScene={(loaded, name) => {
            dispatch({ type: 'loadScene', scene: loaded })
            setCurrentSessionName(name ?? null)
          }}
          onPanic={instrument.panic}
        />
      </Modal>

      <ChordPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        keyRoot={scene.keyRoot}
        mode={scene.mode}
        slotIndex={paletteSlot}
        onPick={(chord: Chord) => {
          if (paletteSlot !== null) dispatch({ type: 'setSlotChord', index: paletteSlot, chord })
        }}
        onClear={() => {
          if (paletteSlot !== null) dispatch({ type: 'clearSlot', index: paletteSlot })
        }}
      />

      <ProgressionBrowser
        open={progressionsOpen}
        onClose={() => setProgressionsOpen(false)}
        keyRoot={scene.keyRoot}
        mode={scene.mode}
        onLoad={(chords, loadedMode) =>
          dispatch({ type: 'loadProgression', chords, mode: loadedMode })
        }
      />

      <ChordEntryModal
        open={chordsOpen}
        onClose={() => setChordsOpen(false)}
        keyRoot={scene.keyRoot}
        mode={scene.mode}
        onApply={(chords) => dispatch({ type: 'loadProgression', chords })}
      />

      <footer className="app__footer">
        <span>mchord v{__APP_VERSION__}</span>
        <span>·</span>
        <span>local-first · no account · works offline</span>
      </footer>
    </main>
  )
}
