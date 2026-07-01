import { useEffect, useReducer, useRef, useState } from 'react'
import { useInstrument } from './app/useInstrument'
import { AdvancedPanel } from './components/AdvancedPanel'
import { ChordPalette } from './components/ChordPalette'
import { ChordSlots } from './components/ChordSlots'
import { HarmonyControls } from './components/HarmonyControls'
import { Macros } from './components/Macros'
import { ProgressionBrowser } from './components/ProgressionBrowser'
import { TopBar } from './components/TopBar'
import { Transport } from './components/Transport'
import { createDefaultScene } from './persistence'
import { sceneFromUrl } from './sharing'
import { createInitialState, isEditableTarget, keyToCommand, sceneReducer } from './state'
import type { Chord, MacroValues } from './types'

/** Space/Enter should activate a focused control rather than firing a shortcut. */
function isInteractive(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  const tag = el?.tagName
  if (typeof tag !== 'string') return false
  return (
    tag === 'BUTTON' ||
    tag === 'A' ||
    tag === 'SELECT' ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    el?.getAttribute('role') === 'button'
  )
}

export default function App() {
  // Load a shared scene from the URL fragment once, at mount, via the reducer's
  // lazy initializer (falls back to the default scene on any malformed input).
  const [state, dispatch] = useReducer(sceneReducer, undefined, () => {
    try {
      return createInitialState(sceneFromUrl(window.location.hash) ?? createDefaultScene())
    } catch {
      return createInitialState(createDefaultScene())
    }
  })
  const instrument = useInstrument(state.scene)

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteSlot, setPaletteSlot] = useState<number | null>(null)
  const [progressionsOpen, setProgressionsOpen] = useState(false)

  // Drop a share fragment after loading so a refresh doesn't clobber edits.
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  // Keep the latest values reachable from the one stable keydown listener.
  // Synced in an effect; the listener only reads them inside an event callback.
  const refs = useRef({ instrument, state, paletteOpen, progressionsOpen })
  useEffect(() => {
    refs.current = { instrument, state, paletteOpen, progressionsOpen }
  })

  const openPaletteFor = (index: number) => {
    setPaletteSlot(index)
    setPaletteOpen(true)
    dispatch({ type: 'selectSlot', index })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { instrument: inst, state: st, paletteOpen: pOpen, progressionsOpen: prOpen } = refs.current
      const overlay = pOpen || prOpen
      const cmd = keyToCommand(
        { key: e.key, code: e.code, shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey },
        { typing: isEditableTarget(e.target), overlayOpen: overlay },
      )
      if (!cmd) return
      // While a modal is open, only let Escape (closeOverlay) through.
      if (overlay && cmd.kind !== 'closeOverlay') return
      if (
        (cmd.kind === 'toggleTransport' || cmd.kind === 'openOrCommitChord') &&
        isInteractive(e.target)
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
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const { scene } = state

  return (
    <main className="app">
      <TopBar
        getLevel={instrument.getOutputLevel}
        link={instrument.link.state}
        effectiveBpm={instrument.effectiveBpm}
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
        swing={scene.swing}
        loopLength={scene.loopLength}
        onKey={(root) => dispatch({ type: 'setKey', root })}
        onMode={(mode) => dispatch({ type: 'setMode', mode })}
        onVoicing={(mode) => dispatch({ type: 'setVoicingMode', mode })}
        onRhythm={(style) => dispatch({ type: 'setRhythm', style })}
        onDirection={(dir) => dispatch({ type: 'setDirection', dir })}
        onPreset={(preset) => dispatch({ type: 'setPreset', preset })}
        onSwing={(swing, transient) => dispatch({ type: 'setSwing', swing, transient })}
        onLoopLength={(length) => dispatch({ type: 'setLoopLength', length })}
      />

      <AdvancedPanel
        scene={scene}
        onLoadScene={(loaded) => dispatch({ type: 'loadScene', scene: loaded })}
        midi={instrument.midi}
        link={instrument.link}
        onPanic={instrument.panic}
      />

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

      <footer className="app__footer">
        <span>mchord v{__APP_VERSION__}</span>
        <span>·</span>
        <span>local-first · no account · works offline</span>
      </footer>
    </main>
  )
}
