// How big a change must be before it counts (decision 103), kept apart so a page can judge a change without loading the check-in comparison: the fixed amount used until there is enough history for a spread

// The smallest change that counts for one measure without enough history: a share of the earlier value, or a set amount, whichever is bigger
export interface Noise {
  // The share of the earlier value
  share: number;
  // The set amount
  amount: number;
}

// The pitch range's: 0.15 of the earlier range, or one step (decision 103; also used by "last try and this try", decision 111)
export const PITCH_RANGE_NOISE: Noise = { share: 0.15, amount: 1 };

// The fixed amount for a measure: a share of the earlier value, or the set amount, whichever is bigger
export function fixedThreshold(noise: Noise, before: number): number {
  // The bigger of the two
  return Math.max(Math.abs(before) * noise.share, noise.amount);
}
