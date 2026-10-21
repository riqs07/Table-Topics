// Small, robust statistics for the analysis and the profile (decision 90): medians and the median absolute deviation, which one odd take cannot swing

// The scale that makes the median absolute deviation comparable to a standard deviation for normal data
export const MAD_SCALE = 1.4826;

// The values sorted from low to high, as a new list
function sorted(values: ReadonlyArray<number>): number[] {
  // Copy, then sort numerically
  return [...values].sort((a, b) => a - b);
}

// The middle value of a list, or null when it is empty
export function median(values: ReadonlyArray<number>): number | null {
  // Nothing to take the middle of
  if (values.length === 0) return null;
  // In order
  const ordered = sorted(values);
  // The middle position
  const middle = Math.floor(ordered.length / 2);
  // The middle one, or the average of the two in the middle
  return ordered.length % 2 === 1 ? ordered[middle]! : (ordered[middle - 1]! + ordered[middle]!) / 2;
}

// The value a share of the way through a list (0.9 is the 90th percentile), by linear interpolation, or null when empty
export function quantile(values: ReadonlyArray<number>, share: number): number | null {
  // Nothing to read
  if (values.length === 0) return null;
  // In order
  const ordered = sorted(values);
  // The exact place, between two items
  const place = Math.min(1, Math.max(0, share)) * (ordered.length - 1);
  // The item below and the item above
  const [below, above] = [Math.floor(place), Math.ceil(place)];
  // Between them, in proportion
  return ordered[below]! + (ordered[above]! - ordered[below]!) * (place - below);
}

// The average, or null when empty
export function mean(values: ReadonlyArray<number>): number | null {
  // Nothing to average
  if (values.length === 0) return null;
  // The total over the count
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// The standard deviation (population), or null when empty
export function standardDeviation(values: ReadonlyArray<number>): number | null {
  // The average
  const average = mean(values);
  // Nothing to measure
  if (average === null) return null;
  // The square root of the average squared distance from the average
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
}

// The coefficient of variation: the standard deviation as a share of the average, or null when the average is zero or there is nothing
export function coefficientOfVariation(values: ReadonlyArray<number>): number | null {
  // The average
  const average = mean(values);
  // The spread
  const spread = standardDeviation(values);
  // Not meaningful around zero
  if (average === null || spread === null || average === 0) return null;
  // Spread over average
  return spread / average;
}

// The robust spread: 1.4826 times the median absolute deviation from the median, or null when empty
export function robustSpread(values: ReadonlyArray<number>): number | null {
  // The middle
  const middle = median(values);
  // Nothing to measure
  if (middle === null) return null;
  // How far each value sits from the middle
  const distances = values.map((value) => Math.abs(value - middle));
  // The middle of those distances, scaled
  return MAD_SCALE * median(distances)!;
}

// Round to a number of decimals
export function round(value: number, decimals: number): number {
  // Shift, round, shift back
  const factor = 10 ** decimals;
  // The rounded value
  return Math.round(value * factor) / factor;
}
