// "Export my data": a JSON file of sessions, challenges, settings, saved talks, each take's measures and the weekly summaries that can be imported again (checkpoint C8, decision 90)
// Audio is left out to keep the file small; transcripts, numbers and feedback are all included

// Load the record types
import { isSessionMode, type AnalysisRecord, type ChallengeRecord, type SessionRecord, type SettingsRecord, type SummaryRecord, type TalkRecord } from "@/data/records";
// Load the rubric reader and the rubric merge (decision 90)
import { readRubric } from "@/core/analysis/rubric";
// (merge)
import { withRubric, withServerAnalysis } from "@/core/analysis/analysis";
// Load the reader for a kept server analysis (decision 91)
import { readServerAnalysis } from "@/core/analysis/server";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the rules for joining a backup with what is already here (decision 86)
import { mergeRecord, mergeSession, mergeSettings } from "@/core/importMerge";

// Label that identifies a VoiceLab export file
const FORMAT = "voicelab-export";
// Version of the file layout; raise it if the layout changes
const VERSION = 1;

// The contents of an export file
export interface ExportFile {
  // Always "voicelab-export"
  format: typeof FORMAT;
  // Layout version
  version: typeof VERSION;
  // When the file was made (ISO text)
  exportedAt: string;
  // Every session, newest first, without audio
  sessions: SessionRecord[];
  // Every challenge, newest week first
  challenges: ChallengeRecord[];
  // The user's settings
  settings: SettingsRecord;
  // The user's own talks (missing in files made before Rehearse my talk)
  talks: TalkRecord[];
  // Each take's measures (missing in files made before decision 90)
  analyses: AnalysisRecord[];
  // Weekly coach summaries, newest first (missing in files made before decision 90)
  summaries: SummaryRecord[];
}

// Gather everything into an export file
export async function buildExport(repo: Repository, now: Date): Promise<ExportFile> {
  // Read the sessions and clear their audio pointers, since audio is not in the file
  const sessions = (await repo.listSessions()).map((session) => ({ ...session, audioKey: null }));
  // Put the file together
  return { format: FORMAT, version: VERSION, exportedAt: now.toISOString(), sessions, challenges: await repo.listChallenges(), settings: await repo.getSettings(now), talks: await repo.listTalks(), analyses: await repo.listAnalyses(), summaries: await repo.listSummaries() };
}

// Save everything from an export file, joined with what is already here (decision 86): a record already on this device is kept and only gains what it lacks (so recordings stay linked and newer feedback or notes are not lost), and settings and progress are joined; returns how many sessions were new and how many already here
export async function importExport(repo: Repository, file: ExportFile, now: Date = new Date()): Promise<{ added: number; kept: number }> {
  // Sessions new to this device
  let added = 0;
  // Each session in the file
  for (const session of file.sessions) {
    // The copy already here, if any
    const existing = await repo.getSession(session.id);
    // Count it
    if (!existing) added += 1;
    // Saved, joined with the copy here
    await repo.saveSession(mergeSession(existing, session));
  }
  // The challenges already here, by id
  const challenges = new Map((await repo.listChallenges()).map((challenge) => [challenge.id, challenge]));
  // Each challenge, joined with the copy here
  for (const challenge of file.challenges) await repo.saveChallenge(mergeRecord(challenges.get(challenge.id), challenge));
  // Each talk, joined with the copy here
  for (const talk of file.talks) await repo.saveTalk(mergeRecord(await repo.getTalk(talk.id), talk));
  // The settings, joined with those here
  await repo.saveSettings(mergeSettings(await repo.getSettings(now), file.settings));
  // Each take's measures: one already here is kept, gaining only a rubric or a deeper analysis it lacks (decisions 90 and 91)
  for (const analysis of file.analyses) {
    // The copy here, if any
    let here = await repo.getAnalysis(analysis.sessionId);
    // Saved as it is when new
    if (!here) {
      // Saved
      await repo.saveAnalysis(analysis);
      // Next
      continue;
    }
    // A rubric the copy here lacks
    const gainsRubric = !here.rubric && analysis.rubric;
    // (added)
    if (gainsRubric) here = withRubric(here, analysis.rubric!);
    // A deeper analysis the copy here lacks, with its status
    const gainsServer = !here.server && analysis.server;
    // (added)
    if (gainsServer) here = withServerAnalysis(here, analysis.server!, analysis.deep ?? { status: "done", note: "", at: analysis.computedAt });
    // Saved when anything was gained
    if (gainsRubric || gainsServer) await repo.saveAnalysis(here);
  }
  // The summaries already here, by id
  const summaries = new Set((await repo.listSummaries()).map((summary) => summary.id));
  // Each summary not here yet
  for (const summary of file.summaries) if (!summaries.has(summary.id)) await repo.saveSummary(summary);
  // Report the counts to show the user
  return { added, kept: file.sessions.length - added };
}

// Messages shown to the user when a file cannot be imported
const NOT_AN_EXPORT = "This file is not a VoiceLab export.";
// Shown when the file is from a later version of the app
const TOO_NEW = "This file comes from a newer version of VoiceLab.";
// Shown when the file's records are broken
const DAMAGED = "This file is damaged and cannot be imported.";

// Check that a value is a plain object
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
// Check that a value is text
const isText = (value: unknown): value is string => typeof value === "string";
// Check that a value is a real number
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
// Check that a value is text or null
const isTextOrNull = (value: unknown) => value === null || isText(value);

// Check that a value has the shape of coach feedback
function isFeedback(value: unknown): boolean {
  // Feedback must be an object with three text parts
  return isObject(value) && isText(value.keep) && isText(value.change) && isText(value.retryCue) && (value.smallTalk === undefined || isObject(value.smallTalk)) && (value.connection === undefined || isObject(value.connection)) && (value.conversation === undefined || isObject(value.conversation));
}

// Check that a value has the shape of one turn of a conversation
function isTurn(value: unknown): boolean {
  // Said by you or them, with the words, how long it took, and for their turns the line said
  return isObject(value) && (value.who === "you" || value.who === "them") && isText(value.text) && isNumber(value.seconds) && (value.lineId === undefined || isText(value.lineId));
}

// Check that a value has the shape of a session record
function isSession(value: unknown): value is SessionRecord {
  // Must be an object to check further
  if (!isObject(value)) return false;
  // Check every field's type
  return (
    // Text identifiers and times
    isText(value.id) && isText(value.createdAt) && isText(value.promptId) && isText(value.transcript) && isText(value.focus) &&
    // Yes/no flag
    typeof value.isBaseline === "boolean" &&
    // Optional links
    isTextOrNull(value.retryOf) && isTextOrNull(value.audioKey) &&
    // Session kind (missing in files made before warm-ups existed)
    (value.mode === undefined || isSessionMode(value.mode)) &&
    // Measurements
    isNumber(value.durationSec) && isNumber(value.wordsPerMinute) && isNumber(value.fillersPerMinute) &&
    // Q&A questions saved on a rehearsal or response, and the question a Q&A answer answered (both usually missing)
    (value.questions === undefined || (Array.isArray(value.questions) && value.questions.every(isText))) && (value.question === undefined || isText(value.question)) &&
    // A short speech's plan (usually missing)
    (value.outline === undefined || (typeof value.outline === "object" && value.outline !== null && isText((value.outline as Record<string, unknown>).topic) && Array.isArray((value.outline as Record<string, unknown>).points) && ((value.outline as Record<string, unknown>).points as unknown[]).every(isText) && typeof (value.outline as Record<string, unknown>).goalMinutes === "number")) &&
    // A conversation's turns, each said by you or them, and its situation (only on conversations, decisions 83 and 84)
    (value.conversation === undefined || (isObject(value.conversation) && Array.isArray(value.conversation.turns) && value.conversation.turns.every(isTurn) && (value.conversation.scenarioId === undefined || isText(value.conversation.scenarioId)) && (value.conversation.twist === undefined || isNumber(value.conversation.twist)))) &&
    // Section of a rehearsal (missing on most sessions)
    (value.sectionIndex === undefined || value.sectionIndex === null || isNumber(value.sectionIndex)) &&
    // Feedback and its status
    (value.feedback === null || isFeedback(value.feedback)) && ["pending", "done", "failed"].includes(value.feedbackStatus as string)
  );
}

// Check that a value has the shape of a challenge record
function isChallenge(value: unknown): value is ChallengeRecord {
  // Must be an object with text fields and an optional completion time
  return isObject(value) && isText(value.id) && isText(value.weekStart) && isText(value.text) && isTextOrNull(value.completedAt);
}

// Check that a value has the shape of a saved talk
function isTalk(value: unknown): value is TalkRecord {
  // Must be an object with text fields and a goal that is a number or null
  return isObject(value) && isText(value.id) && isText(value.title) && isText(value.body) && isText(value.createdAt) && (value.goalMinutes === null || isNumber(value.goalMinutes)) && (value.eventDate === undefined || value.eventDate === null || (isText(value.eventDate) && /^\d{4}-\d{2}-\d{2}$/.test(value.eventDate)));
}

// Check that a value has the shape of one take's analysis (decision 90): its identity, its measures each with a number or nothing, its raw features, and a rubric when there is one
function isAnalysis(value: unknown): value is AnalysisRecord {
  // Must be an object with an id, a version, a time and the engines
  if (!isObject(value) || !isText(value.sessionId) || !isNumber(value.schemaVersion) || !isText(value.computedAt) || !isObject(value.engines) || !isObject(value.raw)) return false;
  // Every measure: a number or nothing, a unit, a known source and an engine
  const metricsOk = isObject(value.metrics) && Object.values(value.metrics).every((metric) => isObject(metric) && (metric.value === null || isNumber(metric.value)) && isText(metric.unit) && ["device", "transcript", "voice", "rubric"].includes(metric.source as string) && isText(metric.engine));
  // The raw features' lists and counts
  const raw = value.raw;
  // (checked)
  const rawOk = Array.isArray(raw.timedWords) && Array.isArray(raw.pauses) && isObject(raw.contentWords) && isNumber(raw.durationSec);
  // A rubric, when present, must read cleanly
  const rubricOk = value.rubric === undefined || readRubric(value.rubric, value.computedAt) !== null;
  // The server's analysis, when present, must read cleanly (decision 91)
  const serverOk = value.server === undefined || readServerAnalysis(value.server) !== null;
  // The replaced phone values, when present, have the same shape as measures
  const supersededOk = value.superseded === undefined || (isObject(value.superseded) && Object.values(value.superseded).every((metric) => isObject(metric) && (metric.value === null || isNumber(metric.value)) && isText(metric.unit) && isText(metric.engine)));
  // The status, when present, is one of the known ones with a note and a time
  const deepOk = value.deep === undefined || (isObject(value.deep) && ["running", "done", "partial", "failed", "skipped"].includes(value.deep.status as string) && isText(value.deep.note) && isText(value.deep.at));
  // All of them
  return metricsOk && rawOk && rubricOk && serverOk && supersededOk && deepOk;
}

// Check that a value has the shape of a weekly summary
function isSummary(value: unknown): value is SummaryRecord {
  // Text fields, a list of lines, and a drill or nothing
  return isObject(value) && isText(value.id) && isText(value.createdAt) && isText(value.headline) && Array.isArray(value.improved) && value.improved.every(isText) && isText(value.pattern) && isText(value.focus) && isTextOrNull(value.suggestedDrill) && isText(value.model);
}

// Check that a value has the shape of the settings record
function isSettings(value: unknown): value is SettingsRecord {
  // Must be an object with a focus position, start date and audio limit
  return isObject(value) && isNumber(value.focusIndex) && isText(value.focusStartedOn) && isNumber(value.audioRetention);
}

// Read an export file's text, checking it fully before anything is saved
export function parseExport(text: string): ExportFile {
  // Try to read the text as JSON
  let data: unknown;
  // Parse, treating any failure as "not an export"
  try {
    // Read the JSON
    data = JSON.parse(text);
  } catch {
    // Not JSON at all
    throw new Error(NOT_AN_EXPORT);
  }
  // Must carry the VoiceLab label
  if (!isObject(data) || data.format !== FORMAT) throw new Error(NOT_AN_EXPORT);
  // Must not be from a newer app version
  if (isNumber(data.version) && data.version > VERSION) throw new Error(TOO_NEW);
  // Must be this version (anything else is damaged)
  if (data.version !== VERSION) throw new Error(DAMAGED);
  // Every part must have the right shape
  const valid = isText(data.exportedAt) && Array.isArray(data.sessions) && data.sessions.every(isSession) && Array.isArray(data.challenges) && data.challenges.every(isChallenge) && isSettings(data.settings) && (data.talks === undefined || (Array.isArray(data.talks) && data.talks.every(isTalk))) && (data.analyses === undefined || (Array.isArray(data.analyses) && data.analyses.every(isAnalysis))) && (data.summaries === undefined || (Array.isArray(data.summaries) && data.summaries.every(isSummary)));
  // Refuse a damaged file
  if (!valid) throw new Error(DAMAGED);
  // The file has been checked, so it can be used as an export
  const file = data as unknown as ExportFile;
  // Sessions from before warm-ups existed are full sessions
  return { ...file, talks: file.talks ?? [], analyses: file.analyses ?? [], summaries: file.summaries ?? [], sessions: file.sessions.map((session) => ({ ...session, mode: session.mode ?? "standard" })) };
}
