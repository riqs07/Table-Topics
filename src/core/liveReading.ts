// Reading along live: split a script into words that can be lit up, follow the reader through it, and note when each word was heard

// Load the word normaliser shared with the reading check
import { normalize } from "@/core/readAlong";

// How a piece of the script is shown: plain, *stressed*, or a [stage direction]
export type TokenStyle = "plain" | "stress" | "note";

// One piece of the script as shown: a pause mark, or some text (a word, or the space between words)
export type ReadingToken = { kind: "pause" } | { kind: "text"; text: string; style: TokenStyle; word: number | null };

// How far ahead to look for the next word read (a few skipped words are normal)
const WINDOW = 6;

// Split a script into pieces for display, numbering each word that is meant to be read aloud
export function readingTokens(body: string): ReadingToken[] {
  // The pieces, in order
  const tokens: ReadingToken[] = [];
  // The next word number
  let next = 0;
  // Each stretch between pause marks
  body.split(" / ").forEach((part, partIndex) => {
    // A pause mark before every stretch but the first
    if (partIndex > 0) tokens.push({ kind: "pause" });
    // Each plain, stressed, or bracketed piece of the stretch
    for (const piece of part.split(/(\*[^*]+\*|\[[^\]]+\])/)) {
      // Skip the empty pieces the split leaves
      if (piece === "") continue;
      // A *stressed* word or phrase
      const stress = piece.startsWith("*") && piece.endsWith("*") && piece.length > 2;
      // A [stage direction]
      const note = piece.startsWith("[") && piece.endsWith("]");
      // Its style
      const style: TokenStyle = stress ? "stress" : note ? "note" : "plain";
      // The words without their markers
      const inner = stress || note ? piece.slice(1, -1) : piece;
      // A direction stays whole: it is shown, not read
      if (note) {
        // Keep it as one piece
        tokens.push({ kind: "text", text: inner, style, word: null });
        // Next piece
        continue;
      }
      // Words and the spaces between them, kept apart
      for (const chunk of inner.split(/(\s+)/)) {
        // Skip empty chunks
        if (chunk === "") continue;
        // A dash ends a word, as the reading check treats it
        for (const bit of chunk.split(/(?<=—)/)) {
          // Only real words are numbered
          const counts = normalize(bit) !== "";
          // Keep the piece, numbering it if it counts
          tokens.push({ kind: "text", text: bit, style, word: counts ? next++ : null });
        }
      }
    }
  });
  // Hand back the pieces
  return tokens;
}

// The numbered words of a script, normalised, in order: the words to listen for
export function scriptWords(tokens: ReadonlyArray<ReadingToken>): string[] {
  // Every numbered word, normalised
  return tokens.flatMap((token) => (token.kind === "text" && token.word !== null ? [normalize(token.text)] : []));
}

// Follow a reader through the script: which words have been read, and the number of the next word to read
export function followReading(expected: ReadonlyArray<string>, heardText: string): { read: boolean[]; next: number } {
  // The heard words, normalised
  const heard = heardText.split(/\s+/).map(normalize).filter((word) => word !== "");
  // Nothing read yet
  const read = expected.map(() => false);
  // The place in the script
  let next = 0;
  // Take each heard word in order
  for (let j = 0; j < heard.length && next < expected.length; j++) {
    // The word
    const word = heard[j];
    // Look a few words ahead for it
    let found = -1;
    // Each word in the window
    for (let k = next; k < Math.min(expected.length, next + WINDOW); k++) {
      // The first match wins
      if (expected[k] === word) {
        // Keep it
        found = k;
        // Stop looking
        break;
      }
    }
    // Not nearby: look further ahead, but only for two heard words in a row, so a lone common word cannot make the place jump
    if (found < 0 && j + 1 < heard.length) {
      // Each later pair of script words
      for (let k = next + WINDOW; k < expected.length - 1; k++) {
        // Both words match
        if (expected[k] === word && expected[k + 1] === heard[j + 1]) {
          // Keep it
          found = k;
          // Stop looking
          break;
        }
      }
    }
    // A filler or an added word: the place stays
    if (found < 0) continue;
    // Mark the word read
    read[found] = true;
    // Move the place past it
    next = found + 1;
  }
  // Hand back what was read and where the reader is
  return { read, next };
}

// Note the first time each script word was read (null until then); later guesses never move a time
export function stampFirstRead(times: ReadonlyArray<number | null>, read: ReadonlyArray<boolean>, seconds: number): (number | null)[] {
  // Keep an earlier time, or stamp a newly read word
  return read.map((isRead, index) => times[index] ?? (isRead ? seconds : null));
}

// Note the time each spoken word position first appeared; the list only grows
export function stampSpoken(times: ReadonlyArray<number>, count: number, seconds: number): number[] {
  // New positions take the current time
  return count <= times.length ? [...times] : [...times, ...new Array<number>(count - times.length).fill(seconds)];
}

// A steady reading pace, in words a second (about 140 words a minute)
const PACE_WORDS_PER_SECOND = 2.3;
// How far the pace may run ahead of the last word recognition matched
const PACE_AHEAD_LIMIT = 30;

// The word to keep in view while reading: the matched place, moved on at a reading pace for the time the reader has been speaking since recognition last matched a word, so the text still scrolls when recognition lags or misses words (it never runs more than a few lines ahead, and stops when the reader stops)
export function scrollGuide(place: number, voicedSeconds: number, total: number): number {
  // Nothing to keep in view
  if (total === 0) return 0;
  // Words the pace adds, capped
  const ahead = Math.min(PACE_AHEAD_LIMIT, Math.floor(Math.max(0, voicedSeconds) * PACE_WORDS_PER_SECOND));
  // The matched place moved on, within the text
  return Math.min(total - 1, place + ahead);
}
