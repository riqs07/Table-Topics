// The records VoiceLab stores on the device (see documents/architecture/data-model.md)
// Dates are stored as ISO text such as "2026-10-12T15:00:00.000Z" so exports round-trip exactly

// The coach's three-part feedback for one session
// Load the short-speech plan type
import type { Outline } from "@/core/outline";

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
  // For a conversation with a character: one of your lines, and how it could sound (decision 83)
  conversation?: ConversationFeedback;
}

// The coach's notes on a conversation: one of your lines as you said it, and a better version
export interface ConversationFeedback {
  // Your words, quoted exactly
  yours: string;
  // How they could sound, in your voice, using only what was said
  better: string;
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

// Every kind of session: a Table Topic ("talk", Toastmasters timing), a Record Response, reading aloud, a pause drill, a rehearsal of the user's own talk, a skill-path lesson, an openings and closings drill, or the retired one-minute session and 30-second warm-up, or a small-talk answer ("smalltalk", kept apart from the speech practice), or a private "one moment a day" note ("moment"), or free talk about anything ("free") and a short speech the user planned themselves ("outline", decision 73), or a voice drill or shadowing, recorded take by take ("voice", decision 80), or a spoken conversation with a character ("conversation", decision 83)
export const SESSION_MODES = ["standard", "warmup", "talk", "response", "read", "pause", "rehearse", "lesson", "bookend", "qa", "smalltalk", "moment", "free", "outline", "voice", "conversation"] as const;

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
  // Loudness readings taken every tenth of a second while recording (0 to 1, two decimals), for finding pauses; missing on older sessions. A recording made without the browser's levelling is scaled by one factor (loudnessScale) so its typical speech reads about 0.2 (decision 81)
  loudness?: number[];
  // The factor the loudness readings were scaled by, for a recording made without the browser's levelling; also sets how much playback is boosted (decision 81)
  loudnessScale?: number;
  // Whether the browser's automatic levelling was on while recording: false means loudness changes across the take are real; missing when the browser could not say, and on older sessions (decision 81)
  autoGain?: boolean;
  // Pitch readings taken with the loudness, in whole hertz, or null where there was no voice; missing on older sessions (decision 81)
  pitch?: (number | null)[];
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
  // For a short speech the user planned: its topic, points and length (decision 73)
  outline?: Outline;
  // The user's notes after listening back: null while waiting for them (new first tries), missing on older sessions and retries, which skip the step
  selfReview?: SelfReview | null;
  // Key of the saved audio, or null if there is none or it was pruned
  audioKey: string | null;
  // For a voice drill or shadowing (mode "voice"): what kind, the headline, and one line per take; the takes' audio is kept only while on the page (decision 80)
  voice?: VoiceSummary;
  // For a conversation (mode "conversation"): every turn, yours and theirs, and the situation and twist it was in (missing on conversations from before decision 84, which were in the persona's own situation); no audio is kept (decisions 83 and 84)
  conversation?: { turns: ConversationTurn[]; scenarioId?: string; twist?: number };
}

// One turn of a conversation with a character (decision 83)
export interface ConversationTurn {
  // Who spoke
  who: "you" | "them";
  // What was said: the words heard from you, or their line's words (recorded or written)
  text: string;
  // For their turn from a recording, the id of the line they said (missing on written lines)
  lineId?: string;
  // How long it took, in seconds (your take, or their recording)
  seconds: number;
}

// What a voice drill or a shadowing session showed, kept with the session (decision 80)
export interface VoiceSummary {
  // The kind: clear sounds, volume, pitch and stress, tone, or shadowing
  kind: "clear" | "volume" | "pitch" | "tone" | "shadow";
  // The headline shown at the end
  headline: string;
  // Each take's name and its line
  takes: { label: string; line: string }[];
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

// One try at a mission: accepted (with a prediction) or skipped for a day, then debriefed
export interface MissionRecord {
  // Unique id for this try
  id: string;
  // The mission (ids from src/content/missions.ts)
  missionId: string;
  // The calendar day it was offered and answered ("2026-10-18")
  day: string;
  // Accepted and waiting for a debrief, skipped for the day, or debriefed
  status: "accepted" | "skipped" | "done";
  // How the user expected it to go, 1 (badly) to 5 (really well); null when skipped
  predicted: number | null;
  // Whether they tried it (null until debriefed)
  tried: boolean | null;
  // How it went, 1 to 5 (null until debriefed, or when not tried)
  outcome: number | null;
  // What they noticed, in their own words (typed or said; kept on the device)
  note: string;
  // Whether it felt like too much, so the next one steps back
  tooMuch: boolean;
  // When it was debriefed (ISO text)
  debriefedAt: string | null;
}

// How a scenario question went (decision 54)
export interface ScenarioProgress {
  // The tier of the reply chosen the first time ("best", "good", "flat" or "misstep")
  firstTier: string;
  // The tier chosen most recently
  lastTier: string;
  // When it was first answered (ISO text)
  firstAt: string;
  // When it was last answered (ISO text)
  lastAt: string;
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
  // Missions: every try, oldest first (missing until the first mission is answered)
  missions?: MissionRecord[];
  // Scenario questions: how each went, by scenario id (missing until the first is answered)
  scenarios?: Record<string, ScenarioProgress>;
  // Steps of today's practice put off with "Can't speak now?": the day (YYYY-MM-DD) and each step's key; another day's list means nothing (decision 77; missing until the first skip)
  skipped?: { day: string; steps: string[] };
  // Hide the run and the week's squares on Today (decision 78; missing means shown)
  hideStreak?: boolean;
  // When the user practises, in their words, such as "after my morning coffee" (decision 78; missing until chosen)
  anchor?: string;
  // The daily reminder's time, "HH:MM", for the calendar file (decision 78; missing until chosen)
  reminderTime?: string;
  // Show pause-word counts (decision 79; missing means shown)
  showPauseWords?: boolean;
  // "I stammer": hides pause words, repeats and fluency judgements, and tells the coach to leave fluency alone (decision 79; missing means off)
  stammer?: boolean;
  // Days a warm-up routine was finished (YYYY-MM-DD, the latest 60), since warm-ups record nothing (decision 80; missing until the first)
  warmupDays?: string[];
  // Words clear-sounds drills found hard to catch, with how often (decision 80; missing until the first)
  wordsToWatch?: Record<string, number>;
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
