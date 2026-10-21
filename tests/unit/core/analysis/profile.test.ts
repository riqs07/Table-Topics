// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the profile being checked
import { FAMILIES, buildProfile, changeFlag, familyOf, formatValue, summarizeMetric, takeMeasures, vocabularyProfile, type ProfileTake } from "@/core/analysis/profile";
// Load the registry being checked
import { METRICS, METRIC_GROUPS, findMetric } from "@/core/analysis/metrics";
// Load the record types
import { SESSION_MODES, type AnalysisRecord, type MetricValue, type SessionMode, type SessionRecord } from "@/data/records";
// Load the sample records
import { makeSession } from "../../../support/fixtures";

// A day in milliseconds
const DAY = 86_400_000;
// The moment the checks run at
const NOW = new Date("2026-10-21T12:00:00.000Z");

// One measured value from the phone
const device = (value: number | null, unit = ""): MetricValue => ({ value, unit, source: "device", engine: "device-v1" });

// A take: a session a number of days ago, and an analysis with the given measures and content words
function take(id: string, mode: SessionMode, daysAgo: number, metrics: Record<string, number | null>, extra: Partial<AnalysisRecord["raw"]> = {}): { session: SessionRecord; analysis: AnalysisRecord } {
  // The session
  const session = makeSession({ id, mode, createdAt: new Date(NOW.getTime() - daysAgo * DAY).toISOString() });
  // Its analysis
  const analysis: AnalysisRecord = { sessionId: id, schemaVersion: 1, computedAt: NOW.toISOString(), engines: { device: { name: "device", version: "1", at: NOW.toISOString() } }, metrics: Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, device(value, findMetric(key)?.unit)])), raw: { mode, durationSec: 60, fillersPerMinute: 0, timedWords: [], pauses: [], pauseSource: "none", speech: null, loudness: null, pitch: null, fading: null, firstPart: null, contentWords: {}, ...extra } };
  // Both
  return { session, analysis };
}

// A history of takes in one family, oldest first, one a day, with the given values of one measure
function history(mode: SessionMode, id: string, values: Array<number | null>, prefix: string = mode): Array<{ session: SessionRecord; analysis: AnalysisRecord }> {
  // One take per value, the last one today
  return values.map((value, index) => take(`${prefix}-${index}`, mode, values.length - 1 - index, { [id]: value }));
}

// Split takes into the two lists the profile reads
function split(takes: Array<{ session: SessionRecord; analysis: AnalysisRecord }>): [SessionRecord[], AnalysisRecord[]] {
  // Sessions and analyses
  return [takes.map((item) => item.session), takes.map((item) => item.analysis)];
}

// Group the checks about the registry
describe("measurement registry", () => {
  // Ids are unique and every measure has a known group and a definition
  it("has unique ids, known groups and full definitions", () => {
    // The groups
    const groups = new Set(METRIC_GROUPS.map((group) => group.id));
    // Confirm unique ids, and that every measure is complete
    expect([new Set(METRICS.map((metric) => metric.id)).size === METRICS.length, METRICS.every((metric) => groups.has(metric.group) && metric.name !== "" && metric.definition.endsWith(".") && metric.unit !== "")]).toEqual([true, true]);
  });

  // Stage-B measures are registered but come from the services still to be added
  it("registers the stage-B measures from transcription, the voice worker and the rubric", () => {
    // The stage-B ids
    const later = METRICS.filter((metric) => metric.stage === "B").map((metric) => metric.id);
    // Confirm a few named in the research, plus articulation clarity and the less-common-words share
    expect(["flu.articulation_rate", "pro.hnr_db", "pro.arousal", "pro.articulation_clarity", "lang.rare_word_share", "conv.reply_latency_median_s"].every((id) => later.includes(id))).toBe(true);
  });

  // Every kind of session is in one family or deliberately left out
  it("puts every kind of session in at most one family", () => {
    // Kinds in more than one family
    const doubled = SESSION_MODES.filter((mode) => FAMILIES.filter((family) => family.modes.includes(mode)).length > 1);
    // Confirm none, and that voice drills and moment notes are left out
    expect([doubled, familyOf("voice"), familyOf("moment"), familyOf("talk"), familyOf("read")]).toEqual([[], null, null, "spot", "reading"]);
  });
});

// Group the checks about one measure's summary
describe("summarizeMetric", () => {
  // Words per run (higher is better) rising over twelve takes
  it("gives usual, recent, trend and best take", () => {
    // Twelve takes rising from 4 to 9.5
    const takes: ProfileTake[] = history("talk", "flu.mlr_words", [4, 4.5, 5, 4, 4.5, 6, 7, 8, 8.5, 9, 9.5, 9]);
    // The summary
    const summary = summarizeMetric(findMetric("flu.mlr_words")!, takes)!;
    // Confirm the usual (first five), recent (last seven), the trend and the best take
    expect([summary.usual, summary.recent, summary.trend, summary.verdict, summary.best?.value, summary.best?.sessionId, summary.count]).toEqual([4.5, 8.5, "up", "better", 9.5, "talk-10", 12]);
  });

  // A lower-is-better measure going up is worse
  it("calls a rise worse on a lower-is-better measure", () => {
    // Pause words rising
    const summary = summarizeMetric(findMetric("lang.fillers_per_min")!, history("talk", "lang.fillers_per_min", [1, 1, 1, 1, 1, 3, 3, 3, 3, 3]))!;
    // Confirm the verdict
    expect([summary.trend, summary.verdict]).toEqual(["up", "worse"]);
  });

  // Fewer than six takes give no trend; empty values are skipped
  it("gives no trend with too few takes and skips empty values", () => {
    // Four values and two empties
    const summary = summarizeMetric(findMetric("flu.mlr_words")!, history("talk", "flu.mlr_words", [4, null, 5, 6, null, 7]))!;
    // Confirm the count and no trend
    expect([summary.count, summary.trend, summary.flag]).toEqual([4, null, null]);
  });

  // A measure never measured has no summary
  it("leaves out a measure with no values", () => {
    // Nothing measured
    expect(summarizeMetric(findMetric("pro.hnr_db")!, history("talk", "flu.mlr_words", [1, 2]))).toBeNull();
  });
});

// Group the checks about the change flag
describe("changeFlag", () => {
  // Three takes in a row above the usual band
  it("flags three takes in a row beyond the usual band", () => {
    // A steady history, then three high takes
    expect(changeFlag(findMetric("pro.f0_range_st")!, [5, 6, 5, 6, 5, 6, 5, 10, 11, 10])).toEqual({ side: "higher", verdict: "better", values: [10, 11, 10], usual: 5 });
  });

  // Two high takes and a usual one are not a change
  it("does not flag a run broken by a usual take", () => {
    // The last three: high, usual, high
    expect(changeFlag(findMetric("pro.f0_range_st")!, [5, 6, 5, 6, 5, 6, 5, 10, 5.5, 10])).toBeNull();
  });

  // A measure without a better side is flagged as a change only
  it("calls a change on a neither measure a change", () => {
    // Speaking rate dropping three times
    expect(changeFlag(findMetric("lang.wpm")!, [150, 152, 148, 150, 151, 149, 150, 120, 118, 121])?.verdict).toBe("changed");
  });

  // Fewer than eight takes are never flagged
  it("needs eight takes", () => {
    // Seven takes
    expect(changeFlag(findMetric("pro.f0_range_st")!, [5, 5, 5, 5, 10, 10, 10])).toBeNull();
  });
});

// Group the checks about the whole profile
describe("buildProfile", () => {
  // Families are kept apart, and voice drills are left out
  it("groups takes by family and leaves voice drills out", () => {
    // Three Rapid Fire takes, two readings, one voice drill
    const [sessions, analyses] = split([...history("talk", "lang.wpm", [140, 150, 160]), ...history("read", "lang.wpm", [120, 125]), ...history("voice", "lang.wpm", [99])]);
    // The profile
    const profile = buildProfile(sessions, analyses, NOW);
    // Confirm the families and their counts
    expect(profile.families.map((family) => [family.id, family.takes])).toEqual([["spot", 3], ["reading", 2]]);
  });

  // No patterns before fifteen takes in a family
  it("finds no patterns with fewer than fifteen takes", () => {
    // Fourteen takes in one family, five in another, far apart
    const [sessions, analyses] = split([...history("talk", "flu.mlr_words", Array.from({ length: 14 }, (_, index) => 4 + (index % 3) * 0.5)), ...history("read", "flu.mlr_words", [10, 10, 11, 10, 11])]);
    // Confirm none
    expect(buildProfile(sessions, analyses, NOW).patterns).toEqual([]);
  });

  // With fifteen takes, a clear difference between families is reported with its numbers
  it("reports a difference between families with the numbers behind it", () => {
    // Fifteen spot takes around 4.5 words per run, five readings around 10
    const [sessions, analyses] = split([...history("talk", "flu.mlr_words", Array.from({ length: 15 }, (_, index) => 4 + (index % 3) * 0.5)), ...history("read", "flu.mlr_words", [10, 10, 11, 10, 11])]);
    // The family patterns
    const patterns = buildProfile(sessions, analyses, NOW).patterns.filter((pattern) => pattern.kind === "family");
    // Confirm the sentence and its numbers
    expect(patterns).toEqual([{ family: "spot", kind: "family", statement: "Words per run is lower in speaking on the spot (4.5 words) than in reading aloud (10 words).", numbers: { spot: 4.5, reading: 10, spread: 0.74 } }]);
  });

  // Speaking faster in the first 30 seconds in most takes
  it("reports a consistent opening pattern", () => {
    // Fifteen takes, twelve faster at the start
    const takes = Array.from({ length: 15 }, (_, index) => take(`t${index}`, "talk", 15 - index, { "lang.wpm": 150 }, { firstPart: { firstWpm: index < 12 ? 170 : 140, restWpm: 145, firstPausesPerMin: 10, restPausesPerMin: 10 } }));
    // The opening patterns
    const patterns = buildProfile(...split(takes), NOW).patterns.filter((pattern) => pattern.kind === "opening");
    // Confirm the sentence
    expect(patterns.map((pattern) => pattern.statement)).toEqual(["In 12 of 15 takes you spoke faster in the first 30 seconds (typically 170 words a minute, against 145 for the rest)."]);
  });

  // Early in the week against late
  it("reports a difference between early and late in the week", () => {
    // Twenty-one takes, one a day; Monday to Wednesday ones have a wider pitch range
    const takes = Array.from({ length: 21 }, (_, index) => {
      // When it was
      const when = new Date(NOW.getTime() - (20 - index) * DAY);
      // A wide range early in the week
      return take(`w${index}`, "talk", 20 - index, { "pro.f0_range_st": [1, 2, 3].includes(when.getDay()) ? 9 + (index % 2) : 4 + (index % 2) });
    });
    // The week patterns
    const patterns = buildProfile(...split(takes), NOW).patterns.filter((pattern) => pattern.kind === "week");
    // Confirm one, saying early is higher
    expect(patterns.map((pattern) => pattern.statement.startsWith("Pitch range is higher early in the week"))).toEqual([true]);
  });
});

// Group the checks about word habits
describe("vocabularyProfile", () => {
  // A word said far more lately is a favourite; a word first said lately is new
  it("finds favourite words and new words", () => {
    // Ten older takes that say "project" now and then, and three recent ones full of "basically" (a stop word, so ignored) and "journey"
    const older = Array.from({ length: 10 }, (_, index) => take(`o${index}`, "talk", 40 - index, {}, { contentWords: { project: 2, team: 3, customer: 1 } }));
    // Recent takes
    const recent = Array.from({ length: 3 }, (_, index) => take(`r${index}`, "talk", 3 - index, {}, { contentWords: { journey: 3, team: 1, roadmap: 1 } }));
    // The habits
    const vocabulary = vocabularyProfile([...older, ...recent], NOW);
    // Confirm "journey" is a favourite and new, and "roadmap" is new
    expect([vocabulary.favourites.map((item) => item.word), vocabulary.newWords]).toEqual([["journey"], [{ word: "journey", count: 9 }, { word: "roadmap", count: 3 }]]);
  });

  // With no history before the window, nothing counts as new
  it("calls nothing new without an earlier history", () => {
    // Only recent takes
    expect(vocabularyProfile([take("a", "talk", 1, {}, { contentWords: { garden: 5 } })], NOW)).toEqual({ favourites: [{ word: "garden", recent: 5, usualPer1000: 0 }], newWords: [], swaps: [] });
  });

  // The coach's swaps, newest first
  it("lists the coach's recent word swaps, newest first, each once", () => {
    // Three takes with swaps, the oldest repeating the newest
    const [zero, first, second] = [take("z", "talk", 3, {}), take("a", "talk", 2, {}), take("b", "talk", 1, {})];
    // A rubric on each
    const rubric = (said: string) => ({ pointFirst: { score: 1, quote: "" }, answersQuestion: null, structure: { score: 1, quote: "" }, ending: { score: 1, quote: "" }, concreteExample: { score: 1, quote: "" }, wordChoice: { score: 1, quote: "" }, devices: [], unnecessaryHedges: 0, wordSwaps: [{ said, stronger: "better", why: "clearer" }], model: "m", at: NOW.toISOString() });
    // Attach them
    first.analysis.rubric = rubric("good");
    // (second)
    second.analysis.rubric = rubric("nice");
    // (the repeat)
    zero.analysis.rubric = rubric("Nice");
    // Confirm the order, the repeat shown once
    expect(vocabularyProfile([zero, first, second], NOW).swaps.map((swap) => swap.said)).toEqual(["nice", "good"]);
  });
});

// Group the checks about the per-take view
describe("takeMeasures", () => {
  // Each measure with the family's usual level from the other takes
  it("lists a take's measures with its family's usual level", () => {
    // Three Rapid Fire takes and a reading
    const takes = [...history("talk", "lang.wpm", [140, 150, 160]), ...history("read", "lang.wpm", [100], "r")];
    // The rows for the latest Rapid Fire take
    const rows = takeMeasures(takes[2]!.session, takes[2]!.analysis, ...split(takes));
    // Confirm its value and the usual of the other two (the reading is not counted)
    expect(rows.map((row) => [row.metric.id, row.value, row.usual])).toEqual([["lang.wpm", 160, 145]]);
  });

  // Values are written with their units
  it("formats values with their units", () => {
    // A rate, a percentage and a score
    expect([formatValue(152.4, "words/min"), formatValue(42.1, "%"), formatValue(2, "0–3"), formatValue(0.456, "s"), formatValue(2.4, "/100 words")]).toEqual(["152 words/min", "42%", "2", "0.46 s", "2.4/100 words"]);
  });
});
