// Keeping a take's detailed readings apart from its session (decision 98): the session record stays small for lists, and the readings (pitch, loudness and word times, ten a second or one a word) live in their own record, joined back only where they are drawn or measured

// Load the record types and the names of the readings
import { SIGNAL_FIELDS, type FullSession, type SessionRecord, type SessionSignals, type SignalsRecord } from "@/data/records";

// Whether a record still carries any reading inline (a session saved before decision 98, or a full session about to be saved)
export function hasInlineSignals(session: SessionRecord | FullSession): boolean {
  // Any of the reading fields present
  return SIGNAL_FIELDS.some((field) => (session as FullSession)[field] !== undefined);
}

// Split a session into the small record kept in the list and its readings (null when it has none)
export function splitSignals(session: SessionRecord | FullSession): { session: SessionRecord; signals: SignalsRecord | null } {
  // Every field, readings included
  const { loudness, pitch, spokenTimes, scriptTimes, ...rest } = session as FullSession;
  // The readings that are present
  const signals: SessionSignals = { ...(loudness !== undefined ? { loudness } : {}), ...(pitch !== undefined ? { pitch } : {}), ...(spokenTimes !== undefined ? { spokenTimes } : {}), ...(scriptTimes !== undefined ? { scriptTimes } : {}) };
  // The small record, and the readings under the session's id when there are any
  return { session: rest, signals: Object.keys(signals).length > 0 ? { sessionId: session.id, ...signals } : null };
}

// Join a session with its readings: readings still inline (an older record) are kept, and the stored ones fill in the rest
export function joinSignals(session: SessionRecord | FullSession, signals: SignalsRecord | undefined | null): FullSession {
  // Nothing stored apart: the record as it is
  if (!signals) return session;
  // The stored readings without their key
  const readings: SessionSignals = { ...(signals.loudness !== undefined ? { loudness: signals.loudness } : {}), ...(signals.pitch !== undefined ? { pitch: signals.pitch } : {}), ...(signals.spokenTimes !== undefined ? { spokenTimes: signals.spokenTimes } : {}), ...(signals.scriptTimes !== undefined ? { scriptTimes: signals.scriptTimes } : {}) };
  // The readings first, then the record (so an older inline reading wins, which is the same data)
  return { ...readings, ...session };
}
