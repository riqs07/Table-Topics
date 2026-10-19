// The compact row of numbers on a session's page: fillers, speed, length, and pauses when measured

// Load the rate formatter
import { formatRate } from "@/core/copy";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// Under this many seconds a rate scales a few fillers up into an alarming number, so counts are given instead ("2 pause words in 11 seconds"; decision 77)
export const SHORT_TAKE_SECONDS = 30;

// Whether a take is short enough to give counts rather than rates
export function isShortTake(session: SessionRecord): boolean {
  // Under the line
  return session.durationSec < SHORT_TAKE_SECONDS;
}

// How many fillers a take had (worked back from its rate, so it matches however the rate was counted)
export function fillerCount(session: SessionRecord): number {
  // Rate times minutes, whole
  return Math.round((session.fillersPerMinute * session.durationSec) / 60);
}

// A count over a short take, such as "2 pause words in 11 seconds" or "1 pause in 8 seconds"
export function countPhrase(count: number, thing: string, durationSec: number): string {
  // Whole seconds
  const seconds = Math.round(durationSec);
  // Singular for one
  return `${count} ${thing}${count === 1 ? "" : "s"} in ${seconds} second${seconds === 1 ? "" : "s"}`;
}

// The fillers in words: a count for a short take, otherwise the rate
export function fillerPhrase(session: SessionRecord): string {
  // A count, or the rate
  return isShortTake(session) ? countPhrase(fillerCount(session), "pause word", session.durationSec) : `${formatRate(session.fillersPerMinute)} pause words a minute`;
}

// Which number a result tile shows
export type ResultKind = "fillers" | "speed" | "length" | "pauses";

// One number with the words that follow it, such as "2.4" and "fillers a minute"
export interface ResultNumber {
  // Which number it is
  kind: ResultKind;
  // The words after the number
  label: string;
  // The number as shown
  value: string;
}

// How the numbers are shown on a results page
export interface ResultOptions {
  // Give a short take's fillers as a count (comparisons between tries keep rates)
  counts?: boolean;
  // Numbers already said elsewhere on the page (the headline's, or the length beside the timing ring), so each is shown once (decision 77)
  leaveOut?: ReadonlyArray<ResultKind>;
}

// The numbers for one session, with the pause count if loudness was recorded (null if not)
export function resultNumbers(session: SessionRecord, pauseCount: number | null, options: ResultOptions = {}): ResultNumber[] {
  // How many fillers, for a short take shown as counts
  const count = fillerCount(session);
  // Fillers, speed, and length are always known
  const numbers: ResultNumber[] = [
    // Fillers: a count over a short take, otherwise a rate to one decimal
    options.counts && isShortTake(session) ? { kind: "fillers", label: countPhrase(count, "pause word", session.durationSec).replace(/^\d+ /, ""), value: String(count) } : { kind: "fillers", label: "pause words a minute", value: formatRate(session.fillersPerMinute) },
    // Words a minute, whole
    { kind: "speed", label: "words a minute", value: String(Math.round(session.wordsPerMinute)) },
    // Length as a clock
    { kind: "length", label: "long", value: formatClock(session.durationSec) },
  ];
  // Pauses only when they were measured, singular for one
  const all: ResultNumber[] = pauseCount === null ? numbers : [...numbers, { kind: "pauses", label: pauseCount === 1 ? "pause" : "pauses", value: String(pauseCount) }];
  // Less any said elsewhere
  return all.filter((item) => !options.leaveOut?.includes(item.kind));
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
