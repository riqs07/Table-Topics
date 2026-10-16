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
