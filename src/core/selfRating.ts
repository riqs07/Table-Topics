// Rate yourself (decision 116): the answers a take could be rated with ("How did that feel?", pace or liveliness). The question is no longer asked after a take (decision 129); these are kept so takes rated before then still show their line on the results and count on Your progress. Pure

// Load the record types
import type { RatingAnswer, RatingScale, SelfRating } from "@/data/records";

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

// The option for a saved rating
export function ratingOption(rating: SelfRating): RatingOption | undefined {
  // Found on its scale
  return RATING_OPTIONS[rating.scale].find((option) => option.answer === rating.answer);
}
