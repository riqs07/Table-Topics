// Findings from the time each word was heard: how the pace changed, and where the reader paused

// Load the script piece type
import type { ReadingToken } from "@/core/liveReading";

// Fewest words for a pace finding
const MIN_WORDS = 30;
// Shortest stretch, in seconds, for a pace finding
const MIN_SECONDS = 20;
// How much faster or slower the end must be than the start to count as a change (15%)
const CHANGE = 1.15;
// Shortest gap between words, in seconds, that counts as a pause at a mark (word times are only approximate)
const MARK_GAP = 0.8;
// Most missed marks to name in a sentence
const MAX_NAMED = 4;

// Words a minute across a run of word times, or null if they cannot be measured
function rate(times: ReadonlyArray<number>): number | null {
  // The first and last time
  const first = times[0];
  // (and the last)
  const last = times.at(-1);
  // Need two words with time between them
  if (times.length < 2 || first === undefined || last === undefined || last <= first) return null;
  // Gaps between words, per minute
  return ((times.length - 1) / (last - first)) * 60;
}

// How the pace changed from the first third of the time to the last, with a sentence, or null for a short take
export function paceAcross(times: ReadonlyArray<number>): { start: number; end: number; sentence: string } | null {
  // The first and last time
  const first = times[0] ?? 0;
  // (and the last)
  const last = times.at(-1) ?? 0;
  // Too little to judge
  if (times.length < MIN_WORDS || last - first < MIN_SECONDS) return null;
  // A third of the time
  const third = (last - first) / 3;
  // Speed in the first third
  const start = rate(times.filter((time) => time < first + third));
  // Speed in the last third
  const end = rate(times.filter((time) => time >= last - third));
  // Speed overall
  const overall = rate(times);
  // Something could not be measured
  if (start === null || end === null || overall === null) return null;
  // Whole numbers for showing
  const [shownStart, shownEnd] = [Math.round(start), Math.round(end)];
  // Faster at the end
  if (end >= start * CHANGE) return { start: shownStart, end: shownEnd, sentence: `You sped up: ${shownStart} words a minute at the start, ${shownEnd} by the end.` };
  // Slower at the end
  if (end * CHANGE <= start) return { start: shownStart, end: shownEnd, sentence: `You slowed down: ${shownStart} words a minute at the start, ${shownEnd} by the end.` };
  // About the same
  return { start: shownStart, end: shownEnd, sentence: `A steady pace: about ${Math.round(overall)} words a minute from start to finish.` };
}

// Which pause marks had a pause: counted only where the words on both sides were heard
export function marksPaused(tokens: ReadonlyArray<ReadingToken>, times: ReadonlyArray<number | null>): { taken: number; total: number; missedAfter: string[] } {
  // Marks judged and marks with a pause
  let total = 0;
  // (with a pause)
  let taken = 0;
  // The word before each mark without a pause
  const missedAfter: string[] = [];
  // The last word seen, with its number
  let before: { word: number; text: string } | null = null;
  // The word before a mark still waiting for the word after it
  let waiting: { word: number; text: string } | null = null;
  // Walk the script
  for (const token of tokens) {
    // A mark: wait for the next word
    if (token.kind === "pause") {
      // Remember the word before it
      waiting = before;
      // Next piece
      continue;
    }
    // Spaces and stage directions do not count
    if (token.word === null) continue;
    // The word after a mark: judge the mark
    if (waiting) {
      // Both times
      const [then, now] = [times[waiting.word], times[token.word]];
      // Only marks with both words heard
      if (then !== null && then !== undefined && now !== null && now !== undefined) {
        // One more judged
        total += 1;
        // A long enough gap is a pause
        if (now - then >= MARK_GAP) taken += 1;
        // Otherwise name the word before it
        else missedAfter.push(waiting.text.replace(/[^\p{L}\p{N}'’]+$/u, ""));
      }
      // Done with this mark
      waiting = null;
    }
    // This word is now the last one seen
    before = { word: token.word, text: token.text };
  }
  // Hand back the counts
  return { taken, total, missedAfter };
}

// The pause marks as a sentence, or nothing if no mark could be judged
export function marksSentence({ taken, total, missedAfter }: { taken: number; total: number; missedAfter: ReadonlyArray<string> }): string {
  // Nothing judged
  if (total === 0) return "";
  // Every mark
  if (taken === total) return total === 1 ? "You paused at the one mark." : `You paused at all ${total} marks.`;
  // The words to name, a few at most
  const named = missedAfter.slice(0, MAX_NAMED).map((word) => `“${word}”`).join(", ");
  // How many more there were
  const more = missedAfter.length > MAX_NAMED ? `, and ${missedAfter.length - MAX_NAMED} more` : "";
  // The count and the misses
  return `You paused at ${taken} of the ${total} marks. No pause after ${named}${more}.`;
}
