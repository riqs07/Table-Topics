// The app's single way to save and load its data; written against the Store contract

// Load the start-of-day helper for default settings
import { startOfDay } from "@/core/dates";
// Load the rule that keeps a take's readings apart from its session (decision 98)
import { joinSignals, splitSignals } from "@/core/sessionSignals";
// Load the word splitter, to rebuild an analysis's words while the take keeps its word times (decision 98)
import { timedWords } from "@/core/analysis/timedWords";
// Load the record types
import { USER_COLLECTIONS, type AnalysisRecord, type ChallengeRecord, type FullSession, type SelfRating, type SessionRecord, type SettingsRecord, type SignalsRecord, type StoryRecord, type SummaryRecord, type TalkRecord } from "@/data/records";
// Load the storage contract
import type { Store, StoreOp } from "@/data/store";

// Key of the single settings record
const SETTINGS_KEY = "settings";
// The count once used by the old "keep the last N" rule, still written so older copies of the app can read the settings (decision 98)
export const DEFAULT_AUDIO_RETENTION = 30;

// Records to save together in one transaction (an import's chunk, decision 98)
export interface RecordBatch {
  // Sessions, with or without their readings inline (readings are moved to their own record)
  sessions?: ReadonlyArray<SessionRecord | FullSession>;
  // Readings to save under their session ids
  signals?: ReadonlyArray<SignalsRecord>;
  // Takes' analyses (their words are not stored)
  analyses?: ReadonlyArray<AnalysisRecord>;
  // Weekly challenges
  challenges?: ReadonlyArray<ChallengeRecord>;
  // Saved talks
  talks?: ReadonlyArray<TalkRecord>;
  // Weekly summaries
  summaries?: ReadonlyArray<SummaryRecord>;
  // Stories
  stories?: ReadonlyArray<StoryRecord>;
}

// Everything the app can do with its stored data
export interface Repository {
  // Save a new session or update an existing one; readings in it are kept apart, and readings saved earlier stay when it has none (decision 98)
  saveSession(session: SessionRecord | FullSession): Promise<void>;
  // Load one session by id, without its readings
  getSession(id: string): Promise<SessionRecord | undefined>;
  // Load one session with its readings, for the take's page, the analysis and the coach (decision 98)
  getFullSession(id: string): Promise<FullSession | undefined>;
  // Load a take's readings, if they are still kept
  getSignals(sessionId: string): Promise<SignalsRecord | undefined>;
  // Load several sessions by id, in the same order (undefined where missing)
  getSessions(ids: ReadonlyArray<string>): Promise<Array<SessionRecord | undefined>>;
  // Load every session, newest first (read once and shared until something is saved, decision 99)
  listSessions(): Promise<SessionRecord[]>;
  // Load the sessions still waiting for coach feedback, oldest first, through the database's lookup (no full read; decision 99)
  listPendingSessions(): Promise<SessionRecord[]>;
  // Star a take, or take its star away: a starred take keeps its recording and readings (decision 98)
  setStarred(id: string, starred: boolean): Promise<void>;
  // Save how the speaker said a take felt, asked before its results (decision 116)
  setSelfRating(id: string, rating: SelfRating): Promise<void>;
  // Save a recording under a key
  saveAudio(key: string, audio: Blob): Promise<void>;
  // Load a recording by key
  getAudio(key: string): Promise<Blob | undefined>;
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
  // Save a take's measures (decision 90); its words are left out, since they are rebuilt from the transcript (decision 98)
  saveAnalysis(analysis: AnalysisRecord): Promise<void>;
  // Load a take's measures by session id, as stored (without its words)
  getAnalysis(sessionId: string): Promise<AnalysisRecord | undefined>;
  // Load a take's measures ready to be worked on again: its words rebuilt while the take keeps its word times, left out once they were dropped (decision 98)
  getWorkingAnalysis(sessionId: string): Promise<AnalysisRecord | undefined>;
  // Load several analyses by session id, in the same order
  getAnalyses(sessionIds: ReadonlyArray<string>): Promise<Array<AnalysisRecord | undefined>>;
  // Load every take's measures (read once and shared until something is saved)
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
  // Save many records together, all or none (an import's chunk; decision 99)
  saveBatch(records: RecordBatch): Promise<void>;
  // Remove every stored record and recording
  deleteAllData(): Promise<void>;
  // The store underneath, for upkeep that works on it directly (moving older records, dropping old readings)
  readonly store: Store;
  // Say that the stored data changed outside the methods above, so shared reads are made again here and in other tabs
  changed(): void;
}

// What a repository can be given besides its store
export interface RepositoryOptions {
  // A way to hear about, and tell, other tabs that the data changed (the browser's BroadcastChannel; missing in tests)
  channel?: { postMessage(message: unknown): void; addEventListener(type: "message", listener: () => void): void } | null;
}

// An analysis as stored: without its words, which are rebuilt from the transcript when needed (decision 98)
export function storedAnalysis(analysis: AnalysisRecord): AnalysisRecord {
  // Nothing to leave out
  if (analysis.raw.timedWords === undefined) return analysis;
  // The raw features without the words
  const { timedWords: _words, ...raw } = analysis.raw;
  // Mark the words as deliberately left out, so the linter knows they are unused on purpose
  void _words;
  // The same record with the smaller raw features
  return { ...analysis, raw };
}

// The changes that save one session: the small record, and its readings when it carries any (readings saved earlier stay when it carries none)
function sessionOps(session: SessionRecord | FullSession): StoreOp[] {
  // Split the readings out
  const parts = splitSignals(session);
  // The session, and its readings when present
  return [{ kind: "put", collection: "sessions", key: session.id, value: parts.session }, ...(parts.signals ? [{ kind: "put" as const, collection: "signals" as const, key: session.id, value: parts.signals }] : [])];
}

// Build a repository on top of a store
export function createRepository(store: Store, options: RepositoryOptions = {}): Repository {
  // Every session newest first, read once and shared until something is saved (null when it must be read again)
  let sessionsShared: Promise<SessionRecord[]> | null = null;
  // Every analysis, shared the same way
  let analysesShared: Promise<AnalysisRecord[]> | null = null;

  // Forget the shared reads, so the next ones read the store again
  function forget(): void {
    // Sessions read again
    sessionsShared = null;
    // Analyses read again
    analysesShared = null;
  }

  // Forget the shared reads here and tell other tabs to do the same
  function changed(): void {
    // Here
    forget();
    // Other tabs (telling them can fail if the channel was closed; nothing is lost then)
    try {
      // The message itself carries nothing: any change means "read again"
      options.channel?.postMessage("changed");
    } catch {
      // Nothing more to do
    }
  }

  // Another tab saved something: read again next time
  options.channel?.addEventListener("message", forget);

  // Wait for a write, then forget the shared reads (also when it fails, since part of it may have been saved)
  async function writing<T>(work: Promise<T>): Promise<T> {
    // The write can fail
    try {
      // Wait for it
      return await work;
    } finally {
      // Read again next time
      changed();
    }
  }

  // Load every session sorted newest first (ISO text sorts in time order), sharing one read between callers
  async function listSessions(): Promise<SessionRecord[]> {
    // Start a read if none is shared
    if (!sessionsShared) {
      // Read and sort (a plain comparison: the dates are ISO text of the same shape)
      const reading = store.getAll("sessions").then((sessions) => sessions.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)));
      // Shared from now on
      sessionsShared = reading;
      // A failed read is not shared, so the next call tries again
      reading.catch(() => {
        // Only if it is still the shared one
        if (sessionsShared === reading) sessionsShared = null;
      });
    }
    // A copy of the list, so a caller sorting or filtering in place never changes what others see
    return [...(await sessionsShared)];
  }

  // Load every analysis, sharing one read between callers
  async function listAnalyses(): Promise<AnalysisRecord[]> {
    // Start a read if none is shared
    if (!analysesShared) {
      // Read them
      const reading = store.getAll("analyses");
      // Shared from now on
      analysesShared = reading;
      // A failed read is not shared
      reading.catch(() => {
        // Only if it is still the shared one
        if (analysesShared === reading) analysesShared = null;
      });
    }
    // A copy of the list
    return [...(await analysesShared)];
  }

  // Load settings or fall back to defaults
  async function getSettings(now: Date): Promise<SettingsRecord> {
    // Read the saved settings
    const saved = await store.get("settings", SETTINGS_KEY);
    // Use them if present, otherwise start at the first focus today (no number of days saved means the default, 14; decision 98)
    return saved ?? { focusIndex: 0, focusStartedOn: startOfDay(now).toISOString(), audioRetention: DEFAULT_AUDIO_RETENTION };
  }

  // Load a session with its readings joined back
  async function getFullSession(id: string): Promise<FullSession | undefined> {
    // The session
    const session = await store.get("sessions", id);
    // None
    if (!session) return undefined;
    // With its readings
    return joinSignals(session, await store.get("signals", id));
  }

  // Hand back the repository's operations
  return {
    // Save a session and its readings together
    saveSession: (session) => writing(store.batch(sessionOps(session))),
    // Load a session by id
    getSession: (id) => store.get("sessions", id),
    // Load a session with its readings
    getFullSession,
    // Load a take's readings
    getSignals: (sessionId) => store.get("signals", sessionId),
    // Load several sessions
    getSessions: (ids) => store.getMany("sessions", ids),
    // Load every session, newest first
    listSessions,

    // Load the waiting sessions, oldest first
    async listPendingSessions() {
      // Through the lookup, then sorted oldest first
      return (await store.getAllWhere("sessions", "feedbackStatus", "pending")).sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
    },

    // Star or unstar a take, changing only that field of the session as stored now
    setStarred: (id, starred) => writing(store.batch([{ kind: "update", collection: "sessions", key: id, change: (stored) => (stored ? { ...stored, starred } : undefined) }])),
    // Save the speaker's own call on a take, in the same way (decision 116)
    setSelfRating: (id, selfRating) => writing(store.batch([{ kind: "update", collection: "sessions", key: id, change: (stored) => (stored ? { ...stored, selfRating } : undefined) }])),
    // Save a recording under its key
    saveAudio: (key, audio) => store.put("audio", key, audio),
    // Load a recording by key
    getAudio: (key) => store.get("audio", key),
    // Delete a recording by key
    deleteAudio: (key) => store.delete("audio", key),
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
    // Save a take's measures under its session id, without its words
    saveAnalysis: (analysis) => writing(store.put("analyses", analysis.sessionId, storedAnalysis(analysis))),
    // Load a take's measures
    getAnalysis: (sessionId) => store.get("analyses", sessionId),

    // Load a take's measures with their words rebuilt when the take still has them
    async getWorkingAnalysis(sessionId) {
      // The analysis, the session and its readings
      const [analysis, session, signals] = await Promise.all([store.get("analyses", sessionId), store.get("sessions", sessionId), store.get("signals", sessionId)]);
      // Nothing to work on
      if (!analysis) return undefined;
      // Words saved in an older record are used as they are
      if (analysis.raw.timedWords) return analysis;
      // The session's readings, inline on an older record or kept apart
      const full = session ? joinSignals(session, signals) : undefined;
      // Without the session, or once its readings were dropped, the words cannot be rebuilt the same way: left out, so the measures keep their values
      if (!full || full.trimmedAt) return analysis;
      // Rebuilt exactly as the analysis first took them
      return { ...analysis, raw: { ...analysis.raw, timedWords: timedWords(full.transcript, full.spokenTimes) } };
    },

    // Load several analyses
    getAnalyses: (sessionIds) => store.getMany("analyses", sessionIds),
    // Load every take's measures
    listAnalyses,
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

    // Save many records in one transaction
    saveBatch(records) {
      // Every change, collection by collection
      const ops: StoreOp[] = [
        // Sessions, with their readings kept apart
        ...(records.sessions ?? []).flatMap(sessionOps),
        // Readings given on their own
        ...(records.signals ?? []).map((signals): StoreOp => ({ kind: "put", collection: "signals", key: signals.sessionId, value: signals })),
        // Analyses, without their words
        ...(records.analyses ?? []).map((analysis): StoreOp => ({ kind: "put", collection: "analyses", key: analysis.sessionId, value: storedAnalysis(analysis) })),
        // Challenges
        ...(records.challenges ?? []).map((challenge): StoreOp => ({ kind: "put", collection: "challenges", key: challenge.id, value: challenge })),
        // Talks
        ...(records.talks ?? []).map((talk): StoreOp => ({ kind: "put", collection: "talks", key: talk.id, value: talk })),
        // Summaries
        ...(records.summaries ?? []).map((summary): StoreOp => ({ kind: "put", collection: "summaries", key: summary.id, value: summary })),
        // Stories
        ...(records.stories ?? []).map((story): StoreOp => ({ kind: "put", collection: "stories", key: story.id, value: story })),
      ];
      // Saved together
      return writing(store.batch(ops));
    },

    // Remove everything the user made (the layout facts stay)
    async deleteAllData() {
      // Empty every collection of the user's data
      await writing((async () => {
        // One at a time
        for (const collection of USER_COLLECTIONS) await store.clear(collection);
      })());
    },

    // The store underneath
    store,
    // Read again after a change made on the store directly
    changed,
  };
}
