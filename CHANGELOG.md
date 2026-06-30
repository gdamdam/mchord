# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-30

### Added

- **Loop-length control** — choose how many of the eight slots the progression
  cycles (1–8). Slots beyond the loop are "parked": still editable and
  auditionable, shown dimmed, but not played.
- **Authored visual identity** — Fraunces / Space Grotesk / Space Mono type
  (self-hosted, offline-safe), a warm "analog dusk" palette, and a box-drawing
  wordmark logo with the version shown at its top-right.

### Fixed

- **No audio on start** — the master-limiter AudioWorklet declared its parameters
  under the wrong static name (`parameters` instead of `parameterDescriptors`),
  so `process()` threw and the node output silence.
- **Crackling during playback** — replaced the JavaScript AudioWorklet limiter
  with a native `DynamicsCompressorNode`. JS worklets don't flush denormals, so
  decaying note/reverb tails caused audio-thread CPU spikes; native nodes don't.
  Also made voice retriggers click-free (continuous `cancelAndHoldAtTime` ramps,
  a larger voice pool, and quietest-voice stealing).

### Changed

- Scene schema bumped to v2 (added `loopLength`). Older saved scenes and share
  links migrate automatically, defaulting to the full eight-slot loop.

## [0.1.0] — 2026-06-30

Initial release of the v0.1 instrument.

### Added

- **Harmony engine** with deterministic voice leading — chords are voiced by a
  pure theory engine that keeps motion between successive chords smooth and
  repeatable.
- **8-slot progression** — build and trigger a sequence of up to eight chords.
- **8 rhythm styles** for animating the progression, with swing.
- **Built-in polyphonic synth** — 8 presets and 4 performance macros.
- **Sample-accurate scheduling** — a lookahead scheduler decoupled from React
  drives both audio and MIDI on the audio clock.
- **Save & share** — local-first persistence plus shareable links that encode a
  full session.
- **Optional MIDI in/out + clock** — play and drive external gear via Web MIDI;
  send/receive transport clock.
- **Optional Ableton Link** — tempo sync via the companion link bridge.
- **Installable PWA** — offline-capable after the first visit, served at
  [mchord.mpump.live](https://mchord.mpump.live).

[1.0.0]: https://github.com/gdamdam/mchord/releases/tag/v1.0.0
[0.1.0]: https://github.com/gdamdam/mchord/releases/tag/v0.1.0
