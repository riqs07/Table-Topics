// The number that goes with each weekly focus, so headlines measure what the user is working on

// Load the number formatter for filler rates
import { formatRate } from "@/core/copy";
// Load the focus lookup, for titles of current and retired focuses
import { findFocus } from "@/core/focus";
// Load the pause finder, for pausing week
import { findPauses } from "@/core/pauses";
// Load the spacing of loudness readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// One measurable number for a focus
export interface FocusMeasure {
  // Words that follow the number, like "fillers a minute"
  unit: string;
  // Reads the number from a session, or null when the session cannot give it
  read: (session: SessionRecord) => number | null;
  // Writes the number for people to read
  format: (value: number) => string;
  // Smallest change worth calling a change
  noticeable: number;
}

// Filler week: fillers a minute, one decimal place
const FILLERS: FocusMeasure = {
  // Unit words
  unit: "fillers a minute",
  // Read the filler rate
  read: (session) => session.fillersPerMinute,
  // One decimal place
  format: formatRate,
  // Same threshold the retry comparison uses
  noticeable: 0.2,
};

// Pace week: words a minute, whole numbers
const PACE: FocusMeasure = {
  // Unit words
  unit: "words a minute",
  // Read the speaking speed
  read: (session) => session.wordsPerMinute,
  // Whole words
  format: (value) => String(Math.round(value)),
  // A few words a minute is noise
  noticeable: 3,
};

// Pausing week: pauses a minute, from the loudness readings, one decimal place
const PAUSES: FocusMeasure = {
  // Unit words
  unit: "pauses a minute",
  // Count pauses, or nothing for sessions saved before loudness was kept
  read: (session) => (session.loudness && session.durationSec > 0 ? findPauses(session.loudness, LOUDNESS_TICK_MS).count / (session.durationSec / 60) : null),
  // One decimal place
  format: formatRate,
  // Less than one pause a minute either way is noise
  noticeable: 1,
};

// The number for a focus, or null when a transcript cannot measure it
export function measureFor(focusId: string): FocusMeasure | null {
  // Filler week
  if (focusId === "cut-fillers") return FILLERS;
  // Pausing week
  if (focusId === "pausing") return PAUSES;
  // Pace week (retired 2026-10-15, still used for old sessions)
  if (focusId === "pace") return PACE;
  // Openings, structure, closes, and anything else have no number
  return null;
}

// The focus title, or a plain fallback if the id is unknown
function focusTitle(focusId: string): string {
  // Look up the title
  return findFocus(focusId)?.title ?? "Your take";
}

// The headline sentence on the Feedback screen
export function headlineFor(session: SessionRecord): string {
  // Find the focus's number
  const measure = measureFor(session.focus);
  // The number, if there is one
  const value = measure?.read(session) ?? null;
  // No number: name the focus
  if (!measure || value === null) return `${focusTitle(session.focus)}.`;
  // Otherwise the number and its unit
  return `${measure.format(value)} ${measure.unit}.`;
}

// The headline sentence on the Retry result screen
export function retryHeadline(retry: SessionRecord, original: SessionRecord): string {
  // Measure by the focus the first try was made under
  const measure = measureFor(original.focus);
  // Read both numbers
  const before = measure?.read(original) ?? null;
  // The retry's number
  const after = measure?.read(retry) ?? null;
  // No number on either try: a plain statement
  if (!measure || before === null || after === null) return "Your second try is in.";
  // Too close to call: say it held at the first try's number
  if (Math.abs(after - before) < measure.noticeable) return `Again about ${measure.format(before)} ${measure.unit}.`;
  // Otherwise state both numbers plainly
  return `From ${measure.format(before)} to ${measure.format(after)} ${measure.unit}.`;
}
