// "Export my data": a JSON file of sessions, challenges, settings and saved talks that can be imported again (checkpoint C8)
// Audio is left out to keep the file small; transcripts, numbers and feedback are all included

// Load the record types
import type { ChallengeRecord, SessionRecord, SettingsRecord, TalkRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

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
}

// Gather everything into an export file
export async function buildExport(repo: Repository, now: Date): Promise<ExportFile> {
  // Read the sessions and clear their audio pointers, since audio is not in the file
  const sessions = (await repo.listSessions()).map((session) => ({ ...session, audioKey: null }));
  // Put the file together
  return { format: FORMAT, version: VERSION, exportedAt: now.toISOString(), sessions, challenges: await repo.listChallenges(), settings: await repo.getSettings(now), talks: await repo.listTalks() };
}

// Save everything from an export file, adding to existing data; returns what was imported
export async function importExport(repo: Repository, file: ExportFile): Promise<{ sessions: number; challenges: number }> {
  // Save each session (one with the same id is replaced)
  for (const session of file.sessions) await repo.saveSession(session);
  // Save each challenge (one with the same id is replaced)
  for (const challenge of file.challenges) await repo.saveChallenge(challenge);
  // Save each talk (one with the same id is replaced)
  for (const talk of file.talks) await repo.saveTalk(talk);
  // Use the file's settings
  await repo.saveSettings(file.settings);
  // Report the counts to show the user
  return { sessions: file.sessions.length, challenges: file.challenges.length };
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
  return isObject(value) && isText(value.keep) && isText(value.change) && isText(value.retryCue);
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
    (value.mode === undefined || value.mode === "standard" || value.mode === "warmup" || value.mode === "talk" || value.mode === "response" || value.mode === "read" || value.mode === "pause" || value.mode === "rehearse" || value.mode === "lesson") &&
    // Measurements
    isNumber(value.durationSec) && isNumber(value.wordsPerMinute) && isNumber(value.fillersPerMinute) &&
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
  const valid = isText(data.exportedAt) && Array.isArray(data.sessions) && data.sessions.every(isSession) && Array.isArray(data.challenges) && data.challenges.every(isChallenge) && isSettings(data.settings) && (data.talks === undefined || (Array.isArray(data.talks) && data.talks.every(isTalk)));
  // Refuse a damaged file
  if (!valid) throw new Error(DAMAGED);
  // The file has been checked, so it can be used as an export
  const file = data as unknown as ExportFile;
  // Sessions from before warm-ups existed are full sessions
  return { ...file, talks: file.talks ?? [], sessions: file.sessions.map((session) => ({ ...session, mode: session.mode ?? "standard" })) };
}
