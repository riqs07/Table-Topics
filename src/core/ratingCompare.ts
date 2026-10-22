// Comparing a take's self-rating with what was measured (decision 116): one line on the results, and, once there are enough rated takes, how often the two agreed. A call is compared only with a measure that is confident (decisions 103 and 115): a long enough take, and a usual band from at least five earlier takes of the same family, so a call is never checked against noise. Pure

// Load the families, so a take is compared only with its own kind of practice (decision 90)
import { familyOf } from "@/core/analysis/families";
// Load the statistics helpers
import { median, robustSpread } from "@/core/analysis/stats";
// Load the question's answers and the lookup of a saved answer
import { ratingOption, type BandSide } from "@/core/selfRating";
// Load the record types
import type { RatingScale, SessionRecord } from "@/data/records";

// The shortest take whose pace is trusted, in seconds (a few sentences give a jumpy rate)
export const MIN_PACE_SECONDS = 20;
// The fewest earlier takes of the same family before a usual band is trusted (the same as Your progress's usual zone, decision 115)
export const MIN_EARLIER_TAKES = 5;
// The most earlier takes the band is drawn from: the latest ones, so it follows the speaker as they change
export const BAND_TAKES = 20;
// The narrowest half-band, as a share of the usual level (as in the usual zone, so a very steady speaker's band is not a single point)
const MIN_HALF_SHARE = 0.05;
// The fewest rated takes, each with a confident measure, before the calibration line shows
export const CALIBRATION_MIN = 8;
// The rated takes the calibration line counts: the latest ones
export const CALIBRATION_TAKES = 10;

// Each scale's measure: its name in the line, its unit, and its words for each side (decision 103's neutral words)
const MEASURE_WORDS: Readonly<Record<RatingScale, { name: string; unit: (value: number) => string; above: string; below: string }>> = {
  // Overall pace, in words a minute
  pace: { name: "pace", unit: (value) => `${Math.round(value)} a minute`, above: "faster than usual", below: "slower than usual" },
  // Pitch range, in steps
  liveliness: { name: "pitch range", unit: (value) => `${Number(value.toFixed(1))} ${Number(value.toFixed(1)) === 1 ? "step" : "steps"}`, above: "wider than usual", below: "narrower than usual" },
};


// A take's value on a scale, or null when it is not confident: a pace only from a long enough take, a pitch range only when one was measured
export function ratingValue(session: SessionRecord, scale: RatingScale): number | null {
  // Pace: the overall pace, from a take long enough for it to settle
  if (scale === "pace") return session.durationSec >= MIN_PACE_SECONDS && session.wordsPerMinute > 0 ? session.wordsPerMinute : null;
  // Liveliness: the pitch range saved with the take, when there was enough voice
  return typeof session.pitchRange === "number" ? session.pitchRange : null;
}

// The usual band for a scale from earlier values: the middle plus or minus the robust spread (never narrower than 5% of the middle), or null with too few
export function usualBand(values: ReadonlyArray<number>): { low: number; high: number } | null {
  // Too few to trust
  if (values.length < MIN_EARLIER_TAKES) return null;
  // The middle
  const usual = median(values)!;
  // The half-band
  const half = Math.max(robustSpread(values) ?? 0, Math.abs(usual) * MIN_HALF_SHARE);
  // The band
  return { low: usual - half, high: usual + half };
}

// Which side of a band a value sits on
export function bandSide(value: number, band: { low: number; high: number }): BandSide {
  // Above, below, or inside
  return value > band.high ? "above" : value < band.low ? "below" : "inside";
}


// What a comparison found: the line, whether the call matched the measure, the measure's side, and the value
export interface RatingComparison {
  // One plain line, such as "You said rushed. Your pace was 150 a minute, inside your usual."
  text: string;
  // Whether the call and the measure agree
  matched: boolean;
  // Where the measure sits
  side: BandSide;
  // The measured value
  value: number;
}

// Compare a rated take's call with what was measured, against the usual band of the same family's earlier takes; null when it was not rated, or no confident measure maps to the question
export function compareRating(session: SessionRecord, sessions: ReadonlyArray<SessionRecord>): RatingComparison | null {
  // The call
  const rating = session.selfRating;
  // Not rated
  if (!rating) return null;
  // The answer's option
  const option = ratingOption(rating);
  // An answer from another scale
  if (!option) return null;
  // The take's value, when confident
  const value = ratingValue(session, rating.scale);
  // Its family
  const family = familyOf(session.mode);
  // Nothing to compare
  if (value === null || family === null) return null;
  // The same family's earlier takes with a confident value, newest first, the latest few
  const earlier = sessions
    // Earlier takes of the same family, not this one
    .filter((other) => other.id !== session.id && other.createdAt < session.createdAt && familyOf(other.mode) === family)
    // Newest first
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    // Their values, where confident
    .flatMap((other) => {
      // The value
      const otherValue = ratingValue(other, rating.scale);
      // Kept when there is one
      return otherValue === null ? [] : [otherValue];
    })
    // The latest few
    .slice(0, BAND_TAKES);
  // The usual band, when there are enough
  const band = usualBand(earlier);
  // Not confident yet
  if (!band) return null;
  // Where the take sits
  const side = bandSide(value, band);
  // The measure's words
  const words = MEASURE_WORDS[rating.scale];
  // The side in words
  const where = side === "above" ? words.above : side === "below" ? words.below : "inside your usual";
  // The line
  return { text: `You said ${option.said}. Your ${words.name} was ${words.unit(value)}, ${where}.`, matched: option.side === side, side, value };
}

// The calibration line on Your progress: how often the speaker's call matched the measure over their latest rated takes with a confident measure
export interface Calibration {
  // The scale
  scale: RatingScale;
  // How many matched
  matched: number;
  // Out of how many
  total: number;
  // The line
  text: string;
}

// How often the speaker's sense matched the measure on one scale, over the latest rated takes that could be compared, or null with fewer than eight
export function calibration(sessions: ReadonlyArray<SessionRecord>, scale: RatingScale): Calibration | null {
  // Rated on this scale, newest first
  const rated = sessions.filter((session) => session.selfRating?.scale === scale).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // The comparisons, newest first, up to the count used
  const judged: RatingComparison[] = [];
  // Each rated take until there are enough
  for (const session of rated) {
    // Enough
    if (judged.length >= CALIBRATION_TAKES) break;
    // Its comparison, when confident
    const comparison = compareRating(session, sessions);
    // Kept
    if (comparison) judged.push(comparison);
  }
  // Too few to say anything
  if (judged.length < CALIBRATION_MIN) return null;
  // How many matched
  const matched = judged.filter((comparison) => comparison.matched).length;
  // What it is about
  const about = scale === "pace" ? "your pace" : "how lively you sounded";
  // The line
  return { scale, matched, total: judged.length, text: `Your sense of ${about} matched the measure in ${matched} of your last ${judged.length} takes.` };
}
