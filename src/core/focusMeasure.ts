// The number that goes with each weekly focus, so headlines measure what the user is working on

// Load the number formatter for filler rates
import { formatRate } from "@/core/copy";
// Load the list of weekly focuses, for their titles
import { WEEKLY_FOCUSES } from "@/core/focus";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// One measurable number for a focus
export interface FocusMeasure {
  // Words that follow the number, like "fillers a minute"
  unit: string;
  // Reads the number from a session
  read: (session: SessionRecord) => number;
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

// The number for a focus, or null when a transcript cannot measure it
export function measureFor(focusId: string): FocusMeasure | null {
  // Filler week
  if (focusId === "cut-fillers") return FILLERS;
  // Pace week
  if (focusId === "pace") return PACE;
  // Finishing sentences, structure, and anything else have no number
  return null;
}

// The focus title, or a plain fallback if the id is unknown
function focusTitle(focusId: string): string {
  // Look up the title
  return WEEKLY_FOCUSES.find((focus) => focus.id === focusId)?.title ?? "Your take";
}

// The headline sentence on the Feedback screen
export function headlineFor(session: SessionRecord): string {
  // Find the focus's number
  const measure = measureFor(session.focus);
  // No number: name the focus
  if (!measure) return `${focusTitle(session.focus)}.`;
  // Otherwise the number and its unit
  return `${measure.format(measure.read(session))} ${measure.unit}.`;
}

// The headline sentence on the Retry result screen
export function retryHeadline(retry: SessionRecord, original: SessionRecord): string {
  // Measure by the focus the first try was made under
  const measure = measureFor(original.focus);
  // No number: a plain statement
  if (!measure) return "Your second try is in.";
  // Read both numbers
  const before = measure.read(original);
  // The retry's number
  const after = measure.read(retry);
  // Too close to call: say it held
  if (Math.abs(after - before) < measure.noticeable) return `Again about ${measure.format(after)} ${measure.unit}.`;
  // Otherwise state both numbers plainly
  return `From ${measure.format(before)} to ${measure.format(after)} ${measure.unit}.`;
}
