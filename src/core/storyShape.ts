// A story's shape (decision 115): how much of the telling went on the set-up, the turn, the ending and the point, as one strip. Where the story coach heard the beats (decision 92), each beat's quote is found in the words and starts its part (set-up until the turn, then the turn, how it ended, and what it meant); otherwise the phone's own story checks place the turn and the point (set-up, turn, point). Parts are measured in time when the words have times, otherwise in words. Hidden when neither found a turn or a point. Pure

// Load the story checks and their word splitter
import { storyChecks, wordsOf } from "@/core/storyChecks";
// Load the record types
import type { StoryBeat } from "@/data/records";

// One part of the strip
export type ShapePart = "setup" | "turn" | "end" | "point";

// The parts' names
export const SHAPE_NAMES: Readonly<Record<ShapePart, string>> = { setup: "Set-up", turn: "Turn", end: "End", point: "Point" };

// The shape
export interface StoryShape {
  // Each part with its share of the story (0 to 1) and when it started, in seconds (null without times)
  parts: Array<{ part: ShapePart; share: number; at: number | null }>;
  // Where it came from: the coach's beats or the phone's checks
  source: "coach" | "phone";
  // One plain line
  line: string;
}

// The set-up takes more than this share before the line suggests getting to the turn sooner
const LONG_SETUP = 0.5;

// Where a quote starts in the words, or -1: its first three words in a row (or its first two, then its first)
export function quoteAt(words: ReadonlyArray<string>, quote: string, from = 0): number {
  // The quote's words
  const parts = wordsOf(quote);
  // Nothing to find
  if (parts.length === 0) return -1;
  // Longest lead first
  for (const length of [Math.min(3, parts.length), Math.min(2, parts.length), 1]) {
    // Its first words
    const lead = parts.slice(0, length);
    // Each place
    for (let index = from; index + lead.length <= words.length; index++) if (lead.every((part, offset) => words[index + offset] === part)) return index;
  }
  // Not found
  return -1;
}

// The last place a phrase starts in some words, or -1
function lastAt(words: ReadonlyArray<string>, phrase: string): number {
  // Its words
  const parts = phrase.split(" ");
  // Walk back
  for (let index = words.length - parts.length; index >= 0; index--) if (parts.every((part, offset) => words[index + offset] === part)) return index;
  // Not found
  return -1;
}

// The shape of a told story, or null when no turn or point was placed
export function storyShape(input: { transcript: string; times?: ReadonlyArray<number> | null; durationSec: number; beats?: ReadonlyArray<{ beat: StoryBeat; quote: string }> | null }): StoryShape | null {
  // The words
  const words = wordsOf(input.transcript);
  // Nothing said
  if (words.length < 5) return null;
  // The markers: each part's first word
  const markers: Array<{ part: ShapePart; at: number }> = [];
  // Where they came from
  let source: StoryShape["source"] = "phone";
  // The coach's beats, when it heard a turn or a point
  const coach = (input.beats ?? []).filter((beat) => beat.beat === "turn" || beat.beat === "ending" || beat.beat === "meaning");
  // Placed from the coach's quotes, each after the one before
  if (coach.length > 0) {
    // Each part's beat, in story order
    for (const [part, beat] of [["turn", "turn"], ["end", "ending"], ["point", "meaning"]] as const) {
      // Its quote
      const quote = coach.find((item) => item.beat === beat)?.quote;
      // Found after the last marker
      const at = quote ? quoteAt(words, quote, (markers.at(-1)?.at ?? 0) + (markers.length > 0 ? 1 : 0)) : -1;
      // Kept when found past the start
      if (at > 0) markers.push({ part, at });
    }
    // From the coach when it placed one
    if (markers.length > 0) source = "coach";
  }
  // Otherwise the phone's checks
  if (markers.length === 0) {
    // The checks
    const checks = storyChecks(input.transcript);
    // The turn: its first place
    const turn = checks.turn ? quoteAt(words, checks.turn) : -1;
    // The point: its last place
    const point = checks.endsOnPoint ? lastAt(words, checks.endsOnPoint) : -1;
    // Kept in order
    if (turn > 0) markers.push({ part: "turn", at: turn });
    // (the point after the turn)
    if (point > Math.max(0, turn)) markers.push({ part: "point", at: point });
  }
  // Nothing placed
  if (markers.length === 0) return null;
  // A word's moment: its time when known, otherwise its place
  const timed = input.times && input.times.length >= words.length;
  // (the moment)
  const moment = (index: number) => (timed ? input.times![index]! : index);
  // The story's start and end in those units
  const [start, end] = [moment(0), timed ? Math.max(input.durationSec, moment(words.length - 1)) : words.length];
  // The parts: the set-up, then each marker to the next
  const starts = [{ part: "setup" as ShapePart, at: 0 }, ...markers];
  // Each with its share
  const parts = starts.map((item, index) => {
    // From here
    const from = moment(item.at);
    // To the next part, or the end
    const to = index + 1 < starts.length ? moment(starts[index + 1]!.at) : end;
    // Its share
    return { part: item.part, share: Math.max(0, (to - from) / Math.max(1e-6, end - start)), at: timed ? Math.round(from) : null };
  });
  // The set-up's share
  const setup = parts[0]!.share;
  // The line
  const line = setup > LONG_SETUP ? `The set-up took ${Math.round(setup * 100)}% of your story. Get to the turn by the halfway mark: try “Start in the middle”.` : `${parts[1]!.part === "turn" ? "The turn came" : "The point came"} ${Math.round(setup * 100)}% of the way in.`;
  // The shape
  return { parts, source, line };
}
