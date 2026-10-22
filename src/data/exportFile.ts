// "Export my data": a JSON file of sessions, their detailed readings, challenges, settings, saved talks, each take's measures, the weekly summaries and the user's stories that can be imported again (checkpoint C8, decisions 90, 92 and 98)
// Audio is left out to keep the file small; transcripts, numbers and feedback are all included. Since decision 99 the file is written compactly, a part at a time, and read back in batches, with progress shown for big files

// Load the record types
import { answerScale, isCheckInPart, isRatingAnswer, isRatingScale, isSessionMode, type AnalysisRecord, type SelfRating, type ChallengeRecord, type FullSession, type SessionRecord, type SettingsRecord, type SignalsRecord, type StoryRecord, type SummaryRecord, type TalkRecord } from "@/data/records";
// Load the story merge rule (decision 92)
import { mergeStory } from "@/core/storyLibrary";
// Load the story choice checks
import { isStoryFocus, isStoryLength, isStoryShape } from "@/content/stories";
// Load the rubric reader and the rubric merge (decision 90)
import { readRubric } from "@/core/analysis/rubric";
// (merge)
import { withRubric, withServerAnalysis } from "@/core/analysis/analysis";
// Load the reader for a kept server analysis (decision 91)
import { readServerAnalysis } from "@/core/analysis/server";
// Load the rule that splits a session's readings out (decision 98)
import { splitSignals } from "@/core/sessionSignals";
// Load the repository type and the stored form of an analysis
import { storedAnalysis, type Repository } from "@/data/repository";
// Load the rules for joining a backup with what is already here (decision 86)
import { mergeRecord, mergeSession, mergeSettings } from "@/core/importMerge";

// Label that identifies a VoiceLab export file
const FORMAT = "voicelab-export";
// Version of the file layout; raise it if the layout changes (2 since decision 98: readings in their own list, analyses without their words; files of version 1 still import)
const VERSION = 2;
// Records written or saved in one go before the page gets a turn
const CHUNK = 200;

// The contents of an export file
export interface ExportFile {
  // Always "voicelab-export"
  format: typeof FORMAT;
  // Layout version (a version 1 file read back is turned into this shape)
  version: number;
  // When the file was made (ISO text)
  exportedAt: string;
  // Every session, newest first, without audio (a version 1 file's sessions carry their readings inline)
  sessions: Array<SessionRecord | FullSession>;
  // Each take's detailed readings that are still kept (missing in files made before decision 98)
  signals: SignalsRecord[];
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
  // The user's stories and their titles (missing in files made before decision 92)
  stories: StoryRecord[];
}

// How far a long export or import has got, for the progress line
export interface Progress {
  // Records done
  done: number;
  // Records in all
  total: number;
}

// What a long export or import can be given: a progress callback and the pause between parts
export interface ChunkOptions {
  // Told after each part
  onProgress?: (progress: Progress) => void;
  // A pause between parts, so the page stays responsive
  pause?: () => Promise<void>;
}

// Give the page a turn between parts
function nextTurn(): Promise<void> {
  // After whatever is waiting
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Gather everything into an export file
export async function buildExport(repo: Repository, now: Date): Promise<ExportFile> {
  // Read the sessions and clear their audio pointers, since audio is not in the file (readings still inline on an older record go to their own list)
  const parts = (await repo.listSessions()).map((session) => splitSignals({ ...session, audioKey: null }));
  // The readings kept apart, joined by any still inline
  const signals = new Map((await repo.store.getAll("signals")).map((record) => [record.sessionId, record]));
  // (inline ones)
  for (const part of parts) if (part.signals && !signals.has(part.signals.sessionId)) signals.set(part.signals.sessionId, part.signals);
  // Put the file together (analyses without their words, which are rebuilt from the transcript)
  return { format: FORMAT, version: VERSION, exportedAt: now.toISOString(), sessions: parts.map((part) => part.session), signals: [...signals.values()], challenges: await repo.listChallenges(), settings: await repo.getSettings(now), talks: await repo.listTalks(), analyses: (await repo.listAnalyses()).map(storedAnalysis), summaries: await repo.listSummaries(), stories: await repo.listStories() };
}

// The lists of an export file in the order they are written
const LISTS = ["sessions", "signals", "challenges", "talks", "analyses", "summaries", "stories"] as const;

// Write an export file as compact JSON, a part at a time, so no single step holds the page for long and the whole file never sits in one string (decision 99)
export async function exportParts(file: ExportFile, options: ChunkOptions = {}): Promise<string[]> {
  // Records in all
  const total = LISTS.reduce((sum, list) => sum + file[list].length, 0);
  // Records written so far
  let done = 0;
  // The file's opening: its label, version, time and settings
  const parts: string[] = [`{"format":${JSON.stringify(file.format)},"version":${file.version},"exportedAt":${JSON.stringify(file.exportedAt)},"settings":${JSON.stringify(file.settings)}`];
  // Each list in turn
  for (const list of LISTS) {
    // Its records
    const records: ReadonlyArray<unknown> = file[list];
    // Its opening
    parts.push(`,${JSON.stringify(list)}:[`);
    // A chunk at a time
    for (let start = 0; start < records.length; start += CHUNK) {
      // The chunk's records, comma-separated, with a comma before it unless it is the first
      parts.push(`${start > 0 ? "," : ""}${records.slice(start, start + CHUNK).map((record) => JSON.stringify(record)).join(",")}`);
      // Counted
      done += Math.min(CHUNK, records.length - start);
      // Said
      options.onProgress?.({ done, total });
      // Let the page breathe
      await (options.pause ?? nextTurn)();
    }
    // Its close
    parts.push("]");
  }
  // The file's close
  parts.push("}");
  // The parts, ready to become a file
  return parts;
}

// Save a list a chunk at a time, saying how far it got
async function inChunks<T>(items: ReadonlyArray<T>, save: (chunk: ReadonlyArray<T>) => Promise<void>, progress: { done: number; total: number }, options: ChunkOptions): Promise<void> {
  // A chunk at a time
  for (let start = 0; start < items.length; start += CHUNK) {
    // Saved together
    await save(items.slice(start, start + CHUNK));
    // Counted
    progress.done += Math.min(CHUNK, items.length - start);
    // Said
    options.onProgress?.({ ...progress });
    // Let the page breathe
    await (options.pause ?? nextTurn)();
  }
}

// Save everything from an export file, joined with what is already here (decision 86): a record already on this device is kept and only gains what it lacks (so recordings stay linked and newer feedback or notes are not lost), and settings and progress are joined; returns how many sessions were new and how many already here. Records are read and saved a chunk at a time, each chunk in one transaction (decision 98)
export async function importExport(repo: Repository, file: ExportFile, now: Date = new Date(), options: ChunkOptions = {}): Promise<{ added: number; kept: number }> {
  // How far it has got
  const progress = { done: 0, total: file.sessions.length + file.analyses.length };
  // Sessions new to this device
  let added = 0;
  // The file's readings by session id (a version 1 file has none here: its sessions carry them)
  const fileSignals = new Map(file.signals.map((record) => [record.sessionId, record]));
  // Sessions, a chunk at a time
  await inChunks(file.sessions, async (chunk) => {
    // The copies already here
    const existing = await repo.getSessions(chunk.map((session) => session.id));
    // The readings already here
    const existingSignals = await repo.store.getMany("signals", chunk.map((session) => session.id));
    // The sessions to save
    const sessions: SessionRecord[] = [];
    // The readings to save
    const signals: SignalsRecord[] = [];
    // Each session in the chunk
    for (const [index, incoming] of chunk.entries()) {
      // The copy here, if any
      const here = existing[index];
      // Count it
      if (!here) added += 1;
      // Joined with the copy here, then split from any readings it carries
      const parts = splitSignals(mergeSession(here, splitSignals(incoming).session));
      // Saved
      sessions.push(parts.session);
      // The file's readings for it: inline (version 1) or in their own list
      const readings = splitSignals(incoming).signals ?? fileSignals.get(incoming.id) ?? null;
      // Added only when this device has none for it and has not dropped them on purpose (or keeps them inline on an older record)
      if (readings && !existingSignals[index] && !parts.signals && !parts.session.trimmedAt) signals.push(readings);
      // Readings inline on an older record here are kept, in their own record
      if (parts.signals) signals.push(parts.signals);
    }
    // Saved together
    await repo.saveBatch({ sessions, signals });
  }, progress, options);
  // The challenges already here, by id
  const challenges = new Map((await repo.listChallenges()).map((challenge) => [challenge.id, challenge]));
  // The talks already here, by id
  const talks = new Map((await repo.listTalks()).map((talk) => [talk.id, talk]));
  // The summaries already here, by id
  const summaries = new Set((await repo.listSummaries()).map((summary) => summary.id));
  // The stories already here, by id
  const stories = new Map((await repo.listStories()).map((story) => [story.id, story]));
  // Challenges, talks, summaries and stories joined with the copies here (each list is small), saved together: a challenge or talk gains what it lacks, a summary is added when new, and the later story title wins (decision 92)
  await repo.saveBatch({ challenges: file.challenges.map((challenge) => mergeRecord(challenges.get(challenge.id), challenge)), talks: file.talks.map((talk) => mergeRecord(talks.get(talk.id), talk)), summaries: file.summaries.filter((summary) => !summaries.has(summary.id)), stories: file.stories.map((story) => mergeStory(stories.get(story.id), story)) });
  // The settings, joined with those here
  await repo.saveSettings(mergeSettings(await repo.getSettings(now), file.settings));
  // Each take's measures, a chunk at a time: one already here is kept, gaining only a rubric or a deeper analysis it lacks (decisions 90 and 91)
  await inChunks(file.analyses, async (chunk) => {
    // The copies here
    const existing = await repo.getAnalyses(chunk.map((analysis) => analysis.sessionId));
    // The analyses to save
    const analyses: AnalysisRecord[] = [];
    // Each in the chunk
    for (const [index, analysis] of chunk.entries()) {
      // The copy here, if any
      const stored = existing[index];
      // Saved as it is when new
      if (!stored) {
        // Saved
        analyses.push(analysis);
        // Next
        continue;
      }
      // A rubric the copy here lacks
      const gainsRubric = !stored.rubric && analysis.rubric;
      // A deeper analysis the copy here lacks, with its status
      const gainsServer = !stored.server && analysis.server;
      // Nothing gained: left as it is
      if (!gainsRubric && !gainsServer) continue;
      // The copy here, with its words rebuilt while the take keeps them, so its measures are worked out the same way
      let here = (await repo.getWorkingAnalysis(analysis.sessionId)) ?? stored;
      // (rubric added)
      if (gainsRubric) here = withRubric(here, analysis.rubric!);
      // (deeper analysis added)
      if (gainsServer) here = withServerAnalysis(here, analysis.server!, analysis.deep ?? { status: "done", note: "", at: analysis.computedAt });
      // Saved
      analyses.push(here);
    }
    // Saved together
    await repo.saveBatch({ analyses });
  }, progress, options);
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
  return isObject(value) && isText(value.keep) && isText(value.change) && isText(value.retryCue) && (value.smallTalk === undefined || isObject(value.smallTalk)) && (value.connection === undefined || isObject(value.connection)) && (value.conversation === undefined || isObject(value.conversation)) && (value.story === undefined || isObject(value.story));
}

// Check that a value has the shape of one turn of a conversation
function isTurn(value: unknown): boolean {
  // Said by you or them, with the words, how long it took, for their turns the line said, and when it began and ended and whether it was cut short (decision 120)
  return isObject(value) && (value.who === "you" || value.who === "them") && isText(value.text) && isNumber(value.seconds) && (value.lineId === undefined || isText(value.lineId)) && (value.at === undefined || isNumber(value.at)) && (value.end === undefined || isNumber(value.end)) && (value.cut === undefined || typeof value.cut === "boolean");
}

// Check that a value is a self-rating: a known scale, an answer on that scale, and when (decision 116)
function isSelfRating(value: unknown): value is SelfRating {
  // An object with a known scale, its own kind of answer and a time
  return isObject(value) && isRatingScale(value.scale) && isRatingAnswer(value.answer) && answerScale(value.answer) === value.scale && isText(value.ratedAt);
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
    (value.conversation === undefined || (isObject(value.conversation) && Array.isArray(value.conversation.turns) && value.conversation.turns.every(isTurn) && (value.conversation.scenarioId === undefined || isText(value.conversation.scenarioId)) && (value.conversation.twist === undefined || isNumber(value.conversation.twist)) && (value.conversation.difficulty === undefined || ["easy", "normal", "hard"].includes(value.conversation.difficulty as string)) && (value.conversation.turnMode === undefined || ["tap", "auto", "live", "call"].includes(value.conversation.turnMode as string)))) &&
    // A check-in take's check-in, number and part (decision 100)
    (value.checkIn === undefined || (isObject(value.checkIn) && isText(value.checkIn.id) && /^ci-\d{4}-\d{2}-\d{2}$/.test(value.checkIn.id) && isNumber(value.checkIn.week) && value.checkIn.week >= 1 && isCheckInPart(value.checkIn.part))) &&
    // A told story's set-up (only on stories, decision 92)
    (value.story === undefined || (isObject(value.story) && isStoryShape(value.story.shape) && (value.story.focus === null || isStoryFocus(value.story.focus)) && isStoryLength(value.story.length))) &&
    // The speaker's own call on the take, asked before its results (decision 116; usually missing)
    (value.selfRating === undefined || isSelfRating(value.selfRating)) &&
    // A 4/3/2 round's loop, round and target (decision 118; usually missing)
    (value.loop === undefined || (isObject(value.loop) && isText(value.loop.id) && isNumber(value.loop.round) && value.loop.round >= 1 && value.loop.round <= 3 && isNumber(value.loop.targetSec) && value.loop.targetSec > 0)) &&
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
  // The raw features' lists and counts (the words are missing in files of version 2, decision 98)
  const raw = value.raw;
  // (checked)
  const rawOk = (raw.timedWords === undefined || Array.isArray(raw.timedWords)) && Array.isArray(raw.pauses) && isObject(raw.contentWords) && isNumber(raw.durationSec);
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

// Check that a value is a list of numbers, or of numbers and nulls
const isReadings = (value: unknown, nullable: boolean) => Array.isArray(value) && value.every((item) => isNumber(item) || (nullable && item === null));

// Check that a value has the shape of one take's detailed readings (decision 98)
function isSignals(value: unknown): value is SignalsRecord {
  // Its session's id, and each reading list when present
  return isObject(value) && isText(value.sessionId) && (value.loudness === undefined || isReadings(value.loudness, false)) && (value.pitch === undefined || isReadings(value.pitch, true)) && (value.spokenTimes === undefined || isReadings(value.spokenTimes, false)) && (value.scriptTimes === undefined || isReadings(value.scriptTimes, true));
}

// Check that a value has the shape of a weekly summary
function isSummary(value: unknown): value is SummaryRecord {
  // Text fields, a list of lines, and a drill or nothing
  return isObject(value) && isText(value.id) && isText(value.createdAt) && isText(value.headline) && Array.isArray(value.improved) && value.improved.every(isText) && isText(value.pattern) && isText(value.focus) && isTextOrNull(value.suggestedDrill) && isText(value.model);
}

// Check that a value has the shape of one of the user's stories
function isStory(value: unknown): value is StoryRecord {
  // Text fields only
  return isObject(value) && isText(value.id) && isText(value.title) && isText(value.createdAt) && isText(value.updatedAt);
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
  // Must be this version or the one before it (anything else is damaged)
  if (data.version !== VERSION && data.version !== 1) throw new Error(DAMAGED);
  // Every part must have the right shape
  const valid = isText(data.exportedAt) && Array.isArray(data.sessions) && data.sessions.every(isSession) && Array.isArray(data.challenges) && data.challenges.every(isChallenge) && isSettings(data.settings) && (data.talks === undefined || (Array.isArray(data.talks) && data.talks.every(isTalk))) && (data.analyses === undefined || (Array.isArray(data.analyses) && data.analyses.every(isAnalysis))) && (data.summaries === undefined || (Array.isArray(data.summaries) && data.summaries.every(isSummary))) && (data.stories === undefined || (Array.isArray(data.stories) && data.stories.every(isStory))) && (data.signals === undefined || (Array.isArray(data.signals) && data.signals.every(isSignals)));
  // Refuse a damaged file
  if (!valid) throw new Error(DAMAGED);
  // The file has been checked, so it can be used as an export
  const file = data as unknown as ExportFile;
  // Sessions from before warm-ups existed are full sessions
  return { ...file, signals: file.signals ?? [], talks: file.talks ?? [], analyses: file.analyses ?? [], summaries: file.summaries ?? [], stories: file.stories ?? [], sessions: file.sessions.map((session) => ({ ...session, mode: session.mode ?? "standard" })) };
}
