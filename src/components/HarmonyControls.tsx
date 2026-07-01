import { PRESETS } from '../audio'
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
  swing: number
  loopLength: number
  onKey: (root: PitchClass) => void
  onMode: (mode: Mode) => void
  onVoicing: (mode: VoicingMode) => void
  onRhythm: (style: RhythmStyle) => void
  onDirection: (dir: Direction) => void
  onPreset: (id: PresetId) => void
  onSwing: (swing: number) => void
  onLoopLength: (length: number) => void
}

export function HarmonyControls(props: HarmonyControlsProps) {
  return (
    <section className="controls" aria-label="Harmony and sound">
      <div className="controls__row">
        <Select
          label="Key"
          value={String(props.keyRoot)}
          onChange={(v) => props.onKey(Number(v))}
          options={ROOT_LABELS.map((label, i) => ({ value: String(i), label })).sort((a, b) =>
            a.label.localeCompare(b.label),
          )}
        />
        <Select
          label="Mode"
          value={props.mode}
          onChange={(v) => props.onMode(v as Mode)}
          options={MODES.map((m) => ({ value: m, label: MODE_LABELS[m] })).sort((a, b) =>
            a.label.localeCompare(b.label),
          )}
        />
        <Select
          label="Sound"
          value={props.preset}
          onChange={(v) => props.onPreset(v as PresetId)}
          options={PRESET_IDS.map((id) => ({ value: id, label: PRESETS[id].name })).sort((a, b) =>
            a.label.localeCompare(b.label),
          )}
        />
        <Select
          label="Style"
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
          value={props.voicingMode}
          onChange={props.onVoicing}
          options={VOICING_MODES.map((m) => ({ value: m, label: VOICING_LABELS[m] }))}
        />
        <Segmented<Direction>
          label="Direction"
          value={props.direction}
          onChange={props.onDirection}
          options={DIRECTIONS.map((d) => ({ value: d, label: DIRECTION_LABELS[d] }))}
        />
        <Select
          label="Loop"
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
