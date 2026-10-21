// The app's single way to save and load its data; written against the Store contract

// Load the start-of-day helper for default settings
import { startOfDay } from "@/core/dates";
// Load the rule for which recordings lose their audio
import { audioToPrune } from "@/core/audioRetention";
// Load the record types
import { COLLECTION_NAMES, type AnalysisRecord, type ChallengeRecord, type SessionRecord, type SettingsRecord, type StoryRecord, type SummaryRecord, type TalkRecord } from "@/data/records";
// Load the storage contract
import type { Store } from "@/data/store";

// Key of the single settings record
const SETTINGS_KEY = "settings";
// Number of recent sessions that keep their audio unless the user changes it
export const DEFAULT_AUDIO_RETENTION = 30;

// Everything the app can do with its stored data
export interface Repository {
  // Save a new session or update an existing one
  saveSession(session: SessionRecord): Promise<void>;
  // Load one session by id
  getSession(id: string): Promise<SessionRecord | undefined>;
  // Load every session, newest first
  listSessions(): Promise<SessionRecord[]>;
  // Save a recording under a key
  saveAudio(key: string, audio: Blob): Promise<void>;
  // Load a recording by key
  getAudio(key: string): Promise<Blob | undefined>;
  // Delete audio beyond the retention limit (never the baseline's, nor up to 20 first takes kept for comparing); returns how many were removed
  pruneAudio(): Promise<number>;
  // Delete one recording by key
  deleteAudio(key: string): Promise<void>;
  // Load settings, or defaults based on "now" if none are saved
  getSettings(now: Date): Promise<SettingsRecord>;
  // Save settings
  saveSettings(settings: SettingsRecord): Promise<void>;
  // Save a new challenge or update an existing one
  saveChallenge(challenge: ChallengeRecord): Promise<void>;
  // Load every challenge, newest week first
  listChallenges(): Promise<ChallengeRecord[]>;
  // Save a new talk or update an existing one
  saveTalk(talk: TalkRecord): Promise<void>;
  // Load a talk by id
  getTalk(id: string): Promise<TalkRecord | undefined>;
  // Load every talk, newest first
  listTalks(): Promise<TalkRecord[]>;
  // Remove a talk (its rehearsals stay in history)
  deleteTalk(id: string): Promise<void>;
  // Save a take's measures (decision 90)
  saveAnalysis(analysis: AnalysisRecord): Promise<void>;
  // Load a take's measures by session id
  getAnalysis(sessionId: string): Promise<AnalysisRecord | undefined>;
  // Load every take's measures
  listAnalyses(): Promise<AnalysisRecord[]>;
  // Save a weekly coach summary
  saveSummary(summary: SummaryRecord): Promise<void>;
  // Load every weekly summary, newest first
  listSummaries(): Promise<SummaryRecord[]>;
  // Save one of the user's stories (decision 92)
  saveStory(story: StoryRecord): Promise<void>;
  // Load a story by its seed's id
  getStory(id: string): Promise<StoryRecord | undefined>;
  // Load every story, first told first
  listStories(): Promise<StoryRecord[]>;
  // Remove every stored record and recording
  deleteAllData(): Promise<void>;
}

// Build a repository on top of a store
export function createRepository(store: Store): Repository {
  // Load every session sorted newest first (ISO text sorts in time order)
  async function listSessions(): Promise<SessionRecord[]> {
    // Read all sessions and sort by start time, newest first
    return (await store.getAll("sessions")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // Load settings or fall back to defaults
  async function getSettings(now: Date): Promise<SettingsRecord> {
    // Read the saved settings
    const saved = await store.get("settings", SETTINGS_KEY);
    // Use them if present, otherwise start at the first focus today with the default audio limit
    return saved ?? { focusIndex: 0, focusStartedOn: startOfDay(now).toISOString(), audioRetention: DEFAULT_AUDIO_RETENTION };
  }

  // Hand back the repository's operations
  return {
    // Save a session under its id
    saveSession: (session) => store.put("sessions", session.id, session),
    // Load a session by id
    getSession: (id) => store.get("sessions", id),
    // Load every session, newest first
    listSessions,
    // Save a recording under its key
    saveAudio: (key, audio) => store.put("audio", key, audio),
    // Load a recording by key
    getAudio: (key) => store.get("audio", key),
    // Delete a recording by key
    deleteAudio: (key) => store.delete("audio", key),

    // Delete audio for sessions past the retention limit
    async pruneAudio() {
      // Read the limit (the date does not matter here, so any moment will do)
      const { audioRetention } = await getSettings(new Date());
      // Make the limit a whole number of zero or more, so a bad value cannot prune the wrong sessions
      const keep = Math.max(0, Math.floor(audioRetention) || 0);
      // Every session, newest first
      const sessions = await listSessions();
      // Older sessions that still have audio and are neither the baseline nor a first take kept for "then and now" (decision 88)
      const toPrune = audioToPrune(sessions, keep);
      // Remove each one's audio and clear its pointer
      for (const session of toPrune) {
        // Delete the recording
        await store.delete("audio", session.audioKey as string);
        // The session as it is now (feedback or notes may have been saved since the list was read)
        const latest = (await store.get("sessions", session.id)) ?? session;
        // Keep the session but mark its audio as gone
        await store.put("sessions", session.id, { ...latest, audioKey: null });
      }
      // Report how many recordings were removed
      return toPrune.length;
    },

    // Load settings or defaults
    getSettings,
    // Save settings under the single settings key
    saveSettings: (settings) => store.put("settings", SETTINGS_KEY, settings),
    // Save a challenge under its id
    saveChallenge: (challenge) => store.put("challenges", challenge.id, challenge),

    // Load every challenge, newest week first
    async listChallenges() {
      // Read all challenges and sort by week start, newest first
      return (await store.getAll("challenges")).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    },

    // Save a talk under its id
    saveTalk: (talk) => store.put("talks", talk.id, talk),
    // Load a talk by id
    getTalk: (id) => store.get("talks", id),

    // Load every talk, newest first
    async listTalks() {
      // Read all talks and sort by save time, newest first
      return (await store.getAll("talks")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    // Remove a talk by id
    deleteTalk: (id) => store.delete("talks", id),
    // Save a take's measures under its session id
    saveAnalysis: (analysis) => store.put("analyses", analysis.sessionId, analysis),
    // Load a take's measures
    getAnalysis: (sessionId) => store.get("analyses", sessionId),
    // Load every take's measures
    listAnalyses: () => store.getAll("analyses"),
    // Save a weekly summary under its id
    saveSummary: (summary) => store.put("summaries", summary.id, summary),

    // Load every weekly summary, newest first
    async listSummaries() {
      // Read all and sort by when they were written, newest first
      return (await store.getAll("summaries")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    // Save a story under its seed's id
    saveStory: (story) => store.put("stories", story.id, story),
    // Load a story
    getStory: (id) => store.get("stories", id),

    // Load every story, first told first
    async listStories() {
      // Read all and sort by when each was first told
      return (await store.getAll("stories")).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    // Remove everything
    async deleteAllData() {
      // Empty every collection
      for (const collection of COLLECTION_NAMES) await store.clear(collection);
    },
  };
}
