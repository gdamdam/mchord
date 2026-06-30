# Architecture

`mchord` is a Vite + React + TypeScript (strict) PWA. The design separates a pure
harmony engine and a clock-driven scheduler from React and Web Audio, so the
musical logic is deterministic and unit-tested and the UI is just a view over it.

## Harmony engine (pure)

`src/harmony/` holds the music theory and voice leading — chords, scales, and
note spelling — as framework-free TypeScript with no dependency on React or Web
Audio. It turns a chord choice into a concrete set of voiced notes, and voices
each chord relative to the previous one so motion between chords is smooth and
**deterministic** (the same progression always voices the same way). This module
is covered by unit tests (`chords.test.ts`, `scales.test.ts`, `spelling.test.ts`).

## Audio engine

`src/audio/` is the synth: `voiceParams.ts`, `presets.ts`, and `macros.ts` define
the polyphonic voices, the factory presets, and the performance macros; `dsp.ts`
and `src/audio/worklets/` hold the DSP and the AudioWorklet stages. The engine
builds a **native voice graph** on a single `AudioContext` created on a user
gesture, with an **AudioWorklet limiter** as the final master stage. It is a
**singleton** — one audio graph for the whole app — so there is exactly one place
that owns audio output.

## Lookahead scheduler

`src/transport/` owns timing: `clock.ts` (the lookahead scheduler), `rhythm.ts`
(the 8 rhythm styles and swing), and `rng.ts` (seeded, deterministic variation).
The scheduler is **decoupled from React** — it looks ahead on the audio clock and
emits timed note events rather than relying on UI timers, which keeps playback
sample-accurate under load.

## MIDI layer and the NoteSink contract

`src/midi/` parses and routes Web MIDI: `parse.ts` and `messages.ts` decode/encode
MIDI bytes, `ownership.ts` tracks note ownership so notes are released correctly
(no hung notes), and `webmidi.d.ts` provides the Web MIDI types. The scheduler
emits notes through a shared **NoteSink** contract that both the audio engine and
the MIDI output implement, so a single event stream drives the built-in synth and
external gear identically. MIDI is optional; the app is fully usable without it.

## Persistence and share codec

`src/persistence/` (`defaults.ts` and the session store) keeps sessions in the
browser's local storage, and `src/sharing/` encodes a full session into a share
link and decodes it back. Both **validate at the boundary**: data coming from
storage or from a URL is checked and normalized (falling back to defaults on bad
input) before it ever reaches the engine, so a malformed or stale link can't
corrupt state.

## Link transport

`src/transport/link.ts` is the Ableton Link adapter — a thin client over the
companion link bridge that translates Link's shared tempo/phase into the
scheduler's clock. When the bridge isn't running, the adapter degrades gracefully
and the rest of the app is unaffected.

## State, undo/redo

UI state lives in a **reducer**; user actions are dispatched as actions and the
reducer produces the next state, with **bounded undo/redo** history. React renders
this state; it never schedules audio or MIDI directly.

## PWA strategy

`public/manifest.webmanifest` plus `public/sw.js` make `mchord` installable. The
service worker is **network-first for navigations** (a deploy never serves a stale
shell) and **cache-first for hashed assets**. At install it precaches the shell
and the content-hashed build assets listed in a generated `precache-manifest.json`,
so the full app — including the audio worklet — works offline after one visit.

## Directory layout

```text
src/
  App.tsx  main.tsx           integrated UI + wiring, app entry
  types.ts                    shared types
  harmony/                    pure theory + deterministic voice leading
    chords.ts  scales.ts  spelling.ts   (+ .test.ts beside each)
  audio/                      built-in synth (singleton engine)
    voiceParams.ts  presets.ts  macros.ts  dsp.ts
    worklets/                 AudioWorklet stages (incl. limiter)
  transport/                  clock.ts (lookahead scheduler) · rhythm.ts (styles +
                              swing) · rng.ts (seeded) · link.ts (Ableton Link)
  midi/                       parse.ts  messages.ts  ownership.ts  webmidi.d.ts
  persistence/                defaults.ts + local session store
  sharing/                    share-link codec (encode/decode + validation)
  styles/                     global.css  theme.css
public/                       manifest.webmanifest · sw.js · mark · CNAME · robots
.github/workflows/            ci.yml (check) · deploy.yml (GitHub Pages)
```
