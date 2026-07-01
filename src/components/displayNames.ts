import type { Direction, Mode, RhythmStyle, VoicingMode } from '../types'

/** Box-drawing wordmark (spells "mchord"). Built via join so source indentation
 *  never leaks into the leading spaces. Rendered in a box-drawing-capable mono. */
export const WORDMARK_ASCII = ['    ┓      ┓', '┏┳┓┏┣┓┏┓┏┓┏┫', '┛┗┗┗┛┗┗┛┛ ┗┻'].join('\n')

/** Chromatic labels for the key picker (sharp spelling; slots spell per-key). */
export const ROOT_LABELS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

export const MODE_LABELS: Record<Mode, string> = {
  major: 'Major',
  'natural-minor': 'Minor',
  dorian: 'Dorian',
  mixolydian: 'Mixolydian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  'harmonic-minor': 'Harmonic minor',
}

export const VOICING_LABELS: Record<VoicingMode, string> = {
  root: 'Root',
  close: 'Close',
  smooth: 'Smooth',
  wide: 'Wide',
  bass: 'Bass',
}

export const DIRECTION_LABELS: Record<Direction, string> = {
  forward: 'Forward',
  reverse: 'Reverse',
  pendulum: 'Pendulum',
  random: 'Random',
}

export const RHYTHM_LABELS: Record<RhythmStyle, string> = {
  hold: 'Hold',
  pulse: 'Pulse',
  stab: 'Stab',
  offbeat: 'Offbeat',
  'arp-up': 'Arp ↑',
  'arp-down': 'Arp ↓',
  'arp-updown': 'Arp ↕',
  broken: 'Broken',
  'bass-melody': 'Bass + Melody',
  'house-bass-stab': 'House Stab + Bass',
  'techno-roll': 'Techno Roll',
  'trance-arp': 'Trance Arp',
  'dub-skank': 'Dub Skank',
  'synth-drive': 'Synthwave Drive',
  'lofi-broken': 'Lo-Fi Broken',
  'garage-2step': 'Garage 2-Step',
}

/** Grouping for the Style selector (Block / Arp / Split). */
export const STYLE_GROUPS: { label: string; ids: RhythmStyle[] }[] = [
  { label: 'Block', ids: ['hold', 'pulse', 'stab', 'offbeat'] },
  { label: 'Arp', ids: ['arp-up', 'arp-down', 'arp-updown', 'broken'] },
  {
    label: 'Split (bass + melody)',
    ids: ['bass-melody', 'house-bass-stab', 'techno-roll', 'trance-arp', 'dub-skank', 'synth-drive', 'lofi-broken', 'garage-2step'],
  },
]

export const MACRO_LABELS = {
  tension: { name: 'Tension', hint: 'harmonic edge' },
  spread: { name: 'Spread', hint: 'voicing width' },
  motion: { name: 'Motion', hint: 'rhythmic drive' },
  color: { name: 'Color', hint: 'tone' },
} as const
