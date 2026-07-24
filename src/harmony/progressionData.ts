/**
 * Genre chord-progression library DATA (raw, legacy source).
 *
 * Genres mirror mpump's melodic-genre catalog. Chords are key-agnostic:
 * { offset (semitones above tonic 0–11), family }, so a preset instantiates into
 * any key. Per-genre counts VARY (there is no fixed number per genre).
 *
 * PROVENANCE NOTE: these were assembled as common genre/theory patterns; no
 * verifiable external source is recorded for individual rows. They are therefore
 * treated by the normalized catalog as `traditional` / `unverified` pending
 * editorial review (see catalog.ts / catalogCurated.ts). This file is hand-edited
 * data — there is no generator script.
 */
import type { ProgressionLibrary } from './progressions'

export const PROGRESSION_LIBRARY: ProgressionLibrary = {
  "techno": [
    {
      "name": "Hypnotic i Drone",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 0,
          "family": "sus2"
        }
      ]
    },
    {
      "name": "Driving i-bVI Vamp",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Warehouse i-bVII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Detroit Parallel Stabs",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Peak-Time i-bIII-bVII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Dorian Sunrise iv",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Rolling i-bVI-bVII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Suspended Tension",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "sus4"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Climbing Buildup",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 3,
          "family": "add9"
        },
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 7,
          "family": "min7"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Melodic i-bVI-bIII-bVII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    }
  ],
  "acid-techno": [
    {
      "name": "303 Phrygian Pedal",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Phrygian bII-i",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Squelch i-bII",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Dark Descent",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 1,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Phrygian Loop bII-i-bVII-bVI",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Diminished Bite",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 7,
          "family": "dim"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "bII-bIII-i Mystery",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Acid Aeolian Grind",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "min"
        }
      ]
    },
    {
      "name": "Harmonic Sting V-i",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Sus2 Sneer",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    }
  ],
  "trance": [
    {
      "name": "Euphoric vi-IV-I-V",
      "mode": "major",
      "chords": [
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Anthem I-V-vi-IV",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Melodic ii-V-I",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Minor Breakdown i-bVI-bIII-bVII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Uplift i-bVII-bVI-bVII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Shimmer add9 Wash",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "add9"
        },
        {
          "offset": 5,
          "family": "maj9"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "sus4"
        }
      ]
    },
    {
      "name": "Rising iv-bVI-bVII-i",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Sunrise I-IV Vamp",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 5,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Progressive i-VI-III-VII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Hands-Up vi-IV-I-V-I",
      "mode": "major",
      "chords": [
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Epic 8-Bar Uplifter",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Emotional Breakdown",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    }
  ],
  "dub-techno": [
    {
      "name": "Basic Channel Stab",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 0,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Hollow min7 Pulse",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 0,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Chain Reaction i-iv",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Maurizio i-bVII",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Deep Chord Drift i-bVI",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 8,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Echo Chamber i-v",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Suspended Fog",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 0,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Quadrant min9 Haze",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Tape-Delay i-bIII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 3,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Submerged i-iv-bVII",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    }
  ],
  "idm": [
    {
      "name": "Warp Dorian Vamp",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Sine Wave Suspension",
      "mode": "lydian",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 2,
          "family": "sus4"
        }
      ]
    },
    {
      "name": "Melancholy Sixths",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "6"
        },
        {
          "offset": 2,
          "family": "6"
        },
        {
          "offset": 9,
          "family": "6"
        }
      ]
    },
    {
      "name": "Phrygian Dust",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Broken Music Box",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "minMaj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Ambient Drift",
      "mode": "lydian",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 2,
          "family": "add9"
        }
      ]
    },
    {
      "name": "Rusted Circuitry",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Glitched Cadence",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Fractal Lullaby",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Cold Modal Loop",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "maj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 1,
          "family": "add9"
        }
      ]
    }
  ],
  "edm": [
    {
      "name": "Minor Anthem Vamp",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Power Fifth Swing",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Language Climb",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 3,
          "family": "add9"
        },
        {
          "offset": 5,
          "family": "add9"
        },
        {
          "offset": 7,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Uplifting Minor Chorus",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 8,
          "family": "add9"
        },
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "add9"
        },
        {
          "offset": 7,
          "family": "min"
        }
      ]
    },
    {
      "name": "Festival Four",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Future Bass Lift",
      "mode": "major",
      "chords": [
        {
          "offset": 5,
          "family": "maj9"
        },
        {
          "offset": 7,
          "family": "add9"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 0,
          "family": "add9"
        }
      ]
    },
    {
      "name": "Emo Drop Setup",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Melodic Dubstep Yearn",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 9,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "min"
        },
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Progressive Sweep",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Trance Sus Rise",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "sus4"
        },
        {
          "offset": 3,
          "family": "maj"
        }
      ]
    }
  ],
  "drum-and-bass": [
    {
      "name": "Liquid ii-V-I",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "dom9"
        },
        {
          "offset": 0,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Hospital Rhodes",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 8,
          "family": "maj9"
        },
        {
          "offset": 10,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Soulful Cascade",
      "mode": "major",
      "chords": [
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Rolling Minor Vamp",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Twilight Liquid",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Amen Melancholy",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 5,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Chilled Neurofunk",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 1,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Deep Jazz Roller",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Atmospheric Pad Loop",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Golden Era Sus",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "sus2"
        },
        {
          "offset": 10,
          "family": "maj9"
        },
        {
          "offset": 3,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Liquid ii-V Ladder",
      "mode": "major",
      "chords": [
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "dom7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Rhodes Cascade",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj9"
        },
        {
          "offset": 4,
          "family": "min7"
        }
      ]
    }
  ],
  "house": [
    {
      "name": "Deep House Ninths",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Parallel Glide",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 3,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Soulful Piano House",
      "mode": "major",
      "chords": [
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom9"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Sunset Terrace",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "maj9"
        },
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Jackin Vamp",
      "mode": "mixolydian",
      "chords": [
        {
          "offset": 0,
          "family": "dom9"
        },
        {
          "offset": 5,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Warehouse Sus",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "sus4"
        },
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "sus2"
        }
      ]
    },
    {
      "name": "Lush Garage 2-Step",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Phrygian Tech",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 1,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Melodic Progressive Groove",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 8,
          "family": "maj9"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Chicago Warmth",
      "mode": "dorian",
      "chords": [
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom9"
        },
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Diva House",
      "mode": "major",
      "chords": [
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 4,
          "family": "min"
        },
        {
          "offset": 9,
          "family": "min"
        }
      ]
    },
    {
      "name": "Soulful Maj9 Turn",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    }
  ],
  "breakbeat": [
    {
      "name": "Chunky funk vamp",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Rare-groove skank",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Dark break loop",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Hammond stab",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Acid-jazz turn",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 5,
          "family": "dom9"
        },
        {
          "offset": 0,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Ghetto swing",
      "mode": "mixolydian",
      "chords": [
        {
          "offset": 0,
          "family": "dom9"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Funky breaks",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "dom9"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Minor stab drive",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Rhodes shuffle",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Horn-stab groove",
      "mode": "mixolydian",
      "chords": [
        {
          "offset": 0,
          "family": "dom9"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    }
  ],
  "jungle": [
    {
      "name": "Ragga minor vamp",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "min"
        }
      ]
    },
    {
      "name": "Dread i–bVI",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Amen dark loop",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Dub skank",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Reese drone",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Jazz-stab jungle",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Ominous half-step",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Ragga clash",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Liquid soul lift",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 5,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Steppers minor",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 7,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    }
  ],
  "garage": [
    {
      "name": "Soulful 2-step",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Rhodes glide",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "dom9"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "1-5-6-3 swing",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 4,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Organ stab vamp",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Silky R&B turn",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Skippy Rhodes",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 5,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Deep house lean",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Two-step lush",
      "mode": "major",
      "chords": [
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Garage gospel",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Night bassline",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 8,
          "family": "maj9"
        },
        {
          "offset": 10,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "2-Step Swing Turn",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 9,
          "family": "min7"
        }
      ]
    },
    {
      "name": "R&B Lean",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        }
      ]
    }
  ],
  "ambient": [
    {
      "name": "Floating maj7 wash",
      "mode": "lydian",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 2,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Suspended drift",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 5,
          "family": "sus2"
        }
      ]
    },
    {
      "name": "Dorian cloud",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Add9 glow",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "add9"
        },
        {
          "offset": 9,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Static maj9 haze",
      "mode": "lydian",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 2,
          "family": "add9"
        }
      ]
    },
    {
      "name": "Modal shift wash",
      "mode": "mixolydian",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Sus4 breath",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "sus4"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Cosmic min9 pad",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Desolate open drone",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Nostalgic maj7 arc",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 9,
          "family": "min7"
        }
      ]
    }
  ],
  "glitch": [
    {
      "name": "Frozen Loop",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Stutter Drift",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "add9"
        },
        {
          "offset": 5,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Chrome Fog",
      "mode": "lydian",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 2,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Ambiguous Cell",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj7"
        },
        {
          "offset": 0,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Bitcrush Bloom",
      "mode": "lydian",
      "chords": [
        {
          "offset": 0,
          "family": "add9"
        },
        {
          "offset": 7,
          "family": "add9"
        },
        {
          "offset": 2,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Sliced Modal",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Data Rot",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "minMaj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Glass Shards",
      "mode": "lydian",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 6,
          "family": "dim"
        },
        {
          "offset": 7,
          "family": "add9"
        }
      ]
    },
    {
      "name": "Nonlinear",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 1,
          "family": "maj9"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 3,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Quantize Error",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "6"
        }
      ]
    }
  ],
  "electro": [
    {
      "name": "Neon Phrygian",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Spanish Circuit",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Cold Descent",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Robot Funk",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Vocoder Nights",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Grid Pulse",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Chrome Bass",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Acid Drive",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Static Rush",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 1,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Midnight Motor",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "min7"
        }
      ]
    }
  ],
  "downtempo": [
    {
      "name": "Velvet Dusk",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Smoke & Vinyl",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Slow Rain",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Amber Haze",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 8,
          "family": "maj9"
        },
        {
          "offset": 5,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Faded Photo",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Nocturne",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "minMaj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Driftwood",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Blue Hour",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj7"
        },
        {
          "offset": 0,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Warm Static",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Hollow Room",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 1,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj7"
        }
      ]
    }
  ],
  "dubstep": [
    {
      "name": "Black Drone",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Wobble Descent",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Tritone Terror",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 6,
          "family": "dim"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Sub Abyss",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Iron Lung",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "sus4"
        },
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Grinder",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Doom Riff",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Cracked Bell",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "minMaj7"
        },
        {
          "offset": 11,
          "family": "dim"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Halftime Void",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Cold Steel",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    }
  ],
  "lo-fi": [
    {
      "name": "Jazzy ii-V-I",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom9"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Turnaround Loop",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Rainy Window",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "dom9"
        },
        {
          "offset": 3,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Study Vamp",
      "mode": "major",
      "chords": [
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Nostalgia iii-VI",
      "mode": "major",
      "chords": [
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "dom9"
        },
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Velvet Six",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "6"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Dusk Backdoor",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "6"
        }
      ]
    },
    {
      "name": "Late Night Two",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Warm Cassette",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Mellow min6",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min6"
        },
        {
          "offset": 5,
          "family": "dom9"
        },
        {
          "offset": 10,
          "family": "maj7"
        },
        {
          "offset": 0,
          "family": "min7"
        }
      ]
    },
    {
      "name": "1-6-2-5 Sevenths",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Lo-Fi Blues",
      "mode": "mixolydian",
      "chords": [
        {
          "offset": 0,
          "family": "dom7"
        },
        {
          "offset": 5,
          "family": "dom7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Dorian Maj-IV Vamp",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Secondary Dom Turn",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 4,
          "family": "dom7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "maj7"
        }
      ]
    }
  ],
  "synthwave": [
    {
      "name": "Retro Cascade",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Night Drive",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Neon Sunset",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 8,
          "family": "add9"
        },
        {
          "offset": 10,
          "family": "add9"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Outrun Anthem",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "add9"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "add9"
        },
        {
          "offset": 7,
          "family": "sus4"
        }
      ]
    },
    {
      "name": "Dystopia iv-i",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Chrome Dreams",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Epic Majors",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "VHS Sunrise",
      "mode": "major",
      "chords": [
        {
          "offset": 5,
          "family": "maj9"
        },
        {
          "offset": 7,
          "family": "add9"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 4,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Midnight Pulse",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Neon Vamp",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "80s Axis",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Dystopian Pulse",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "min"
        }
      ]
    }
  ],
  "deep-house": [
    {
      "name": "Soulful Planing",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 3,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Two-Chord Groove",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 4,
          "family": "min7"
        }
      ]
    },
    {
      "name": "III-vi-ii-V",
      "mode": "major",
      "chords": [
        {
          "offset": 4,
          "family": "maj7"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Lush maj9 Vamp",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 9,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Sunday Chords",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "maj9"
        },
        {
          "offset": 3,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Sus Pump",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "maj7"
        },
        {
          "offset": 0,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Detroit Deep",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 10,
          "family": "dom9"
        }
      ]
    },
    {
      "name": "Warm Rhodes",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "dom9"
        },
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 5,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Late Rooms",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Vocal House",
      "mode": "major",
      "chords": [
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj9"
        },
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "sus4"
        }
      ]
    },
    {
      "name": "Min9 Planing Chain",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "min9"
        },
        {
          "offset": 8,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Larry Heard",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "dom9"
        },
        {
          "offset": 3,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Sus2-Sus4 Pump",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 0,
          "family": "sus4"
        },
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 0,
          "family": "sus4"
        }
      ]
    },
    {
      "name": "Maj7 ii-V Feel",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "dom9"
        },
        {
          "offset": 0,
          "family": "maj9"
        }
      ]
    }
  ],
  "psytrance": [
    {
      "name": "Phrygian Drone",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Dark bII Roll",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Descent",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 1,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Night Ritual",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Twilight Minor",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Serpent bII-bIII",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Diminished Tension",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 7,
          "family": "dim"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Hypnotic i-bVI",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Acid Phrygian",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Full Moon",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 10,
          "family": "maj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 1,
          "family": "maj"
        }
      ]
    }
  ],
  "jazz": [
    {
      "name": "Major ii–V–I",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "13"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Minor ii–V–i",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 2,
          "family": "m7b5"
        },
        {
          "offset": 7,
          "family": "7b9"
        },
        {
          "offset": 0,
          "family": "minMaj7"
        }
      ]
    },
    {
      "name": "Rhythm Changes A",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "So What Modal",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 1,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Autumn Leaves",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "dom7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 2,
          "family": "m7b5"
        },
        {
          "offset": 7,
          "family": "7b9"
        },
        {
          "offset": 0,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Minor Turnaround",
      "mode": "melodic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 8,
          "family": "dom7"
        },
        {
          "offset": 2,
          "family": "m7b5"
        },
        {
          "offset": 7,
          "family": "7#9"
        }
      ]
    },
    {
      "name": "Giant Steps Cycle",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "dom7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 11,
          "family": "dom7"
        },
        {
          "offset": 4,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Bird Turnaround",
      "mode": "major",
      "chords": [
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "7b9"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Backdoor Cadence",
      "mode": "major",
      "chords": [
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Tritone Turnaround",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "7#9"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 1,
          "family": "13"
        }
      ]
    },
    {
      "name": "Jazz Blues",
      "mode": "mixolydian",
      "chords": [
        {
          "offset": 0,
          "family": "dom7"
        },
        {
          "offset": 5,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "dom7"
        },
        {
          "offset": 5,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "dom7"
        },
        {
          "offset": 9,
          "family": "dom7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Bird Blues",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 11,
          "family": "m7b5"
        },
        {
          "offset": 4,
          "family": "dom7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "dom7"
        },
        {
          "offset": 7,
          "family": "min7"
        },
        {
          "offset": 0,
          "family": "dom7"
        },
        {
          "offset": 5,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Rhythm Changes Bridge",
      "mode": "major",
      "chords": [
        {
          "offset": 4,
          "family": "dom7"
        },
        {
          "offset": 9,
          "family": "dom7"
        },
        {
          "offset": 2,
          "family": "dom7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "1-6-2-5 Turnaround",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Lady Bird Turnaround",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 1,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Coltrane ii-V Reharm",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 3,
          "family": "dom7"
        },
        {
          "offset": 8,
          "family": "maj7"
        },
        {
          "offset": 11,
          "family": "dom7"
        },
        {
          "offset": 4,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "ii-V of IV",
      "mode": "major",
      "chords": [
        {
          "offset": 7,
          "family": "min7"
        },
        {
          "offset": 0,
          "family": "dom7"
        },
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "ii-V of vi",
      "mode": "major",
      "chords": [
        {
          "offset": 11,
          "family": "m7b5"
        },
        {
          "offset": 4,
          "family": "7b9"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Minor Line Cliche",
      "mode": "melodic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 0,
          "family": "minMaj7"
        },
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 0,
          "family": "min6"
        }
      ]
    },
    {
      "name": "Satin Doll ii-V Chain",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "dom7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "dom7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    }
  ],
  "pop": [
    {
      "name": "Axis I–V–vi–IV",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Sensitive vi–IV–I–V",
      "mode": "major",
      "chords": [
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Doo-Wop I–vi–IV–V",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Pop-Punk Power Four",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "5"
        },
        {
          "offset": 7,
          "family": "5"
        },
        {
          "offset": 9,
          "family": "5"
        },
        {
          "offset": 5,
          "family": "5"
        }
      ]
    },
    {
      "name": "Aeolian i–bVI–bIII–bVII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Singer-Songwriter I–iii–IV–V",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 4,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Four-Chord IV–I–V–vi",
      "mode": "major",
      "chords": [
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min"
        }
      ]
    },
    {
      "name": "Rotation V–vi–IV–I",
      "mode": "major",
      "chords": [
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Anthemic I–IV–vi–V",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "add9"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "sus4"
        }
      ]
    },
    {
      "name": "Aeolian Pop i–bVI–bVII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Royal Road",
      "mode": "major",
      "chords": [
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "min"
        }
      ]
    },
    {
      "name": "Canon",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "min"
        },
        {
          "offset": 4,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Creep",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 4,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "min"
        }
      ]
    },
    {
      "name": "Lament Line Cliche",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 0,
          "family": "minMaj7"
        },
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 0,
          "family": "min6"
        }
      ]
    },
    {
      "name": "Andalusian Pop",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "maj"
        }
      ]
    }
  ],
  "cinematic": [
    {
      "name": "Epic Minor i–bVI–bIII–bVII",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Lydian Wonder I–II",
      "mode": "lydian",
      "chords": [
        {
          "offset": 0,
          "family": "maj7#11"
        },
        {
          "offset": 2,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Suspended Pedal",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "sus2"
        },
        {
          "offset": 0,
          "family": "sus4"
        },
        {
          "offset": 0,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Chromatic Mediants",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 3,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Neo-Soul Lush 9ths",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 5,
          "family": "maj9"
        },
        {
          "offset": 9,
          "family": "min9"
        },
        {
          "offset": 2,
          "family": "min9"
        }
      ]
    },
    {
      "name": "Aeolian Film Cue",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "min"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Heroic bVII–IV–I",
      "mode": "mixolydian",
      "chords": [
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Lydian Float",
      "mode": "lydian",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 7,
          "family": "maj"
        },
        {
          "offset": 2,
          "family": "maj7#11"
        }
      ]
    },
    {
      "name": "Descending Line Cliché",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 0,
          "family": "minMaj7"
        },
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 0,
          "family": "min6"
        }
      ]
    },
    {
      "name": "Ominous Phrygian bII",
      "mode": "phrygian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 1,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Hollywood Cadence",
      "mode": "major",
      "chords": [
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Skywalker Mixolydian",
      "mode": "mixolydian",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Andalusian Descent",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 7,
          "family": "dom7"
        }
      ]
    },
    {
      "name": "Dorian Hope",
      "mode": "dorian",
      "chords": [
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        },
        {
          "offset": 5,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Interstellar Oscillation",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 10,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "min"
        }
      ]
    },
    {
      "name": "Major-Third Planing",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 8,
          "family": "maj"
        },
        {
          "offset": 4,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        }
      ]
    }
  ],
  "gospel": [
    {
      "name": "2–5–1 Extended",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "13"
        },
        {
          "offset": 0,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Gospel Walk-Up",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Amen Plagal IV–I",
      "mode": "major",
      "chords": [
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Passing Diminished",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 1,
          "family": "dim"
        },
        {
          "offset": 2,
          "family": "min7"
        }
      ]
    },
    {
      "name": "Tritone-Sub 2–5–1",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min9"
        },
        {
          "offset": 1,
          "family": "13"
        },
        {
          "offset": 0,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "6–2–5–1 Turnaround",
      "mode": "major",
      "chords": [
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "13"
        },
        {
          "offset": 0,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Shout 1–4 Vamp",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 5,
          "family": "maj9"
        },
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 7,
          "family": "13"
        }
      ]
    },
    {
      "name": "Minor Gospel i–iv–V",
      "mode": "harmonic-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "min9"
        },
        {
          "offset": 7,
          "family": "7b9"
        }
      ]
    },
    {
      "name": "Lush Maj9 Bed",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj9"
        },
        {
          "offset": 4,
          "family": "min9"
        },
        {
          "offset": 5,
          "family": "maj9"
        },
        {
          "offset": 7,
          "family": "13"
        }
      ]
    },
    {
      "name": "Backdoor Amen bVII–IV–I",
      "mode": "mixolydian",
      "chords": [
        {
          "offset": 10,
          "family": "dom7"
        },
        {
          "offset": 5,
          "family": "maj"
        },
        {
          "offset": 0,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "3-6-2-5-1",
      "mode": "major",
      "chords": [
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 9,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "1-4 Walk-Up",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 0,
          "family": "dom7"
        },
        {
          "offset": 5,
          "family": "maj7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "So-What Cadence",
      "mode": "major",
      "chords": [
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 7,
          "family": "7sus4"
        },
        {
          "offset": 0,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Neo-Gospel Descent",
      "mode": "major",
      "chords": [
        {
          "offset": 5,
          "family": "maj9"
        },
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 0,
          "family": "maj9"
        }
      ]
    },
    {
      "name": "Praise Break Cycle",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj"
        },
        {
          "offset": 9,
          "family": "dom7"
        },
        {
          "offset": 2,
          "family": "dom7"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "maj"
        }
      ]
    },
    {
      "name": "Minor Gospel Circle",
      "mode": "natural-minor",
      "chords": [
        {
          "offset": 0,
          "family": "min7"
        },
        {
          "offset": 5,
          "family": "min7"
        },
        {
          "offset": 10,
          "family": "dom7"
        },
        {
          "offset": 3,
          "family": "maj7"
        },
        {
          "offset": 8,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Sharp-iv Diminished",
      "mode": "major",
      "chords": [
        {
          "offset": 0,
          "family": "maj7"
        },
        {
          "offset": 6,
          "family": "dim"
        },
        {
          "offset": 7,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    },
    {
      "name": "Tritone Walkdown 2-5-1",
      "mode": "major",
      "chords": [
        {
          "offset": 4,
          "family": "min7"
        },
        {
          "offset": 2,
          "family": "min7"
        },
        {
          "offset": 1,
          "family": "dom7"
        },
        {
          "offset": 0,
          "family": "maj7"
        }
      ]
    }
  ]
}
