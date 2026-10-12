// Per-session measurements computed from the transcript and the recording length

// Load the filler counter
import { countFillers } from "@/core/fillers";
// Load the shared helper that splits a transcript into clean words
import { toWords } from "@/core/words";

// Count the words in a transcript, including fillers
export function countWords(transcript: string): number {
  // The number of clean words is the word count
  return toWords(transcript).length;
}

// Turn a count into a per-minute rate, or zero if the duration is not positive
function perMinute(count: number, durationSec: number): number {
  // A session with no length has no meaningful rate
  if (durationSec <= 0) return 0;
  // Scale the count from the session length up to one minute
  return (count * 60) / durationSec;
}

// How many words were spoken per minute
export function wordsPerMinute(transcript: string, durationSec: number): number {
  // Divide the word count by the minutes spoken
  return perMinute(countWords(transcript), durationSec);
}

// How many fillers were spoken per minute
export function fillersPerMinute(transcript: string, durationSec: number): number {
  // Divide the filler count by the minutes spoken
  return perMinute(countFillers(transcript).total, durationSec);
}
