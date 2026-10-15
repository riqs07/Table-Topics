// Reading aloud: compare what the speech service heard with the text that was on screen

// One word of the text, with whether it was heard
export interface ReadWord {
  // The word as written, with its punctuation, for display
  text: string;
  // True if the speech service heard it
  read: boolean;
}

// The result of comparing a reading with its text
export interface ReadingCheck {
  // Every word of the text, in order
  words: ReadWord[];
  // Whole-number percent of the text's words that were heard (rounded down)
  percentRead: number;
  // Words of the text that were not heard
  missed: number;
  // Words heard that are not in the text (fillers, repeats, additions)
  extra: number;
  // Extra words that repeat the word just before them
  repeated: number;
}

// Reduce a word to letters, digits and apostrophes in lower case, so punctuation and capitals do not matter
function normalize(word: string): string {
  // Lower case, then drop everything else
  return word.toLowerCase().replace(/[^a-z0-9']/g, "");
}

// Split text into display words, treating dashes as breaks between words
function displayWords(text: string): string[] {
  // Put a space after each dash so "dedicate—we" becomes two words, then split on spaces
  return text.replace(/—/g, "— ").split(/\s+/).filter((word) => normalize(word) !== "");
}

// How many pause marks (" / ") a text has
export function countPauseMarks(text: string): number {
  // Count slashes standing alone between words
  return text.split(/\s\/\s/).length - 1;
}

// Compare a reading with its text, word by word (longest common sequence of words); pause marks are not words and are skipped
export function alignReading(text: string, spoken: string): ReadingCheck {
  // The text's words for display
  const shown = displayWords(text);
  // The same words, normalized
  const expected = shown.map(normalize);
  // The heard words, normalized
  const heard = spoken.split(/\s+/).map(normalize).filter((word) => word !== "");
  // Table of best match lengths: cell [i][j] covers expected from i and heard from j
  const best: number[][] = Array.from({ length: expected.length + 1 }, () => new Array<number>(heard.length + 1).fill(0));
  // Fill the table from the end backwards
  for (let i = expected.length - 1; i >= 0; i--) {
    // Each heard position
    for (let j = heard.length - 1; j >= 0; j--) {
      // Matching words extend the sequence; otherwise take the better of skipping either side
      best[i]![j] = expected[i] === heard[j] ? best[i + 1]![j + 1]! + 1 : Math.max(best[i + 1]![j]!, best[i]![j + 1]!);
    }
  }
  // Which text words were heard
  const read = new Array<boolean>(expected.length).fill(false);
  // Which heard words matched the text
  const matched = new Array<boolean>(heard.length).fill(false);
  // Walk the table from the start to recover the matches
  let i = 0;
  // Position in the heard words
  let j = 0;
  // Until either side runs out
  while (i < expected.length && j < heard.length) {
    // A match: mark both and move on
    if (expected[i] === heard[j]) {
      // Mark the text word as read
      read[i] = true;
      // Mark the heard word as matched
      matched[j] = true;
      // Move both
      i += 1;
      // (both)
      j += 1;
    }
    // Skipping the text word loses nothing: it was missed
    else if (best[i + 1]![j]! >= best[i]![j + 1]!) i += 1;
    // Otherwise the heard word is extra
    else j += 1;
  }
  // Count the text words heard
  const readCount = read.filter(Boolean).length;
  // Extra words heard
  const extraIndexes = heard.map((_, index) => index).filter((index) => !matched[index]);
  // Hand back the words and counts
  return {
    // Every text word with whether it was heard
    words: shown.map((word, index) => ({ text: word, read: read[index]! })),
    // Percent heard, rounded down so a perfect score means every word
    percentRead: expected.length === 0 ? 100 : Math.floor((readCount / expected.length) * 100),
    // Words not heard
    missed: expected.length - readCount,
    // Words not in the text
    extra: extraIndexes.length,
    // Extra words that repeat the one before
    repeated: extraIndexes.filter((index) => index > 0 && heard[index] === heard[index - 1]).length,
  };
}
