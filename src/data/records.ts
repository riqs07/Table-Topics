// The records VoiceLab stores on the device (see documents/architecture/data-model.md)
// Dates are stored as ISO text such as "2026-10-12T15:00:00.000Z" so exports round-trip exactly

// The coach's three-part feedback for one session
export interface Feedback {
  // One thing done well, quoting the user
  keep: string;
  // One specific fix, with an example from the transcript
  change: string;
  // One sentence to read before retrying
  retryCue: string;
  // For a small-talk answer: what the coach found for each beat, and a livelier version
  smallTalk?: SmallTalkFeedback;
  // For a follow-up question or a reply to a story: the beats the coach heard, and a better version
  connection?: ConnectionFeedback;
}

// The coach's notes on a follow-up question or a reply to a story
export interface ConnectionFeedback {
  // Each beat it heard, with the words that showed it
  found: Array<{ beat: string; quote: string }>;
  // A better question or reply, in the user's voice
  better: string;
}

// The coach's notes on a small-talk answer, beat by beat (an empty quote means the beat was missing)
export interface SmallTalkFeedback {
  // The speaker's words that give the moment
  moment: string;
  // Up to three details a listener could ask about, in the speaker's words
  hooks: string[];
  // The speaker's words that say how it felt
  feeling: string;
  // The question they handed back with
  handBack: string;
  // The answer as it could sound, using only facts the speaker said (gaps in square brackets)
  livelier: string;
}

// Every kind of session: a Table Topic ("talk", Toastmasters timing), a Record Response, reading aloud, a pause drill, a rehearsal of the user's own talk, a skill-path lesson, an openings and closings drill, or the retired one-minute session and 30-second warm-up, or a small-talk answer ("smalltalk", kept apart from the speech practice), or a private "one moment a day" note ("moment")
export const SESSION_MODES = ["standard", "warmup", "talk", "response", "read", "pause", "rehearse", "lesson", "bookend", "qa", "smalltalk", "moment"] as const;

// One kind of session (bookend: an openings and closings drill; qa: an answer to a likely audience question; both added 2026-10-15)
export type SessionMode = (typeof SESSION_MODES)[number];

// Whether a value names a kind of session
export function isSessionMode(value: unknown): value is SessionMode {
  // One of the listed kinds
  return typeof value === "string" && (SESSION_MODES as ReadonlyArray<string>).includes(value);
}

// The user's own notes after listening back to a session
export interface SelfReview {
  // What worked, in their words (may be empty)
  worked: string;
  // What they would change, in their words (may be empty)
  change: string;
  // Quick tags they tapped (ids from src/core/selfReview.ts)
  tags: string[];
  // True if they chose "skip this time" instead of listening
  skipped: boolean;
  // When the notes were saved (ISO text)
  savedAt: string;
}

// Where a session's feedback request stands
export type FeedbackStatus = "pending" | "done" | "failed";

// One recording and everything measured about it
export interface SessionRecord {
  // Unique identifier
  id: string;
  // When the session started (ISO text)
  createdAt: string;
  // Which prompt was used
  promptId: string;
  // True for the user's first-ever session
  isBaseline: boolean;
  // Id of the session this one retries, or null
  retryOf: string | null;
  // Full session or warm-up (warm-ups count for the streak, not for progress)
  mode: SessionMode;
  // Length of the recording in seconds
  durationSec: number;
  // Full text of what was said
  transcript: string;
  // Computed speaking speed
  wordsPerMinute: number;
  // Computed filler rate
  fillersPerMinute: number;
  // Id of the weekly focus active at the time
  focus: string;
  // The coach's feedback, or null if not received yet
  feedback: Feedback | null;
  // Whether feedback is pending, done, or failed
  feedbackStatus: FeedbackStatus;
  // Loudness readings taken every tenth of a second while recording (0 to 1, two decimals), for finding pauses; missing on older sessions
  loudness?: number[];
  // Seconds from the start when each word of the transcript was first heard (a tenth of a second, approximate); missing on older sessions
  spokenTimes?: number[];
  // For a session with text on screen: seconds when each word of that text was first read, or null if it never was; missing on older sessions
  scriptTimes?: (number | null)[];
  // For a rehearsal or a response: likely audience questions for Q&A practice (written by the coach or typed by the user)
  questions?: string[];
  // For a Q&A answer: the question it answered (its prompt id is the session the question came from)
  question?: string;
  // For a rehearsal: which section of the talk was rehearsed (counted from 0), or null or missing for the whole talk
  sectionIndex?: number | null;
  // The user's notes after listening back: null while waiting for them (new first tries), missing on older sessions and retries, which skip the step
  selfReview?: SelfReview | null;
  // Key of the saved audio, or null if there is none or it was pruned
  audioKey: string | null;
}

// One of the user's own talks, saved for Rehearse my talk (stays on the device)
export interface TalkRecord {
  // Unique id, also used as the session's prompt id
  id: string;
  // Short title shown in lists
  title: string;
  // The words of the talk, or notes
  body: string;
  // Target length in whole minutes, or null for none
  goalMinutes: number | null;
  // The day the talk will be given, as "2026-10-22", or null or missing for none
  eventDate?: string | null;
  // When it was saved (ISO text)
  createdAt: string;
}

// One weekly real-world challenge
export interface ChallengeRecord {
  // Unique identifier
  id: string;
  // The day the week began (ISO date text)
  weekStart: string;
  // The real-world task
  text: string;
  // When the user marked it done (ISO text), or null
  completedAt: string | null;
}

// One Learn card's progress (the same shape as CardProgress in src/core/learn.ts)
export interface LearnCardProgress {
  // When it was first read (ISO text)
  readAt: string;
  // Right answers in a row (0 after a miss)
  box: number;
  // When its recall question is next due (ISO text)
  dueAt: string;
  // How the last recall went
  lastResult: "right" | "wrong" | null;
  // When its recall question was last answered (ISO text; missing before 2026-10-18 or until answered)
  recalledAt?: string;
}

// The user's settings (one record)
export interface SettingsRecord {
  // Position in the v1 weekly focus list
  focusIndex: number;
  // The day the current focus began (ISO text)
  focusStartedOn: string;
  // How many recent sessions keep their audio
  audioRetention: number;
  // Whether the coach may read the user's own notes after listening back (off unless chosen; missing on older settings)
  shareNotes?: boolean;
  // Learn: each card's reading and recall progress, by card id (missing until the first card is read)
  learn?: Record<string, LearnCardProgress>;
}

// What each stored collection holds
export interface Collections {
  // Session records, keyed by session id
  sessions: SessionRecord;
  // Challenge records, keyed by challenge id
  challenges: ChallengeRecord;
  // The single settings record, under the key "settings"
  settings: SettingsRecord;
  // Recorded audio, keyed by audio key
  audio: Blob;
  // The user's own talks, keyed by talk id
  talks: TalkRecord;
}

// One collection name
export type CollectionName = keyof Collections;

// Every collection name, for creating and clearing storage
export const COLLECTION_NAMES: ReadonlyArray<CollectionName> = ["sessions", "challenges", "settings", "audio", "talks"];
