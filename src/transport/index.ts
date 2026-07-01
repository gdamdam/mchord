/**
 * transport — public surface of the mchord transport / scheduling layer.
 *
 * Sample-time-scheduled progression playback, rhythmic articulation, and an
 * optional Ableton Link adapter, all decoupled from React render timing.
 */

// Pure tempo/timing math.
export { secondsPerBeat, secondsPerBar, swungBeatTime } from './clock'

// Rhythm / articulation.
export { rhythmEvents } from './rhythm'
export type { RhythmEvent, RhythmOpts } from './rhythm'

// Play styles (multi-lane bass + melody performances; delegates originals).
export { playStyleEvents, SPLIT_STYLE_IDS } from './playStyles'
export type { PlayStyleOpts } from './playStyles'

// Scheduler + pure planner.
export { Scheduler, planWindow, slotOrderIndex, swingBeatSeconds } from './scheduler'
export type {
  ScheduledNote,
  SchedStep,
  PlanState,
  SchedulerOpts,
  SetStepsOpts,
} from './scheduler'

// Seeded RNG (reproducible 'random' direction).
export { makeRng } from './rng'
export type { Rng } from './rng'

// Ableton Link adapter (kept isolated; the Scheduler works without it).
export {
  enableLink,
  autoDetectLink,
  sendLinkTempo,
  sendLinkPlaying,
  getLinkState,
  onLinkState,
  linkQuantizeDelay,
  getLinkSnapshot,
} from './link'
export type { LinkState, LinkClockSnapshot, QuantizeGrid } from './link'

// Pure Link clock math (re-exported for callers doing their own boundary math).
export {
  makeLinkClockSnapshot,
  nextDownbeatTime,
  nextBoundaryTime,
  quantizeDelaySec,
  barSec,
  projectBeat,
  projectPhase,
  followTransport,
  shouldSendPlaying,
} from './linkClock'
export type { TransportAction } from './linkClock'
