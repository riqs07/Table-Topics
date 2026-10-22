// The speaking profile (decision 90): each measure per family of practice, the usual level against the recent one, changes that held for three takes, plain patterns across takes, and word habits. Pure: it reads sessions and analyses and returns numbers and sentences
//
// Rules, from documents/research/speech-analysis-2026-10.md section 7:
// - Families: practice that behaves alike is compared only with itself (reading aloud is never compared with Rapid Fire).
// - Usual: the median of the first five takes in the family. Recent: the median of the latest seven.
// - Spread: the robust spread, 1.4826 times the median absolute deviation, over every take in the family.
// - Trend (six takes or more): up or down when recent and usual differ by more than half a spread (and by more than 5% of the usual), otherwise steady.
// - Only values from the same source as the latest take are compared (phone with phone, server with server; decision 91).
// - Change flag (eight takes or more): the latest three takes all sit beyond the median plus or minus one spread of the takes before them, on the same side.
// - Patterns (fifteen takes or more in a family): differences between families, the first 30 seconds against the rest, and early against late in the week, reported only when the gap is larger than the family's usual spread (or holds in at least 70% of takes).

// Load the measure registry
import { METRICS, findMetric, type MetricDefinition } from "@/core/analysis/metrics";
// Load the statistics helpers
import { median, robustSpread, round } from "@/core/analysis/stats";
// Load the take counts the profile works with
import { PROFILE_RULES } from "@/core/analysis/profileRules";
// Load the record types
import type { AnalysisRecord, MetricSource, SessionRecord } from "@/data/records";

// The families and the lookup live in their own small file, so pages that only need them do not load the profile (decision 116)
export { FAMILIES, familyOf, type FamilyId } from "@/core/analysis/families";
// (and are used here)
import { FAMILIES, familyOf, type FamilyId } from "@/core/analysis/families";

// Takes for the usual level (the take counts live in profileRules.ts, which the Learn card also reads)
const BASELINE_TAKES = PROFILE_RULES.usualTakes;
// Takes for the recent level
const RECENT_TAKES = PROFILE_RULES.recentTakes;
// Fewest takes before a trend is given
const MIN_FOR_TREND = PROFILE_RULES.minForTrend;
// Fewest takes before a change flag is looked for
const MIN_FOR_FLAG = PROFILE_RULES.minForFlag;
// Takes in a row that make a change
const FLAG_RUN = PROFILE_RULES.flagRun;
// Fewest takes in a family before patterns are looked for
export const MIN_FOR_PATTERNS = PROFILE_RULES.minForPatterns;
// Fewest takes in the other group of a comparison
const MIN_GROUP = 5;
// Share of takes that must agree for an opening pattern
const AGREEMENT = 0.7;
// Days counted as recent for word habits
const RECENT_DAYS = 14;
// Milliseconds in a day
const DAY_MS = 86_400_000;


// One take with its measures, as the profile reads it
export interface ProfileTake {
  // The session
  session: SessionRecord;
  // Its analysis
  analysis: AnalysisRecord;
}

// One measure summed up in one family
export interface MetricSummary {
  // The measure's definition
  metric: MetricDefinition;
  // Where the values summed up came from (the latest take's source; decision 91)
  source: MetricSource;
  // How many takes measured it
  count: number;
  // The usual level (median of the first five), or null
  usual: number | null;
  // The recent level (median of the latest seven), or null
  recent: number | null;
  // The latest take's value
  latest: number | null;
  // The robust spread
  spread: number | null;
  // Which way recent moved from usual, or null with too few takes
  trend: "up" | "down" | "steady" | null;
  // Whether that move is better, worse, or only a change (for a measure with no better side)
  verdict: "better" | "worse" | "changed" | "steady" | null;
  // The best take so far, for a measure with a better side
  best: { sessionId: string; value: number; createdAt: string } | null;
  // A change that held for the latest three takes, or null
  flag: { side: "higher" | "lower"; verdict: "better" | "worse" | "changed"; values: number[]; usual: number } | null;
}

// One family's profile
export interface FamilyProfile {
  // Which family
  id: FamilyId;
  // Its name
  name: string;
  // How many analysed takes
  takes: number;
  // Each measure with at least one value, in registry order
  metrics: MetricSummary[];
}

// One pattern across takes, in plain words, with the numbers behind it
export interface Pattern {
  // The family it was found in
  family: FamilyId;
  // What kind of comparison
  kind: "family" | "opening" | "week";
  // The sentence
  statement: string;
  // The numbers behind it
  numbers: Record<string, number>;
}

// Word habits across takes (owner's request)
export interface VocabularyProfile {
  // Content words used far more than usual lately: how often lately, and the usual rate per 1,000 content words
  favourites: Array<{ word: string; recent: number; usualPer1000: number }>;
  // Content words first said in the last two weeks
  newWords: Array<{ word: string; count: number }>;
  // The coach's recent word swaps, newest first
  swaps: Array<{ said: string; stronger: string; why: string; sessionId: string; createdAt: string }>;
}

// The whole profile
export interface SpeakerProfile {
  // Each family with takes, in the families' order
  families: FamilyProfile[];
  // The patterns found
  patterns: Pattern[];
  // Word habits
  vocabulary: VocabularyProfile;
}

// Pair each analysed take with its session, oldest first, leaving out kinds with no family
export function profileTakes(sessions: ReadonlyArray<SessionRecord>, analyses: ReadonlyArray<AnalysisRecord>): ProfileTake[] {
  // The analyses by session id
  const byId = new Map(analyses.map((analysis) => [analysis.sessionId, analysis]));
  // Each session with an analysis and a family, oldest first
  return sessions.filter((session) => byId.has(session.id) && familyOf(session.mode) !== null).map((session) => ({ session, analysis: byId.get(session.id)! })).sort((a, b) => a.session.createdAt.localeCompare(b.session.createdAt));
}

// The verdict for a move in a direction on a measure
function verdictFor(metric: MetricDefinition, side: "up" | "down"): "better" | "worse" | "changed" {
  // No better side
  if (metric.better === "neither") return "changed";
  // Up is better for higher-is-better measures, down for lower-is-better ones
  return (side === "up") === (metric.better === "higher") ? "better" : "worse";
}

// Sum one measure up over a family's takes, oldest first
export function summarizeMetric(metric: MetricDefinition, takes: ReadonlyArray<ProfileTake>): MetricSummary | null {
  // Where the latest value came from: only values from the same kind of engine are compared, so a take measured by the server is never set against phone guesses (decision 91)
  const source = [...takes].reverse().map((take) => take.analysis.metrics[metric.id]).find((value) => value !== undefined && value.value !== null)?.source;
  // The takes that measured it from that source, with their values
  const measured = takes.map((take) => ({ take, value: take.analysis.metrics[metric.id]?.source === source ? (take.analysis.metrics[metric.id]?.value ?? null) : null })).filter((entry): entry is { take: ProfileTake; value: number } => entry.value !== null);
  // Nothing measured
  if (measured.length === 0) return null;
  // The values, oldest first
  const values = measured.map((entry) => entry.value);
  // Usual and recent
  const [usual, recent] = [median(values.slice(0, BASELINE_TAKES)), median(values.slice(-RECENT_TAKES))];
  // The spread
  const spread = robustSpread(values);
  // The trend, with enough takes
  let trend: MetricSummary["trend"] = null;
  // Judge it
  if (values.length >= MIN_FOR_TREND && usual !== null && recent !== null) {
    // How far recent moved
    const moved = recent - usual;
    // The smallest move that counts
    const enough = Math.max((spread ?? 0) * 0.5, Math.abs(usual) * 0.05, 1e-9);
    // Up, down or steady
    trend = Math.abs(moved) <= enough ? "steady" : moved > 0 ? "up" : "down";
  }
  // The best take, for a measure with a better side
  const best = metric.better === "neither" ? null : measured.reduce((top, entry) => ((metric.better === "higher" ? entry.value > top.value : entry.value < top.value) ? entry : top), measured[0]!);
  // The summary
  return {
    // The measure, where its values came from, and its counts
    metric, source: source ?? metric.source, count: values.length,
    // Levels, rounded to two decimals
    usual: usual === null ? null : round(usual, 2), recent: recent === null ? null : round(recent, 2), latest: round(values.at(-1)!, 2), spread: spread === null ? null : round(spread, 2),
    // The trend and its verdict
    trend, verdict: trend === null ? null : trend === "steady" ? "steady" : verdictFor(metric, trend),
    // The best take
    best: best ? { sessionId: best.take.session.id, value: round(best.value, 2), createdAt: best.take.session.createdAt } : null,
    // A change that held
    flag: changeFlag(metric, values),
  };
}

// A change that held: the latest three values all beyond the median plus or minus one robust spread of the values before them, on the same side
export function changeFlag(metric: MetricDefinition, values: ReadonlyArray<number>): MetricSummary["flag"] {
  // Too few takes
  if (values.length < MIN_FOR_FLAG) return null;
  // The values before the latest three
  const before = values.slice(0, -FLAG_RUN);
  // The latest three
  const latest = values.slice(-FLAG_RUN);
  // The usual band: median and spread (a flat history uses a tenth of its level, so tiny wobbles do not count)
  const middle = median(before)!;
  // (spread)
  const spread = Math.max(robustSpread(before) ?? 0, Math.abs(middle) * 0.1, 1e-9);
  // All above
  if (latest.every((value) => value > middle + spread)) return { side: "higher", verdict: verdictFor(metric, "up"), values: latest.map((value) => round(value, 2)), usual: round(middle, 2) };
  // All below
  if (latest.every((value) => value < middle - spread)) return { side: "lower", verdict: verdictFor(metric, "down"), values: latest.map((value) => round(value, 2)), usual: round(middle, 2) };
  // No change
  return null;
}

// A value with its unit, for sentences
export function formatValue(value: number, unit: string): string {
  // Percentages and other units read differently
  const shown = Math.abs(value) >= 10 ? Math.round(value).toString() : round(value, Math.abs(value) >= 1 ? 1 : 2).toString();
  // With the unit
  return unit === "%" ? `${shown}%` : unit.startsWith("/") ? `${shown}${unit}` : unit === "yes/no" || unit === "count" || unit === "ratio" || unit === "0–1" || unit === "0–3" ? shown : `${shown} ${unit}`;
}

// The patterns of one family, when it has enough takes
function familyPatterns(family: FamilyProfile, takes: ReadonlyArray<ProfileTake>, others: ReadonlyArray<{ profile: FamilyProfile; takes: ReadonlyArray<ProfileTake> }>): Pattern[] {
  // The patterns found
  const patterns: Pattern[] = [];
  // Too few takes
  if (takes.length < MIN_FOR_PATTERNS) return patterns;
  // The shown measures with a spread
  const shown = family.metrics.filter((summary) => summary.metric.shown && summary.metric.source === "device" && summary.spread !== null && summary.spread > 0);
  // Families compared: each shown measure against each other family with enough takes
  for (const summary of shown) {
    // Each other family
    for (const other of others) {
      // Its values of this measure
      const theirs = other.takes.map((take) => take.analysis.metrics[summary.metric.id]?.value ?? null).filter((value): value is number => value !== null);
      // Too few
      if (theirs.length < MIN_GROUP) continue;
      // Both medians
      const [mine, them] = [median(takes.map((take) => take.analysis.metrics[summary.metric.id]?.value ?? null).filter((value): value is number => value !== null))!, median(theirs)!];
      // A gap larger than the usual spread
      if (Math.abs(mine - them) > summary.spread!) patterns.push({ family: family.id, kind: "family", statement: `${summary.metric.name} is ${mine > them ? "higher" : "lower"} in ${family.name.toLowerCase()} (${formatValue(mine, summary.metric.unit)}) than in ${other.profile.name.toLowerCase()} (${formatValue(them, summary.metric.unit)}).`, numbers: { [family.id]: round(mine, 2), [other.profile.id]: round(them, 2), spread: summary.spread! } });
    }
  }
  // The first 30 seconds against the rest
  const parts = takes.map((take) => take.analysis.raw.firstPart).filter((part): part is NonNullable<typeof part> => part !== null && part.restWpm > 0);
  // Enough takes with both parts
  if (parts.length >= MIN_GROUP * 2) {
    // Faster at the start, and slower
    const [faster, slower] = [parts.filter((part) => part.firstWpm > part.restWpm * 1.05).length, parts.filter((part) => part.firstWpm < part.restWpm * 0.95).length];
    // The medians
    const [first, rest] = [median(parts.map((part) => part.firstWpm))!, median(parts.map((part) => part.restWpm))!];
    // Most takes agree
    if (Math.max(faster, slower) >= parts.length * AGREEMENT) patterns.push({ family: family.id, kind: "opening", statement: `In ${Math.max(faster, slower)} of ${parts.length} takes you spoke ${faster >= slower ? "faster" : "slower"} in the first 30 seconds (typically ${Math.round(first)} words a minute, against ${Math.round(rest)} for the rest).`, numbers: { takes: parts.length, agreeing: Math.max(faster, slower), firstWpm: round(first, 1), restWpm: round(rest, 1) } });
    // Pauses at the start against the rest
    const [morePauses, fewerPauses] = [parts.filter((part) => part.firstPausesPerMin > part.restPausesPerMin * 1.1).length, parts.filter((part) => part.firstPausesPerMin < part.restPausesPerMin * 0.9).length];
    // Most takes agree
    if (Math.max(morePauses, fewerPauses) >= parts.length * AGREEMENT) patterns.push({ family: family.id, kind: "opening", statement: `In ${Math.max(morePauses, fewerPauses)} of ${parts.length} takes you paused ${morePauses >= fewerPauses ? "more" : "less"} often in the first 30 seconds than afterwards.`, numbers: { takes: parts.length, agreeing: Math.max(morePauses, fewerPauses), firstPausesPerMin: round(median(parts.map((part) => part.firstPausesPerMin))!, 2), restPausesPerMin: round(median(parts.map((part) => part.restPausesPerMin))!, 2) } });
  }
  // Early in the week (Monday to Wednesday) against late (Thursday to Sunday)
  const early = (take: ProfileTake) => [1, 2, 3].includes(new Date(take.session.createdAt).getDay());
  // Each shown measure
  for (const summary of shown) {
    // Values early and late
    const value = (take: ProfileTake) => take.analysis.metrics[summary.metric.id]?.value ?? null;
    // (early)
    const earlyValues = takes.filter(early).map(value).filter((item): item is number => item !== null);
    // (late)
    const lateValues = takes.filter((take) => !early(take)).map(value).filter((item): item is number => item !== null);
    // Too few on either side
    if (earlyValues.length < MIN_GROUP || lateValues.length < MIN_GROUP) continue;
    // Both medians
    const [first, second] = [median(earlyValues)!, median(lateValues)!];
    // A gap larger than the usual spread
    if (Math.abs(first - second) > summary.spread!) patterns.push({ family: family.id, kind: "week", statement: `${summary.metric.name} is ${first > second ? "higher" : "lower"} early in the week (${formatValue(first, summary.metric.unit)}, Monday to Wednesday) than later (${formatValue(second, summary.metric.unit)}).`, numbers: { early: round(first, 2), late: round(second, 2), spread: summary.spread! } });
  }
  // The patterns
  return patterns;
}

// Word habits: favourite words lately, new words, and the coach's swaps
export function vocabularyProfile(takes: ReadonlyArray<ProfileTake>, now: Date): VocabularyProfile {
  // The start of the recent window
  const since = now.getTime() - RECENT_DAYS * DAY_MS;
  // Whether a take is recent
  const isRecent = (take: ProfileTake) => new Date(take.session.createdAt).getTime() >= since;
  // Content-word counts added up over some takes
  const total = (group: ReadonlyArray<ProfileTake>) => {
    // Counts by word
    const counts = new Map<string, number>();
    // Each take's words
    for (const take of group) for (const [word, count] of Object.entries(take.analysis.raw.contentWords)) counts.set(word, (counts.get(word) ?? 0) + count);
    // The counts
    return counts;
  };
  // Recent and earlier counts
  const [recent, earlier] = [total(takes.filter(isRecent)), total(takes.filter((take) => !isRecent(take)))];
  // Their sizes
  const [recentSize, earlierSize] = [[...recent.values()].reduce((sum, count) => sum + count, 0), [...earlier.values()].reduce((sum, count) => sum + count, 0)];
  // Favourites: said at least four times lately, at three times the usual rate or more (with no history, simply the most said)
  const favourites = [...recent.entries()]
    // Enough uses
    .filter(([, count]) => count >= 4)
    // With how much more than usual
    .map(([word, count]) => ({ word, recent: count, usualPer1000: earlierSize > 0 ? round(((earlier.get(word) ?? 0) * 1000) / earlierSize, 1) : 0, lift: earlierSize > 0 ? count / recentSize / Math.max((earlier.get(word) ?? 0) / earlierSize, 1 / earlierSize) : count }))
    // Far more than usual
    .filter((entry) => earlierSize === 0 || entry.lift >= 3)
    // The biggest first
    .sort((a, b) => b.lift - a.lift || b.recent - a.recent)
    // A few
    .slice(0, 8)
    // Without the working number
    .map(({ word, recent: count, usualPer1000 }) => ({ word, recent: count, usualPer1000 }));
  // New words: only meaningful with a history from before the window
  const newWords = earlierSize === 0 ? [] : [...recent.entries()].filter(([word, count]) => !earlier.has(word) && count >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12).map(([word, count]) => ({ word, count }));
  // The coach's swaps, newest take first, each pair of words once
  const swaps = [...takes].reverse().flatMap((take) => (take.analysis.rubric?.wordSwaps ?? []).map((swap) => ({ ...swap, sessionId: take.session.id, createdAt: take.session.createdAt }))).filter((swap, index, all) => all.findIndex((other) => other.said.toLowerCase() === swap.said.toLowerCase() && other.stronger.toLowerCase() === swap.stronger.toLowerCase()) === index).slice(0, 6);
  // The habits
  return { favourites, newWords, swaps };
}

// Build the whole profile from every session and analysis
export function buildProfile(sessions: ReadonlyArray<SessionRecord>, analyses: ReadonlyArray<AnalysisRecord>, now: Date): SpeakerProfile {
  // The analysed takes, oldest first
  const takes = profileTakes(sessions, analyses);
  // Each family with takes
  const families = FAMILIES.map((family) => {
    // Its takes
    const own = takes.filter((take) => familyOf(take.session.mode) === family.id);
    // Each measure summed up
    const metrics = METRICS.map((metric) => summarizeMetric(metric, own)).filter((summary): summary is MetricSummary => summary !== null);
    // The family's profile with its takes
    return { profile: { id: family.id, name: family.name, takes: own.length, metrics }, takes: own };
  }).filter((family) => family.takes.length > 0);
  // The patterns of each family with enough takes
  const patterns = families.flatMap((family) => familyPatterns(family.profile, family.takes, families.filter((other) => other.profile.id !== family.profile.id)));
  // The profile
  return { families: families.map((family) => family.profile), patterns, vocabulary: vocabularyProfile(takes, now) };
}

// The median of a measure over some takes, from one source only (decision 91), or null when none measured it
function usualOf(id: string, takes: ReadonlyArray<ProfileTake>, source: MetricSource): number | null {
  // The values measured from that source
  const values = takes.map((take) => (take.analysis.metrics[id]?.source === source ? (take.analysis.metrics[id]?.value ?? null) : null)).filter((value): value is number => value !== null);
  // Their middle, rounded
  return values.length > 0 ? round(median(values)!, 2) : null;
}

// One take's every measure with its family's usual level, for the per-take view
export function takeMeasures(session: SessionRecord, analysis: AnalysisRecord, sessions: ReadonlyArray<SessionRecord>, analyses: ReadonlyArray<AnalysisRecord>): Array<{ metric: MetricDefinition; value: number | null; usual: number | null; engine: string; source: MetricSource }> {
  // The family's other takes
  const family = familyOf(session.mode);
  // Their analyses
  const others = family === null ? [] : profileTakes(sessions, analyses).filter((take) => familyOf(take.session.mode) === family && take.session.id !== session.id);
  // Each registered measure this take has, in registry order, then any unknown ones
  return Object.keys(analysis.metrics).map((id) => findMetric(id)).filter((metric): metric is MetricDefinition => metric !== undefined).sort((a, b) => METRICS.indexOf(a) - METRICS.indexOf(b)).map((metric) => ({
    // The measure
    metric,
    // This take's value
    value: analysis.metrics[metric.id]!.value,
    // The family's usual: the median of its other takes measured the same way
    usual: usualOf(metric.id, others, analysis.metrics[metric.id]!.source),
    // Its engine
    engine: analysis.metrics[metric.id]!.engine,
    // Where it came from
    source: analysis.metrics[metric.id]!.source,
  }));
}
