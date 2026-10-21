// A take's whole analysis record (decision 90): the phone's measures, worked out from the raw features, plus the coach's rubric once it arrives

// Load the phone's measures
import { DEVICE_ENGINE_VERSION, deviceMetrics, extractRaw } from "@/core/analysis/device";
// Load the server's measures and the merge rule (decision 91)
import { mergeMetrics, serverMetrics, voiceEngine } from "@/core/analysis/server";
// Load the record types
import type { AnalysisRaw, AnalysisRecord, DeepStatus, EngineInfo, MetricValue, RubricRecord, ServerAnalysis, SessionMode, SessionRecord } from "@/data/records";

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

// Every measure from the three sources (phone, rubric, server), with the phone values a server value replaced; nothing from the phone is lost (decision 91)
export function composeMetrics(raw: AnalysisRaw, rubric: RubricRecord | undefined, server: ServerAnalysis | undefined): { metrics: Record<string, MetricValue>; superseded: Record<string, MetricValue> } {
  // Merged in order: phone, rubric, server
  return mergeMetrics(deviceMetrics(raw), rubric ? rubricMetrics(rubric) : {}, server ? serverMetrics(server, raw) : {});
}

// The server engines that contributed, for the record's engines list
function serverEngines(server: ServerAnalysis | undefined): { transcript?: EngineInfo; voice?: EngineInfo } {
  // The transcript's and the voice worker's, each when present
  return {
    // The transcription service and its model
    ...(server?.transcript ? { transcript: { name: "transcript", version: server.transcript.engine, at: server.transcript.at } } : {}),
    // The voice worker and its Praat
    ...(server?.voice ? { voice: { name: "voice", version: voiceEngine(server.voice), at: server.voice.at } } : {}),
  };
}

// The record's parts that come from outside the phone, kept as they are: the rubric, the server's analysis and the deeper analysis status
function kept(existing: AnalysisRecord | undefined): Pick<AnalysisRecord, "rubric" | "server" | "deep"> {
  // Each when present
  return { ...(existing?.rubric ? { rubric: existing.rubric } : {}), ...(existing?.server ? { server: existing.server } : {}), ...(existing?.deep ? { deep: existing.deep } : {}) };
}

// Assemble a record from its raw features and kept parts, working every measure out
function assemble(sessionId: string, raw: AnalysisRaw, parts: Pick<AnalysisRecord, "rubric" | "server" | "deep">, at: string): AnalysisRecord {
  // The measures and the phone values replaced
  const { metrics, superseded } = composeMetrics(raw, parts.rubric, parts.server);
  // The record
  return {
    // Whose analysis
    sessionId,
    // Which definitions
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    // When
    computedAt: at,
    // The engines: the phone's, the coach's when a rubric is kept, and the server's when its analysis is kept
    engines: { device: { name: "device", version: DEVICE_ENGINE_VERSION, at }, ...(parts.rubric ? { rubric: { name: "rubric", version: parts.rubric.model, at: parts.rubric.at } } : {}), ...serverEngines(parts.server) },
    // The measures
    metrics,
    // The raw features
    raw,
    // The kept parts
    ...parts,
    // The phone values a server value replaced, when any were
    ...(Object.keys(superseded).length > 0 ? { superseded } : {}),
  };
}

// Build a take's analysis from its session, keeping any rubric, server analysis and status already saved (now: when it is worked out)
export function buildAnalysis(session: SessionRecord, now: Date, existing?: AnalysisRecord): AnalysisRecord {
  // Built from fresh raw features
  return assemble(session.id, extractRaw(session), kept(existing), now.toISOString());
}

// Work the measures out again from the raw features alone (no session or audio needed), keeping the rubric and the server's analysis
export function recomputeFromRaw(analysis: AnalysisRecord, now: Date): AnalysisRecord {
  // Built from the saved raw features
  return assemble(analysis.sessionId, analysis.raw, kept(analysis), now.toISOString());
}

// Add the coach's rubric to an analysis
export function withRubric(analysis: AnalysisRecord, rubric: RubricRecord): AnalysisRecord {
  // The rubric, its engine and its measures added, keeping when the measures were worked out
  return assemble(analysis.sessionId, analysis.raw, { ...kept(analysis), rubric }, analysis.computedAt);
}

// Add the server's deeper analysis to an analysis (either part may be missing), with its status; a part already saved is kept when the new result lacks it
export function withServerAnalysis(analysis: AnalysisRecord, server: ServerAnalysis, deep: DeepStatus): AnalysisRecord {
  // The parts, the new ones first
  const merged: ServerAnalysis = { transcript: server.transcript ?? analysis.server?.transcript ?? null, voice: server.voice ?? analysis.server?.voice ?? null };
  // Rebuilt with them
  return assemble(analysis.sessionId, analysis.raw, { ...kept(analysis), server: merged, deep }, analysis.computedAt);
}

// Set a take's deeper analysis status without changing its measures
export function withDeepStatus(analysis: AnalysisRecord, deep: DeepStatus): AnalysisRecord {
  // The status replaced
  return { ...analysis, deep };
}
