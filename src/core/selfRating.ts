// Rate yourself before the results (decision 116): the one quick question asked after a take ("How did that feel?", three taps or skip) and which kinds of practice are asked. Kept apart from the comparison (ratingCompare.ts) so the recording page loads only this small part. Pure

// Load the record types
import type { RatingAnswer, RatingScale, SelfRating, SessionMode } from "@/data/records";

// Where a value sits against the usual band: above it, inside it, or below it
export type BandSide = "above" | "inside" | "below";

// One answer as shown: its word on the button, its word in the comparison line, and the side of the band it claims
export interface RatingOption {
  // The saved answer
  answer: RatingAnswer;
  // The button's word
  label: string;
  // How it reads in "You said …"
  said: string;
  // The side of the usual band it claims
  side: BandSide;
}

// The question asked before the results
export const RATING_QUESTION = "How did that feel?";

// The three answers on each scale, in the order shown
export const RATING_OPTIONS: Readonly<Record<RatingScale, ReadonlyArray<RatingOption>>> = {
  // Pace: rushed claims faster than usual, about right inside it, slow slower
  pace: [
    // Rushed
    { answer: "rushed", label: "Rushed", said: "rushed", side: "above" },
    // About right
    { answer: "right", label: "About right", said: "about right", side: "inside" },
    // Slow
    { answer: "slow", label: "Slow", said: "slow", side: "below" },
  ],
  // Liveliness (stories): flat claims a narrower pitch range than usual, OK inside it, lively wider
  liveliness: [
    // Flat
    { answer: "flat", label: "Flat", said: "flat", side: "below" },
    // OK
    { answer: "ok", label: "OK", said: "OK", side: "inside" },
    // Lively
    { answer: "lively", label: "Lively", said: "lively", side: "above" },
  ],
};

// The scale a kind of practice is rated on, or null when it is not asked: stories by how lively they sounded; Rapid Fire, prepared speeches, free talk, short speeches and reading aloud by pace (word lists, which have no pace to speak of, and every other kind are not asked; a check-in's parts are these kinds)
export function ratingScaleFor(mode: SessionMode, options: { wordList?: boolean } = {}): RatingScale | null {
  // A story: lively or flat
  if (mode === "story") return "liveliness";
  // Reading aloud, except a list of tricky words
  if (mode === "read") return options.wordList ? null : "pace";
  // The speaking kinds
  if (mode === "talk" || mode === "response" || mode === "free" || mode === "outline") return "pace";
  // Nothing else is asked
  return null;
}

// The option for a saved rating
export function ratingOption(rating: SelfRating): RatingOption | undefined {
  // Found on its scale
  return RATING_OPTIONS[rating.scale].find((option) => option.answer === rating.answer);
}
