import { describe, it, expect } from 'vitest'
import {
  CHORD_FAMILIES,
  MODES,
  SLOT_COUNT,
  SLOT_DURATIONS,
  type ChordFamily,
} from '../types'
import {
  CATALOG,
  CLASSIFICATIONS,
  COMPLETENESS,
  PROVENANCE_KINDS,
  REVIEW_STATES,
  HARMONY_TAGS,
  INTENT_TAGS,
  entryToLoad,
  filterByFamily,
  filterByMode,
  normalizeLegacyLibrary,
  progressionsForGenre,
  resolveById,
  searchProgressions,
  signatureOfEvents,
  type CatalogEntry,
} from './catalog'
import { GENRES, PROGRESSION_LIBRARY } from './progressions'
import { scaleSemitones, mod12 } from './scales'
import { computeCatalogAudit, type AuditRow } from './catalogAudit'

const familySet = new Set<string>(CHORD_FAMILIES)
const modeSet = new Set<string>(MODES)
const genreSet = new Set<string>(GENRES)
const durationSet = new Set<number>(SLOT_DURATIONS)

/**
 * PERMANENCE GOLDEN. Every shipped id is pinned here. Ids must never change or be
 * reused once shipped; adding an entry appends to this list (a DELIBERATE edit),
 * while an accidental id change fails this test. Keep sorted.
 */
const PINNED_IDS: string[] = [
  '1-4-walk-up', '1-5-6-3-swing', '1-6-2-5-sevenths', '2-5-1-extended',
  '2-step-swing-turn', '3-6-2-5-1', '303-phrygian-pedal', '6-2-5-1-turnaround',
  'acid-aeolian-grind', 'acid-drive', 'acid-jazz-turn', 'add9-glow',
  'amber-haze', 'ambient-drift', 'ambiguous-cell', 'amen-melancholy',
  'amen-plagal-iv-i', 'andalusian-descent', 'anthem-i-v-vi-iv', 'anthemic-i-iv-vi-v',
  'atmospheric-pad-loop', 'augmented-line-rise', 'autumn-leaves', 'backdoor-amen-bvii-iv-i',
  'backdoor-cadence', 'basic-channel-stab', 'bii-biii-i-mystery', 'bird-blues',
  'bird-turnaround', 'bitcrush-bloom', 'blue-hour', 'broken-music-box',
  'call-response-stabs', 'canon', 'chain-reaction-i-iv', 'chicago-warmth',
  'chilled-neurofunk', 'chromatic-mediants', 'chrome-bass', 'chunky-funk-vamp',
  'climbing-buildup', 'cold-descent', 'cold-modal-loop', 'cold-steel',
  'coltrane-ii-v-reharm', 'cosmic-min9-pad', 'cracked-bell', 'creep',
  'dark-descent', 'data-rot', 'deep-chord-drift-i-bvi', 'deep-house-lean',
  'deep-house-ninths', 'deep-jazz-roller', 'desolate-open-drone', 'detroit-deep',
  'detroit-parallel-stabs', 'diminished-bite', 'diva-house', 'doo-wop-i-vi-iv-v',
  'doom-riff', 'dorian-cloud', 'dorian-hope', 'dorian-maj-iv-vamp',
  'dorian-sunrise-iv', 'driftwood', 'driving-i-bvi-vamp', 'dub-skank',
  'dub-space-skank', 'dusk-backdoor', 'dystopian-pulse', 'echo-chamber-i-v',
  'emotional-breakdown', 'epic-8-bar-uplifter', 'euphoric-vi-iv-i-v', 'faded-photo',
  'floating-maj7-wash', 'four-chord-iv-i-v-vi', 'fractal-lullaby', 'full-moon',
  'funky-breaks', 'future-bass-lift', 'garage-gospel', 'ghetto-swing',
  'giant-steps-cycle', 'glass-shards', 'glitched-cadence', 'golden-era-sus',
  'gospel-walk-up', 'grid-pulse', 'halftime-void', 'hands-up-vi-iv-i-v-i',
  'harmonic-major-borrowed-iv', 'harmonic-sting-v-i', 'hendrix-sharp9-funk', 'heroic-bvii-iv-i',
  'hollow-min7-pulse', 'hollow-room', 'hollywood-cadence', 'horn-stab-groove',
  'hospital-rhodes', 'hypnotic-i-bvi', 'hypnotic-i-drone', 'ii-v-of-iv',
  'ii-v-of-vi', 'iii-vi-ii-v', 'interstellar-oscillation', 'iron-lung',
  'jackin-vamp', 'jazz-blues', 'jazz-stab-jungle', 'jazzy-ii-v-i',
  'lady-bird-turnaround', 'language-climb', 'larry-heard', 'liquid-ii-v-i',
  'liquid-ii-v-ladder', 'liquid-soul-lift', 'lo-fi-blues', 'locrian-half-dim-drift',
  'long-short-vamp', 'lush-garage-2-step', 'lush-maj9-bed', 'lush-maj9-vamp',
  'lydian-float', 'lydian-sharp11-planing', 'lydian-wonder-i-ii', 'major-ii-v-i',
  'major-third-planing', 'maurizio-i-bvii', 'melancholy-sixths', 'mellow-min6',
  'melodic-dubstep-yearn', 'melodic-i-bvi-biii-bvii', 'melodic-ii-v-i', 'melodic-minor-tonic-vamp',
  'melodic-progressive-groove', 'midnight-motor', 'midnight-pulse', 'min9-planing-chain',
  'minor-breakdown-i-bvi-biii-bvii', 'minor-gospel-circle', 'minor-gospel-i-iv-v', 'minor-ii-v-i',
  'minor-line-cliche', 'minor-stab-drive', 'minor-turnaround', 'modal-shift-wash',
  'neo-gospel-descent', 'neo-soul-lush-9ths', 'neon-sunset', 'neon-vamp',
  'night-bassline', 'night-drive', 'night-ritual', 'nonlinear',
  'nostalgia-iii-vi', 'nostalgic-maj7-arc', 'ominous-half-step', 'outrun-anthem',
  'parallel-glide', 'passing-diminished', 'peak-time-i-biii-bvii', 'phrygian-bii-i',
  'phrygian-dust', 'phrygian-loop-bii-i-bvii-bvi', 'phrygian-tech', 'pop-punk-power-four',
  'praise-break-cycle', 'progressive-i-vi-iii-vii', 'progressive-sweep', 'quadrant-min9-haze',
  'quantize-error', 'r-b-lean', 'ragga-clash', 'ragga-minor-vamp',
  'rainy-window', 'rare-groove-skank', 'reese-drone', 'retro-cascade',
  'rhodes-cascade', 'rhodes-shuffle', 'rhythm-changes-bridge', 'rising-iv-bvi-bvii-i',
  'rolling-i-bvi-bvii', 'rolling-minor-vamp', 'rotation-v-vi-iv-i', 'royal-road',
  'satin-doll-ii-v-chain', 'secondary-dom-turn', 'sharp-iv-diminished', 'shimmer-add9-wash',
  'shout-1-4-vamp', 'silky-r-b-turn', 'sine-wave-suspension', 'singer-songwriter-i-iii-iv-v',
  'skippy-rhodes', 'skywalker-mixolydian', 'sliced-modal', 'slow-rain',
  'smoke-vinyl', 'so-what-cadence', 'so-what-modal', 'soulful-cascade',
  'soulful-piano-house', 'soulful-planing', 'spanish-circuit', 'static-rush',
  'steppers-minor', 'study-vamp', 'stutter-drift', 'submerged-i-iv-bvii',
  'sunday-chords', 'sunrise-i-iv-vamp', 'sunset-terrace', 'sus-pump',
  'sus2-sneer', 'sus2-sus4-pump', 'sus4-breath', 'suspended-drift',
  'suspended-fog', 'suspended-pedal', 'suspended-tension', 'suspense-hit-rest',
  'tape-delay-i-biii', 'trance-sus-rise', 'tritone-sub-2-5-1', 'tritone-terror',
  'tritone-turnaround', 'tritone-walkdown-2-5-1', 'turnaround-loop', 'twilight-liquid',
  'two-chord-groove', 'two-step-lush', 'uplift-i-bvii-bvi-bvii', 'uplifting-minor-chorus',
  'velvet-six', 'vhs-sunrise', 'vocal-house', 'vocoder-nights',
  'warehouse-i-bvii', 'warehouse-sus', 'warm-cassette', 'warm-rhodes',
  'warm-static', 'warp-dorian-vamp',
]

describe('catalog: identity + permanence', () => {
  it('ids are unique', () => {
    const ids = CATALOG.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ids match the pinned golden set (ids are permanent)', () => {
    expect([...CATALOG.map((e) => e.id)].sort()).toEqual([...PINNED_IDS].sort())
  })

  it('resolveById round-trips every entry', () => {
    for (const e of CATALOG) expect(resolveById(e.id)).toBe(e)
  })
})

describe('catalog: schema validity', () => {
  it('every entry is well-formed', () => {
    for (const e of CATALOG) {
      expect(e.name.trim().length, `${e.id}: name`).toBeGreaterThan(0)
      expect(CLASSIFICATIONS).toContain(e.classification)
      expect(REVIEW_STATES).toContain(e.review)
      expect(COMPLETENESS).toContain(e.completeness)
      expect(PROVENANCE_KINDS).toContain(e.provenance.kind)

      expect(e.genres.length, `${e.id}: genres`).toBeGreaterThan(0)
      for (const g of e.genres) expect(genreSet.has(g), `${e.id}: genre ${g}`).toBe(true)
      if (e.mode !== undefined) expect(modeSet.has(e.mode), `${e.id}: mode`).toBe(true)

      expect(e.events.length, `${e.id}: event count`).toBeGreaterThanOrEqual(1)
      expect(e.events.length, `${e.id}: event count`).toBeLessThanOrEqual(SLOT_COUNT)
      for (const ev of e.events) {
        if (ev.chord) {
          expect(familySet.has(ev.chord.family), `${e.id}: family`).toBe(true)
          expect(Number.isInteger(ev.chord.offset)).toBe(true)
          expect(ev.chord.offset).toBeGreaterThanOrEqual(0)
          expect(ev.chord.offset).toBeLessThanOrEqual(11)
        }
        if (ev.durationBars !== undefined) {
          expect(durationSet.has(ev.durationBars), `${e.id}: duration`).toBe(true)
        }
        if (ev.inversion !== undefined) {
          expect(ev.inversion).toBeGreaterThanOrEqual(0)
          expect(ev.inversion).toBeLessThanOrEqual(3)
        }
        if (ev.bass !== undefined) {
          expect(ev.bass).toBeGreaterThanOrEqual(0)
          expect(ev.bass).toBeLessThanOrEqual(11)
        }
      }
      for (const t of e.tags) expect(HARMONY_TAGS).toContain(t)
    }
  })

  it('aliases never duplicate the canonical name and are unique', () => {
    for (const e of CATALOG) {
      expect(e.aliases).not.toContain(e.name)
      expect(new Set(e.aliases).size, `${e.id}: alias dupes`).toBe(e.aliases.length)
      for (const a of e.aliases) expect(a.trim().length, `${e.id}: empty alias`).toBeGreaterThan(0)
    }
  })
})

describe('catalog: provenance + review rules', () => {
  it('reviewed entries carry a description and a supporting claim', () => {
    for (const e of CATALOG.filter((x) => x.review === 'reviewed')) {
      expect(e.description.trim().length, `${e.id}: description`).toBeGreaterThan(0)
      expect(e.provenance.supports?.trim().length, `${e.id}: supports`).toBeGreaterThan(0)
    }
  })

  it('external-source provenance kinds carry a citation; no fabricated citations elsewhere', () => {
    for (const e of CATALOG) {
      const p = e.provenance
      if (p.kind === 'textbook' || p.kind === 'reference-work' || p.kind === 'artist-material') {
        // If we ever claim an external source, it MUST have a durable reference.
        expect(Boolean(p.url || p.isbn || p.title), `${e.id}: external cite`).toBe(true)
      } else {
        // Honest no-external-source kinds must NOT carry a fabricated URL/ISBN.
        expect(p.url, `${e.id}: unexpected url`).toBeUndefined()
        expect(p.isbn, `${e.id}: unexpected isbn`).toBeUndefined()
      }
    }
  })

  it('unverified entries are classified honestly', () => {
    for (const e of CATALOG.filter((x) => x.review === 'unverified')) {
      // Either a legacy-normalized traditional pattern, or an explicitly
      // unverified attribution — never a claimed external source.
      expect(['traditional', 'unverified', 'internal-theory-review']).toContain(e.provenance.kind)
    }
  })
})

describe('catalog: no unexplained duplicates', () => {
  it('has no duplicate canonical signatures and no same-genre duplicates', () => {
    const rows: AuditRow[] = CATALOG.map((e) => ({
      id: e.id,
      genres: e.genres,
      name: e.name,
      mode: e.mode,
      chords: e.events.map((ev) => ev.chord),
    }))
    const audit = computeCatalogAudit(rows)
    expect(audit.exactDuplicates, 'exact duplicate signatures').toEqual([])
    expect(audit.sameGenreDuplicates, 'same-genre duplicates').toEqual([])
    expect(audit.uniqueSignatures).toBe(CATALOG.length)
  })
})

describe('catalog: harmonic-intent annotation', () => {
  it('non-diatonic entries declare an intent tag or note (no blanket diatonic rule)', () => {
    for (const e of CATALOG) {
      if (!e.mode) continue
      const scale = new Set(scaleSemitones(e.mode))
      const nonDiatonic = e.events.some((ev) => ev.chord && !scale.has(mod12(ev.chord.offset)))
      if (nonDiatonic) {
        const annotated =
          e.tags.some((t) => INTENT_TAGS.has(t)) || Boolean(e.harmonicIntent)
        expect(annotated, `${e.id}: non-diatonic but unannotated`).toBe(true)
      }
    }
  })
})

describe('catalog: coverage targets', () => {
  it('every supported mode has at least one reviewed entry', () => {
    for (const m of MODES) {
      const reviewed = CATALOG.filter((e) => e.mode === m && e.review === 'reviewed')
      expect(reviewed.length, `mode ${m}: reviewed coverage`).toBeGreaterThanOrEqual(1)
    }
  })

  it('every chord family is used, with at least one reviewed use', () => {
    for (const f of CHORD_FAMILIES) {
      const used = filterByFamily(f as ChordFamily)
      expect(used.length, `family ${f}: any use`).toBeGreaterThanOrEqual(1)
      const reviewed = used.filter((e) => e.review === 'reviewed')
      expect(reviewed.length, `family ${f}: reviewed use`).toBeGreaterThanOrEqual(1)
    }
  })

  it('carries several rest-containing patterns', () => {
    const withRests = CATALOG.filter((e) => e.events.some((ev) => ev.chord === null))
    expect(withRests.length).toBeGreaterThanOrEqual(3)
  })
})

describe('catalog: golden theory patterns', () => {
  const golden: Record<string, string> = {
    'major-ii-v-i': '2:min7|7:13|0:maj7',
    'anthem-i-v-vi-iv': '0:maj|7:maj|9:min|5:maj', // Axis
    'doo-wop-i-vi-iv-v': '0:maj|9:min|5:maj|7:maj',
    canon: '0:maj|7:maj|9:min|4:min|5:maj|0:maj|5:maj|7:maj', // Pachelbel
    'andalusian-descent': '0:min|10:maj|8:maj|7:dom7',
  }
  for (const [id, sig] of Object.entries(golden)) {
    it(`${id} has the expected harmonic signature`, () => {
      const e = resolveById(id)
      expect(e, id).toBeDefined()
      expect(signatureOfEvents(e!.events)).toBe(sig)
    })
  }

  it('the Axis entry was renamed and keeps its legacy names as aliases', () => {
    const e = resolveById('anthem-i-v-vi-iv')!
    expect(e.name).toBe('Axis I–V–vi–IV')
    expect(e.aliases).toEqual(expect.arrayContaining(['80s Axis', 'Epic Majors']))
  })
})

describe('catalog: instantiation + transposition', () => {
  it('transposes offsets above the key root, wrapping mod 12', () => {
    const e = resolveById('major-ii-v-i')!
    const load = entryToLoad(e, 2) // D
    expect(load.chords).toEqual([
      { root: 4, family: 'min7' },
      { root: 9, family: '13' },
      { root: 2, family: 'maj7' },
    ])
    // wrap-around at the top of the octave
    const wrap = entryToLoad(resolveById('heroic-bvii-iv-i')!, 7) // offsets 10,5,0 → 5,0,7
    expect(wrap.chords.map((c) => c!.root)).toEqual([5, 0, 7])
  })

  it('emits per-event durations, defaulting to 1 bar', () => {
    const load = entryToLoad(resolveById('long-short-vamp')!, 0)
    expect(load.durations).toEqual([2, 1, 1])
    const plain = entryToLoad(resolveById('major-ii-v-i')!, 0)
    expect(plain.durations).toEqual([1, 1, 1])
  })

  it('rests instantiate as null and keep their duration', () => {
    const load = entryToLoad(resolveById('call-response-stabs')!, 0)
    expect(load.chords[1]).toBeNull()
    expect(load.chords[3]).toBeNull()
    expect(load.durations).toEqual([1, 1, 1, 1])
  })
})

describe('catalog: catalog-only metadata boundary', () => {
  it('entryToLoad never leaks inversion / bass into the wired chord objects', () => {
    // A synthetic entry carrying catalog-only metadata.
    const e: CatalogEntry = {
      id: '_test',
      name: 'test',
      aliases: [],
      classification: 'original-editorial',
      genres: ['jazz'],
      mode: 'major',
      events: [{ chord: { offset: 0, family: 'maj7' }, inversion: 2, bass: 4, keyCenter: 7 }],
      tags: [],
      description: '',
      provenance: { kind: 'internal-theory-review' },
      review: 'reviewed',
      completeness: 'complete',
    }
    const load = entryToLoad(e, 0)
    expect(Object.keys(load.chords[0]!).sort()).toEqual(['family', 'root'])
  })
})

describe('catalog: immutability + determinism', () => {
  it('the catalog is frozen', () => {
    expect(Object.isFrozen(CATALOG)).toBe(true)
    expect(Object.isFrozen(CATALOG[0])).toBe(true)
  })

  it('normalization is deterministic', () => {
    expect(JSON.stringify(normalizeLegacyLibrary())).toBe(JSON.stringify(normalizeLegacyLibrary()))
  })
})

describe('catalog: legacy compatibility', () => {
  it('every legacy genre still resolves to at least one canonical entry', () => {
    for (const g of GENRES) expect(progressionsForGenre(g).length, g).toBeGreaterThanOrEqual(1)
  })

  it('the legacy PROGRESSION_LIBRARY export is intact', () => {
    for (const g of GENRES) expect(Array.isArray(PROGRESSION_LIBRARY[g])).toBe(true)
  })

  it('search finds entries by legacy alias', () => {
    // "Squelch i-bII" was a legacy same-bank duplicate now folded into an alias.
    const hits = searchProgressions('Squelch')
    expect(hits.some((e) => e.id === '303-phrygian-pedal')).toBe(true)
  })

  it('mode filter returns only entries of that mode', () => {
    for (const e of filterByMode('dorian')) expect(e.mode).toBe('dorian')
  })
})
