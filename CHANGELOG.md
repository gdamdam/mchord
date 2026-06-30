# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Unreleased

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

[0.1.0]: https://github.com/gdamdam/mchord/releases/tag/v0.1.0
