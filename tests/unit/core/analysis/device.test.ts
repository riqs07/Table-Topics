// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the phone measures being checked
import { deviceMetrics, extractRaw, timedWords } from "@/core/analysis/device";
// Load the analysis builders being checked
import { ANALYSIS_SCHEMA_VERSION, buildAnalysis, isAnalysed, needsAnalysis, recomputeFromRaw, withRubric } from "@/core/analysis/analysis";
// Load the pause placement rule being checked
import { atBoundary, placePauses, wordAfter } from "@/core/analysis/placement";
// Load the registry, to check every measure is registered
import { findMetric } from "@/core/analysis/metrics";
// Load the record types
import type { RubricRecord } from "@/data/records";
// Load the sample records
import { makeSession, voiceReadings } from "../../../support/fixtures";

// Loudness for a take: half a second of quiet, three two-second phrases with a 0.5-second and a 1.2-second pause between them, then 0.3 seconds of quiet
function loudness(): number[] {
  // A run of readings at one level
  const run = (ticks: number, level: number) => Array<number>(ticks).fill(level);
  // The take
  return [...run(5, 0.01), ...run(20, 0.2), ...run(5, 0.01), ...run(20, 0.2), ...run(12, 0.01), ...run(20, 0.2), ...run(3, 0.01)];
}

// The take's words and when each was heard: "I went to the shop" in the first phrase, "and then I saw the" in the second, "dog barked loudly" in the third
const TRANSCRIPT = "I went to the shop and then I saw the dog barked loudly";
// (times)
const TIMES = [0.6, 1.0, 1.4, 1.8, 2.2, 3.1, 3.5, 3.9, 4.3, 4.7, 6.3, 6.9, 7.5];

// The take as a session
const SESSION = makeSession({ id: "take", mode: "talk", durationSec: 9, transcript: TRANSCRIPT, spokenTimes: TIMES, loudness: loudness(), fillersPerMinute: 0 });

// A rubric as the coach returns it
const RUBRIC: RubricRecord = { pointFirst: { score: 2, quote: "I went" }, answersQuestion: null, structure: { score: 1, quote: "" }, ending: { score: 3, quote: "loudly" }, concreteExample: { score: 2, quote: "the dog" }, wordChoice: { score: 1, quote: "shop" }, devices: ["story"], unnecessaryHedges: 0, wordSwaps: [{ said: "barked loudly", stronger: "howled", why: "more vivid" }], model: "coach-model", at: "2026-10-21T10:00:00.000Z" };

// Group the checks about the raw features
describe("extractRaw", () => {
  // Words keep their times and the next word's time
  it("pairs each word with when it was heard", () => {
    // Two words with times, and punctuation cleaned off
    expect(timedWords("Hello, World!", [1, 2])).toEqual([{ w: "hello", s: 1, e: 2 }, { w: "world", s: 2, e: null }]);
  });

  // The pauses come from the loudness, each with the word heard after it
  it("finds pauses of a quarter second or more, and the word after each", () => {
    // The raw features
    const raw = extractRaw(SESSION);
    // Confirm the pauses, their source and the span of speech
    expect([raw.pauses, raw.pauseSource, raw.speech]).toEqual([[{ start: 2.5, end: 3, nextWord: 5 }, { start: 5, end: 6.2, nextWord: 10 }], "loudness", { first: 0.5, last: 8.2 }]);
  });

  // Without loudness, long gaps between word times stand in for pauses
  it("falls back to gaps between word times without loudness", () => {
    // The take without loudness
    const raw = extractRaw({ ...SESSION, loudness: undefined });
    // Confirm the source and the gap of 1.6 seconds before "dog"
    expect([raw.pauseSource, raw.pauses.map((pause) => pause.nextWord)]).toEqual(["word-gaps", [5, 10]]);
  });

  // An old session with neither still gets text measures
  it("keeps the words when neither loudness nor word times were saved", () => {
    // An old take
    const raw = extractRaw(makeSession({ transcript: "so the thing is good", spokenTimes: undefined, loudness: undefined }));
    // Confirm no pauses and every word kept
    expect([raw.pauseSource, raw.pauses, raw.timedWords.map((word) => word.w)]).toEqual(["none", [], ["so", "the", "thing", "is", "good"]]);
  });
});

// Group the checks about the measures themselves
describe("deviceMetrics", () => {
  // The fluency measures follow from the pauses
  it("works out pace, runs and pauses from the raw features", () => {
    // The measures
    const metrics = deviceMetrics(extractRaw(SESSION));
    // The values that matter
    const value = (id: string) => metrics[id]?.value;
    // Confirm each against the hand-worked numbers
    expect([value("lang.wpm"), value("flu.articulation_rate_wpm"), value("flu.phonation_ratio"), value("flu.mlr_words"), value("flu.pause_rate"), value("flu.pause_mean_s"), value("flu.long_pause_share"), value("flu.opening_latency_s")]).toEqual([86.67, 130, 77.92, 4.33, 15.58, 0.85, 50, 0.5]);
  });

  // One pause before "and" is at a boundary; the one between "the" and "dog" is mid-clause
  it("places pauses with the boundary heuristic and names its engine", () => {
    // The measures
    const metrics = deviceMetrics(extractRaw(SESSION));
    // Confirm the shares, the clause length, and the heuristic engine
    expect([metrics["flu.midclause_pause_share"], metrics["lang.mean_clause_words"]?.value]).toEqual([{ value: 50, unit: "%", source: "device", engine: "device-heuristic-v1" }, 6.5]);
  });

  // Every measure computed is registered, with the registry's unit
  it("only produces registered measures, with their units", () => {
    // The measures of a conversation and of a take
    const all = { ...deviceMetrics(extractRaw(SESSION)), ...deviceMetrics(extractRaw(makeSession({ mode: "conversation", conversation: { turns: [{ who: "them", text: "I went to Lisbon", seconds: 2 }, { who: "you", text: "what did you eat in Lisbon", seconds: 2 }] } }))) };
    // Any measure not registered, or with another unit
    expect(Object.entries(all).filter(([id, metric]) => findMetric(id)?.unit !== metric.unit || findMetric(id)?.stage !== "A")).toEqual([]);
  });

  // A conversation's measures come from its turns
  it("measures a conversation's talk share, questions and follow-ups", () => {
    // A short conversation
    const metrics = deviceMetrics(extractRaw(makeSession({ mode: "conversation", conversation: { turns: [{ who: "them", text: "I went to Lisbon", seconds: 2 }, { who: "you", text: "what did you eat in Lisbon", seconds: 2 }] } })));
    // Confirm the four
    expect(["conv.talk_share", "conv.questions", "conv.followups", "conv.turns"].map((id) => metrics[id]?.value)).toEqual([60, 1, 1, 1]);
  });

  // Pitch measures come from the pitch readings
  it("sums up the pitch range in semitones", () => {
    // A lively take
    const metrics = deviceMetrics(extractRaw(makeSession({ ...voiceReadings("lively"), durationSec: 14 })));
    // Confirm a range was measured, with a usual pitch near the middle reading
    expect([metrics["pro.f0_range_st"]!.value! > 6, metrics["pro.f0_median_hz"]?.value]).toEqual([true, 200]);
  });

  // Levelled loudness is not a real change, so the volume measures are left empty
  it("leaves volume variety empty when the browser levelled the sound", () => {
    // The take, levelled
    const metrics = deviceMetrics(extractRaw({ ...SESSION, autoGain: true }));
    // Confirm both are empty
    expect([metrics["pro.loudness_cv"]?.value, metrics["pro.energy_drop_db"]?.value]).toEqual([null, null]);
  });
});

// Group the checks about the placement rule on its own
describe("pause placement", () => {
  // The word heard at or after a moment
  it("finds the first word heard after a pause", () => {
    // Words at 1, 2 and 3 seconds
    const words = [{ w: "a", s: 1, e: 2 }, { w: "b", s: 2, e: 3 }, { w: "c", s: 3, e: null }];
    // Confirm the word after 1.5 s, at 2.95 s (rounding), and after the end
    expect([wordAfter(words, 1.5), wordAfter(words, 3.05), wordAfter(words, 4)]).toEqual([1, 2, null]);
  });

  // Clause starters and sentence enders mark a boundary
  it("treats clause starters and statement endings as boundaries", () => {
    // Before "because", after "yeah", and between "the" and "dog"
    expect([atBoundary(["it", "rained", "because"], 2), atBoundary(["it", "was", "yeah", "fun"], 3), atBoundary(["the", "dog"], 1)]).toEqual([true, true, false]);
  });

  // A pause before the first word cannot be placed
  it("skips pauses that cannot be placed", () => {
    // One unplaceable pause and one mid-clause
    expect(placePauses([{ start: 0, end: 1, nextWord: 0 }, { start: 2, end: 3, nextWord: null }, { start: 4, end: 5, nextWord: 1 }], ["the", "dog"])).toEqual({ boundary: 0, midClause: 1 });
  });
});

// Group the checks about the whole record
describe("buildAnalysis", () => {
  // The record carries its version, engines and raw features
  it("builds a record with its version and engine", () => {
    // The analysis
    const analysis = buildAnalysis(SESSION, new Date("2026-10-21T10:00:00.000Z"));
    // Confirm who, which version, and the device engine
    expect([analysis.sessionId, analysis.schemaVersion, analysis.engines.device.name, analysis.computedAt]).toEqual(["take", ANALYSIS_SCHEMA_VERSION, "device", "2026-10-21T10:00:00.000Z"]);
  });

  // The measures can be worked out again from the raw features alone
  it("recomputes the same measures from the raw features", () => {
    // The analysis
    const analysis = buildAnalysis(SESSION, new Date("2026-10-21T10:00:00.000Z"));
    // Worked out again, with the measures emptied first
    const again = recomputeFromRaw({ ...analysis, metrics: {} }, new Date("2026-10-22T10:00:00.000Z"));
    // Confirm the same measures
    expect(again.metrics).toEqual(analysis.metrics);
  });

  // A rubric adds its scores, and is kept when the analysis is built again
  it("adds the rubric's scores and keeps them through a rebuild", () => {
    // With the rubric
    const scored = withRubric(buildAnalysis(SESSION, new Date()), RUBRIC);
    // Built again from the session
    const rebuilt = buildAnalysis(SESSION, new Date(), scored);
    // Confirm the scores, their engine, and the swap kept
    expect([rebuilt.metrics["rub.point_first"], rebuilt.metrics["rub.answers_question"]?.value, rebuilt.metrics["rub.devices_count"]?.value, rebuilt.engines.rubric?.version, rebuilt.rubric?.wordSwaps[0]?.stronger]).toEqual([{ value: 2, unit: "0–3", source: "rubric", engine: "coach-model" }, null, 1, "coach-model", "howled"]);
  });

  // Voice drills and moment notes are not analysed; out-of-date ones are redone
  it("knows which takes need an analysis", () => {
    // The analysis of the take, and an old one
    const analysis = buildAnalysis(SESSION, new Date());
    // Confirm each case
    expect([isAnalysed("voice"), isAnalysed("moment"), needsAnalysis(SESSION, undefined), needsAnalysis(SESSION, analysis), needsAnalysis(SESSION, { ...analysis, schemaVersion: 0 })]).toEqual([false, false, true, false, true]);
  });
});
