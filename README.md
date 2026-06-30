<div align="center">

# mchord

**Move through chords. Stay in flow.**

[![license](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue)](./LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](#how-it-works)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](./tsconfig.json)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![live](https://img.shields.io/badge/live-mchord.mpump.live-5fb0c8)](https://mchord.mpump.live)

</div>

---

`mchord` is a browser-native chord instrument. Lay out a progression, let a pure
harmony engine voice it with smooth, deterministic voice leading, animate it with
a rhythm style, and play it through a built-in polyphonic synth — or send it to
your gear over MIDI and sync to Ableton Link. It is local-first and offline-capable:
no account, no cookies, no telemetry, and no audio ever leaves the page.

> Backed by **313 deterministic tests** across the harmony, voice-leading,
> scheduling, MIDI, persistence, sharing, and integration layers.

## Highlights

- **Harmony-first** — think in chords and progressions, not individual notes.
- **Deterministic voice leading** — successive chords are voiced for smooth,
  repeatable motion, every time.
- **8 chord slots** — build and trigger a progression of up to eight chords.
- **Performance macros** — 4 macros sweep curated parameter groups for live play.
- **Built-in synth** — a polyphonic synth with 8 presets, played sample-accurately.
- **MIDI + Link optional** — Web MIDI in/out and clock, plus Ableton Link tempo
  sync; both are enhancements, never required.
- **Local-first / offline** — installable PWA that works offline after one visit.
- **Share links** — encode a full session into a URL and round-trip it anywhere.

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints and start audio (browser audio requires a user gesture).

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run typecheck` | Type-check without emit |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (run once) |
| `npm run check` | **typecheck + lint + test + build** (the full gate) |
| `npm run preview` | Serve the production build locally |

## How it works

The **harmony engine** (music theory + voice leading) is pure TypeScript, kept
independent of React and Web Audio, so it is deterministic and unit-tested. A
**lookahead scheduler** runs on the audio clock — decoupled from React — and
drives a built-in **audio engine** (native voice graph plus an AudioWorklet
limiter) and the **MIDI layer** through one shared note-sink contract. Sessions
persist locally and serialize into share links, with validation at every boundary.
Optional **Ableton Link** sync rides a transport adapter. State is a reducer with
bounded undo/redo, and the app ships as a PWA (network-first navigation,
cache-first hashed assets).

See [docs/architecture.md](./docs/architecture.md) for the full picture and
[docs/qa-checklist.md](./docs/qa-checklist.md) for the manual audio QA checklist.

## Privacy

- **No account, no cookies, no telemetry.** Nothing is tracked.
- **No network audio.** All synthesis and processing happen in the page; audio
  never leaves your browser.
- Sessions live in your browser's local storage; share links are plain URLs you
  choose to copy and send.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `1`–`8` | Trigger chord slots 1–8 |
| `Space` | Play / stop |
| Arrow keys | Move selection |
| `Enter` | Open / commit the selected chord |
| `R` | Generate / vary |
| `Cmd/Ctrl+Z` | Undo |
| `Shift+Cmd/Ctrl+Z` | Redo |
| `Esc` | Close overlays |

## License

[GNU Affero General Public License v3.0 or later](./LICENSE). Part of the *mpump*
family of local-first browser instruments; see [NOTICE](./NOTICE) for code lineage
and attribution.
