// The clarity lens (decision 115): from the deeper analysis's word confidence (AssemblyAI, decision 91), the share of words that came through clearly, the words the service was unsure of, and which Clear sounds drill fits them: word endings when most of them end in a consonant that is easy to swallow, long words when most are long, otherwise the tongue twisters for crisp consonants. Low confidence is the service's, not a judgement of the speaker; the page says "harder to catch". Pure

// Load the words' type
import type { LensWord } from "@/core/lenses/lensWords";

// Below this confidence a word counts as harder to catch
export const CLEAR_CONFIDENCE = 0.6;
// Fewest words before the share is said
const MIN_WORDS = 5;
// The most unclear words named in the note
const NAMED = 2;

// A Clear sounds drill to practise with
export interface ClarityDrill {
  // Its id
  id: "c01" | "c02" | "c03";
  // Its name on the button
  name: string;
  // Why, in a few words
  why: string;
}

// The lens's findings
export interface ClarityLens {
  // The share of words that came through clearly, as a whole percent
  percent: number;
  // The places of the words that were harder to catch
  unclear: number[];
  // The drill that fits them, or null when none were unclear
  drill: ClarityDrill | null;
}

// Consonant endings that are easy to swallow: t, d, k, p, b, g, and "ed", "ts", "ds", "st", "ct"
const SWALLOWED_ENDING = /([tdkpbg]|ed|ts|ds|st|ct|ks)$/;

// How many vowel groups a word has
function syllables(word: string): number {
  // Groups of vowels, at least one
  return Math.max(1, (word.match(/[aeiouy]+/g) ?? []).length);
}

// The drill that fits the unclear words
export function drillFor(words: ReadonlyArray<string>): ClarityDrill | null {
  // None
  if (words.length === 0) return null;
  // How many end in a swallowed consonant
  const endings = words.filter((word) => SWALLOWED_ENDING.test(word)).length;
  // How many are long
  const long = words.filter((word) => syllables(word) >= 3).length;
  // Half or more end in a swallowed consonant
  if (endings * 2 >= words.length && endings >= long) return { id: "c01", name: "Clear sounds: word endings", why: "Words ending in a consonant like “d” or “t” are the easiest to swallow." };
  // Mostly long words
  if (long * 2 > words.length) return { id: "c02", name: "Clear sounds: long words", why: "Most of them are long words, which get squashed when rushed." };
  // Otherwise crisp consonants
  return { id: "c03", name: "Clear sounds: tongue twisters", why: "Crisp consonants make words easier to catch." };
}

// The lens for a take's words, or null without the service's confidence (deeper analysis did not run)
export function clarityLens(words: ReadonlyArray<LensWord>): ClarityLens | null {
  // The real words with a confidence (pause words left out)
  const scored = words.map((word, index) => ({ word, index })).filter(({ word }) => !word.filler && word.conf !== null && word.w !== "");
  // Too few to say anything
  if (scored.length < MIN_WORDS) return null;
  // The ones harder to catch
  const unclear = scored.filter(({ word }) => (word.conf ?? 1) < CLEAR_CONFIDENCE);
  // The share that came through
  const percent = Math.round(((scored.length - unclear.length) / scored.length) * 100);
  // The findings
  return { percent, unclear: unclear.map(({ index }) => index), drill: drillFor(unclear.map(({ word }) => word.w)) };
}

// The plain line under the words: how many came through, and how many were harder
export function clarityHeadline(lens: ClarityLens): string {
  // None unclear
  if (lens.unclear.length === 0) return `${lens.percent}% of your words came through clearly.`;
  // Some
  return `${lens.percent}% of your words came through clearly. ${lens.unclear.length === 1 ? "This one was" : lens.unclear.length === 2 ? "These two were" : `These ${lens.unclear.length} were`} harder to catch.`;
}

// The note above the drill: the first unclear words named, and why the drill fits
export function clarityNote(lens: ClarityLens, words: ReadonlyArray<LensWord>): string {
  // The words named
  const named = lens.unclear.slice(0, NAMED).map((index) => `“${words[index]!.w}”`);
  // Nothing to say
  if (named.length === 0 || !lens.drill) return "";
  // The note
  return `${named.join(" and ")} ${named.length === 1 ? "was" : "were"} harder to catch. ${lens.drill.why}`;
}
