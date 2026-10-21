// Language and vocabulary measures worked out from the words alone (decision 90): hedges, tag questions, pronouns, word variety, vague words, intensifiers, word length, repeats, openings and closings, and content-word counts

// Load the word lists
import { HEDGES, INTENSIFIERS, STOP_WORDS, TAG_QUESTIONS, VAGUE_WORDS, WEAK_CLOSINGS, CLAUSE_STARTERS } from "@/core/analysis/lexicon";
// Load the filler counter
import { countFillers } from "@/core/fillers";

// The window for word variety (MATTR), in words, as the research recommends
export const MATTR_WINDOW = 50;
// Fewest words before word variety is measured on a short take
const MIN_WORDS_FOR_VARIETY = 10;
// A word this long or longer counts as long
const LONG_WORD = 7;
// Most content words kept per take
const MOST_CONTENT_WORDS = 300;

// A hesitation sound (um, uh, er, ah, hmm, mm), in any stretched spelling
const SOUND = /^(u+m+|u+h+|e+r+m*|a+h+|h+m+|m{2,}|mhm|e+h+)$/;
// Lead-in words that make a weak first word
const LEAD_INS: ReadonlySet<string> = new Set(["so", "well", "okay", "ok", "like", "yeah", "alright", "right", "basically", "um", "uh"]);

// Per 100 words, or null without words
function per100(count: number, words: number): number | null {
  // No words, no rate
  return words > 0 ? (count * 100) / words : null;
}

// Count non-overlapping matches of phrases (longest first) in a list of words; a phrase is matched only where its words all line up
export function countPhrases(words: ReadonlyArray<string>, phrases: ReadonlyArray<string>): number {
  // The running count
  let count = 0;
  // Walk the words
  let index = 0;
  // Until the end
  while (index < words.length) {
    // The first phrase (longest first) whose words start here
    const found = phrases.find((phrase) => phrase.split(" ").every((part, offset) => words[index + offset] === part));
    // Count it and skip past it, or move one word on
    if (found) {
      // One more
      count += 1;
      // Past its words
      index += found.split(" ").length;
    } else index += 1;
  }
  // The total
  return count;
}

// Tag questions: a two-word tag before a pause, a clause starter or the end; a one-word tag only right before a pause or at the very end (breaks: positions of words followed by a pause)
export function countTagQuestions(words: ReadonlyArray<string>, breaks: ReadonlySet<number>): number {
  // The running count
  let count = 0;
  // Each word
  for (let index = 0; index < words.length; index++) {
    // Whether a statement could close after the word at a position
    const closesAt = (position: number) => position === words.length - 1 || breaks.has(position);
    // A two-word tag ending at the next word
    const pair = `${words[index]} ${words[index + 1] ?? ""}`;
    // Two words: before a pause, the end, or a clause starter
    if (TAG_QUESTIONS.includes(pair) && pair.includes(" ") && index + 1 < words.length && (closesAt(index + 1) || CLAUSE_STARTERS.has(words[index + 2] ?? ""))) {
      // One more
      count += 1;
      // Skip the second word
      index += 1;
    }
    // One word: only right before a pause or at the end, after at least three words
    else if (TAG_QUESTIONS.includes(words[index]!) && !words[index]!.includes(" ") && index >= 3 && closesAt(index)) count += 1;
  }
  // The total
  return count;
}

// Word variety: the moving-average type-token ratio over 50-word windows (the plain ratio on a shorter take), or null under ten words
export function mattr(words: ReadonlyArray<string>, window = MATTR_WINDOW): number | null {
  // Too few words to say anything
  if (words.length < MIN_WORDS_FOR_VARIETY) return null;
  // Shorter than one window: the share of different words overall
  if (words.length < window) return new Set(words).size / words.length;
  // How often each word appears in the current window
  const counts = new Map<string, number>();
  // Fill the first window
  for (const word of words.slice(0, window)) counts.set(word, (counts.get(word) ?? 0) + 1);
  // The running total of each window's ratio
  let total = counts.size / window;
  // Slide the window one word at a time
  for (let end = window; end < words.length; end++) {
    // The word leaving
    const leaving = words[end - window]!;
    // One fewer of it
    const left = (counts.get(leaving) ?? 1) - 1;
    // Forget it when none are left
    if (left === 0) counts.delete(leaving);
    // Otherwise keep the lower count
    else counts.set(leaving, left);
    // The word arriving
    counts.set(words[end]!, (counts.get(words[end]!) ?? 0) + 1);
    // Add this window's ratio
    total += counts.size / window;
  }
  // The average over every window
  return total / (words.length - window + 1);
}

// Intensifiers, leaving out "so" when it opens a clause ("so I went") rather than pushing a word up ("so good")
export function countIntensifiers(words: ReadonlyArray<string>): number {
  // Each word that is an intensifier
  return words.filter((word, index) => INTENSIFIERS.has(word) && !(word === "so" && (index === 0 || CLAUSE_STARTERS.has(words[index + 1] ?? "") || words[index + 1] === undefined))).length;
}

// Repeats and restarts: a word said twice in a row ("I I", "the the"), or a pair of words said twice in a row ("I was I was"); hesitation sounds are pause words, not repeats
export function countRepairs(words: ReadonlyArray<string>): number {
  // The running count
  let count = 0;
  // Each word
  for (let index = 0; index + 1 < words.length; index++) {
    // The word
    const word = words[index]!;
    // A pair said twice: count once and skip past the second pair
    if (index + 3 < words.length && word === words[index + 2] && words[index + 1] === words[index + 3] && word !== words[index + 1]) {
      // One more
      count += 1;
      // Past the repeat
      index += 2;
    }
    // A single word said twice (not a hesitation sound)
    else if (word === words[index + 1] && !SOUND.test(word)) count += 1;
  }
  // The total
  return count;
}

// Whether a word is a hesitation sound
export function isSound(word: string): boolean {
  // Matches one of the stretched spellings
  return SOUND.test(word);
}

// The opening: whether the first word is a pause word or lead-in, and how many pause words are in the first ten words (null without words)
export function openingSignals(words: ReadonlyArray<string>): { startsWithFiller: number; first10Fillers: number } | null {
  // Nothing said
  if (words.length === 0) return null;
  // The first word
  const first = words[0]!;
  // Both signals
  return { startsWithFiller: SOUND.test(first) || LEAD_INS.has(first) ? 1 : 0, first10Fillers: countFillers(words.slice(0, 10).join(" ")).total };
}

// The closing: 1 when the take trails off on "and yeah", "that's it", a pause word and the like, otherwise 0 (null without words)
export function weakEnding(words: ReadonlyArray<string>): number | null {
  // Nothing said
  if (words.length === 0) return null;
  // The last five words as text
  const tail = words.slice(-5).join(" ");
  // A weak closing phrase at the very end, or a hesitation sound last
  return WEAK_CLOSINGS.some((phrase) => tail === phrase || tail.endsWith(` ${phrase}`)) || SOUND.test(words.at(-1)!) ? 1 : 0;
}

// Uses of a group of pronouns per 100 words ("you know" is a filler, so its "you" is left out)
export function pronounRate(words: ReadonlyArray<string>, group: "i" | "we" | "you"): number | null {
  // The words in each group
  const sets = { i: ["i", "me", "my", "mine", "myself", "i'm", "i've", "i'd", "i'll"], we: ["we", "us", "our", "ours", "ourselves", "we're", "we've", "we'd", "we'll"], you: ["you", "your", "yours", "yourself", "you're", "you've", "you'd", "you'll"] };
  // Count them, leaving out the "you" of "you know"
  const count = words.filter((word, index) => sets[group].includes(word) && !(word === "you" && words[index + 1] === "know")).length;
  // Per 100 words
  return per100(count, words.length);
}

// Word length: the average letters per word and the share of words with seven letters or more (null without words)
export function wordLength(words: ReadonlyArray<string>): { mean: number; longShare: number } | null {
  // Letters only
  const lengths = words.map((word) => word.replace(/'/g, "").length).filter((length) => length > 0);
  // Nothing to measure
  if (lengths.length === 0) return null;
  // Both numbers
  return { mean: lengths.reduce((sum, length) => sum + length, 0) / lengths.length, longShare: lengths.filter((length) => length >= LONG_WORD).length / lengths.length };
}

// Content words with their counts: stop words, hesitation sounds and words under three letters left out, the 300 most used kept
export function contentWordCounts(words: ReadonlyArray<string>): Record<string, number> {
  // Counts by word
  const counts = new Map<string, number>();
  // Each word worth counting
  for (const word of words) {
    // Leave out small and common words
    if (word.length < 3 || STOP_WORDS.has(word) || SOUND.test(word) || !/[a-z]/.test(word)) continue;
    // One more
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  // The most used first (ties in alphabetical order), up to the limit
  const kept = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, MOST_CONTENT_WORDS);
  // As a plain record
  return Object.fromEntries(kept);
}

// The language and vocabulary measures for a list of words (breaks: positions of words followed by a pause)
export function languageMeasures(words: ReadonlyArray<string>, breaks: ReadonlySet<number>): Record<string, number | null> {
  // The word count
  const count = words.length;
  // Word lengths
  const lengths = wordLength(words);
  // The opening
  const opening = openingSignals(words);
  // Every measure
  return {
    // Hedges per 100 words
    "lang.hedges_per_100w": per100(countPhrases(words, HEDGES), count),
    // Tag questions per 100 words
    "lang.tag_questions_per_100w": per100(countTagQuestions(words, breaks), count),
    // Pronouns per 100 words
    "lang.pronoun_i_per_100w": pronounRate(words, "i"),
    // (we)
    "lang.pronoun_we_per_100w": pronounRate(words, "we"),
    // (you)
    "lang.pronoun_you_per_100w": pronounRate(words, "you"),
    // Word variety
    "lang.mattr50": mattr(words),
    // Vague words per 100
    "lang.vague_per_100w": per100(countPhrases(words, VAGUE_WORDS), count),
    // Intensifiers per 100
    "lang.intensifiers_per_100w": per100(countIntensifiers(words), count),
    // Average word length
    "lang.mean_word_length": lengths?.mean ?? null,
    // Share of long words, as a percentage
    "lang.long_word_share": lengths ? lengths.longShare * 100 : null,
    // Opening signals
    "open.starts_with_filler": opening?.startsWithFiller ?? null,
    // (pause words in the first ten)
    "open.first10_fillers": opening?.first10Fillers ?? null,
    // The closing
    "close.weak_ending": weakEnding(words),
  };
}
