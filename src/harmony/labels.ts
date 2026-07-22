import type {
  Chord,
  ChordCategory,
  ChordLabel,
  Mode,
  PitchClass,
} from '../types'
import { chordIntervals } from './chords'
import { mod12, scalePitchClasses, scaleSemitones } from './scales'
import { chordName, spellChord } from './spelling'

/**
 * Roman-numeral analysis, harmonic category, and a stability heuristic.
 *
 * These three drive the palette's colour/ordering and the on-screen labels.
 * Everything here is a pure deterministic function of (chord, key, mode).
 */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

/** Quality buckets used to choose numeral case and suffix. */
type Quality = 'major' | 'minor' | 'dim' | 'aug' | 'sus' | 'other'

function qualityOf(chord: Chord): Quality {
  const iv = chordIntervals(chord.family)
  const has = (n: number) => iv.includes(n)
  if (chord.family === 'sus2' || chord.family === 'sus4') return 'sus'
  if (has(4) && has(8) && !has(7)) return 'aug'
  if (has(3) && has(6) && !has(7)) return 'dim'
  if (has(3) && has(7)) return 'minor'
  if (has(4) && has(7)) return 'major'
  return 'other'
}

/** Suffix appended to a roman numeral (independent of case). */
function romanSuffix(chord: Chord): string {
  switch (chord.family) {
    case 'dim':
      return '°'
    case 'aug':
      return '+'
    case 'maj7':
      return 'maj7'
    case 'min7':
    case 'dom7':
      return '7'
    case 'minMaj7':
      return '(maj7)'
    case 'maj9':
      return 'maj9'
    case 'min9':
    case 'dom9':
      return '9'
    case 'add9':
      return 'add9'
    case '6':
    case 'min6':
      return '6'
    case 'sus2':
      return 'sus2'
    case 'sus4':
      return 'sus4'
    default:
      return ''
  }
}

/**
 * Find the diatonic degree (0..6) whose pitch class equals the chord root, or
 * compute the chromatic numeral relative to the nearest diatonic step.
 *
 * WHY relative to major-scale letter steps: roman numerals are spelled by
 * generic degree. We compute the chord root's interval above the tonic, then
 * find which scale degree of the *major* reference it's an accidental of.
 */
function romanBase(
  rootPc: PitchClass,
  keyRoot: PitchClass,
  mode: Mode,
): { numeralIdx: number; accidental: string } {
  const interval = mod12(rootPc - keyRoot)
  const modeSemis = scaleSemitones(mode)
  // Exact diatonic root?
  const exact = modeSemis.indexOf(interval)
  if (exact !== -1) return { numeralIdx: exact, accidental: '' }

  // Chromatic: map to the major-scale generic degree for stable spelling.
  // Choose the degree whose diatonic semitone is one step below (♯) or above
  // (♭) the chord root. Prefer flat spelling (more common: ♭II, ♭III, ♭VI, ♭VII).
  const MAJOR = [0, 2, 4, 5, 7, 9, 11]
  // The tritone above the tonic (interval 6) is conventionally the raised
  // subdominant (♯iv°), not ♭v — take the sharp spelling for this one degree
  // before the general flat-first rule below claims it as ♭V.
  if (interval === 6) {
    for (let d = 0; d < 7; d++) {
      if (mod12(MAJOR[d] + 1) === interval) return { numeralIdx: d, accidental: '♯' }
    }
  }
  for (let d = 0; d < 7; d++) {
    if (mod12(MAJOR[d] - 1) === interval) return { numeralIdx: d, accidental: '♭' }
  }
  for (let d = 0; d < 7; d++) {
    if (mod12(MAJOR[d] + 1) === interval) return { numeralIdx: d, accidental: '♯' }
  }
  // Fallback (shouldn't happen for 12-tone roots).
  return { numeralIdx: 0, accidental: '' }
}

/** Roman numeral with quality + accidental, e.g. "ii7", "V7", "♭VII", "vii°". */
export function romanNumeral(
  chord: Chord,
  keyRoot: PitchClass,
  mode: Mode,
): string {
  const { numeralIdx, accidental } = romanBase(chord.root, keyRoot, mode)
  const q = qualityOf(chord)
  let numeral: string = ROMAN[numeralIdx]
  // Case: uppercase for major/aug/sus(neutral→upper), lowercase for minor/dim.
  if (q === 'minor' || q === 'dim') numeral = numeral.toLowerCase()
  return accidental + numeral + romanSuffix(chord)
}

/**
 * Category:
 *  - 'diatonic'  : both root and quality belong to the key's diatonic harmony.
 *  - 'borrowed'  : root is a diatonic scale degree but the quality is from a
 *                  parallel/modal source (modal mixture).
 *  - 'chromatic' : root is not a diatonic scale degree.
 */
export function chordCategory(
  chord: Chord,
  keyRoot: PitchClass,
  mode: Mode,
): ChordCategory {
  const pcs = scalePitchClasses(keyRoot, mode)
  const rootDegree = pcs.indexOf(mod12(chord.root))
  if (rootDegree === -1) return 'chromatic'

  // Root is diatonic. Are ALL chord tones diatonic too?
  const chordPcs = chordIntervals(chord.family).map((iv) =>
    mod12(chord.root + iv),
  )
  const allDiatonic = chordPcs.every((pc) => pcs.includes(pc))
  return allDiatonic ? 'diatonic' : 'borrowed'
}

/**
 * Stability 0..1. Deterministic heuristic combining:
 *  - functional weight of the root degree (tonic/dominant/subdominant highest),
 *  - consonance of the quality (triads > 7ths > altered/dim/aug),
 *  - penalty for chromatic roots and for added tensions.
 */
export function chordStability(
  chord: Chord,
  keyRoot: PitchClass,
  mode: Mode,
): number {
  const pcs = scalePitchClasses(keyRoot, mode)
  const degree = pcs.indexOf(mod12(chord.root))

  // Functional weight by scale degree (0=tonic..6).
  // Tonic(0) highest, dominant(4) & subdominant(3) strong, others medium.
  const DEGREE_WEIGHT = [1.0, 0.6, 0.55, 0.8, 0.85, 0.6, 0.45]
  let base = degree === -1 ? 0.25 : DEGREE_WEIGHT[degree]

  // Quality consonance multiplier.
  const q = qualityOf(chord)
  const QUALITY_MULT: Record<Quality, number> = {
    major: 1.0,
    minor: 0.95,
    sus: 0.85,
    dim: 0.55,
    aug: 0.5,
    other: 0.8,
  }
  base *= QUALITY_MULT[q]

  // Extension penalty: more notes / tensions → slightly less stable.
  const size = chordIntervals(chord.family).length
  if (size >= 5) base *= 0.85
  else if (size === 4) base *= 0.93

  // Borrowed/chromatic penalty.
  const cat = chordCategory(chord, keyRoot, mode)
  if (cat === 'borrowed') base *= 0.85
  else if (cat === 'chromatic') base *= 0.7

  return Math.max(0, Math.min(1, Number(base.toFixed(4))))
}

/** Assemble the full ChordLabel for UI consumption. */
export function chordLabel(
  chord: Chord,
  keyRoot: PitchClass,
  mode: Mode,
): ChordLabel {
  return {
    roman: romanNumeral(chord, keyRoot, mode),
    name: chordName(chord, keyRoot, mode),
    notes: spellChord(chord, keyRoot, mode).join(' '),
    stability: chordStability(chord, keyRoot, mode),
    category: chordCategory(chord, keyRoot, mode),
  }
}
