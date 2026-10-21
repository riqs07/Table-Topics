// Which takes keep their recording and their detailed readings (decision 98). Most people never go back to old takes, so only a few are kept as markers of how you sounded:
// - a recording keeps its audio for the chosen number of days (14 unless changed to 7 or 30); starred takes, marker takes (the weekly check-in's) and the very first recording keep theirs however old;
// - the detailed readings (pitch and loudness ten times a second, and each word's time) are kept for 30 days, and longer for starred takes, marker takes and the very first recording;
// - the transcript, the numbers, the measures, the feedback and the notes are always kept.

// Load the record types
import type { SessionRecord, SettingsRecord } from "@/data/records";

// The choices for how many days of recordings keep their audio
export const RECORDING_DAY_CHOICES: ReadonlyArray<number> = [7, 14, 30];
// The number of days used when none was chosen
export const DEFAULT_RECORDING_DAYS = 14;
// How many days the detailed readings are kept for takes that are not kept as markers
export const READINGS_DAYS = 30;
// One day in milliseconds
const DAY_MS = 24 * 60 * 60 * 1000;

// The number of days of recordings the user keeps: their choice when it is one of the offered ones, otherwise the default
export function recordingDays(settings: Pick<SettingsRecord, "recordingDays"> | null | undefined): number {
  // The saved choice
  const chosen = settings?.recordingDays;
  // Used only when it is one of the choices, so a damaged value can never delete more
  return typeof chosen === "number" && RECORDING_DAY_CHOICES.includes(chosen) ? chosen : DEFAULT_RECORDING_DAYS;
}

// Whether a take is kept whole however old it is: starred by the user, a marker take, or the very first recording
export function keptWhole(session: SessionRecord): boolean {
  // Any of the three
  return session.starred === true || session.marker === true || session.isBaseline;
}

// Whether a take was made more than a number of days before now
function olderThan(session: SessionRecord, days: number, now: Date): boolean {
  // Its age against the limit
  return now.getTime() - new Date(session.createdAt).getTime() > days * DAY_MS;
}

// The takes whose recording should be deleted now: those with a recording, older than the chosen days, and not kept whole
export function audioToDrop(sessions: ReadonlyArray<SessionRecord>, now: Date, days: number): SessionRecord[] {
  // Each take checked on its own, so the rule never depends on how many there are
  return sessions.filter((session) => session.audioKey !== null && !keptWhole(session) && olderThan(session, days, now));
}

// The takes whose detailed readings should be dropped now: those that still have readings, older than 30 days, and not kept whole
export function readingsToDrop(sessions: ReadonlyArray<SessionRecord>, withReadings: ReadonlySet<string>, now: Date): SessionRecord[] {
  // Each take checked on its own; once its readings are gone it is no longer in the list, so running again changes nothing
  return sessions.filter((session) => withReadings.has(session.id) && !keptWhole(session) && olderThan(session, READINGS_DAYS, now));
}
