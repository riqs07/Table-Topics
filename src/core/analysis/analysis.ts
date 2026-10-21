// A take's whole analysis record (decision 90): the phone's measures, worked out from the raw features, plus the coach's rubric once it arrives

// Load the phone's measures
import { DEVICE_ENGINE_VERSION, deviceMetrics, extractRaw } from "@/core/analysis/device";
// Load the record types
import type { AnalysisRecord, MetricValue, RubricRecord, SessionMode, SessionRecord } from "@/data/records";

// The version of the measure definitions; raising it makes every analysis be worked out again (rule 1 of the research's storage plan)
export const ANALYSIS_SCHEMA_VERSION = 1;

// Kinds of session that are not analysed: voice drills (no speech to measure as a talk) and private moment notes
const NOT_ANALYSED: ReadonlyArray<SessionMode> = ["voice", "moment"];

// Whether a kind of session gets an analysis
export function isAnalysed(mode: SessionMode): boolean {
  // Everything except the kinds left out
  return !NOT_ANALYSED.includes(mode);
}

// Whether a session needs its analysis worked out (none yet, or from an older definition)
export function needsAnalysis(session: SessionRecord, analysis: AnalysisRecord | undefined): boolean {
  // Only kinds that are analysed, missing or out of date
  return isAnalysed(session.mode) && (!analysis || analysis.schemaVersion !== ANALYSIS_SCHEMA_VERSION);
}

// The rubric's scores as measures (decision 90), with the coach model as their engine
export function rubricMetrics(rubric: RubricRecord): Record<string, MetricValue> {
  // One measure from the rubric
  const value = (score: number | null, unit = "0–3"): MetricValue => ({ value: score, unit, source: "rubric", engine: rubric.model });
  // Every rubric measure
  return {
    // The five scores and word choice
    "rub.point_first": value(rubric.pointFirst.score),
    // (answers the question, empty without one)
    "rub.answers_question": value(rubric.answersQuestion ? rubric.answersQuestion.score : null),
    // (structure)
    "rub.structure": value(rubric.structure.score),
    // (ending)
    "rub.close_strength": value(rubric.ending.score),
    // (concrete example)
    "rub.concrete_example": value(rubric.concreteExample.score),
    // (word choice)
    "rub.word_choice": value(rubric.wordChoice.score),
    // The tags, as counts
    "rub.devices_count": value(rubric.devices.length, "count"),
    // (unneeded hedges)
    "rub.unnecessary_hedges": value(rubric.unnecessaryHedges, "count"),
  };
}

// Build a take's analysis from its session, keeping any rubric already saved (now: when it is worked out)
export function buildAnalysis(session: SessionRecord, now: Date, existing?: AnalysisRecord): AnalysisRecord {
  // The raw features
  const raw = extractRaw(session);
  // When
  const at = now.toISOString();
  // The rubric already saved, if any
  const rubric = existing?.rubric;
  // The record
  return {
    // Whose analysis
    sessionId: session.id,
    // Which definitions
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    // When
    computedAt: at,
    // The engines: the phone's, and the coach's when a rubric is kept
    engines: { device: { name: "device", version: DEVICE_ENGINE_VERSION, at }, ...(existing?.engines.rubric ? { rubric: existing.engines.rubric } : {}) },
    // The measures: the phone's, then the rubric's
    metrics: { ...deviceMetrics(raw), ...(rubric ? rubricMetrics(rubric) : {}) },
    // The raw features
    raw,
    // The rubric, kept
    ...(rubric ? { rubric } : {}),
  };
}

// Work the phone's measures out again from the raw features alone (no session or audio needed)
export function recomputeFromRaw(analysis: AnalysisRecord, now: Date): AnalysisRecord {
  // When
  const at = now.toISOString();
  // The same record with fresh phone measures, the rubric's kept
  return { ...analysis, schemaVersion: ANALYSIS_SCHEMA_VERSION, computedAt: at, engines: { ...analysis.engines, device: { name: "device", version: DEVICE_ENGINE_VERSION, at } }, metrics: { ...deviceMetrics(analysis.raw), ...(analysis.rubric ? rubricMetrics(analysis.rubric) : {}) } };
}

// Add the coach's rubric to an analysis
export function withRubric(analysis: AnalysisRecord, rubric: RubricRecord): AnalysisRecord {
  // The rubric, its engine and its measures added
  return { ...analysis, engines: { ...analysis.engines, rubric: { name: "rubric", version: rubric.model, at: rubric.at } }, metrics: { ...analysis.metrics, ...rubricMetrics(rubric) }, rubric };
}
