// The word-choice lens (decision 115): words a listener can picture in bold, and hedges, vague words and intensifiers with a soft wavy underline, from the analysis's own word lists (decision 90). Tapping a marked word shows its swap: the coach's word swap when it suggested one for those words, otherwise a plain line on what that kind of word does. "Concrete" is a rough guess from word lists and endings (no word-frequency or concreteness list is bundled), and the page says so. Pure

// Load the word lists
import { CLAUSE_STARTERS, HEDGES, INTENSIFIERS, STOP_WORDS, VAGUE_WORDS } from "@/core/analysis/lexicon";
// Load the words' type
import type { LensWord } from "@/core/lenses/lensWords";

// What a run of words is, for word choice
export type WordKind = "concrete" | "hedge" | "vague" | "intensifier" | "swap";

// One marked run of words
export interface WordSpan {
  // The first word's place
  from: number;
  // The last word's place
  to: number;
  // What it is
  kind: WordKind;
  // The words, cleaned, as one phrase
  phrase: string;
  // The coach's swap for it, when there is one
  swap: { said: string; stronger: string; why: string } | null;
  // A plain line on it, for the tap
  explain: string;
}

// The lens's findings
export interface WordsLens {
  // Every marked run, in order
  spans: WordSpan[];
  // How many of each
  counts: Record<WordKind, number>;
}

// Endings of abstract words ("quality", "management", "happiness"), which are hard to picture
const ABSTRACT_ENDING = /(tion|sion|ment|ness|ity|ism|ance|ence|ship|hood|ology)s?$/;
// General words that carry little a listener can picture, beyond the stop words
const GENERAL: ReadonlySet<string> = new Set(["people", "person", "time", "times", "way", "ways", "day", "days", "year", "years", "lot", "part", "point", "idea", "ideas", "fact", "case", "kind", "sort", "type", "bit", "end", "start", "place", "world", "life", "work", "number", "problem", "problems", "question", "thought", "feel", "felt", "seem", "seemed", "need", "needed", "try", "tried", "use", "used", "started", "look", "looked", "keep", "kept", "give", "gave", "put", "find", "found", "tell", "told", "ask", "asked", "mean", "meant", "let", "even", "still", "always", "never", "maybe", "today", "yesterday", "tomorrow", "back", "again", "first", "last", "next", "other", "another", "same", "different", "own", "able", "sure", "every", "everything", "everyone", "anything", "nothing", "everybody"]);

// The plain line for each kind
const EXPLAIN: Readonly<Record<Exclude<WordKind, "concrete" | "swap">, (phrase: string) => string>> = {
  // A hedge
  hedge: (phrase) => `“${phrase}” softens what comes next. If you mean it, say it without; keep it where you really are unsure.`,
  // A vague word
  vague: (phrase) => `“${phrase}” is hard to picture. Name the thing itself, or what made it so.`,
  // An intensifier
  intensifier: (phrase) => `“${phrase}” adds volume, not meaning. A more specific word does both.`,
};

// Whether a word is one a listener can picture: a number, or a meaningful word that is not abstract, general or on a list
export function isConcrete(word: LensWord): boolean {
  // Its cleaned form
  const w = word.w;
  // A number said as digits
  if (/^\d/.test(w)) return true;
  // Too short, a pause word, a small word or a general word
  if (w.length < 3 || word.filler || STOP_WORDS.has(w) || GENERAL.has(w) || CLAUSE_STARTERS.has(w)) return false;
  // On one of the other lists
  if (INTENSIFIERS.has(w) || VAGUE_WORDS.includes(w) || HEDGES.includes(w)) return false;
  // An abstract ending
  if (ABSTRACT_ENDING.test(w)) return false;
  // A word ending in "ly" describes how, not what
  if (w.endsWith("ly") && w.length > 4) return false;
  // A meaningful, plain word
  return true;
}

// The longest phrase from a list starting at a place, or null
function phraseAt(words: ReadonlyArray<string>, index: number, phrases: ReadonlyArray<string>): string | null {
  // The first (longest-first lists) whose words all line up
  return phrases.find((phrase) => phrase.split(" ").every((part, offset) => words[index + offset] === part)) ?? null;
}

// Whether "so" here pushes a word up ("so good") rather than opening a clause ("so I went"), as the analysis counts it
function intensifies(words: ReadonlyArray<string>, index: number): boolean {
  // Any other intensifier always counts; "so" only before a word that does not start a clause
  return words[index] !== "so" || (index > 0 && words[index + 1] !== undefined && !CLAUSE_STARTERS.has(words[index + 1]!) && !STOP_WORDS.has(words[index + 1]!));
}

// The coach's swap that matches some words, by its "said" words appearing there
function swapFor(words: ReadonlyArray<string>, from: number, swaps: ReadonlyArray<{ said: string; stronger: string; why: string }>): { swap: { said: string; stronger: string; why: string }; length: number } | null {
  // Each swap
  for (const swap of swaps) {
    // Its words, cleaned
    const said = swap.said.toLowerCase().replace(/[’]/g, "'").split(/\s+/).map((part) => part.replace(/[^a-z0-9']+/g, "")).filter((part) => part !== "");
    // All of them line up here
    if (said.length > 0 && said.every((part, offset) => words[from + offset] === part)) return { swap, length: said.length };
  }
  // None
  return null;
}

// The lens for a take's words, with the coach's word swaps (none until its rubric arrives)
export function wordsLens(words: ReadonlyArray<LensWord>, swaps: ReadonlyArray<{ said: string; stronger: string; why: string }> = []): WordsLens {
  // The cleaned words, pause words kept so places line up
  const cleaned = words.map((word) => word.w);
  // The runs found
  const spans: WordSpan[] = [];
  // Walk the words
  let index = 0;
  // Until the end
  while (index < words.length) {
    // The coach's swap here
    const coach = swapFor(cleaned, index, swaps);
    // A hedge, a vague word or an intensifier here (hedges first, as "kind of" is both)
    const hedge = phraseAt(cleaned, index, HEDGES);
    // (vague)
    const vague = hedge ? null : phraseAt(cleaned, index, VAGUE_WORDS);
    // (intensifier)
    const intensifier = !hedge && !vague && INTENSIFIERS.has(cleaned[index]!) && intensifies(cleaned, index) ? cleaned[index]! : null;
    // The kind and length found
    const found: { kind: WordKind; length: number; phrase: string } | null = hedge ? { kind: "hedge", length: hedge.split(" ").length, phrase: hedge } : vague ? { kind: "vague", length: vague.split(" ").length, phrase: vague } : intensifier ? { kind: "intensifier", length: 1, phrase: intensifier } : null;
    // The run: the longer of the coach's words and the list's
    const length = Math.max(found?.length ?? 0, coach?.length ?? 0);
    // Something to mark
    if (found || coach) {
      // The phrase, as heard
      const phrase = cleaned.slice(index, index + length).join(" ");
      // Kept, with the coach's swap when it has one
      spans.push({ from: index, to: index + length - 1, kind: found?.kind ?? "swap", phrase, swap: coach?.swap ?? null, explain: coach ? coach.swap.why || `The coach suggests “${coach.swap.stronger}”.` : EXPLAIN[found!.kind as Exclude<WordKind, "concrete" | "swap">](phrase) });
      // Past it
      index += length;
      // Go on
      continue;
    }
    // A concrete word (never a pause word, which the pauses lens shows)
    if (isConcrete(words[index]!)) spans.push({ from: index, to: index, kind: "concrete", phrase: cleaned[index]!, swap: null, explain: "" });
    // Next word
    index += 1;
  }
  // The counts
  const counts: Record<WordKind, number> = { concrete: 0, hedge: 0, vague: 0, intensifier: 0, swap: 0 };
  // Each run
  for (const span of spans) counts[span.kind] += 1;
  // Hand them back
  return { spans, counts };
}
