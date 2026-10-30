// How an imported backup joins what is already on this device (decision 86): nothing on the device is lost or unlinked. A record already here is kept and only gains what it lacks from the file; settings take the file's choices but keep any the file does not have; progress lists are joined, keeping the further-on entry for each item

// Load the record types
import type { ChallengeRecord, LearnCardProgress, ListenProgress, MissionRecord, ScenarioProgress, SceneProgress, SessionRecord, SettingsRecord, TalkRecord } from "@/data/records";
// Load the reader that makes a saved focus safe (decision 97)
import { readPracticeFocus } from "@/core/practiceFocus";
// Load the check-in settings' reader and join (decision 100)
import { mergeCheckInSettings, readCheckInSettings } from "@/core/checkIn";
// Load the safe reader for guided course progress (decision 131)
import { readCourseProgress } from "@/core/courses";

// The most warm-up days kept (the same as when they are saved)
const WARMUP_DAYS_KEPT = 60;

// A record already here, with any of its empty fields filled from the file's copy
function fillGaps<T extends object>(existing: T, incoming: T): T {
  // Start from the copy on this device
  const merged: Record<string, unknown> = { ...(existing as Record<string, unknown>) };
  // Each field in the file's copy
  for (const [key, value] of Object.entries(incoming)) {
    // Only where this device has nothing
    if (merged[key] === undefined || merged[key] === null) merged[key] = value;
  }
  // The joined record
  return merged as T;
}

// A session from the file joined with the one already here, if any: coach feedback and your notes come from whichever has them, and the recording link is never touched
export function mergeSession(existing: SessionRecord | undefined, incoming: SessionRecord): SessionRecord {
  // New to this device: the file's copy (backups carry no audio)
  if (!existing) return incoming;
  // The device's copy, with its gaps filled
  const merged = fillGaps(existing, incoming);
  // Feedback only in the file: its status comes with it
  const feedbackStatus = existing.feedback === null && incoming.feedback !== null ? incoming.feedbackStatus : existing.feedbackStatus;
  // Whether its readings were dropped stays this device's own fact: the file's mark is taken off (decision 98)
  const { trimmedAt: fileTrimmed, ...rest } = merged;
  // (the file's mark is not used)
  void fileTrimmed;
  // The recording stays linked as it was, and this device's mark is kept when it has one
  return { ...rest, feedbackStatus, audioKey: existing.audioKey, ...(existing.trimmedAt ? { trimmedAt: existing.trimmedAt } : {}) };
}

// A challenge or talk from the file joined with the one already here, if any (one marked done stays done)
export function mergeRecord<T extends ChallengeRecord | TalkRecord>(existing: T | undefined, incoming: T): T {
  // New here, or the device's copy with its gaps filled
  return existing ? fillGaps(existing, incoming) : incoming;
}

// When a Learn card was last used
const learnedAt = (progress: LearnCardProgress) => progress.recalledAt ?? progress.readAt;

// Two maps by id joined, keeping the later entry where both have one
function joinMaps<T>(here: Record<string, T> | undefined, there: Record<string, T> | undefined, later: (a: T, b: T) => T): Record<string, T> | undefined {
  // Neither has any
  if (!here && !there) return undefined;
  // Start from the file's
  const joined: Record<string, T> = { ...there };
  // Each entry here
  for (const [id, entry] of Object.entries(here ?? {})) {
    // The file's entry for it
    const other = joined[id];
    // Kept, or the later of the two
    joined[id] = other === undefined ? entry : later(entry, other);
  }
  // The joined map
  return joined;
}

// How far a mission try got: done beats accepted beats skipped
const missionRank = (mission: MissionRecord) => (mission.status === "done" ? 2 : mission.status === "accepted" ? 1 : 0);

// Two lists of mission tries joined by id, keeping the further-on try, oldest day first
function joinMissions(here: MissionRecord[] | undefined, there: MissionRecord[] | undefined): MissionRecord[] | undefined {
  // Neither has any
  if (!here && !there) return undefined;
  // By id, starting from the file's
  const byId = new Map((there ?? []).map((mission) => [mission.id, mission]));
  // Each try here
  for (const mission of here ?? []) {
    // The file's copy
    const other = byId.get(mission.id);
    // Kept unless the file's got further
    byId.set(mission.id, other && missionRank(other) > missionRank(mission) ? other : mission);
  }
  // Oldest day first
  return [...byId.values()].sort((a, b) => a.day.localeCompare(b.day));
}

// The settings on this device joined with the file's: the file's choices, the device's where the file has none, and progress joined
export function mergeSettings(existing: SettingsRecord, incoming: SettingsRecord): SettingsRecord {
  // The file's choices over the device's
  const merged: SettingsRecord = { ...existing, ...incoming };
  // Learn cards: both, the more recently used where both have one
  const learn = joinMaps(existing.learn, incoming.learn, (a, b) => (learnedAt(b) > learnedAt(a) ? b : a));
  // Scenario questions: both, the more recently answered where both have one
  const scenarios = joinMaps<ScenarioProgress>(existing.scenarios, incoming.scenarios, (a, b) => (b.lastAt > a.lastAt ? b : a));
  // Scenes and Active listening stories: both, the more recently played where both have one (decisions 149 and 150)
  const scenes = joinMaps<SceneProgress>(existing.scenes, incoming.scenes, (a, b) => (b.lastAt > a.lastAt ? b : a));
  // (stories)
  const listening = joinMaps<ListenProgress>(existing.listening, incoming.listening, (a, b) => (b.lastAt > a.lastAt ? b : a));
  // Words to watch: both, the higher count where both have one
  const wordsToWatch = joinMaps(existing.wordsToWatch, incoming.wordsToWatch, (a, b) => Math.max(a, b));
  // Mission tries: both, the further-on where both have one
  const missions = joinMissions(existing.missions, incoming.missions);
  // Guided course parts: both, read safely; where both have one, the one answered again, otherwise the later (decision 131)
  const courses = joinMaps(readCourseProgress(existing.courses), readCourseProgress(incoming.courses), (a, b) => (!!b.revisitedAt !== !!a.revisitedAt ? (b.revisitedAt ? b : a) : b.doneAt > a.doneAt ? b : a));
  // Warm-up days: both, the latest few
  const warmupDays = existing.warmupDays || incoming.warmupDays ? [...new Set([...(existing.warmupDays ?? []), ...(incoming.warmupDays ?? [])])].sort().slice(-WARMUP_DAYS_KEPT) : undefined;
  // Steps put off: the later day's list
  const skipped = existing.skipped && incoming.skipped ? (incoming.skipped.day > existing.skipped.day ? incoming.skipped : existing.skipped) : (incoming.skipped ?? existing.skipped);
  // The focus, made safe: an edited or damaged backup's unknown areas are dropped (decision 97)
  const practiceFocus = readPracticeFocus(merged.practiceFocus);
  // The check-in's day and choice from the file, its skipped parts and reminders seen joined with this device's, each made safe (decision 100)
  const checkIn = mergeCheckInSettings(readCheckInSettings(existing.checkIn), readCheckInSettings(incoming.checkIn));
  // (without the file's unchecked copy)
  delete merged.checkIn;
  // Each joined part, only where there is one
  return { ...merged, ...(checkIn ? { checkIn } : {}), ...(practiceFocus ? { practiceFocus } : {}), ...(learn ? { learn } : {}), ...(scenarios ? { scenarios } : {}), ...(scenes ? { scenes } : {}), ...(listening ? { listening } : {}), ...(wordsToWatch ? { wordsToWatch } : {}), ...(missions ? { missions } : {}), ...(courses && Object.keys(courses).length > 0 ? { courses } : {}), ...(warmupDays ? { warmupDays } : {}), ...(skipped ? { skipped } : {}) };
}
