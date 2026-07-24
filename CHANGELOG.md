# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.1] — 2026-07-24

### Added

- **Normalized progression catalog.** The flat genre→preset bank is now a typed,
  auditable catalog (`src/harmony/catalog.ts`). One **canonical entry per unique
  musical signature** (246 entries), tagged to one or more genres with alternate
  names as **aliases** instead of duplicated chord data. Each entry carries a
  **classification**, **typed provenance**, **review status**, **completeness**,
  harmonic-intent **tags**, and a description.
- **Per-event durations end to end.** Catalog entries can hold a chord for longer
  than one bar; `loadProgression` now honours per-event durations through slots,
  playback, persistence, and share links (previously durations reset to 1 bar).
  Rests are supported in catalog entries too.
- **Catalog-only metadata.** `ProgEvent` also models inversion, slash bass, local
  key centre, sections, alternate endings, and tempo/voicing/style recommendations
  — recorded losslessly but explicitly **not** wired to the audio/MIDI path yet (a
  boundary test guards this).
- **Upgraded Progression browser.** Text search over name/alias, a mode filter, a
  "reviewed only" toggle, per-item mode/length/tag chips, badges for
  excerpts/reductions/**unverified** entries, and an expandable details view with
  provenance. Fast genre-browse-and-load is preserved; search input, filters, and
  details are keyboard/screen-reader accessible.
- **Catalog audit command.** `npm run catalog:audit` prints a deterministic report
  (counts, unique signatures, duplicates, rotations, mode/family/rest coverage,
  provenance by kind); the same pure module backs the regression tests.

### Changed

- **Honest provenance.** No fabricated citations. Common theory/idiom patterns are
  `traditional`/`internal-theory-review` with a rationale; entries whose names
  implied a specific composition/artist we could not verify (e.g. Giant Steps,
  Satin Doll, Creep, Skywalker) were **renamed** to generic functional names and
  marked `unverified`/`composition-reduction`, keeping the old name as an alias.
- **Duplicates canonicalized.** The three known same-bank duplicates (Acid-Techno
  303 Phrygian Pedal / Squelch i-♭II, Synthwave Epic Majors / 80s Axis, Jazz
  Rhythm Changes A / 1-6-2-5 Turnaround) and 29 cross-genre exact duplicates now
  fold into single canonical entries with genre tags/aliases.
- **Coverage hardened.** Added reviewed, musically-defensible entries exercising
  previously-empty engine features: **Locrian**, **harmonic major**, **augmented**,
  **7♯9**, extra **melodic-minor** and **maj7♯11**, and several **rest**-containing
  patterns. Every supported mode and chord family now has at least one reviewed use.
- **Docs/comments corrected.** Removed the stale "10 progressions per genre" claim,
  the unverifiable "compiled from web research" note, and the reference to a missing
  generator script; README and the catalog now agree.

### Compatibility

- Saved scenes and share links decode **exactly as before** — scenes store resolved
  slots (chord + duration), not catalog references, so catalog changes don't affect
  them. `SCENE_VERSION` and the share-codec format are **unchanged**; new per-event
  durations ride the existing `durationBars` slot field. Round-trip tests cover it.

## [1.8.0] — 2026-07-22

### Added

- **Three more modes (7 → 10).** **Locrian** (completes the seven modes of the
  major scale), **Melodic minor** (jazz minor), and **Harmonic major**. All are
  heptatonic, so they drop straight into the existing 7-degree palette / Roman
  numeral engine — no behavioural change to the seven original modes.
- **Seven more chord families (16 → 23).** **m7♭5** (half-diminished), **7♭9**,
  **7♯9**, **13**, **maj7♯11**, **7sus4**, and **5** (power chord). Extended
  tensions spell by generic degree (e.g. C7♯11 → …F♯, C13 → …A) and label with
  correct Roman suffixes (viiø7, V7♭9, …).
- **Three more voice-leading modes (5 → 8).** **Quartal** (stacked fourths,
  modal "So What" voicing), **Drop-2** (close voicing with the 2nd-from-top voice
  dropped an octave), and **Shell** (root + 3rd + 7th guide-tone shell).
- **Type-a-progression by name.** A new **⌨ Chords** button in the header opens a
  modal where you type chord names (e.g. `Cmaj7 Am7 Dm7 G7`) and apply them to the
  slots. Names are read absolutely (independent of the Key setting), with a live
  preview that flags anything unrecognised before you apply.
- **Bigger, richer progression library (240 → 287 presets).** Added the
  **Jazz** (20), **Pop** (15), **Cinematic** (16), and **Gospel** (18) genres,
  plus expansions to **lo-fi**/**deep-house** (14) and **house**/**garage**/
  **trance**/**synthwave**/**drum-and-bass** (12). Counts are now **variable per
  genre** (5–30): idiom-rich genres carry more (jazz blues, rhythm-changes bridge,
  Royal Road, Pachelbel, Hollywood cadence, gospel 3-6-2-5-1, …); 2–4-chord
  vamp-based electronic genres stay at 10.
- **Per-setting help tooltips.** Every harmony control (Key, Mode, Tuning,
  Anchor, Sound, Style, Voice leading, Direction, Loop, Swing) now shows a
  hover tooltip explaining what it does.

### Changed

- **Unified Ableton Link control.** The separate "Enable Link" button and the
  "Link off" status pill are now a single control that toggles Link *and* shows
  its status across three states (off → on/waiting → connected, with a live
  BPM · peers readout).
- **Anchor dims when it has no effect.** With the default Equal (12-TET) tuning
  the anchor rotates nothing, so the control is now greyed out (with an
  explanatory tooltip) until a microtuning is selected.
- **Progression genres list alphabetically** in the browser modal.

### Fixed

- **Half-diminished sevenths are now spelled correctly.** The diatonic seventh
  on vii° (major) / ii (minor) previously fell back to `min7`; it is now the
  first-class **m7♭5** family, so `viiø7` reads and voices as a true
  half-diminished chord.
- **Swing slider no longer stretches full-width** when it wraps onto its own
  row — it now matches the width of the controls beside it.

### Compatibility

- All new enum members are **appended** to their const arrays, so existing saved
  sessions and share links keep byte-identical decoding (the codec indexes into
  these arrays and clamps out-of-range values). Microtuning, MIDI, and scene
  formats are unchanged.

## [1.6.0] — 2026-07-22

### Added

- **Link, Share, and Advanced moved into the header.** The Enable Link toggle
  and the "Copy share link" button now live in the top bar, and a new
  **⚙ Advanced** button opens the backup/reset/panic controls in a modal. The
  old page-level "Advanced" disclosure section is gone.

### Fixed

- **Hung notes after a main-thread stall.** When a scheduler tick is delayed
  longer than the lookahead (e.g. a backgrounded tab throttling timers), note-off
  events stranded in the skipped window are now released instead of lost.
- **Hung notes when editing during playback.** Changing steps, motion,
  direction, or loop length — and applying queued jumps — now flushes sounding
  voices, matching the existing play-style behaviour, so held notes cannot lose
  their release events.
- **MIDI clock lifecycle.** Swapping or disconnecting the MIDI output now sends
  STOP to the old device and re-STARTs the new one; the clock is drift-corrected
  against the audio clock and paused while the tab is hidden, instead of
  emitting a garbled ~2.5 BPM stream.
- **Zombie MIDI input after replug.** A disconnected input's message handler is
  detached, so replugging a device no longer triggers slots behind the current
  selection.
- **Keyboard shortcuts no longer fire from menus and dropdowns.** Activating a
  select option or a `<summary>` menu with the keyboard no longer also opens the
  chord palette or toggles playback; menu navigation works for keyboard-only
  users.
- **Instrument could get permanently stuck if audio start-up failed once.** A
  transient `AudioContext` start failure is no longer cached forever.
- **Audio hardening.** No crash when a note arrives before the voice pool is
  built (autoplay-blocked resume); notes are dropped rather than stacked while
  the context is suspended; live filter-cutoff changes no longer fight a note's
  in-flight envelope.
- **Voice-leading range.** Bass-mode voicings now respect the low range limit
  and no longer stack duplicate notes at the top of the range.
- **Enharmonic spelling in remote keys.** Chords in six-or-more-accidental keys
  (e.g. G♭ major) now spell correctly (C♭ E♭ G♭, not B D♯ F♯); the tritone-above
  degree is labelled ♯iv° rather than ♭v°.
- **Progression generation.** Borrowed/secondary chords sharing a diatonic root
  are no longer wrongly substituted when varying a progression; two-chord
  progressions start on the tonic.
- **Sharing & persistence robustness.** Share links from a newer app version are
  rejected instead of silently mis-decoded; scenes from a newer version are no
  longer lossily downgraded and re-saved; explicit Save reports success/failure;
  over-long tuning names from untrusted links are clamped.
- **Reconnect races in the mbus and Link bridges** no longer let a stale
  WebSocket close tear down a fresh connection or spawn duplicate sockets; the
  Link-bridge auto-detect now sweeps its full URL list.
- **Service worker** precaches the app shell with `no-store` and bounds its
  navigation cache, avoiding a stale offline `index.html`.

## [1.5.2] — 2026-07-21

### Fixed

- **Hung notes when changing play style during playback.** Active voices and
  pending MIDI events are now flushed before the scheduler switches styles, so
  notes from the previous style cannot lose their matching release events.

## [1.5.0] — 2026-07-13

### Added
- **Tuning anchor** — new setting next to the tuning picker choosing which
  pitch class the microtuning table is rooted on: **Follow key** (the tonic is
  always pure — the intent of JI/maqam scales, and the fix for JI in D minor
  being C-pure instead of D-pure), **Fixed C** (the historically-authentic
  reading of well-temperaments), or any fixed note. Selecting a builtin preset
  applies its suggested anchor (well-temperaments → Fixed C, everything else →
  Follow key), overridable afterwards. New scenes default to Follow key.
  **Compatibility:** scenes and share links saved before this setting existed
  decode as Fixed C — the previous implicit behaviour — so they sound
  bit-identical to before. Scene schema v5, share-link compact format v4.

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
