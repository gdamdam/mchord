import { useRef, type ChangeEvent } from 'react'
import { PRESETS } from '../audio'
import { TUNING_PRESETS, sclTextToTuning } from '../tuning'
import {
  DIRECTIONS,
  MODES,
  PRESET_IDS,
  SLOT_COUNT,
  VOICING_MODES,
  type Direction,
  type Mode,
  type PitchClass,
  type PresetId,
  type RhythmStyle,
  type SceneTuning,
  type VoicingMode,
} from '../types'
import { Segmented } from './Segmented'
import { Select } from './Select'
import { Slider } from './Slider'
import {
  DIRECTION_LABELS,
  MODE_LABELS,
  RHYTHM_LABELS,
  ROOT_LABELS,
  STYLE_GROUPS,
  VOICING_LABELS,
} from './displayNames'

interface HarmonyControlsProps {
  keyRoot: PitchClass
  mode: Mode
  voicingMode: VoicingMode
  rhythm: RhythmStyle
  direction: Direction
  preset: PresetId
  tuning: SceneTuning
  swing: number
  loopLength: number
  onKey: (root: PitchClass) => void
  onMode: (mode: Mode) => void
  onVoicing: (mode: VoicingMode) => void
  onRhythm: (style: RhythmStyle) => void
  onDirection: (dir: Direction) => void
  onPreset: (id: PresetId) => void
  onTuning: (tuning: SceneTuning) => void
  onSwing: (swing: number, transient?: boolean) => void
  onLoopLength: (length: number) => void
}

/** Sentinel option value that opens the `.scl` file picker instead of selecting. */
const IMPORT_SCL = '__import_scl__'

export function HarmonyControls(props: HarmonyControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { tuning, onTuning } = props

  // Show the active tuning even when it's an imported/custom one not in the
  // builtin list, then the builtins, then the Import action.
  const isBuiltin = TUNING_PRESETS.some((t) => t.name === tuning.name)
  const tuningOptions = [
    ...(isBuiltin ? [] : [{ value: tuning.name, label: tuning.name }]),
    ...TUNING_PRESETS.map((t) => ({ value: t.name, label: t.name })),
    { value: IMPORT_SCL, label: 'Import .scl…' },
  ]

  const onTuningChange = (value: string) => {
    if (value === IMPORT_SCL) {
      fileRef.current?.click()
      return
    }
    const preset = TUNING_PRESETS.find((t) => t.name === value)
    // Selecting a preset applies its suggested anchor (JI/maqam → follow key,
    // well-temperaments → fixed C); the Anchor control overrides it afterwards.
    if (preset) onTuning({ name: preset.name, centsOffset: [...preset.centsOffset], anchor: preset.anchor })
  }

  // With an all-zero cents table (Equal 12-TET) the anchor rotates nothing, so
  // the control is inert — dim it rather than imply it does something.
  const anchorInert = tuning.centsOffset.every((c) => c === 0)

  /** Anchor selector value: 'key' or the fixed pitch class as a string. */
  const ANCHOR_KEY = 'key'
  const anchorValue = tuning.anchor.mode === 'key' ? ANCHOR_KEY : String(tuning.anchor.pc)
  const anchorOptions = [
    { value: ANCHOR_KEY, label: 'Follow key' },
    ...ROOT_LABELS.map((label, pc) => ({ value: String(pc), label: `Fixed ${label}` })),
  ]
  const onAnchorChange = (value: string) => {
    onTuning({
      ...tuning,
      anchor: value === ANCHOR_KEY ? { mode: 'key' } : { mode: 'fixed', pc: Number(value) as PitchClass },
    })
  }

  const onSclFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same file
    if (!file) return
    const parsed = sclTextToTuning(await file.text())
    // A non-12-note or malformed file is silently ignored (12-tone scope only).
    if (parsed) onTuning(parsed)
  }

  return (
    <section className="controls" aria-label="Harmony and sound">
      <div className="controls__row">
        <Select
          label="Key"
          title="The tonic (root) of the progression. Every chord is spelled and voiced relative to this key."
          value={String(props.keyRoot)}
          onChange={(v) => props.onKey(Number(v))}
          options={ROOT_LABELS.map((label, i) => ({ value: String(i), label })).sort((a, b) =>
            a.label.localeCompare(b.label),
          )}
        />
        <Select
          label="Mode"
          title="The scale the harmony is drawn from — it sets which chords are diatonic and how the Roman numerals read."
          value={props.mode}
          onChange={(v) => props.onMode(v as Mode)}
          options={MODES.map((m) => ({ value: m, label: MODE_LABELS[m] })).sort((a, b) =>
            a.label.localeCompare(b.label),
          )}
        />
        <Select
          label="Tuning"
          title="Microtuning applied to the internal synth's final pitches (Equal 12-TET is standard). MIDI output always stays 12-TET."
          value={tuning.name}
          onChange={onTuningChange}
          options={tuningOptions}
        />
        <Select
          label="Anchor"
          value={anchorValue}
          onChange={onAnchorChange}
          options={anchorOptions}
          disabled={anchorInert}
          title={
            anchorInert
              ? 'Anchor applies only to microtunings — the current tuning is Equal (12-TET), so it has no effect.'
              : 'Which note the tuning is rooted on: JI & maqam scales want Follow key; historical well-temperaments are authentically Fixed C.'
          }
        />
        <input
          ref={fileRef}
          type="file"
          accept=".scl"
          hidden
          aria-hidden="true"
          onChange={onSclFile}
        />
        <Select
          label="Sound"
          title="The built-in synth preset used for local audio playback."
          value={props.preset}
          onChange={(v) => props.onPreset(v as PresetId)}
          options={PRESET_IDS.map((id) => ({ value: id, label: PRESETS[id].name })).sort((a, b) =>
            a.label.localeCompare(b.label),
          )}
        />
        <Select
          label="Style"
          title="How each chord is performed rhythmically — block, arpeggio, strum, melodic, ostinato, euclidean, or split bass+melody."
          value={props.rhythm}
          onChange={(v) => props.onRhythm(v as RhythmStyle)}
          groups={STYLE_GROUPS.map((g) => ({
            label: g.label,
            options: g.ids
              .map((id) => ({ value: id, label: RHYTHM_LABELS[id] }))
              .sort((a, b) => a.label.localeCompare(b.label)),
          }))}
        />
      </div>

      <div className="controls__row">
        <Segmented<VoicingMode>
          label="Voice leading"
          title="How chords are voiced across octaves. Smooth/Bass minimise movement between chords; Quartal, Drop-2, and Shell are jazz voicings."
          value={props.voicingMode}
          onChange={props.onVoicing}
          options={VOICING_MODES.map((m) => ({ value: m, label: VOICING_LABELS[m] }))}
        />
        <Segmented<Direction>
          label="Direction"
          title="Playback order through the slots — forward, reverse, pendulum (back-and-forth), or seeded random."
          value={props.direction}
          onChange={props.onDirection}
          options={DIRECTIONS.map((d) => ({ value: d, label: DIRECTION_LABELS[d] }))}
        />
        <Select
          label="Loop"
          title="How many of the 8 slots are included in the playback loop. Slots beyond it stay editable but silent."
          value={String(props.loopLength)}
          onChange={(v) => props.onLoopLength(Number(v))}
          options={Array.from({ length: SLOT_COUNT }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1} ${i === 0 ? 'slot' : 'slots'}`,
          }))}
        />
        <div className="controls__swing">
          <Slider
            label="Swing"
            title="Delays the off-beats for a shuffled feel (0% = straight timing)."
            value={props.swing}
            min={0}
            max={1}
            step={0.01}
            onChange={props.onSwing}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      </div>
    </section>
  )
}
