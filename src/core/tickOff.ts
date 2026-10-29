// Which of today's done steps are newly done, so Today can tick them off with a small moment once (decision 141). Pure: the stored record comes in, the steps to tick off and the record to keep go out

// The record kept: the day and the steps already ticked off that day
export interface TickedRecord {
  // The day, as its key ("2026-10-29")
  day: string;
  // The steps' keys
  keys: string[];
}

// Read a stored value as a record, or nothing when it is missing, broken, from another day's shape or another app
export function readTicked(value: unknown): TickedRecord | null {
  // It must be an object
  if (!value || typeof value !== "object") return null;
  // Its fields
  const { day, keys } = value as { day?: unknown; keys?: unknown };
  // A day as text and a list of text keys
  if (typeof day !== "string" || !Array.isArray(keys) || !keys.every((key) => typeof key === "string")) return null;
  // The record
  return { day, keys };
}

// The done steps not yet ticked off today, and the record to keep: a record from another day counts as none ticked
export function freshTicks(stored: TickedRecord | null, day: string, doneKeys: ReadonlyArray<string>): { fresh: string[]; next: TickedRecord } {
  // What was ticked off today already
  const before = stored && stored.day === day ? stored.keys : [];
  // The done steps not among them
  const fresh = doneKeys.filter((key) => !before.includes(key));
  // Everything ticked off today, now
  return { fresh, next: { day, keys: [...new Set([...before, ...doneKeys])] } };
}
