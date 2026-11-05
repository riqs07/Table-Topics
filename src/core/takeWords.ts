// What a take said, word by word, for the result's "What you said" card (the UI rewrite's result screen): each word marked as a pause word or not, and a real pause after a word where the voice stopped long enough. Pure, so the screen only draws it

// Load the pause-word marker, piece by piece
import { fillerPieces } from "@/core/fillers";
// Load the phone's word times, placed against the loudness
import { alignFromDevice } from "@/core/wordAlign";
// Load how often loudness is read
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the measures a take's verdict rests on
import { MANY_FILLERS } from "@/core/notesCheck";
import type { LocalChange } from "@/core/localChange";

// The shortest silence between two words that counts as a real pause, in seconds (the same as the pause count's)
export const REAL_PAUSE_SECONDS = 0.6;

// One space-separated piece of what was said
export interface TakeWord {
  // The piece as said, punctuation and all
  text: string;
  // Whether it is a pause word (um, uh, like...)
  filler: boolean;
  // Whether a real pause came after it
  pauseAfter: boolean;
}

// What a take needs for its words
interface WordsSource {
  // What was said
  transcript: string;
  // When each piece was first heard, in seconds, if saved
  spokenTimes?: ReadonlyArray<number>;
  // The loudness readings, if saved
  loudness?: ReadonlyArray<number>;
}

// The take's words, with pause words marked and, where word times were saved, the real pauses between words
export function takeWords(take: WordsSource): TakeWord[] {
  // The pieces as the times were counted
  const pieces = take.transcript.split(/\s+/).filter((piece) => piece !== "");
  // Which pieces are pause words
  const fillers = fillerPieces(take.transcript);
  // The pieces after which the voice stopped long enough, found from the placed words
  const pausedAfter = new Set<number>();
  // Only with word times
  if (take.spokenTimes && take.spokenTimes.length > 0) {
    // The words placed against the loudness
    const placed = alignFromDevice(take.transcript, take.spokenTimes, take.loudness ?? [], LOUDNESS_TICK_MS).words;
    // Each word and the next
    placed.forEach((word, index) => {
      // The next one
      const next = placed[index + 1];
      // A gap long enough is a real pause after this word
      if (next && next.start - word.end >= REAL_PAUSE_SECONDS) pausedAfter.add(word.ref);
    });
  }
  // Each piece, marked
  return pieces.map((text, index) => ({ text, filler: fillers[index] === true, pauseAfter: pausedAfter.has(index) }));
}

// Whether a take went well or was rough, from the same numbers the one change is picked from: rough when the timing missed its window or pause words were many (when shown); never a verdict on the person
export function takeVerdict(take: { fillersPerMinute: number }, change: Pick<LocalChange, "aboutTiming">, options: { pauseWords: boolean }): "good" | "rough" {
  // The timing missed, or many pause words
  return change.aboutTiming === true || (options.pauseWords && take.fillersPerMinute >= MANY_FILLERS) ? "rough" : "good";
}
