// "Then and now": find an earlier recording of the same prompt to play beside a new one

// Load the calendar-day helpers
import { dayKey, daysBetween } from "@/core/dates";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// The first recording of the same prompt on an earlier day, or null if there is none
export function earlierTake(sessions: ReadonlyArray<SessionRecord>, session: SessionRecord): SessionRecord | null {
  // The day this session was recorded
  const today = dayKey(new Date(session.createdAt));
  // Earlier sessions on the same prompt (and, for rehearsals, the same section), from a different day (a same-day retry has its own comparison screen)
  const earlier = sessions.filter((other) => other.id !== session.id && other.promptId === session.promptId && (other.sectionIndex ?? null) === (session.sectionIndex ?? null) && other.createdAt < session.createdAt && dayKey(new Date(other.createdAt)) !== today);
  // The earliest of them (ISO text sorts in time order)
  const first = [...earlier].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  // Hand it back, or null
  return first ?? null;
}

// Which day of practice a date falls on, counting the day of the first recording as day 1
export function practiceDay(sessions: ReadonlyArray<SessionRecord>, when: Date): number {
  // The earliest recording (ISO text sorts in time order)
  const first = [...sessions].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  // Without any recording, this is day 1
  if (!first) return 1;
  // Whole calendar days since then, plus one
  return daysBetween(new Date(first.createdAt), when) + 1;
}
