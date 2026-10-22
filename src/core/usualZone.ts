// Your usual zone (decision 115): for a few headline measures on Your progress, the speaker's usual band (their usual level plus or minus their spread, decision 90) and where their latest take sits, with neutral words on which side (decision 103: "faster", "fewer", "wider", never "better" or "worse"; no colour carries a verdict). Pure

// Load the profile's summary type
import type { MetricSummary } from "@/core/analysis/profile";

// The measures shown, in order, each with its words for above and below
export const ZONE_MEASURES: ReadonlyArray<{ id: string; above: string; below: string }> = [
  // Overall pace
  { id: "lang.wpm", above: "faster than usual", below: "slower than usual" },
  // Pause words
  { id: "lang.fillers_per_min", above: "more than usual", below: "fewer than usual" },
  // Pitch range
  { id: "pro.f0_range_st", above: "wider than usual", below: "narrower than usual" },
];

// Fewest takes before a usual band is drawn (the usual is the median of the first five; decision 90)
export const ZONE_MIN_TAKES = 5;
// The narrowest half-band, as a share of the usual level, so a very steady speaker's band is still visible
const MIN_HALF_SHARE = 0.05;

// One bar
export interface ZoneBar {
  // The measure's id
  id: string;
  // Its name
  name: string;
  // Its unit
  unit: string;
  // The band, low to high
  low: number;
  // (high)
  high: number;
  // The latest take's value
  latest: number;
  // Where the bar starts and ends, so the band and the dot both fit
  from: number;
  // (end)
  to: number;
  // The neutral words for where the latest sits
  words: string;
}

// The bars for a family's measures (only those with a usual level, a spread and a latest value)
export function usualZones(metrics: ReadonlyArray<MetricSummary>): ZoneBar[] {
  // Each chosen measure
  return ZONE_MEASURES.flatMap((zone) => {
    // Its summary
    const summary = metrics.find((item) => item.metric.id === zone.id);
    // Not enough to draw
    if (!summary || summary.count < ZONE_MIN_TAKES || summary.usual === null || summary.spread === null || summary.latest === null) return [];
    // The half-band
    const half = Math.max(summary.spread, Math.abs(summary.usual) * MIN_HALF_SHARE);
    // The band
    const [low, high] = [summary.usual - half, summary.usual + half];
    // The bar's ends: the band and the dot, with room either side
    const [min, max] = [Math.min(low, summary.latest), Math.max(high, summary.latest)];
    // The room
    const pad = (max - min) * 0.25 || 1;
    // The words
    const words = summary.latest > high ? zone.above : summary.latest < low ? zone.below : "inside your usual";
    // The bar
    return [{ id: zone.id, name: summary.metric.name, unit: summary.metric.unit, low, high, latest: summary.latest, from: Math.max(0, min - pad), to: max + pad, words }];
  });
}
