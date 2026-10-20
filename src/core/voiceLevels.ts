// Evening out a recording made without the browser's automatic levelling (decision 81): one factor for the whole take, so loud and soft keep their difference, while the pause and fading rules see speech at the level they were built for

// The typical speaking reading (the 80th percentile) a recording is scaled to
export const REFERENCE_LEVEL = 0.2;
// The most a recording is scaled up (beyond this it is too quiet to trust)
const MAX_SCALE = 30;
// The most a recording is scaled down
const MIN_SCALE = 0.5;
// The typical level aimed for when playing a recording back
const PLAYBACK_LEVEL = 0.1;
// The most playback is boosted
const MAX_PLAYBACK_GAIN = 6;

// Keep a number between two limits
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

// The factor that brings a recording's typical speaking reading to the reference (1 when there is no speech to judge by)
export function levelScale(levels: ReadonlyArray<number>): number {
  // The readings in order
  const sorted = [...levels].sort((a, b) => a - b);
  // The reading at the 80th percentile
  const typical = sorted[Math.floor(0.8 * Math.max(0, sorted.length - 1))] ?? 0;
  // Nothing to judge by
  if (typical < 0.0005) return 1;
  // The factor, within limits, to two decimals
  return Math.round(clamp(REFERENCE_LEVEL / typical, MIN_SCALE, MAX_SCALE) * 100) / 100;
}

// How much to boost a recording when playing it back, from the factor it was scaled by (1 for a recording the browser already levelled)
export function playbackGain(scale: number | undefined): number {
  // Levelled by the browser, or no factor saved
  if (scale === undefined) return 1;
  // Up to a comfortable level, never quieter than recorded
  return Math.round(clamp((scale * PLAYBACK_LEVEL) / REFERENCE_LEVEL, 1, MAX_PLAYBACK_GAIN) * 100) / 100;
}
