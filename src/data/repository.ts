// The app's single way to save and load its data; written against the Store contract

// Load the start-of-day helper for default settings
import { startOfDay } from "@/core/dates";
// Load the record types
import { COLLECTION_NAMES, type ChallengeRecord, type SessionRecord, type SettingsRecord } from "@/data/records";
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
  // Delete audio beyond the retention limit (never the baseline's); returns how many were removed
  pruneAudio(): Promise<number>;
  // Load settings, or defaults based on "now" if none are saved
  getSettings(now: Date): Promise<SettingsRecord>;
  // Save settings
  saveSettings(settings: SettingsRecord): Promise<void>;
  // Save a new challenge or update an existing one
  saveChallenge(challenge: ChallengeRecord): Promise<void>;
  // Load every challenge, newest week first
  listChallenges(): Promise<ChallengeRecord[]>;
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

    // Delete audio for sessions past the retention limit
    async pruneAudio() {
      // Read the limit (the date does not matter here, so any moment will do)
      const { audioRetention } = await getSettings(new Date());
      // Make the limit a whole number of zero or more, so a bad value cannot prune the wrong sessions
      const keep = Math.max(0, Math.floor(audioRetention) || 0);
      // Every session, newest first
      const sessions = await listSessions();
      // The first recording of each prompt, kept so "then and now" can play it beside later ones
      const firstTakes = new Set<string>();
      // Oldest first, the first session seen for each prompt is its first take
      const seenPrompts = new Set<string>();
      // Walk from the oldest
      for (const session of [...sessions].reverse()) {
        // Skip prompts already seen
        if (seenPrompts.has(session.promptId)) continue;
        // Note the prompt
        seenPrompts.add(session.promptId);
        // Keep this session's audio
        firstTakes.add(session.id);
      }
      // Find older sessions that still have audio and are neither the baseline nor a prompt's first take
      const toPrune = sessions.slice(keep).filter((session) => session.audioKey && !session.isBaseline && !firstTakes.has(session.id));
      // Remove each one's audio and clear its pointer
      for (const session of toPrune) {
        // Delete the recording
        await store.delete("audio", session.audioKey as string);
        // Keep the session but mark its audio as gone
        await store.put("sessions", session.id, { ...session, audioKey: null });
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

    // Remove everything
    async deleteAllData() {
      // Empty every collection
      for (const collection of COLLECTION_NAMES) await store.clear(collection);
    },
  };
}
