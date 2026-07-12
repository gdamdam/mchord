# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.9] — 2026-07-13

### Fixed
- **mbus subscriptions survive bridge drops.** Vendored mbus client synced from canonical (mbus-client 0.2.1): subscription intent is kept as `connecting` across WebSocket drops instead of failing permanently, ICE candidates are buffered until the remote description is set, and stale peer-connection callbacks can no longer tear down a replacement connection.

## [1.4.5] — 2026-07-07

### Changed

- **Vendored mbus-client re-synced** (upstream 0.2.0): a subscription now
  reports `live` only once the RTCPeerConnection reaches connectionState
  `connected`, instead of at ontrack/SDP time — prevents a false `live`
  badge when ICE fails.

## [1.4.4] — 2026-07-07

### Changed

- **Docs polish** — corrected a stale version badge in the README. No
  functional changes.

## [1.4.3] — 2026-07-06

### Changed

- **Vendored mbus-client re-synced** (upstream 0.1.2): Opus SDP tuning for
  full-band stereo CBR on the bus feed.

## [1.4.2] — 2026-07-06

### Fixed

- **Vendored mbus-client re-synced** (upstream 0.1.1): a false `bridge-too-old`
  under background-tab timer throttling was terminal — the client disabled
  itself and never retried, so the "bus" publish silently stopped working until
  reload. It now keeps retrying and recovers when the bridge answers.

## [1.4.1] — 2026-07-06

### Added

- **Publish to the mbus patchbay.** A “bus” toggle in the top bar offers
  mchord's master output to the [mbus](https://mbus.mpump.live) patchbay as a
  source named `mchord` — tab-to-tab WebRTC via the local link-bridge,
  peer-to-peer, no server. Off by default: until enabled no socket is opened,
  and without the bridge the toggle is harmless. The published feed is
  post-master-chain but pre local-mute, so (like MIDI out) muting the browser
  monitor doesn't cut the bus. The mbus-client is vendored verbatim under
  `src/transport/mbus/` and credited in `NOTICE`.

## [1.3.5] — 2026-07-02

### Added

- **Octave up / down buttons** in the transport shift the whole progression up
  or down by an octave (±2), with a live readout between them. The shift is a
  persisted, undoable scene setting applied at voicing time (register anchor +
  bounds move together), so chords stay octave-less. Scene schema bumped to v3
  with a migration defaulting existing scenes to no shift.

### Fixed

- **Hung notes when changing key (or octave) while playing.** Note-offs are
  keyed by MIDI number and derived from the current step list, so a mid-play
  voicing change left the old pitches without a matching note-off — they hung
  and accumulated. Held voices are now released before the new voicing takes
  over.

## [1.2.1] — 2026-06-30

### Added

- **21 more play styles across 4 new groups.** Arp gains Converge, Diverge,
  Thumb, and Octaves; new groups **Strum** (Downstroke, Up-Down, Harp Roll),
  **Melodic** (Guide-Tone Comp, Top Line, Pedal + Line), **Ostinato** (Alberti
  Bass, Gallop, Cell Roller), and **Euclidean** (E3/E5/E7); Split gains Ambient
  Drone, Dubstep Sub, Downtempo Roll, Psy Roller, and DnB Stab — 37 styles total.
  New lane primitives: strum offset, euclidean masks, extra arp orderings, and
  explicit ostinato sequences.

### Changed

- **Custom cross-browser dropdowns** replace native `<select>`s so every menu
  looks and behaves identically across browsers and OSes (accessible listbox:
  keyboard nav, type-through, click-outside).
- **All dropdowns are alphabetised** (numeric-aware, so numeric lists stay 1,2,…,10),
  sorted within each category for grouped menus.
- **Removed the "Start audio" splash** — audio now starts automatically on the
  first interaction (pressing Play or triggering a chord).

## [1.2.0] — 2026-06-30

### Added

- **Play styles** — the chord can now be performed as **single notes**, not just
  block chords/arps. Eight new multi-lane **Split** styles play a low bass voice
  (the chord root) plus a moving melody/arp voice in a higher octave: Bass +
  Melody, House Stab + Bass, Techno Roll, Trance Arp, Dub Skank, Synthwave Drive,
  Lo-Fi Broken, Garage 2-Step. Melodic lanes ride the existing voice-leading so
  single-note lines move smoothly between chords.
- The **Style** selector (formerly "Rhythm") is now grouped Block / Arp / Split,
  and auditioning a slot while stopped **previews ~1 bar of the current style**.

### Changed

- New style ids are appended to the existing set, so saved scenes and share links
  keep working unchanged. MOTION now also drives arp density in the split styles.

## [1.1.0] — 2026-06-30

### Added

- **Genre progression library** — 200 curated chord progressions (10 each across
  the 20 electronic genres from mpump's catalog: techno, house, trance, DnB,
  ambient, lo-fi, synthwave, dub-techno, and more). Progressions are stored
  key-agnostically and instantiate into the current key.
- **Progressions browser** — a "Progressions" button opens a genre-browsing modal
  to preview and load any progression into the slots (sets the loop length and,
  when the preset suggests one, the mode).
- **Type an exact tempo** — click the BPM readout to enter a value directly
  (Enter to commit, Escape to cancel), in addition to the slider.

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

[1.2.1]: https://github.com/gdamdam/mchord/releases/tag/v1.2.1
[1.2.0]: https://github.com/gdamdam/mchord/releases/tag/v1.2.0
[1.1.0]: https://github.com/gdamdam/mchord/releases/tag/v1.1.0
[1.0.0]: https://github.com/gdamdam/mchord/releases/tag/v1.0.0
[0.1.0]: https://github.com/gdamdam/mchord/releases/tag/v0.1.0
