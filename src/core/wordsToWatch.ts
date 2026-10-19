// Words to watch: the words a user's clear-sounds drills found hard to catch, kept across days so practice follows their own trouble words (decision 80)

// Most words kept
const KEEP = 30;

// A word in its plain form, for counting (lower case, letters and apostrophes only)
function plain(word: string): string {
  // Lower case without punctuation
  return word.toLowerCase().replace(/[^\p{L}'’]+/gu, "");
}

// Update the counts: each missed word goes up one; each word caught again goes down one, and goes once it reaches nothing
export function updateWordsToWatch(current: Readonly<Record<string, number>>, missed: ReadonlyArray<string>, caught: ReadonlyArray<string>): Record<string, number> {
  // A copy to change
  const next: Record<string, number> = { ...current };
  // Missed words up
  for (const word of missed.map(plain).filter(Boolean)) next[word] = (next[word] ?? 0) + 1;
  // Caught words down, only those already on the list
  for (const word of caught.map(plain).filter((item) => item in next)) {
    // One less
    const count = (next[word] ?? 0) - 1;
    // Gone at nothing
    if (count <= 0) delete next[word];
    // Otherwise kept lower
    else next[word] = count;
  }
  // Keep the most-missed few
  return Object.fromEntries(Object.entries(next).sort((a, b) => b[1] - a[1]).slice(0, KEEP));
}

// The words to watch most, most-missed first
export function topWordsToWatch(current: Readonly<Record<string, number>>, count = 6): string[] {
  // By how often they were missed
  return Object.entries(current).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, count).map(([word]) => word);
}
