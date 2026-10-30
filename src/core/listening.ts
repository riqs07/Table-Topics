// Active listening (decision 150): which details a spoken reply picked up, whether it went to what mattered, how the story is marked afterwards, and which story comes next

// Load the stories
import { LISTEN_STORIES, type ListenStory } from "@/content/listening";
// Load the spoken-reply checks and the word matcher
import { mentions, replyCheck, type ReplyCheck, type ReplyCheckId } from "@/core/replyChecks";
// Load the record type
import type { ListenProgress } from "@/data/records";

// The checks a listening reply gets: the shared ones, plus the story's details and what mattered
export type ListenCheckId = ReplyCheckId | "details" | "core";

// One check's result
export interface ListenCheck extends Omit<ReplyCheck, "id"> {
  // Which check
  id: ListenCheckId;
}

// One detail and whether the reply picked it up
export interface DetailHit {
  // The detail's words in the story
  phrase: string;
  // The word in the reply that showed it, or none
  heard: string | null;
}

// How a reply to a story went
export interface ListenResult {
  // Each detail, in the story's order
  details: DetailHit[];
  // How many were picked up
  caught: number;
  // The word that showed what mattered was heard, or none
  core: string | null;
  // The checks, in the order shown
  checks: ListenCheck[];
  // Whether they answer warmly: what mattered was heard, the reply stayed on them, and no advice
  warm: boolean;
}

// How many details make "picked up their details" (or all of them, for a story with fewer)
const DETAILS_NEEDED = 2;

// How a spoken reply to a story went
export function listenResult(story: ListenStory, transcript: string): ListenResult {
  // Each detail and the word that showed it
  const details = story.details.map((detail) => ({ phrase: detail.phrase, heard: mentions(transcript, detail.match) }));
  // How many were heard
  const caught = details.filter((detail) => detail.heard !== null).length;
  // What mattered, heard or not
  const core = mentions(transcript, story.core.match);
  // How it felt for them: a feeling phrase, or one of the story's own feeling words
  const feeling = replyCheck("their-feeling", transcript, story.text);
  // The story's own feeling word, when the general check missed it
  const ownFeeling = feeling.passed ? null : mentions(transcript, story.feelings);
  // The shared checks used here
  const stays = replyCheck("stays", transcript, story.text);
  // (and)
  const noAdvice = replyCheck("no-advice", transcript, story.text);
  // The checks: a reaction on the first two levels (a big reaction suits a story told openly), then the rest
  const checks: ListenCheck[] = [
    // A reaction, levels 1 and 2 only
    ...(story.level < 3 ? [replyCheck("react", transcript, story.text)] : []),
    // The details
    { id: "details", label: "Picked up their details", passed: caught >= Math.min(DETAILS_NEEDED, details.length), evidence: `${caught} of ${details.length}` },
    // How it felt
    { ...feeling, passed: feeling.passed || ownFeeling !== null, evidence: feeling.evidence ?? (ownFeeling ? `“${ownFeeling}”` : null) },
    // What mattered
    { id: "core", label: "Went to what mattered", passed: core !== null, evidence: core ? `“${core}”` : null },
    // A question
    replyCheck("question", transcript, story.text),
    // On them
    stays,
    // No advice
    noAdvice,
  ];
  // Warm when what mattered was heard, on them, with no advice
  const warm = core !== null && stays.passed && noAdvice.passed;
  // Together
  return { details, caught, core, checks, warm };
}

// One piece of the story's words, marked for the reveal
export interface StoryPiece {
  // The words
  text: string;
  // What mattered, a detail picked up, a detail missed, or plain
  mark: "core" | "caught" | "missed" | null;
}

// The story's words in pieces, with what mattered and each detail marked (a detail inside what mattered takes its mark; a phrase not found is left plain)
export function storyPieces(story: ListenStory, result: Pick<ListenResult, "details">): StoryPiece[] {
  // Each marked stretch: what mattered first, so it wins an overlap
  const wanted = [{ phrase: story.core.phrase, mark: "core" as const }, ...result.details.map((detail) => ({ phrase: detail.phrase, mark: detail.heard ? ("caught" as const) : ("missed" as const) }))];
  // Where each is, keeping only those found and not overlapping one kept earlier
  const ranges: Array<{ start: number; end: number; mark: StoryPiece["mark"] }> = [];
  // Each in turn
  for (const item of wanted) {
    // Where it starts
    const start = story.text.indexOf(item.phrase);
    // Not found: plain
    if (start === -1) continue;
    // Where it ends
    const end = start + item.phrase.length;
    // Keep it unless it overlaps one already kept
    if (!ranges.some((range) => start < range.end && end > range.start)) ranges.push({ start, end, mark: item.mark });
  }
  // In the story's order
  ranges.sort((a, b) => a.start - b.start);
  // The pieces
  const pieces: StoryPiece[] = [];
  // Where the last piece ended
  let at = 0;
  // Each marked stretch, with the plain words before it
  for (const range of ranges) {
    // The plain words before
    if (range.start > at) pieces.push({ text: story.text.slice(at, range.start), mark: null });
    // The marked words
    pieces.push({ text: story.text.slice(range.start, range.end), mark: range.mark });
    // On past them
    at = range.end;
  }
  // The plain words after the last
  if (at < story.text.length) pieces.push({ text: story.text.slice(at), mark: null });
  // All of them
  return pieces;
}

// The stories in the order they are offered: by level, then as written
export function storiesInOrder(stories: ReadonlyArray<ListenStory> = LISTEN_STORIES): ListenStory[] {
  // A stable sort by level
  return [...stories].sort((a, b) => a.level - b.level);
}

// The next story to hear: the first not heard yet, by level, then the one heard longest ago
export function nextStory(progress: Readonly<Record<string, ListenProgress>>, stories: ReadonlyArray<ListenStory> = LISTEN_STORIES): ListenStory {
  // In the order offered
  const ordered = storiesInOrder(stories);
  // The first not heard
  const fresh = ordered.find((story) => !progress[story.id]);
  // That one, or the one heard longest ago (a damaged entry without a time counts as oldest)
  return fresh ?? ordered.sort((a, b) => String(progress[a.id]?.lastAt ?? "").localeCompare(String(progress[b.id]?.lastAt ?? "")))[0]!;
}

// How many times a story may be heard before answering: twice on level 1, once after
export function hearingsAllowed(story: ListenStory): number {
  // By level
  return story.level === 1 ? 2 : 1;
}

// A story's address
export function listenHref(id: string): string {
  // The play page with the story
  return `/listening/play?id=${id}`;
}
