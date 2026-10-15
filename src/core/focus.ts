// Weekly focus: one skill at a time, advancing every seven days (PRD section 7)

// Load the calendar-day helpers
import { addDays, daysBetween, startOfDay } from "@/core/dates";

// One skill the user works on for a week
export interface Focus {
  // Stable identifier stored with each session
  id: string;
  // Short name shown to the user
  title: string;
  // One-line explanation shown to the user
  description: string;
  // True if measuring this skill needs audio analysis, which v1 does not have
  needsAudioAnalysis: boolean;
}

// Every focus, in the order a new user meets them (public-speaking skills, decision 22)
export const WEEKLY_FOCUSES: ReadonlyArray<Focus> = [
  // Focus 1: the first seconds of a talk
  { id: "strong-opening", title: "Strong opening", description: "Pause, then start with something worth hearing. No “so, um”.", needsAudioAnalysis: false },
  // Focus 2: a point the audience can follow
  { id: "clear-structure", title: "Clear structure", description: "Say your point first, then a reason and an example.", needsAudioAnalysis: false },
  // Focus 3: silence as a tool
  { id: "pausing", title: "Pausing", description: "Pause between ideas instead of filling the gap.", needsAudioAnalysis: false },
  // Focus 4: fewer ums and uhs
  { id: "cut-fillers", title: "Cut filler words", description: "Replace um and uh with a short pause.", needsAudioAnalysis: false },
  // Focus 5: the last thing the audience hears
  { id: "strong-close", title: "Strong close", description: "End on your point, then stop. No trailing “so, yeah”.", needsAudioAnalysis: false },
  // Focus 6: needs pitch, which the app cannot measure yet (plan step D4)
  { id: "vocal-variety", title: "Vocal variety", description: "Change your pace and pitch to keep listeners with you.", needsAudioAnalysis: true },
];

// Focuses used before 2026-10-15; old sessions still carry their ids and need their names
const RETIRED_FOCUSES: ReadonlyArray<Focus> = [
  // Finish sentences instead of trailing off
  { id: "start-and-finish", title: "Start and finish", description: "Complete your sentences. Stop trailing off.", needsAudioAnalysis: false },
  // Slow down
  { id: "pace", title: "Pace", description: "Slow down. Pause instead of filling.", needsAudioAnalysis: false },
  // Point first
  { id: "structure", title: "Structure", description: "Say your point first, then your reason.", needsAudioAnalysis: false },
  // Energy in the voice
  { id: "warmth-and-energy", title: "Warmth and energy", description: "Let your voice carry some feeling.", needsAudioAnalysis: true },
];

// Find a focus by its id, current or retired
export function findFocus(id: string): Focus | undefined {
  // Current focuses first, then the retired ones
  return [...WEEKLY_FOCUSES, ...RETIRED_FOCUSES].find((focus) => focus.id === id);
}

// The focuses v1 can actually measure, in order
export const V1_FOCUSES: ReadonlyArray<Focus> = WEEKLY_FOCUSES.filter((focus) => !focus.needsAudioAnalysis);

// Days each focus lasts
const DAYS_PER_FOCUS = 7;

// The saved focus state (matches the Settings record in the data model)
export interface FocusState {
  // Position in the v1 focus list
  focusIndex: number;
  // The day the current focus began
  focusStartedOn: Date;
}

// The focus active right now, plus the state to save so it stays in step
export interface ActiveFocus extends FocusState {
  // The focus to show and measure against
  focus: Focus;
}

// Work out the active focus, advancing one step for each full week since it began
export function currentFocus(state: FocusState, now: Date): ActiveFocus {
  // Count calendar days since the focus began, treating a backwards clock as zero
  const days = Math.max(0, daysBetween(state.focusStartedOn, now));
  // Count the full weeks that have passed
  const weeks = Math.floor(days / DAYS_PER_FOCUS);
  // Number of focuses available in v1
  const count = V1_FOCUSES.length;
  // Step forward one focus per week, wrapping around (and fixing any out-of-range saved index)
  const focusIndex = (((state.focusIndex + weeks) % count) + count) % count;
  // Move the start date forward by the whole weeks that passed
  const focusStartedOn = addDays(startOfDay(state.focusStartedOn), weeks * DAYS_PER_FOCUS);
  // Look up the focus (always present because the index is wrapped into range)
  const focus = V1_FOCUSES[focusIndex] as Focus;
  // Hand back the focus and the state to save
  return { focus, focusIndex, focusStartedOn };
}
