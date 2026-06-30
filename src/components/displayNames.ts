import type { Direction, Mode, RhythmStyle, VoicingMode } from '../types'

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
}

export const MACRO_LABELS = {
  tension: { name: 'Tension', hint: 'harmonic edge' },
  spread: { name: 'Spread', hint: 'voicing width' },
  motion: { name: 'Motion', hint: 'rhythmic drive' },
  color: { name: 'Color', hint: 'tone' },
} as const
