/**
 * Curated editorial overlay for the normalized catalog.
 *
 * PROVENANCE POLICY (see docs/architecture.md → "Catalog provenance policy")
 *   • We NEVER fabricate a citation or imply a source supports more than it does.
 *   • Common-practice / theory patterns (ii–V–I, Axis, 12-bar blues, Andalusian
 *     cadence, line clichés, doo-wop, Pachelbel) are marked `traditional` or
 *     `internal-theory-review` with a musical rationale — these are teachable
 *     common knowledge, need no external citation, and none is claimed.
 *   • Entries whose legacy names implied a specific composition/artist we could
 *     not verify are RENAMED to a generic functional name; the evocative legacy
 *     name is kept as an alias so it stays discoverable, and the entry is marked
 *     `unverified` (or `composition-reduction` when it is a harmonic outline).
 *   • `CURATED_OVERRIDES` patch normalized base entries by id (ids are permanent
 *     — a rename changes `name`, never `id`).
 *   • `CURATED_ENTRIES` are hand-authored additions that exercise engine features
 *     the legacy bank never used (Locrian, harmonic-major, augmented, 7#9,
 *     rests, …). Each is `original-editorial`, reviewed, with a musical rationale.
 */
import type { CatalogEntry, CatalogOverride } from './catalog'

/** Shared reviewer stamp for internally-reviewed theory patterns. */
const REVIEW = { reviewer: 'mchord catalog review', reviewDate: '2026-07-24' }

// ---------------------------------------------------------------------------
// Overrides: upgrade reviewed theory patterns + honest renames
// ---------------------------------------------------------------------------

export const CURATED_OVERRIDES: CatalogOverride[] = [
  // ---- Reviewed generic-theory patterns (traditional / theory-review) ----
  {
    id: 'major-ii-v-i',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence'],
    description: 'The core major-key jazz cadence: supertonic → dominant → tonic.',
    provenance: {
      kind: 'traditional',
      supports: 'ii–V–I is the foundational functional cadence of common-practice and jazz harmony.',
      ...REVIEW,
    },
  },
  {
    id: 'minor-ii-v-i',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence', 'borrowed'],
    description: 'Minor ii–V–i using the half-diminished ii and an altered (♭9) dominant.',
    harmonicIntent: 'The ♭9 dominant is the standard altered V of minor — deliberate, not stray chromaticism.',
    provenance: {
      kind: 'traditional',
      supports: 'Minor ii(ø7)–V(7♭9)–i is the standard minor-key jazz cadence.',
      ...REVIEW,
    },
  },
  {
    id: 'so-what-modal',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['modal'],
    aliases: ['So What chord'],
    description: 'Static modal Dorian idiom: two min7 chords a whole step apart (the "So What" sound).',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'Illustrates modal (non-functional) Dorian harmony; the quartal "So What" voicing is a well-known modal-jazz device.',
      ...REVIEW,
    },
  },
  {
    id: 'canon',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence'],
    aliases: ['Pachelbel', 'Pachelbel Canon sequence'],
    description: 'The Pachelbel sequence I–V–vi–iii–IV–I–IV–V, the archetypal descending-bass loop.',
    provenance: {
      kind: 'traditional',
      supports: 'The I–V–vi–iii–IV–I–IV–V descending sequence is common-practice/Baroque common knowledge.',
      ...REVIEW,
    },
  },
  {
    id: 'anthem-i-v-vi-iv',
    name: 'Axis I–V–vi–IV',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence'],
    description: 'The "Axis" progression (I–V–vi–IV) and its rotations — the ubiquitous pop loop.',
    provenance: {
      kind: 'traditional',
      supports: 'I–V–vi–IV ("Axis") and its rotations are a documented, ubiquitous pop pattern.',
      ...REVIEW,
    },
  },
  {
    id: 'doo-wop-i-vi-iv-v',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence'],
    aliases: ['50s progression'],
    description: 'The "50s" / doo-wop loop I–vi–IV–V.',
    provenance: {
      kind: 'traditional',
      supports: 'I–vi–IV–V is the traditional 1950s doo-wop progression.',
      ...REVIEW,
    },
  },
  {
    id: 'jazz-blues',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['blues'],
    description: 'A 12-bar jazz-blues outline in dominant 7ths (reduced to eight events).',
    completeness: 'reduction',
    harmonicIntent: 'All-dominant harmony is idiomatic blues, not unexplained chromaticism.',
    provenance: {
      kind: 'traditional',
      supports: 'The 12-bar blues form and its jazz-blues dominant harmony are traditional.',
      ...REVIEW,
    },
  },
  {
    id: 'andalusian-descent',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence', 'chromatic'],
    aliases: ['Andalusian cadence'],
    description: 'The Andalusian cadence i–♭VII–♭VI–V (Phrygian/harmonic-minor descent).',
    harmonicIntent: 'The major-quality V (with leading tone) over a minor tonic is the defining harmonic-minor colour.',
    provenance: {
      kind: 'traditional',
      supports: 'i–♭VII–♭VI–V is the traditional Andalusian cadence.',
      ...REVIEW,
    },
  },
  {
    id: 'minor-line-cliche',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['line-cliche'],
    description: 'The minor line cliché: a chromatically descending inner voice over a static minor tonic (i–i(maj7)–i7–i6).',
    harmonicIntent: 'The maj7/6th are a moving inner line over the tonic, not functional chromaticism.',
    provenance: {
      kind: 'traditional',
      supports: 'The descending minor line cliché is a standard theory/arranging device.',
      ...REVIEW,
    },
  },
  {
    id: 'passing-diminished',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['chromatic'],
    description: 'A chromatic passing diminished chord (♯i°) linking I and ii.',
    harmonicIntent: 'The ♯i° is a passing chord, a deliberate chromatic connector.',
    provenance: {
      kind: 'traditional',
      supports: 'Chromatic passing diminished chords are standard common-practice/gospel harmony.',
      ...REVIEW,
    },
  },
  {
    id: 'amen-plagal-iv-i',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence'],
    description: 'The plagal ("Amen") cadence IV–I.',
    provenance: {
      kind: 'traditional',
      supports: 'IV–I is the traditional plagal (Amen) cadence.',
      ...REVIEW,
    },
  },
  {
    id: 'backdoor-cadence',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence', 'chromatic'],
    description: 'The backdoor cadence ♭VII7 → I, resolving up by whole step.',
    harmonicIntent: 'The ♭VII7 is a borrowed backdoor dominant — intentional.',
    provenance: {
      kind: 'traditional',
      supports: 'iv–♭VII7–I "backdoor" resolution is standard jazz harmony.',
      ...REVIEW,
    },
  },
  {
    id: 'tritone-sub-2-5-1',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['turnaround', 'chromatic'],
    description: 'A ii–V–I with the dominant replaced by its tritone substitute (♭II7).',
    harmonicIntent: 'The ♭II7 is the tritone substitution for V7 — a deliberate reharmonization.',
    provenance: {
      kind: 'traditional',
      supports: 'Tritone substitution (♭II7 for V7) is standard jazz reharmonization.',
      ...REVIEW,
    },
  },
  {
    id: 'royal-road',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence'],
    aliases: ['Ōdō / Royal Road progression'],
    description: 'The IV(maj7)–V7–iii–vi "Royal Road" progression common in J-pop/anime.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'IVmaj7–V7–iii7–vi is widely documented as the J-pop "Royal Road" (王道進行) progression.',
      ...REVIEW,
    },
  },
  {
    id: 'lady-bird-turnaround',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['turnaround', 'chromatic'],
    description: 'A major-third turnaround of major-7th chords (I–♭III–♭VI–♭II, "Lady Bird" turnaround).',
    harmonicIntent: 'The ♭III/♭VI/♭II maj7 chords are a chromatic-mediant turnaround, deliberate.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'The major-third-cycle "Lady Bird" turnaround is a documented jazz turnaround device.',
      ...REVIEW,
    },
  },
  {
    id: 'liquid-ii-v-i',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence'],
    description: 'A lush ii9–V9–Imaj9 cadence (extended dominants).',
    provenance: {
      kind: 'traditional',
      supports: 'Extended (9th) ii–V–I voicings are standard jazz/soul harmony.',
      ...REVIEW,
    },
  },
  {
    id: 'suspended-pedal',
    review: 'reviewed',
    tags: ['pedal'],
    description: 'A suspended tonic pedal: sus2 → sus4 → resolution.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'Suspension and resolution over a tonic pedal is a standard device.',
      ...REVIEW,
    },
  },
  {
    id: 'lydian-wonder-i-ii',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['modal'],
    description: 'Lydian colour: Imaj7♯11 → II, the bright ♯4 sound.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'Imaj7♯11 with a major II is the characteristic Lydian sound.',
      ...REVIEW,
    },
  },
  {
    id: 'anthemic-i-iv-vi-v',
    review: 'reviewed',
    tags: ['cadence'],
    description: 'An anthemic I(add9)–IV–vi–V(sus4) pop lift.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'add9/sus colourings over a I–IV–vi–V loop are common pop voicings.',
      ...REVIEW,
    },
  },
  {
    id: 'so-what-cadence',
    review: 'reviewed',
    tags: ['cadence'],
    description: 'A gospel ii–V(7sus4)–I with a suspended dominant.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'The suspended dominant (V7sus4) resolving to I is a common gospel cadence.',
      ...REVIEW,
    },
  },
  {
    id: 'pop-punk-power-four',
    review: 'reviewed',
    tags: [],
    description: 'A four-chord pop-punk loop voiced in power chords (root+5th).',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'Power-chord (no-3rd) voicings of a I–V–vi–IV-type loop are idiomatic pop-punk/rock.',
      ...REVIEW,
    },
  },
  {
    id: 'velvet-six',
    review: 'reviewed',
    tags: ['turnaround'],
    description: 'A I6 turnaround with a ii–V into the tonic sixth.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'The tonic 6th chord as a stable resolution is standard jazz/lo-fi harmony.',
      ...REVIEW,
    },
  },
  {
    id: '2-5-1-extended',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['cadence'],
    description: 'An extended gospel 2–5–1 (ii9–V13–Imaj9).',
    provenance: {
      kind: 'traditional',
      supports: 'Extended ii–V–I with a 13th dominant is standard gospel/jazz harmony.',
      ...REVIEW,
    },
  },
  {
    id: 'mellow-min6',
    review: 'reviewed',
    tags: ['vamp'],
    description: 'A mellow Dorian vamp featuring the min6 tonic.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'The min6 tonic is the characteristic Dorian tonic colour.',
      ...REVIEW,
    },
  },

  {
    id: '303-phrygian-pedal',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['modal', 'pedal'],
    description: 'The Phrygian i–♭II: the characteristic flat-second modal colour over a tonic pedal.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'i–♭II is the defining Phrygian modal sound; the ♭II is diatonic in Phrygian.',
      ...REVIEW,
    },
  },

  // ---- Honest renames: unverifiable composition/artist references ----
  {
    id: 'giant-steps-cycle',
    name: 'Major-Third Cycle',
    classification: 'generic-theory',
    review: 'reviewed',
    completeness: 'excerpt',
    aliases: ['Giant Steps', 'Coltrane changes'],
    tags: ['modulation', 'chromatic'],
    description: 'A symmetric major-third key cycle (maj7 chords a major third apart, linked by dominants).',
    harmonicIntent: 'The major-third modulation cycle is a deliberate symmetric device ("Coltrane changes").',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'The major-third (augmented) key cycle is a documented theory concept; this is an excerpt, not a transcription.',
      notes: 'Renamed from "Giant Steps Cycle": we do not claim to reproduce the composition, only the cyclic device.',
      ...REVIEW,
    },
  },
  {
    id: 'coltrane-ii-v-reharm',
    name: 'Major-Third ii–V Reharm',
    classification: 'generic-theory',
    review: 'reviewed',
    completeness: 'reharmonized',
    aliases: ['Coltrane reharm'],
    tags: ['modulation', 'chromatic'],
    description: 'A ii–V reharmonized through a major-third cycle of dominants and majors.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'Major-third-cycle ("Coltrane") reharmonization of ii–V is a documented device.',
      ...REVIEW,
    },
  },
  {
    id: 'autumn-leaves',
    classification: 'composition-reduction',
    review: 'unverified',
    completeness: 'reduction',
    tags: ['cadence'],
    description: 'The relative major/minor ii–V harmonic outline associated with the standard "Autumn Leaves".',
    harmonicIntent: 'A harmonic outline, not a transcription; attribution/accuracy not independently verified.',
    provenance: {
      kind: 'unverified',
      supports: 'A common ii–V outline attributed to the standard; the specific reduction is not verified.',
      notes: 'Kept as a reduction with an unverified attribution rather than claiming a transcription.',
    },
  },
  {
    id: 'satin-doll-ii-v-chain',
    name: 'Descending ii–V Chain',
    classification: 'composition-reduction',
    review: 'unverified',
    completeness: 'reduction',
    aliases: ['Satin Doll'],
    tags: ['turnaround'],
    description: 'A chain of parallel ii–V cells stepping downward.',
    provenance: {
      kind: 'unverified',
      supports: 'A generic descending ii–V chain; the specific song attribution is not verified.',
      notes: 'Renamed from a song title we cannot verify; kept as an alias.',
    },
  },
  {
    id: 'bird-turnaround',
    name: 'Bird Turnaround',
    classification: 'generic-theory',
    review: 'reviewed',
    tags: ['turnaround', 'chromatic'],
    description: 'A bebop turnaround with a secondary ♭9 dominant ("Bird changes" idiom).',
    harmonicIntent: 'The secondary altered dominants are the deliberate bebop-turnaround colour.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'Bebop ("Bird") turnarounds with secondary dominants are a documented device.',
      ...REVIEW,
    },
  },
  {
    id: 'bird-blues',
    name: 'Bird Blues',
    classification: 'generic-theory',
    review: 'reviewed',
    completeness: 'reduction',
    tags: ['blues', 'chromatic'],
    description: 'A bebop "Bird blues" outline — a blues reharmonized with ii–V cells.',
    harmonicIntent: 'The added ii–V cells are the deliberate bebop-blues reharmonization.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'The bebop "Bird blues" reharmonization of the 12-bar blues is a documented device.',
      ...REVIEW,
    },
  },
  {
    id: 'creep',
    name: 'I–III–IV–iv Chromatic Loop',
    classification: 'composition-reduction',
    review: 'unverified',
    aliases: ['Creep'],
    tags: ['borrowed', 'chromatic'],
    description: 'A four-chord loop with a chromatic major III and a borrowed minor iv.',
    harmonicIntent: 'The major III and minor iv are deliberate chromatic/borrowed colours.',
    provenance: {
      kind: 'unverified',
      supports: 'A I–III–IV–iv loop; the popular-song attribution is not verified here.',
      notes: 'Renamed from a song title we cannot verify; kept as an alias.',
    },
  },
  {
    id: 'skywalker-mixolydian',
    name: 'Mixolydian I–♭VII–IV',
    classification: 'generic-theory',
    review: 'reviewed',
    aliases: ['Skywalker'],
    tags: ['modal'],
    description: 'The bright Mixolydian I–♭VII–IV heroic-fanfare sound.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'I–♭VII–IV is the characteristic Mixolydian "heroic" cadence.',
      ...REVIEW,
    },
  },
  {
    id: 'interstellar-oscillation',
    name: '♭VI–♭VII–i Oscillation',
    aliases: ['Interstellar'],
    tags: ['modal'],
    description: 'A cinematic ♭VI–♭VII–i minor oscillation.',
    provenance: {
      kind: 'internal-theory-review',
      supports: '♭VI–♭VII–i is a common cinematic minor cadence.',
      notes: 'Renamed from a film reference we cannot attribute; kept as an alias.',
      ...REVIEW,
    },
  },
  {
    id: 'larry-heard',
    name: 'Deep min9 Cycle',
    aliases: ['Larry Heard'],
    tags: ['vamp'],
    description: 'A deep-house min9 cycle over a Dorian centre.',
    provenance: {
      kind: 'traditional',
      supports: 'A common deep-house extended-minor cycle.',
      notes: 'Renamed from an artist homage; kept as an alias.',
    },
  },
  {
    id: 'maurizio-i-bvii',
    name: 'Dub i–♭VII (min7)',
    aliases: ['Maurizio'],
    tags: ['vamp'],
    description: 'A dub-techno i7–♭VIImaj7 two-chord drift.',
    provenance: {
      kind: 'traditional',
      supports: 'A common dub-techno two-chord vamp.',
      notes: 'Renamed from an artist homage; kept as an alias.',
    },
  },
  {
    id: 'basic-channel-stab',
    name: 'Dub Stab i',
    aliases: ['Basic Channel'],
    tags: ['vamp'],
    description: 'A minimal dub-techno tonic stab (i → i7).',
    provenance: {
      kind: 'traditional',
      supports: 'A minimal dub-techno tonic vamp.',
      notes: 'Renamed from a label/artist homage; kept as an alias.',
    },
  },
  {
    id: 'hospital-rhodes',
    name: 'Liquid Rhodes Cycle',
    aliases: ['Hospital'],
    tags: ['vamp'],
    description: 'A liquid drum-and-bass Rhodes cycle over Dorian.',
    provenance: {
      kind: 'traditional',
      supports: 'A common liquid-DnB extended-chord cycle.',
      notes: 'Renamed from a label homage; kept as an alias.',
    },
  },
]

// ---------------------------------------------------------------------------
// Curated additions: exercise engine features the legacy bank never used
// ---------------------------------------------------------------------------

function original(
  partial: Omit<
    CatalogEntry,
    'classification' | 'review' | 'completeness' | 'aliases' | 'provenance'
  > &
    Partial<Pick<CatalogEntry, 'aliases' | 'provenance' | 'completeness' | 'classification' | 'review'>>,
): CatalogEntry {
  return {
    aliases: [],
    classification: 'original-editorial',
    review: 'reviewed',
    completeness: 'complete',
    provenance: {
      kind: 'internal-theory-review',
      supports: partial.description,
      ...REVIEW,
    },
    ...partial,
  }
}

export const CURATED_ENTRIES: CatalogEntry[] = [
  // ---- Mode coverage: Locrian, harmonic-major, extra melodic-minor ----
  original({
    id: 'locrian-half-dim-drift',
    name: 'Locrian ♭II Drift',
    genres: ['ambient', 'cinematic'],
    mode: 'locrian',
    events: [{ chord: { offset: 0, family: 'm7b5' } }, { chord: { offset: 1, family: 'maj7' } }],
    tags: ['modal'],
    description:
      'An unstable Locrian centre: the ø7 tonic drifts to the ♭II maj7. Locrian rarely functions as a true tonic, so this is intentionally a colour/texture, not a cadence.',
    harmonicIntent: 'The diminished tonic is the defining (unstable) Locrian sound — used deliberately as texture.',
  }),
  original({
    id: 'harmonic-major-borrowed-iv',
    name: 'Harmonic-Major Borrowed iv',
    genres: ['cinematic', 'pop'],
    mode: 'harmonic-major',
    events: [
      { chord: { offset: 0, family: 'maj7' } },
      { chord: { offset: 5, family: 'min' } },
      { chord: { offset: 7, family: 'dom7' } },
      { chord: { offset: 0, family: 'maj7' } },
    ],
    tags: ['borrowed', 'modal'],
    description:
      'Major with a lowered 6th (harmonic major): the bright Imaj7 borrows a minor iv before the dominant — the "harmonic major" colour.',
    harmonicIntent: 'The minor iv (♭6 scale degree) is the characteristic harmonic-major borrowing.',
  }),
  original({
    id: 'melodic-minor-tonic-vamp',
    name: 'Melodic-Minor Tonic Vamp',
    genres: ['jazz', 'cinematic'],
    mode: 'melodic-minor',
    events: [
      { chord: { offset: 0, family: 'minMaj7' } },
      { chord: { offset: 2, family: 'min7' } },
    ],
    tags: ['modal'],
    description:
      'The melodic-minor tonic min(maj7) vamped against the ii — the "jazz minor" tonic colour.',
    harmonicIntent: 'The min(maj7) tonic (natural 7 over a minor triad) is the defining melodic-minor sound.',
  }),

  // ---- Chord-family coverage: augmented, 7#9 ----
  original({
    id: 'augmented-line-rise',
    name: 'Augmented Line Rise',
    genres: ['cinematic', 'jazz'],
    mode: 'major',
    events: [
      { chord: { offset: 0, family: 'maj' } },
      { chord: { offset: 0, family: 'aug' } },
      { chord: { offset: 0, family: '6' } },
      { chord: { offset: 0, family: 'maj' } },
    ],
    tags: ['line-cliche', 'chromatic'],
    description:
      'An ascending augmented line cliché over a static root: I → I+ → I6, the ♯5 walking up to the 6th.',
    harmonicIntent: 'The augmented chord is a chromatic passing sonority in a rising inner line — deliberate.',
  }),
  original({
    id: 'hendrix-sharp9-funk',
    name: '7♯9 Funk Vamp',
    genres: ['electro', 'breakbeat'],
    mode: 'mixolydian',
    events: [
      { chord: { offset: 0, family: '7#9' } },
      { chord: { offset: 5, family: '7#9' } },
    ],
    tags: ['blues', 'chromatic'],
    aliases: ['Hendrix chord vamp'],
    description: 'A funk/blues vamp on the dominant 7♯9 ("Hendrix") chord.',
    harmonicIntent: 'The ♯9 over a dominant is the intentional blues/funk clash colour.',
  }),
  original({
    id: 'lydian-sharp11-planing',
    name: 'Lydian ♯11 Planing',
    genres: ['ambient', 'cinematic'],
    mode: 'lydian',
    events: [
      { chord: { offset: 0, family: 'maj7#11' } },
      { chord: { offset: 2, family: 'maj7#11' } },
    ],
    tags: ['planing', 'modal'],
    description: 'Parallel maj7♯11 chords planed up a whole step — a bright Lydian wash.',
    harmonicIntent: 'Parallel planing of the ♯11 colour is deliberate non-functional motion.',
  }),

  // ---- Rest / articulation coverage (rests were 0 in the legacy bank) ----
  original({
    id: 'call-response-stabs',
    name: 'Call & Response Stabs',
    genres: ['house', 'techno'],
    mode: 'natural-minor',
    events: [
      { chord: { offset: 0, family: 'min7' }, durationBars: 1 },
      { chord: null, durationBars: 1 },
      { chord: { offset: 8, family: 'maj7' }, durationBars: 1 },
      { chord: null, durationBars: 1 },
    ],
    tags: ['vamp'],
    description: 'A stab-and-space pattern: chord, rest, chord, rest — leaving room in the groove.',
  }),
  original({
    id: 'dub-space-skank',
    name: 'Dub Space Skank',
    genres: ['dub-techno', 'jungle'],
    mode: 'natural-minor',
    events: [
      { chord: null, durationBars: 1 },
      { chord: { offset: 0, family: 'min7' }, durationBars: 1 },
      { chord: null, durationBars: 1 },
      { chord: { offset: 5, family: 'min7' }, durationBars: 1 },
    ],
    tags: ['vamp'],
    description: 'An off-beat dub skank: the chord lands in the gaps, rests carry the space.',
  }),
  original({
    id: 'suspense-hit-rest',
    name: 'Suspense Hit & Rest',
    genres: ['cinematic'],
    mode: 'harmonic-minor',
    events: [
      { chord: { offset: 0, family: 'min' }, durationBars: 2 },
      { chord: null, durationBars: 2 },
      { chord: { offset: 7, family: '7b9' }, durationBars: 2 },
      { chord: null, durationBars: 2 },
    ],
    tags: ['cadence', 'chromatic'],
    description: 'A cinematic hit-then-silence: a minor stab and an altered dominant, each followed by two bars of rest.',
    harmonicIntent: 'The 7♭9 dominant is the deliberate tension chord before the silence.',
    tempoRange: [60, 90],
  }),

  // ---- A per-event-duration example (durations wired end-to-end) ----
  original({
    id: 'long-short-vamp',
    name: 'Long–Short Minor Vamp',
    genres: ['downtempo', 'lo-fi'],
    mode: 'dorian',
    events: [
      { chord: { offset: 0, family: 'min9' }, durationBars: 2 },
      { chord: { offset: 5, family: 'dom9' }, durationBars: 1 },
      { chord: { offset: 10, family: 'maj9' }, durationBars: 1 },
    ],
    tags: ['vamp'],
    description: 'A three-chord Dorian vamp where the tonic is held twice as long as the IV/♭VII — demonstrates per-event durations.',
  }),

  // ---- Pack A: elementary triadic fundamentals (the I–IV–V family) ----
  original({
    id: 'three-chord-i-iv-v',
    name: 'I–IV–V (Three-Chord)',
    classification: 'generic-theory',
    genres: ['pop', 'cinematic'],
    mode: 'major',
    events: [
      { chord: { offset: 0, family: 'maj' } },
      { chord: { offset: 5, family: 'maj' } },
      { chord: { offset: 7, family: 'maj' } },
    ],
    tags: ['cadence'],
    description: 'The three-chord song: tonic, subdominant, dominant — the backbone of folk, rock, country, and blues.',
    provenance: {
      kind: 'traditional',
      supports: 'I–IV–V (the primary triads) is the foundational tonal progression of Western popular music.',
      ...REVIEW,
    },
  }),
  original({
    id: 'i-iv-v-iv-loop',
    name: 'I–IV–V–IV Loop',
    classification: 'generic-theory',
    genres: ['pop'],
    mode: 'major',
    events: [
      { chord: { offset: 0, family: 'maj' } },
      { chord: { offset: 5, family: 'maj' } },
      { chord: { offset: 7, family: 'maj' } },
      { chord: { offset: 5, family: 'maj' } },
    ],
    tags: ['vamp', 'cadence'],
    description: 'The looping three-chord vamp I–IV–V–IV that never fully resolves — a garage-rock/party-song staple.',
    provenance: {
      kind: 'traditional',
      supports: 'The repeating I–IV–V–IV vamp is a traditional rock/garage progression.',
      ...REVIEW,
    },
  }),
  original({
    id: 'i-v-iv-rock',
    name: 'I–V–IV (Rock)',
    classification: 'generic-theory',
    genres: ['pop'],
    mode: 'major',
    events: [
      { chord: { offset: 0, family: 'maj' } },
      { chord: { offset: 7, family: 'maj' } },
      { chord: { offset: 5, family: 'maj' } },
    ],
    tags: ['cadence'],
    description: 'The rock turnaround I–V–IV, descending from the dominant back through the subdominant.',
    provenance: {
      kind: 'traditional',
      supports: 'I–V–IV is a traditional rock progression.',
      ...REVIEW,
    },
  }),
  original({
    id: 'iv-v-i-cadence',
    name: 'IV–V–I Cadence',
    classification: 'generic-theory',
    genres: ['pop', 'gospel'],
    mode: 'major',
    events: [
      { chord: { offset: 5, family: 'maj' } },
      { chord: { offset: 7, family: 'maj' } },
      { chord: { offset: 0, family: 'maj' } },
    ],
    tags: ['cadence'],
    description: 'The full authentic cadence with a subdominant preparation: IV → V → I.',
    provenance: {
      kind: 'traditional',
      supports: 'IV–V–I (predominant → dominant → tonic) is the archetypal common-practice cadence.',
      ...REVIEW,
    },
  }),
  original({
    id: 'i-vi-ii-v-turnaround',
    name: 'I–vi–ii–V Turnaround (Triads)',
    classification: 'generic-theory',
    genres: ['pop', 'jazz'],
    mode: 'major',
    events: [
      { chord: { offset: 0, family: 'maj' } },
      { chord: { offset: 9, family: 'min' } },
      { chord: { offset: 2, family: 'min' } },
      { chord: { offset: 7, family: 'maj' } },
    ],
    tags: ['turnaround', 'cadence'],
    description: 'The plain-triad turnaround I–vi–ii–V (the "Blue Moon" / ragtime turnaround), the triadic sibling of the 1-6-2-5 seventh-chord version.',
    provenance: {
      kind: 'traditional',
      supports: 'I–vi–ii–V is a traditional turnaround/circle progression.',
      ...REVIEW,
    },
  }),
  original({
    id: 'i-iii-vi-iv',
    name: 'I–iii–vi–IV (Triads)',
    classification: 'generic-theory',
    genres: ['pop'],
    mode: 'major',
    events: [
      { chord: { offset: 0, family: 'maj' } },
      { chord: { offset: 4, family: 'min' } },
      { chord: { offset: 9, family: 'min' } },
      { chord: { offset: 5, family: 'maj' } },
    ],
    tags: ['cadence'],
    description: 'A gentle descending pop loop I–iii–vi–IV, softer than the Axis loop thanks to the mediant.',
    provenance: {
      kind: 'traditional',
      supports: 'I–iii–vi–IV is a common diatonic pop progression.',
      ...REVIEW,
    },
  }),

  // ---- Pack B: blues fundamentals ----
  original({
    id: 'minor-blues-12-bar',
    name: 'Minor 12-Bar Blues',
    classification: 'generic-theory',
    completeness: 'reduction',
    genres: ['jazz', 'lo-fi'],
    mode: 'harmonic-minor',
    events: [
      { chord: { offset: 0, family: 'min7' } },
      { chord: { offset: 5, family: 'min7' } },
      { chord: { offset: 0, family: 'min7' } },
      { chord: { offset: 0, family: 'min7' } },
      { chord: { offset: 5, family: 'min7' } },
      { chord: { offset: 8, family: 'dom7' } },
      { chord: { offset: 7, family: 'dom7' } },
      { chord: { offset: 0, family: 'min7' } },
    ],
    tags: ['blues', 'chromatic'],
    description: 'An eight-slot reduction of the minor 12-bar blues, with the distinctive ♭VI7 → V7 half-step descent in the turnaround.',
    harmonicIntent: 'The i7/iv7 dominant-flavoured minor harmony and the ♭VI7–V7 chromatic descent are the defining minor-blues colours.',
    provenance: {
      kind: 'traditional',
      supports: 'The minor 12-bar blues (min7 i/iv with a ♭VI7–V7 turnaround) is a traditional blues form.',
      ...REVIEW,
    },
  }),
  original({
    id: 'twelve-bar-blues-quick-change',
    name: '12-Bar Blues (Quick Change)',
    classification: 'generic-theory',
    completeness: 'reduction',
    genres: ['jazz', 'lo-fi'],
    mode: 'mixolydian',
    events: [
      { chord: { offset: 0, family: 'dom7' } },
      { chord: { offset: 5, family: 'dom7' } },
      { chord: { offset: 0, family: 'dom7' } },
      { chord: { offset: 0, family: 'dom7' } },
      { chord: { offset: 5, family: 'dom7' } },
      { chord: { offset: 5, family: 'dom7' } },
      { chord: { offset: 0, family: 'dom7' } },
      { chord: { offset: 7, family: 'dom7' } },
    ],
    tags: ['blues'],
    description: 'The basic "quick-change" 12-bar blues in dominant 7ths (IV7 in bar 2) — simpler than the ii–V jazz-blues reharmonization.',
    harmonicIntent: 'All-dominant harmony is idiomatic blues, not unexplained chromaticism.',
    provenance: {
      kind: 'traditional',
      supports: 'The quick-change 12-bar blues is the standard basic blues form.',
      ...REVIEW,
    },
  }),
  original({
    id: 'i-biii-iv-blues-rock',
    name: 'I–♭III–IV (Blues-Rock)',
    classification: 'generic-theory',
    genres: ['electro', 'breakbeat'],
    mode: 'mixolydian',
    events: [
      { chord: { offset: 0, family: 'maj' } },
      { chord: { offset: 3, family: 'maj' } },
      { chord: { offset: 5, family: 'maj' } },
    ],
    tags: ['blues', 'chromatic'],
    description: 'The blues-rock riff progression I–♭III–IV, borrowing the ♭III from the blues/minor-pentatonic sound.',
    harmonicIntent: 'The major ♭III is a deliberate blues-scale borrowing over a major tonic.',
    provenance: {
      kind: 'traditional',
      supports: 'I–♭III–IV is a traditional blues-rock riff progression.',
      ...REVIEW,
    },
  }),

  // ---- Pack C: classic harmonic devices ----
  original({
    id: 'neapolitan-cadence',
    name: 'Neapolitan Cadence',
    classification: 'generic-theory',
    genres: ['cinematic', 'jazz'],
    mode: 'harmonic-minor',
    events: [
      { chord: { offset: 5, family: 'min' } },
      { chord: { offset: 1, family: 'maj' } },
      { chord: { offset: 7, family: 'dom7' } },
      { chord: { offset: 0, family: 'min' } },
    ],
    tags: ['cadence', 'chromatic'],
    aliases: ['♭II–V–i'],
    description: 'The Neapolitan cadence: a major ♭II chord as a chromatic predominant (iv → ♭II → V → i).',
    harmonicIntent: 'The ♭II (Neapolitan) is a deliberate chromatic predominant, standard common-practice harmony.',
    provenance: {
      kind: 'traditional',
      supports: 'The Neapolitan (♭II) chord as a predominant into V–i is standard common-practice harmony.',
      ...REVIEW,
    },
  }),
  original({
    id: 'ascending-fourths-cycle',
    name: 'Ascending-Fourths Cycle',
    classification: 'generic-theory',
    genres: ['cinematic', 'electro'],
    mode: 'major',
    events: [
      { chord: { offset: 8, family: 'maj' } },
      { chord: { offset: 3, family: 'maj' } },
      { chord: { offset: 10, family: 'maj' } },
      { chord: { offset: 5, family: 'maj' } },
      { chord: { offset: 0, family: 'maj' } },
    ],
    tags: ['modulation', 'chromatic'],
    aliases: ['Hey Joe'],
    description: 'A cycle of ascending perfect fourths through major triads (♭VI–♭III–♭VII–IV–I), rising to a resolute I.',
    harmonicIntent: 'The chain of major triads a fourth apart is a deliberate cyclic (non-diatonic) device.',
    provenance: {
      kind: 'internal-theory-review',
      supports: 'A cycle of major triads ascending by perfect fourth is a well-known rock/modal device.',
      ...REVIEW,
    },
  }),
]
