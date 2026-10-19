// The compact row of numbers on a session's page: fillers, speed, length, and pauses when measured

// Load the rate formatter
import { formatRate } from "@/core/copy";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// One number with the words that follow it, such as "2.4" and "fillers a minute"
export interface ResultNumber {
  // The words after the number
  label: string;
  // The number as shown
  value: string;
}

// The numbers for one session, with the pause count if loudness was recorded (null if not)
export function resultNumbers(session: SessionRecord, pauseCount: number | null): ResultNumber[] {
  // Fillers, speed, and length are always known
  const numbers: ResultNumber[] = [
    // Fillers a minute, to one decimal
    { label: "fillers a minute", value: formatRate(session.fillersPerMinute) },
    // Words a minute, whole
    { label: "words a minute", value: String(Math.round(session.wordsPerMinute)) },
    // Length as a clock
    { label: "long", value: formatClock(session.durationSec) },
  ];
  // Pauses only when they were measured, singular for one
  return pauseCount === null ? numbers : [...numbers, { label: pauseCount === 1 ? "pause" : "pauses", value: String(pauseCount) }];
}

// One number on both tries of a retry
export interface ResultChange {
  // What it counts
  label: string;
  // On the first try
  before: string;
  // On the second try
  after: string;
}

// The same numbers for a first try and its retry, side by side (pauses only when both were measured; decision 67)
export function resultChanges(original: SessionRecord, retry: SessionRecord, pauses: { before: number | null; after: number | null }): ResultChange[] {
  // Pauses count only when both tries have them
  const both = pauses.before !== null && pauses.after !== null;
  // The first try's numbers
  const before = resultNumbers(original, both ? pauses.before : null);
  // The second try's numbers
  const after = resultNumbers(retry, both ? pauses.after : null);
  // Paired by position (the same labels in the same order; "pauses" is used for both counts)
  return before.map((item, index) => ({ label: item.label === "pause" ? "pauses" : item.label, before: item.value, after: after[index]?.value ?? "" }));
}
