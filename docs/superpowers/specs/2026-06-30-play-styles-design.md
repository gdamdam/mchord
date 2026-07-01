# Play Styles (chord-as-single-notes) — Design

**Status:** approved for planning
**Date:** 2026-06-30
**Approach:** Authored, multi-lane play styles (no step editor, no per-style live knobs).

## Goal

Let mchord play a chord not only as a block/simple arp, but as **single notes in
musical, genre-flavoured ways** — most importantly as a **low bass voice plus a
moving melodic voice in a different octave** (the "bass part + melody" idea),
without turning the app into a Scaler-style phrase editor.

## Background (research)

Every serious chord tool (Scaler 3, Cthulhu, ChordPotion, Captain, InstaChord,
Ableton) shares one model: patterns reference **chord-tone indices, not fixed
pitches**; a **dedicated bass voice** = root dropped an octave on its own rhythm;
a **moving upper voice** = chord tones arped with **per-step octave offsets**;
plus order modes, rate, swing, gate, light velocity/rest humanisation. The pros
ship **authored preset patterns** as the fast path to a "designed" feel. The
distilled minimal-magic = *relative chord-tone stepper + pinned-low bass +
per-step octave jumps*. This design implements exactly that as a fixed set of
authored styles.

## Architecture fit

mchord's pipeline is `rhythmEvents(voicing) → RhythmEvent[] → Scheduler →
NoteSink`. A "lane" is just more note events, so **the Scheduler and AudioEngine
do not change**. We generalise the single-lane rhythm generator into a
multi-lane play-style generator and give it the chord **root** (bass lanes need
it). The melodic lanes read the existing **voice-led voicing**, so single-note
lines move smoothly chord-to-chord (a mchord differentiator).

## Data model (new: `src/transport/playStyles.ts`)

```ts
// Which chord notes a lane draws from.
type LaneSource = 'root' | 'fifth' | 'chordTones' | 'guideTones' | 'top'

// Arp ordering for chordTones lanes.
type LaneOrder = 'up' | 'down' | 'updown' | 'asPlayed' | 'random'

interface Lane {
  source: LaneSource
  /** Octave offset applied to the resolved note(s): bass −1/−2, melody +1. */
  octave: number
  /** 16-step gate mask (one bar = 16 sixteenths). true = a note fires. */
  steps: boolean[]            // length 16
  /** For source==='chordTones': how the tones are cycled across active steps. */
  order?: LaneOrder
  /** Octaves the cycle spans before wrapping (1 = single octave). */
  octaveSpan?: number         // default 1
  /** Optional per-step octave jump added to `octave` (length 16, default 0s). */
  octaveJump?: number[]
  /** Gate length as a fraction of one step (0–2; >1 = legato overlap). */
  gate: number
  /** Base velocity 0–1; downbeats get a small accent automatically. */
  velocity: number
}

interface PlayStyleDef {
  id: RhythmStyle            // reuse existing enum (append-only), UI label = "Style"
  name: string
  group: 'block' | 'arp' | 'split'
  lanes: Lane[]              // 1–3 lanes
}
```

**Note resolution.** For each active step:
- `root`/`fifth`: chord root (or root+7) placed at a bass anchor register
  (MIDI ~40 = E2) shifted by `octave*12`.
- `guideTones`: the 3rd and 7th (6th for 6/min6) computed from the chord family,
  placed near the melody anchor (MIDI ~64) + `octave*12`.
- `top`: highest voicing note + `octave*12`.
- `chordTones`: the **voice-led voicing** notes, cycled by `order`/`octaveSpan`,
  + `octave*12` + per-step `octaveJump`.

**Generator (pure, tested):**
```ts
function playStyleEvents(
  root: PitchClass,
  voicing: Voicing,
  style: RhythmStyle,
  opts: { durationBars: number; beatsPerBar?: number; swing: number; motion: number },
): RhythmEvent[]   // same RhythmEvent shape used today
```
`motion` scales density (adds subdivisions / activates a busier variant);
`swing` shifts off-beat steps; the 16-step bar pattern repeats for the slot's
duration. Deterministic (random order uses a seeded RNG passed via opts/seed).

## Scheduler change (small)

`SchedStep` gains the chord root so bass lanes can place it:
```ts
interface SchedStep { voicing: Voicing | null; root: PitchClass | null; durationBars: number }
```
`planWindow` calls `playStyleEvents(step.root, step.voicing, …)`. `useInstrument`
already has `scene.slots[i].chord.root` and passes it alongside the voicing.
`rhythmEvents` is replaced by `playStyleEvents` (the old export can remain as a
thin alias during migration).

## Style set (~16, one grouped "Style" selector)

- **Block** (existing behaviour, single lane): Hold, Pulse, Stab, Offbeat
- **Arp** (existing, single melodic lane): Arp ↑, Arp ↓, Arp ↕, Broken
- **Split** (new, multi-lane):
  - **Bass + Melody** — root bass (beats) + guideTones melody (+1 oct, 8ths)
  - **House Stab + Octave Bass** — root/oct bass on offbeat 8ths + chordTones stab on offbeats
  - **Techno Rolling Root** — root 16ths with the first 16th of each beat empty
  - **Trance 16th Arp** — rolling root bass + chordTones up-arp 16ths (+1 oct, span 2)
  - **Dub Skank** — sparse held root + min-coloured chord stab on offbeats
  - **Synthwave Drive** — root+octave straight 8ths + chordTones up/updown 8ths
  - **Lo-Fi Broken** — loose root on 1 (+3) + rolled/broken upper voicing, humanised
  - **Garage 2-Step** — syncopated root bass + choppy offbeat chord stabs (swung)

Existing eight are re-expressed as single-lane `PlayStyleDef`s that **preserve
current behaviour** (their existing tests must still pass).

## Integration

- **Selector:** today's "Rhythm" control becomes **Style**, grouped
  (Block / Arp / Split) via `<optgroup>`. New ids are **appended** to
  `RHYTHM_STYLES` → no persistence migration, share-codec index stays stable.
  The scene field stays `rhythm`.
- **Audition (transport stopped):** triggering/clicking a slot plays **~1 bar of
  the current style** (not a block chord) so you preview the performance. The
  `useInstrument` audition path generates one bar of `playStyleEvents` and
  dispatches them to the sink instead of a single held block.
- **MOTION** macro continues as the energy control (density/subdivision); **swing**
  applies to off-beat steps.
- No changes to voice leading, macros, persistence shape, MIDI, or Link.

## Testing (`src/transport/playStyles.test.ts`)

Pure generator, deterministic — no audio tests. Cover:
- Each existing style reproduces its prior event pattern (regression).
- Bass lanes place the **root** in the low register (not the voicing's lowest,
  when they differ under inversion).
- Split styles emit **multiple simultaneous lanes** (bass + melody events at the
  expected times/octaves).
- `octaveJump` shifts registers; `order` modes cycle correctly; `octaveSpan` wraps.
- Empty voicing / null root → no events (rest).
- `motion` increases event density monotonically; `swing` delays off-beats.
- Determinism: same inputs (incl. seed for random order) → identical output.

## Out of scope

No step/pattern editor, no per-step UI, no per-style live knobs (that was
approaches B/C), no MPE/slide, no walking/approach tones (needs next-chord
look-ahead). These can graduate later over the same lane model.

## File touch list

- `src/transport/playStyles.ts` (new — lane model, style defs, generator)
- `src/transport/rhythm.ts` (fold into / re-export from playStyles; keep tests green)
- `src/transport/scheduler.ts` (`SchedStep.root`, `planWindow` passes root)
- `src/transport/index.ts` (exports)
- `src/types.ts` (append new ids to `RHYTHM_STYLES`)
- `src/app/useInstrument.ts` (pass root per step; audition = 1 bar of the style)
- `src/components/HarmonyControls.tsx` (grouped Style selector) + `displayNames.ts`
- Tests: `src/transport/playStyles.test.ts` (+ keep `rhythm.test.ts` green)
