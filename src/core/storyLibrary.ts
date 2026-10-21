// "Your stories" (decision 92): every story the user has told, with how often, its latest telling and the takeaway to carry into the next one; plus the rules for a story's title and for joining story records from a backup

// Load the story prompts and moment-seed helpers
import { findStoryPrompt, momentIdOf, momentTitle } from "@/content/stories";
// Load the story checks and the change picked from them
import { heardList, storyChange, storyChecks } from "@/core/storyChecks";
// Load the record types
import type { SessionRecord, StoryRecord } from "@/data/records";

// The longest title kept, in characters
export const STORY_TITLE_MAX = 80;

// One story in the library
export interface LibraryStory {
  // The story's id (its seed's id)
  id: string;
  // Its title: the user's own, or from the prompt or moment
  title: string;
  // How many times it was told
  tellings: number;
  // The latest telling
  latest: SessionRecord;
  // The cue to carry into the next telling: the coach's, or one from the checks
  takeaway: string;
  // When it was last told (ISO text)
  lastToldAt: string;
}

// The title a new story starts with: the prompt's short title, or the first words of the moment note, or a plain one
export function defaultStoryTitle(storyId: string, sessions: ReadonlyArray<SessionRecord>): string {
  // A prompt from the bank
  const prompt = findStoryPrompt(storyId);
  // Its title
  if (prompt) return prompt.title;
  // The moment note it came from, if it is still here
  const moment = sessions.find((session) => session.id === momentIdOf(storyId));
  // Its first words, or a plain title
  return moment ? momentTitle(moment.transcript) : "A story";
}

// A title the user typed, tidied: trimmed, spaces joined, capped; null when nothing is left
export function cleanStoryTitle(text: string): string | null {
  // Tidied
  const title = text.replace(/\s+/g, " ").trim().slice(0, STORY_TITLE_MAX).trim();
  // Something, or nothing
  return title === "" ? null : title;
}

// The library: each story with at least one telling, the most recently told first
export function storyLibrary(sessions: ReadonlyArray<SessionRecord>, stories: ReadonlyArray<StoryRecord>): LibraryStory[] {
  // The told stories, grouped by story id
  const groups = new Map<string, SessionRecord[]>();
  // Each telling
  for (const session of sessions) {
    // Only stories
    if (session.mode !== "story") continue;
    // Added to its story's list
    groups.set(session.promptId, [...(groups.get(session.promptId) ?? []), session]);
  }
  // The saved titles, by id
  const titles = new Map(stories.map((story) => [story.id, story.title]));
  // One entry per story
  const entries = [...groups.entries()].map(([id, tellings]): LibraryStory => {
    // The latest telling (ISO text sorts in time order)
    const latest = [...tellings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!;
    // The entry
    return { id, title: titles.get(id) ?? defaultStoryTitle(id, sessions), tellings: tellings.length, latest, takeaway: (latest.feedback ?? storyChange(latest.transcript, latest.durationSec, latest.story ?? {})).retryCue, lastToldAt: latest.createdAt };
  });
  // Most recently told first
  return entries.sort((a, b) => b.lastToldAt.localeCompare(a.lastToldAt));
}

// Every telling of one story, oldest first
export function storyVersions(sessions: ReadonlyArray<SessionRecord>, storyId: string): SessionRecord[] {
  // Its tellings, in time order
  return sessions.filter((session) => session.mode === "story" && session.promptId === storyId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// A story from a backup joined with the one already here (decision 92): new ones are added; where both exist, the more recently renamed title wins and the first-told date is the earlier
export function mergeStory(existing: StoryRecord | undefined, incoming: StoryRecord): StoryRecord {
  // New to this device
  if (!existing) return incoming;
  // The copy whose title changed last
  const newer = incoming.updatedAt > existing.updatedAt ? incoming : existing;
  // Its title and change date, with the earlier first-told date
  return { ...newer, createdAt: incoming.createdAt < existing.createdAt ? incoming.createdAt : existing.createdAt };
}

// How many of the six checklist lines a telling showed
export function heardCount(session: SessionRecord): number {
  // The lines heard
  return heardList(storyChecks(session.transcript)).filter((line) => line.heard).length;
}

// One row of the before-and-after table for a retold story: a checklist line on each telling, plus "and then"
export function storyCompareRows(before: SessionRecord, after: SessionRecord): Array<{ label: string; before: string; after: string }> {
  // Each telling's checks
  const [first, second] = [storyChecks(before.transcript), storyChecks(after.transcript)];
  // Each telling's checklist
  const [firstLines, secondLines] = [heardList(first), heardList(second)];
  // One row per line, marked heard or not, then the "and then" counts
  return [...firstLines.map((line, index) => ({ label: line.name, before: line.heard ? "Heard" : "–", after: secondLines[index]?.heard ? "Heard" : "–" })), { label: "“And then”", before: String(first.andThen), after: String(second.andThen) }];
}

// The headline for a retelling: how many of the six lines this telling showed against the one before
export function retellHeadline(before: SessionRecord, after: SessionRecord): string {
  // The two counts
  const [was, now] = [heardCount(before), heardCount(after)];
  // Better, the same, or fewer
  return now > was ? `${now} of 6 this time, up from ${was}.` : now === was ? `${now} of 6 again. Same story, new telling.` : `${now} of 6 this time, ${was} last time.`;
}
