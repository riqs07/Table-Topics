// Progress calculations for the retry result and history screens (milestone 8)
// All work on fillers per minute, the v1 headline number

// Load the session record types
import type { SessionMode, SessionRecord } from "@/data/records";

// Smallest change in fillers per minute that counts as a real difference
const NOTICEABLE = 0.2;

// A retry compared with its first try
export interface RetryComparison {
  // Fillers per minute on the first try
  before: number;
  // Fillers per minute on the retry
  after: number;
  // True if the retry had noticeably fewer fillers
  improved: boolean;
  // True if the difference is too small to matter
  same: boolean;
}

// Compare a retry with the session it retried
export function retryComparison(retry: SessionRecord, original: SessionRecord): RetryComparison {
  // Work out the difference (negative means fewer fillers)
  const difference = retry.fillersPerMinute - original.fillersPerMinute;
  // Decide whether the difference is big enough to mention
  const same = Math.abs(difference) < NOTICEABLE;
  // Hand back both numbers and the verdict
  return { before: original.fillersPerMinute, after: retry.fillersPerMinute, improved: !same && difference < 0, same };
}

// Progress since the first recording
export interface BaselineProgress {
  // When the first recording was made (ISO text)
  baselineDate: string;
  // Fillers per minute in the first recording
  baseline: number;
  // Fillers per minute in the latest session
  latest: number;
  // Whole-number percent change (negative means fewer fillers)
  percentChange: number;
}

// Sort sessions oldest first without changing the original list
function oldestFirst(sessions: ReadonlyArray<SessionRecord>): SessionRecord[] {
  // Copy, then sort by start time (ISO text sorts in time order)
  return [...sessions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Keep only full sessions; warm-ups, readings, pause drills, rehearsals, lessons, openings and closings drills, Q&A answers and voice drills count for the streak but never for progress (small-talk answers and moment notes count for neither) (reading a text has fewer fillers by nature)
export function fullSessions(sessions: ReadonlyArray<SessionRecord>): SessionRecord[] {
  // Drop warm-ups, readings, drills, rehearsals, lessons, openings and closings drills and Q&A answers
  return sessions.filter((session) => session.mode !== "warmup" && session.mode !== "read" && session.mode !== "pause" && session.mode !== "rehearse" && session.mode !== "lesson" && session.mode !== "bookend" && session.mode !== "qa" && session.mode !== "smalltalk" && session.mode !== "moment" && session.mode !== "voice");
}

// Whether a new session should become the starting point: the first Table Topic or prepared speech (or old one-minute session), never a reading, drill or warm-up (changed 2026-10-17 so a short Table Topic can be the first recording)
export function shouldBeBaseline(existing: ReadonlyArray<SessionRecord>, mode: SessionMode): boolean {
  // Only speaking on the spot can be the baseline, and there is only ever one
  return (mode === "standard" || mode === "response" || mode === "talk") && !existing.some((session) => session.isBaseline);
}

// Compare the first recording with the most recent full session, or null if there is nothing to compare
export function baselineProgress(sessions: ReadonlyArray<SessionRecord>): BaselineProgress | null {
  // Find the first recording
  const baseline = sessions.find((session) => session.isBaseline);
  // Find the most recent full first try (retries are left out, so this matches the trend line's last point; decision 76)
  const latest = oldestFirst(fullSessions(sessions)).filter((session) => session.retryOf === null).at(-1);
  // Nothing to compare without a baseline and a later session
  if (!baseline || !latest || latest.id === baseline.id) return null;
  // Work out the percent change, guarding against a baseline of zero
  const percentChange = baseline.fillersPerMinute === 0 ? 0 : Math.round(((latest.fillersPerMinute - baseline.fillersPerMinute) / baseline.fillersPerMinute) * 100);
  // Hand back the comparison
  return { baselineDate: baseline.createdAt, baseline: baseline.fillersPerMinute, latest: latest.fillersPerMinute, percentChange };
}

// Fillers per minute for each full first try, oldest first, for the trend line
export function trendSeries(sessions: ReadonlyArray<SessionRecord>): number[] {
  // Leave out warm-ups and retries so the line compares like with like
  return oldestFirst(fullSessions(sessions))
    .filter((session) => session.retryOf === null)
    .map((session) => session.fillersPerMinute);
}

// One line of the history list
export interface HistoryRow {
  // The first try
  session: SessionRecord;
  // Its retry, if there was one
  retry: SessionRecord | null;
}

// Group each first try with its retry, newest first
export function historyRows(sessions: ReadonlyArray<SessionRecord>): HistoryRow[] {
  // Find each first try's retry (the latest one, if there were several)
  return oldestFirst(sessions)
    .filter((session) => session.retryOf === null)
    .reverse()
    .map((session) => ({ session, retry: oldestFirst(sessions).filter((other) => other.retryOf === session.id).at(-1) ?? null }));
}
