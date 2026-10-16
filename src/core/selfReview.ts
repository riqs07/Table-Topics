// Listening back before the feedback: how much has been heard, the transcript as words that follow the playback, and the quick tags

// Load the filler marker
import { markFillers } from "@/core/fillers";

// Seconds the live transcript runs behind the voice (word times are when the speech service sent each word)
export const TRANSCRIPT_LAG = 0.8;
// Recordings longer than this may unlock with their opening and close instead of the whole thing
export const LONG_RECORDING = 180;
// Seconds at each end that count as the opening and the close
const ENDS = 45;
// Share of a recording that counts as having listened to it all (room for a skipped second here and there)
const ENOUGH = 0.9;

// One quick tag: an id saved with the notes, and the words on the button
export interface ReviewTag {
  // Saved id
  id: string;
  // Button words
  label: string;
}

// Tags for what worked
export const WORKED_TAGS: ReadonlyArray<ReviewTag> = [
  { id: "strong-opening", label: "Strong opening" },
  { id: "strong-close", label: "Strong close" },
  { id: "good-pace", label: "Good pace" },
  { id: "good-pauses", label: "Good pauses" },
  { id: "clear-point", label: "Clear point" },
];

// Tags for what to change
export const CHANGE_TAGS: ReadonlyArray<ReviewTag> = [
  { id: "too-fast", label: "Too fast" },
  { id: "too-slow", label: "Too slow" },
  { id: "fillers", label: "Fillers" },
  { id: "no-pauses", label: "Not enough pauses" },
  { id: "trailed-off", label: "Trailed off" },
  { id: "lost-place", label: "Lost my place" },
  { id: "rambled", label: "Rambled" },
];

// A fresh record of which seconds have been heard, one per started second of the recording
export function nothingHeard(durationSec: number): boolean[] {
  // All unheard
  return new Array<boolean>(Math.max(1, Math.ceil(durationSec))).fill(false);
}

// Mark the second being played as heard
export function markHeard(heard: ReadonlyArray<boolean>, seconds: number): boolean[] {
  // The second, kept inside the recording
  const second = Math.min(heard.length - 1, Math.max(0, Math.floor(seconds)));
  // Copy with that second marked
  return heard.map((value, index) => value || index === second);
}

// Whether enough has been heard to open the feedback: nearly all of it, or for a long recording its opening and close
export function listenedEnough(heard: ReadonlyArray<boolean>, durationSec: number): boolean {
  // Seconds heard
  const count = heard.filter(Boolean).length;
  // Nearly everything
  if (count >= Math.floor(heard.length * ENOUGH)) return true;
  // A long recording: the first and last 45 seconds are enough
  return durationSec > LONG_RECORDING && heard.slice(0, ENDS).every(Boolean) && heard.slice(-ENDS).every(Boolean);
}

// One word of the transcript as shown during listening
export interface ListenWord {
  // The word as written, with its punctuation
  text: string;
  // Whether it is part of a filler
  filler: boolean;
}

// The transcript split at spaces (the same words the word times count), each marked if it is a filler
export function listenWords(transcript: string): ListenWord[] {
  // Character ranges of the fillers
  const ranges: Array<[number, number]> = [];
  // Where each piece starts
  let at = 0;
  // Each piece
  for (const piece of markFillers(transcript)) {
    // Keep a filler's range
    if (piece.filler) ranges.push([at, at + piece.text.length]);
    // Move on
    at += piece.text.length;
  }
  // Each word, marked if it overlaps a filler
  return [...transcript.matchAll(/\S+/g)].map((match) => ({ text: match[0], filler: ranges.some(([from, to]) => match.index < to && match.index + match[0].length > from) }));
}

// How many words had been said by a point in the playback (allowing for the transcript running behind)
export function wordsSaidBy(times: ReadonlyArray<number>, seconds: number): number {
  // Words whose time, less the lag, has passed
  return times.filter((time) => time - TRANSCRIPT_LAG <= seconds).length;
}

// Where to start playing to hear a word (a little before it)
export function playFrom(time: number): number {
  // Allow for the lag, start half a second early, and round to a tenth
  return Math.max(0, Math.round((time - TRANSCRIPT_LAG - 0.5) * 10) / 10);
}
