// Filler-word counting. The list was set at checkpoint C7; decision 29 counts crutch words only where they act as fillers

// Load the word matcher used by the reading check
import { matchWords } from "@/core/readAlong";

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

// Filler phrases matched exactly, longest first (these always count)
export const PHRASE_FILLERS: ReadonlyArray<string> = [
  // Long hedging phrases
  "you know what i mean", "at the end of the day", "if that makes sense", "or something like that", "and stuff like that",
  // Three-word phrases
  "to be honest", "and all that", "you know what",
  // Two-word phrases
  "you know", "i mean", "you see", "i guess", "i suppose", "kind of", "sort of", "or something", "and stuff", "or whatever",
].sort((a, b) => b.split(" ").length - a.split(" ").length);

// Single words that are almost always fillers in speech (these always count)
const ALWAYS_WORDS: ReadonlySet<string> = new Set(["basically", "literally", "honestly", "anyway", "anyways", "whatever", "okay", "ok", "yeah", "kinda", "sorta"]);

// Crutch words that are also ordinary words: they count only where they act as fillers (decision 29)
const CONTEXT_WORDS: ReadonlySet<string> = new Set(["like", "so", "well", "just", "really", "actually", "totally", "seriously", "right"]);

// Words before "like" that make it a verb or a comparison ("I like", "feels like", "just like")
const LIKE_ORDINARY_BEFORE: ReadonlySet<string> = new Set(["i", "you", "we", "they", "he", "she", "people", "who", "would", "i'd", "you'd", "we'd", "they'd", "do", "does", "did", "don't", "doesn't", "didn't", "not", "look", "looks", "looked", "feel", "feels", "felt", "seem", "seems", "seemed", "sound", "sounds", "sounded", "something", "anything", "nothing", "just", "much", "more", "most", "exactly", "really", "also", "still", "would've"]);

// Words after "like" that make it a verb ("like it", "like to")
const LIKE_ORDINARY_AFTER: ReadonlySet<string> = new Set(["to", "it", "this", "them", "him", "her", "me", "us"]);

// One word of a transcript, with where it sits in the original text and whether it opens a sentence
interface Token {
  // The word, lower case
  word: string;
  // Where it starts in the original text
  from: number;
  // Where it ends in the original text
  to: number;
  // True for the first word, or a word after a full stop, question mark or exclamation mark
  opensSentence: boolean;
}

// One filler found: which words it covers and its standard name
interface FillerSpan {
  // First word
  start: number;
  // Number of words
  length: number;
  // Standard name, such as "um" or "you know"
  name: string;
}

// Split a transcript into words (letters and apostrophes, as the word counter does), keeping their places in the text
function tokenize(transcript: string): Token[] {
  // Every word with its position
  const matches = [...transcript.matchAll(/[A-Za-z']*[A-Za-z][A-Za-z']*/g)];
  // Each word, noting whether a sentence ended just before it
  return matches.map((match, index) => {
    // Where the previous word ended (or the start)
    const previousEnd = index === 0 ? 0 : (matches[index - 1]!.index + matches[index - 1]![0].length);
    // The word and its place
    return { word: match[0].toLowerCase(), from: match.index, to: match.index + match[0].length, opensSentence: index === 0 || /[.?!]/.test(transcript.slice(previousEnd, match.index)) };
  });
}

// Find which sound filler a single word is, if any
function matchSound(word: string): string | undefined {
  // Return the standard name of the first sound pattern the word fits
  return SOUND_FILLERS.find((filler) => filler.pattern.test(word))?.name;
}

// Find which phrase filler starts at a given word position, if any
function matchPhrase(words: ReadonlyArray<string>, start: number): string | undefined {
  // Return the first phrase whose words all match from this position
  return PHRASE_FILLERS.find((phrase) => phrase.split(" ").every((part, offset) => words[start + offset] === part));
}

// Whether "like" here is a verb or a comparison rather than a filler
function ordinaryLike(words: ReadonlyArray<string>, index: number): boolean {
  // Judged by the word before it and the word after it
  return LIKE_ORDINARY_BEFORE.has(words[index - 1] ?? "") || LIKE_ORDINARY_AFTER.has(words[index + 1] ?? "");
}

// Find every filler in a list of words; strict counts every crutch word (used for words added to a known text)
function findFillers(tokens: ReadonlyArray<Token>, strict: boolean): FillerSpan[] {
  // The words alone
  const words = tokens.map((token) => token.word);
  // Fillers found, by first word
  const spans = new Map<number, FillerSpan>();
  // Crutch words still to judge
  const candidates: number[] = [];
  // Walk through the words
  let index = 0;
  // Until every word is checked
  while (index < words.length) {
    // The word
    const word = words[index]!;
    // A phrase, a hesitation sound, or an always-filler word
    const sure = matchPhrase(words, index) ?? matchSound(word) ?? (ALWAYS_WORDS.has(word) ? word : undefined);
    // Keep a sure filler
    if (sure !== undefined) spans.set(index, { start: index, length: sure.split(" ").length, name: sure });
    // A crutch word: count at once when strict, otherwise judge it below
    else if (CONTEXT_WORDS.has(word)) {
      // Strict: it counts
      if (strict) spans.set(index, { start: index, length: 1, name: word });
      // Otherwise wait
      else candidates.push(index);
    }
    // Move past a phrase, or one word
    index += sure !== undefined ? sure.split(" ").length : 1;
  }
  // Whether a word is part of a filler found so far
  const isFiller = (position: number) => [...spans.values()].some((span) => position >= span.start && position < span.start + span.length);
  // Judge the crutch words, again after each change, since one filler can make its neighbour one ("just really okay")
  let changed = true;
  // Until nothing changes
  while (changed) {
    // Nothing yet this round
    changed = false;
    // Each crutch word not yet counted
    for (const position of candidates) {
      // Already counted
      if (spans.has(position)) continue;
      // The word
      const word = words[position]!;
      // It opens a sentence, sits next to a filler, or is said twice in a row
      const filler = tokens[position]!.opensSentence || isFiller(position - 1) || isFiller(position + 1) || words[position - 1] === word || words[position + 1] === word || (word === "like" && !ordinaryLike(words, position));
      // Count it
      if (filler) {
        // Keep it
        spans.set(position, { start: position, length: 1, name: word });
        // Look again
        changed = true;
      }
    }
  }
  // Hand back the fillers in order
  return [...spans.values()].sort((a, b) => a.start - b.start);
}

// Tally a list of fillers
function tally(spans: ReadonlyArray<FillerSpan>): FillerCount {
  // Count each name
  const byFiller: Record<string, number> = {};
  // Each filler
  for (const span of spans) byFiller[span.name] = (byFiller[span.name] ?? 0) + 1;
  // The total and the tally
  return { total: spans.length, byFiller };
}

// Count how many filler words and phrases appear in a transcript
export function countFillers(transcript: string): FillerCount {
  // Find them and tally them
  return tally(findFillers(tokenize(transcript), false));
}

// Count the fillers in a reading of a known text: only words added to the text count, and every added crutch word counts
export function countScriptFillers(script: string, transcript: string): number {
  // The heard words
  const tokens = tokenize(transcript);
  // Which heard words match the text
  const { matched } = matchWords(tokenize(script).map((token) => token.word), tokens.map((token) => token.word));
  // Fillers whose words are not all in the text
  return findFillers(tokens, true).filter((span) => !matched.slice(span.start, span.start + span.length).every(Boolean)).length;
}

// One piece of a transcript, marked if it is a filler
export interface TranscriptPiece {
  // The original text of this piece
  text: string;
  // True if this piece is a filler word or phrase
  filler: boolean;
}

// Split a transcript into pieces, marking the fillers, without changing any text
export function markFillers(transcript: string): TranscriptPiece[] {
  // The words and their places
  const tokens = tokenize(transcript);
  // Collect the pieces
  const pieces: TranscriptPiece[] = [];
  // Where the last piece ended
  let last = 0;
  // Each filler
  for (const span of findFillers(tokens, false)) {
    // Where it starts and ends in the text
    const [from, to] = [tokens[span.start]!.from, tokens[span.start + span.length - 1]!.to];
    // Keep the ordinary text before it
    if (from > last) pieces.push({ text: transcript.slice(last, from), filler: false });
    // Keep the filler, marked
    pieces.push({ text: transcript.slice(from, to), filler: true });
    // Move past it
    last = to;
  }
  // Keep any ordinary text after the last filler
  if (last < transcript.length) pieces.push({ text: transcript.slice(last), filler: false });
  // Hand back the pieces
  return pieces;
}
