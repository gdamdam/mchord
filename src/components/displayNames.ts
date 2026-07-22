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
  locrian: 'Locrian',
  'melodic-minor': 'Melodic minor',
  'harmonic-major': 'Harmonic major',
}

export const VOICING_LABELS: Record<VoicingMode, string> = {
  root: 'Root',
  close: 'Close',
  smooth: 'Smooth',
  wide: 'Wide',
  bass: 'Bass',
  quartal: 'Quartal',
  drop2: 'Drop-2',
  shell: 'Shell',
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
  'arp-converge': 'Arp Converge',
  'arp-diverge': 'Arp Diverge',
  'arp-thumb': 'Arp Thumb',
  'arp-octaves': 'Arp Octaves',
  'strum-folk': 'Downstroke',
  'strum-updown': 'Up-Down Strum',
  'harp-roll': 'Harp Roll',
  'guide-comp': 'Guide-Tone Comp',
  'top-line': 'Top Line',
  'pedal-line': 'Pedal + Line',
  alberti: 'Alberti Bass',
  gallop: 'Gallop',
  'cell-roller': 'Cell Roller',
  'euclid-3': 'Euclid 3',
  'euclid-5': 'Euclid 5',
  'euclid-7': 'Euclid 7',
  'ambient-drone': 'Ambient Drone',
  'dubstep-sub': 'Dubstep Sub',
  'downtempo-roll': 'Downtempo Roll',
  'psy-roller': 'Psy Roller',
  'dnb-stab': 'DnB Stab',
}

/** Grouping for the Style selector (Block / Arp / Split). */
export const STYLE_GROUPS: { label: string; ids: RhythmStyle[] }[] = [
  { label: 'Block', ids: ['hold', 'pulse', 'stab', 'offbeat'] },
  {
    label: 'Arp',
    ids: ['arp-up', 'arp-down', 'arp-updown', 'broken', 'arp-converge', 'arp-diverge', 'arp-thumb', 'arp-octaves'],
  },
  { label: 'Strum', ids: ['strum-folk', 'strum-updown', 'harp-roll'] },
  { label: 'Melodic', ids: ['guide-comp', 'top-line', 'pedal-line'] },
  { label: 'Ostinato', ids: ['alberti', 'gallop', 'cell-roller'] },
  { label: 'Euclidean', ids: ['euclid-3', 'euclid-5', 'euclid-7'] },
  {
    label: 'Split (bass + melody)',
    ids: [
      'bass-melody', 'house-bass-stab', 'techno-roll', 'trance-arp', 'dub-skank',
      'synth-drive', 'lofi-broken', 'garage-2step', 'ambient-drone', 'dubstep-sub',
      'downtempo-roll', 'psy-roller', 'dnb-stab',
    ],
  },
]

export const MACRO_LABELS = {
  tension: { name: 'Tension', hint: 'harmonic edge' },
  spread: { name: 'Spread', hint: 'voicing width' },
  motion: { name: 'Motion', hint: 'rhythmic drive' },
  color: { name: 'Color', hint: 'tone' },
} as const
