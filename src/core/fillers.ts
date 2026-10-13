// Filler-word counting. The list was set at checkpoint C7: every common filler counts, including crutch words

// Load the shared helper that splits a transcript into clean words
import { toWords } from "@/core/words";

// The result of counting fillers in a transcript
export interface FillerCount {
  // Total number of fillers found
  total: number;
  // How many times each filler was found, keyed by its standard spelling
  byFiller: Record<string, number>;
}

// Single-word hesitation sounds, with a pattern that also matches stretched spellings
const SOUND_FILLERS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  // "um", "umm", "ummm"
  { name: "um", pattern: /^u+m+$/ },
  // "uh", "uhh", "uhhh"
  { name: "uh", pattern: /^u+h+$/ },
  // "er", "err", "erm"
  { name: "er", pattern: /^e+r+m*$/ },
  // "ah", "ahh"
  { name: "ah", pattern: /^a+h+$/ },
  // "hmm", "hmmm"
  { name: "hmm", pattern: /^h+m+$/ },
  // "mm", "mmm"
  { name: "mm", pattern: /^m{2,}$/ },
  // "mhm", "mmhm"
  { name: "mhm", pattern: /^m+h+m+$/ },
  // "eh", "ehh"
  { name: "eh", pattern: /^e+h+$/ },
];

// Filler words and phrases matched exactly, grouped by length (the longest match wins, so phrases beat single words)
const PHRASES_BY_GROUP: ReadonlyArray<ReadonlyArray<string>> = [
  // Long hedging phrases
  ["you know what i mean", "at the end of the day", "if that makes sense", "or something like that", "and stuff like that"],
  // Three-word phrases
  ["to be honest", "and all that", "you know what"],
  // Two-word phrases
  ["you know", "i mean", "you see", "i guess", "i suppose", "kind of", "sort of", "or something", "and stuff", "or whatever"],
  // Single crutch words (these also count when used in their ordinary sense, a known trade-off chosen at C7)
  ["like", "so", "well", "just", "really", "basically", "actually", "literally", "totally", "honestly", "seriously", "anyway", "anyways", "whatever", "right", "okay", "ok", "yeah", "kinda", "sorta"],
];

// Every phrase filler, longest first
export const PHRASE_FILLERS: ReadonlyArray<string> = PHRASES_BY_GROUP.flat().sort((a, b) => b.split(" ").length - a.split(" ").length);

// Find which sound filler a single word is, if any
function matchSound(word: string): string | undefined {
  // Return the standard name of the first sound pattern the word fits
  return SOUND_FILLERS.find((filler) => filler.pattern.test(word))?.name;
}

// Find which phrase filler starts at a given word position, if any
function matchPhrase(words: string[], start: number): string | undefined {
  // Return the first phrase whose words all match from this position
  return PHRASE_FILLERS.find((phrase) => {
    // Split the phrase into its words
    const parts = phrase.split(" ");
    // Check that every word of the phrase lines up with the transcript
    return parts.every((part, offset) => words[start + offset] === part);
  });
}

// Count how many filler words and phrases appear in a transcript
export function countFillers(transcript: string): FillerCount {
  // Break the transcript into clean words
  const words = toWords(transcript);
  // Start with an empty tally
  const byFiller: Record<string, number> = {};
  // Start the running total at zero
  let total = 0;
  // Walk through the words from the start
  let index = 0;
  // Keep going until every word has been checked
  while (index < words.length) {
    // Take the current word (always present inside the loop)
    const word = words[index] ?? "";
    // See whether a filler phrase or sound starts here
    const phrase = matchPhrase(words, index);
    // Use the phrase if found, otherwise check for a hesitation sound
    const filler = phrase ?? matchSound(word);
    // Record the filler if one was found
    if (filler !== undefined) {
      // Add one to this filler's tally
      byFiller[filler] = (byFiller[filler] ?? 0) + 1;
      // Add one to the total
      total += 1;
    }
    // Skip past every word of a matched phrase, or move on by one word
    index += phrase ? phrase.split(" ").length : 1;
  }
  // Hand back the total and the per-filler tally
  return { total, byFiller };
}

// One piece of a transcript, marked if it is a filler
export interface TranscriptPiece {
  // The original text of this piece
  text: string;
  // True if this piece is a filler word or phrase
  filler: boolean;
}

// Pattern matching any filler as a whole word, phrases first (same list as the counter above)
const FILLER_PATTERN = new RegExp(
  // Phrase and word fillers, then stretched hesitation sounds, each as whole words
  `\\b(?:${[...PHRASE_FILLERS.map((phrase) => phrase.replaceAll(" ", "\\s+")), ...SOUND_FILLERS.map((filler) => filler.pattern.source.replace(/^\^|\$$/g, ""))].join("|")})\\b`,
  // Every match, ignoring capitals
  "gi",
);

// Split a transcript into pieces, marking the fillers, without changing any text
export function markFillers(transcript: string): TranscriptPiece[] {
  // Collect the pieces
  const pieces: TranscriptPiece[] = [];
  // Where the last match ended
  let last = 0;
  // Walk through every filler match
  for (const match of transcript.matchAll(FILLER_PATTERN)) {
    // Keep the ordinary text before this filler
    if (match.index > last) pieces.push({ text: transcript.slice(last, match.index), filler: false });
    // Keep the filler itself, marked
    pieces.push({ text: match[0], filler: true });
    // Move past it
    last = match.index + match[0].length;
  }
  // Keep any ordinary text after the last filler
  if (last < transcript.length) pieces.push({ text: transcript.slice(last), filler: false });
  // Hand back the pieces
  return pieces;
}
