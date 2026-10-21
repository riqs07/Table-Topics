// Where pauses fall: inside a clause or at a boundary (decision 90). Browser transcripts have no punctuation, so this is a heuristic, marked with its own engine so stage B's punctuated, timed transcript can replace it:
// - a pause sits at a boundary when the first word after it usually starts a clause or sentence (and, but, so, because, then, which, when, I, we, you… the full list is CLAUSE_STARTERS in lexicon.ts),
// - or when the word before it usually ends a statement (yeah, right, okay, too, anyway, though: SENTENCE_ENDERS),
// - otherwise it is counted as mid-clause.
// Word times are when a word was first heard, a little after it was said, so the word after a pause is the first one heard at or after the pause's end

// Load the word lists
import { CLAUSE_STARTERS, SENTENCE_ENDERS } from "@/core/analysis/lexicon";
// Load the pause and word types
import type { PauseSpan, TimedWord } from "@/data/records";

// The engine name stored with the placement measures
export const PLACEMENT_ENGINE = "device-heuristic-v1";

// The position of the first word heard at or after a moment, or null when none is
export function wordAfter(words: ReadonlyArray<TimedWord>, seconds: number): number | null {
  // The first timed word at or after it (a tenth of a second early still counts, since times are rounded)
  const index = words.findIndex((word) => word.s !== null && word.s >= seconds - 0.1);
  // Nothing found
  return index === -1 ? null : index;
}

// Whether a pause before the word at a position sits at a clause or sentence boundary
export function atBoundary(words: ReadonlyArray<string>, next: number): boolean {
  // The word after the pause starts a clause
  if (CLAUSE_STARTERS.has(words[next] ?? "")) return true;
  // The word before it ends a statement
  return SENTENCE_ENDERS.has(words[next - 1] ?? "");
}

// The pauses that could be placed (a word after them is known), split into boundary and mid-clause
export function placePauses(pauses: ReadonlyArray<PauseSpan>, words: ReadonlyArray<string>): { boundary: number; midClause: number } {
  // The counts
  const counts = { boundary: 0, midClause: 0 };
  // Each pause with a word after it (not before the first word)
  for (const pause of pauses) {
    // Unplaceable
    if (pause.nextWord === null || pause.nextWord === 0) continue;
    // Count it on its side
    if (atBoundary(words, pause.nextWord)) counts.boundary += 1;
    // (inside a clause)
    else counts.midClause += 1;
  }
  // Hand them back
  return counts;
}
