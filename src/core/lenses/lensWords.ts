// The words a take's lenses draw on (decision 115): what was heard, each with its time when known, whether it was a pause word, and how sure the transcription service was. The deeper analysis's words are used when it ran (exact times, punctuation, every "um"); otherwise the phone's transcript, placed with the same rough timing as pitch in your words (decision 111). Pure

// Load the filler marker and the hesitation-sound check
import { fillerPieces, isHesitationSound } from "@/core/fillers";
// Load the word placement
import { alignFromDevice, alignFromServer, cleanWord, type AlignPrecision } from "@/core/wordAlign";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the record types
import type { FullSession, ServerWord } from "@/data/records";

// One word as the lenses see it
export interface LensWord {
  // The word as shown, with any punctuation
  text: string;
  // The word cleaned to lower-case letters and apostrophes
  w: string;
  // When it started, in seconds (null when the take kept no word times)
  start: number | null;
  // When it ended, in seconds (null likewise)
  end: number | null;
  // Whether it is a pause word ("um", "like", "you know")
  filler: boolean;
  // How sure the transcription service was, 0 to 1 (null without deeper analysis)
  conf: number | null;
}

// A take's words for the lenses
export interface LensText {
  // The words, in order
  words: LensWord[];
  // Whether every word has a time
  timed: boolean;
  // Exact (the service's times) or rough (worked out on the phone)
  precision: AlignPrecision;
  // Whether the words carry punctuation
  punctuated: boolean;
  // Whether the service's confidence is known (deeper analysis ran)
  deep: boolean;
}

// The service's words, each pause word marked by the same counter the phone uses (over the whole text, so "you know" counts as one)
function fromServer(words: ReadonlyArray<ServerWord>): LensText {
  // Placed exactly
  const placed = alignFromServer(words).words;
  // The words with letters, as the counter would read them
  const flags = fillerPieces(placed.map((word) => word.text).join(" "));
  // Each word
  return { words: placed.map((word, index) => ({ text: word.text, w: word.w, start: word.start, end: word.end, filler: flags[index] === true || isHesitationSound(word.w), conf: words[word.ref]?.conf ?? null })), timed: true, precision: "exact", punctuated: true, deep: true };
}

// The phone's transcript: placed by its word times when it kept them, otherwise the words alone
function fromDevice(session: FullSession): LensText | null {
  // The transcript's pieces
  const pieces = session.transcript.split(/\s+/).filter((piece) => piece !== "");
  // Nothing said
  if (pieces.length === 0) return null;
  // Which are pause words
  const flags = fillerPieces(session.transcript);
  // With word times: placed roughly
  if (session.spokenTimes && session.spokenTimes.length > 0) {
    // The placed words (pieces without letters, or never timed, are left out)
    const placed = alignFromDevice(session.transcript, session.spokenTimes, session.loudness ?? [], LOUDNESS_TICK_MS).words;
    // Each with its filler flag, by its place in the transcript
    return { words: placed.map((word) => ({ text: word.text, w: word.w, start: word.start, end: word.end, filler: flags[word.ref] === true, conf: null })), timed: true, precision: "rough", punctuated: false, deep: false };
  }
  // Without times: the words alone
  return { words: pieces.flatMap((text, index) => (cleanWord(text) === "" ? [] : [{ text, w: cleanWord(text), start: null, end: null, filler: flags[index] === true, conf: null }])), timed: false, precision: "rough", punctuated: false, deep: false };
}

// A take's words for the lenses, or null when nothing was said (or its words were dropped)
export function lensWords(session: FullSession, serverWords: ReadonlyArray<ServerWord> | null): LensText | null {
  // The service's words when deeper analysis ran
  if (serverWords && serverWords.some((word) => word.text.trim() !== "")) return fromServer(serverWords);
  // Otherwise the phone's
  return fromDevice(session);
}

// The moments pause words were said, in seconds, for the fingerprint and the best moment
export function fillerTimes(text: LensText | null): number[] {
  // Each timed pause word's start, a phrase of several words once (its first word)
  return (text?.words ?? []).flatMap((word, index, all) => (word.filler && word.start !== null && !(all[index - 1]?.filler) ? [word.start] : []));
}
