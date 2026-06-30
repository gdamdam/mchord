# Physical-device & audio QA checklist

Automated tests cover the pure harmony engine and logic; audible behaviour, real
MIDI/Link, and device interactions can't run headless. Verify the following by ear
on real hardware before a release.

## Audio start & output

- [ ] **Start Audio** gesture brings up sound on the first user interaction.
- [ ] No clicks or pops when **changing presets**.
- [ ] **Macro sweeps are click-free** across the full range of all four macros.

## Notes & robustness

- [ ] **No hung notes** on stop, on **panic**, on **tab switch**, and on
      **audio-device change** — every voice releases.
- [ ] **Timing stays stable under load** (busy CPU, many notes, background tabs);
      no audible drift or stutter.
- [ ] **Swing is audible** at non-zero amounts.
- [ ] **All 8 rhythm styles** play and are audibly distinct.
- [ ] **Voice leading is audibly smooth** between successive chords.
- [ ] **Latency feels right** — triggering a slot responds promptly.

## MIDI

- [ ] **MIDI out** to a DAW / hardware synth sends correctly **voiced notes**.
- [ ] Correct **note offs** — nothing is left ringing.
- [ ] **MIDI clock** drives external gear in time.
- [ ] **MIDI input** triggers the instrument from an external controller.

## Ableton Link

- [ ] With the link bridge running: **tempo follows** the Link session.
- [ ] With the bridge running: start is **quantized** to the Link grid.
- [ ] Without the bridge: app **degrades gracefully** (no errors, Link simply
      inactive).

## PWA & sharing

- [ ] **Install as a PWA** and **reload offline** — the full app loads.
- [ ] A **share link round-trips** the session in a fresh browser / profile.

## UI & accessibility

- [ ] **Mobile touch targets** are large enough and the **layout is responsive**.
- [ ] **Screen-reader labels** are present and meaningful on controls.
- [ ] **Keyboard-only operation** works (trigger slots, play/stop, navigate,
      open/commit, undo/redo, close overlays).
- [ ] **`prefers-reduced-motion`** is honoured (animation reduced/disabled).
