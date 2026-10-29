// Which of today's steps have been ticked off with the small moment on Today (decision 141; kept in this browser only; not part of the data export)

// Load the rule
import { freshTicks, readTicked } from "@/core/tickOff";

// Key the record is stored under (app-specific, as setup rule S1 asks)
const KEY = "voicelab-steps-ticked";

// The done steps to tick off now, remembering them so the moment plays once (blocked storage, or anything unreadable there, ticks nothing off rather than every visit)
export function newlyTicked(day: string, doneKeys: ReadonlyArray<string>): string[] {
  // Storage can be blocked (private browsing), so guard the read and write
  try {
    // The stored text
    const text = localStorage.getItem(KEY);
    // Its record, if it is one
    let stored = null;
    // Parse it, treating broken text as none
    try {
      // The record
      stored = text ? readTicked(JSON.parse(text)) : null;
    } catch {
      // Broken text: as if none
      stored = null;
    }
    // The fresh ones and the record to keep
    const { fresh, next } = freshTicks(stored, day, doneKeys);
    // Keep it
    localStorage.setItem(KEY, JSON.stringify(next));
    // Hand back the fresh ones
    return fresh;
  } catch {
    // Blocked storage: no moment
    return [];
  }
}
