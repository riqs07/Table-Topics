// Which recordings lose their audio (decision 88): the newest few keep theirs (the user's setting), the very first recording always does, and so does the first take of up to 20 prompts that were recorded again on a later day, so "then and now" has something to play

// Load the calendar-day helper
import { dayKey } from "@/core/dates";
// Load the record type
import type { SessionRecord } from "@/data/records";

// How many prompts keep their first take beyond the setting (the most recently practised ones)
export const FIRST_TAKES_KEPT = 20;

// Which recordings count as takes of the same thing: the same prompt, section and question, as "then and now" pairs them (src/core/compare.ts)
function takeKey(session: SessionRecord): string {
  // Joined with a separator no id uses
  return `${session.promptId}\u0000${session.sectionIndex ?? ""}\u0000${session.question ?? ""}`;
}

// The ids of first takes worth keeping: for each prompt recorded again on a later day, its first take; only the 20 prompts practised most recently
export function firstTakesToKeep(sessions: ReadonlyArray<SessionRecord>): Set<string> {
  // Each prompt's takes, gathered
  const groups = new Map<string, SessionRecord[]>();
  // Gather them
  for (const session of sessions) {
    // This prompt's list so far, made on first use
    const takes = groups.get(takeKey(session)) ?? [];
    // Add this take
    takes.push(session);
    // Keep the list
    groups.set(takeKey(session), takes);
  }
  // Prompts with a first take and a later-day take, with when they were last practised
  const compared: { first: SessionRecord; lastAt: string }[] = [];
  // Look at each prompt
  for (const takes of groups.values()) {
    // Its takes, oldest first (ISO text sorts in time order)
    const ordered = [...takes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    // The first take
    const first = ordered[0]!;
    // The newest take
    const last = ordered[ordered.length - 1]!;
    // Keep it in mind only when a take on a later day exists, so there is something to compare
    if (ordered.some((take) => dayKey(new Date(take.createdAt)) !== dayKey(new Date(first.createdAt)))) compared.push({ first, lastAt: last.createdAt });
  }
  // The most recently practised prompts first, up to the cap
  return new Set(compared.sort((a, b) => b.lastAt.localeCompare(a.lastAt)).slice(0, FIRST_TAKES_KEPT).map((item) => item.first.id));
}

// The sessions whose audio should be deleted, given every session (newest first) and how many recent ones keep theirs
export function audioToPrune(sessions: ReadonlyArray<SessionRecord>, keep: number): SessionRecord[] {
  // The first takes kept for comparing
  const firstTakes = firstTakesToKeep(sessions);
  // Older sessions that still have audio, are not the very first recording, and are not a kept first take
  return sessions.slice(keep).filter((session) => session.audioKey && !session.isBaseline && !firstTakes.has(session.id));
}
