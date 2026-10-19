// Your own notes on a take: the quick tags (the listen-back step and its helpers went with decision 67)

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
