// The records VoiceLab stores on the device (see documents/architecture/data-model.md)

// Load the tiny fingerprint's shape (decision 115)
import type { MiniFingerprint } from "@/core/miniFingerprint";
// Dates are stored as ISO text such as "2026-10-12T15:00:00.000Z" so exports round-trip exactly

// The coach's three-part feedback for one session
// Load the short-speech plan type
import type { Outline } from "@/core/outline";
// Load the focus area type (decision 97)
import type { FocusAreaId } from "@/core/practiceFocus";

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
  // For a story: the beats heard, and one of your lines as it could sound (decision 92)
  story?: StoryFeedback;
}

// The beats of a told story the coach listens for (decision 92)
export const STORY_BEATS = ["setting", "stakes", "turn", "ending", "meaning"] as const;

// One beat of a told story
export type StoryBeat = (typeof STORY_BEATS)[number];

// The coach's notes on a story: each beat it heard with the words that showed it, and one line made better
export interface StoryFeedback {
  // Each beat heard, with the speaker's words that showed it (missing beats are left out)
  beats: Array<{ beat: StoryBeat; quote: string }>;
  // One of the speaker's lines, quoted exactly
  yours: string;
  // How it could sound, in their voice, inventing nothing
  better: string;
  // For a guided story: what they brought to the facts beyond the facts themselves, and what is still flat, in a sentence or two (decision 93)
  broughtToLife?: string;
}

// A story's optional shape (decision 92)
export type StoryShape = "classic" | "but-therefore" | "then-now" | "small-moment";

// The one thing to try in this telling, or none (decision 92)
export type StoryFocus = "middle" | "dialogue" | "detail" | "point" | "minute";

// How long to tell it: about a minute, or two to three (decision 92)
export type StoryLength = "short" | "full";

// What one telling of a story was set up with; the story itself is named by the session's prompt id (its seed: a prompt from the bank, or "moment-" and a moment note's id), so every telling of the same seed is a version of the same story (decision 92)
export interface StoryTake {
  // The shape shown while planning
  shape: StoryShape;
  // The focus, or null for none
  focus: StoryFocus | null;
  // The length chosen
  length: StoryLength;
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

// Every kind of session: a Table Topic ("talk", Toastmasters timing), a Record Response, reading aloud, a pause drill, a rehearsal of the user's own talk, a skill-path lesson, an openings and closings drill, or the retired one-minute session and 30-second warm-up, or a small-talk answer ("smalltalk", kept apart from the speech practice), or a private "one moment a day" note ("moment"), or free talk about anything ("free") and a short speech the user planned themselves ("outline", decision 73), or a voice drill or shadowing, recorded take by take ("voice", decision 80), or a spoken conversation with a character ("conversation", decision 83), or a told story ("story", decision 92)
export const SESSION_MODES = ["standard", "warmup", "talk", "response", "read", "pause", "rehearse", "lesson", "bookend", "qa", "smalltalk", "moment", "free", "outline", "voice", "conversation", "story"] as const;

// One kind of session (bookend: an openings and closings drill; qa: an answer to a likely audience question; both added 2026-10-15, both since retired, decisions 61 and 106, and kept so older sessions still read and import)
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
  // The factor the loudness readings were scaled by, for a recording made without the browser's levelling; also sets how much playback is boosted (decision 81)
  loudnessScale?: number;
  // Whether the browser's automatic levelling was on while recording: false means loudness changes across the take are real; missing when the browser could not say, and on older sessions (decision 81)
  autoGain?: boolean;
  // The take's pitch range in semitone steps, saved with the take so the "usual range" needs no readings (decision 98); missing when too little voice was heard, and on takes from before it, which work it out from their readings
  pitchRange?: number;
  // Starred by the user on the take's page: its recording and detailed readings are kept however old it is (decision 98)
  starred?: boolean;
  // A marker take, such as the weekly check-in's: kept like a starred one, so "how you sounded then" always has something to play (decision 98)
  marker?: boolean;
  // A tiny copy of the take's shape for History (decision 115): loudness in 32 parts (0 to 9) and the parts with pause words, made when saved or at idle from the readings; null when there was nothing to draw, missing until made
  fingerprint?: MiniFingerprint | null;
  // When the detailed readings (pitch, loudness and word times) were dropped by the retention rule, so pages say so instead of drawing a chart (decision 98); missing while they are kept
  trimmedAt?: string;
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
  conversation?: { turns: ConversationTurn[]; scenarioId?: string; twist?: number; difficulty?: ConversationDifficulty; turnMode?: ConversationTurnMode };
  // For a told story (mode "story"): its shape, focus and length; the story is the prompt id (decision 92)
  story?: StoryTake;
  // For a take in the weekly check-in: which check-in, its number and which of the four parts (decision 100); missing on every other take
  checkIn?: CheckInTake;
  // How the speaker said the take felt, asked once before its results (decision 116); missing when the question was skipped or not asked
  selfRating?: SelfRating;
  // For a round of a 4/3/2 loop: the loop it belongs to, which round, and its target length (decision 118); missing on every other take
  loop?: LoopTake;
}

// The scales a take can be rated on before its results (decision 116): its pace, or (for a story) how lively it sounded
export const RATING_SCALES = ["pace", "liveliness"] as const;

// One scale
export type RatingScale = (typeof RATING_SCALES)[number];

// The answers, three per scale: rushed, about right or slow for pace; flat, OK or lively for liveliness
export const RATING_ANSWERS = ["rushed", "right", "slow", "flat", "ok", "lively"] as const;

// One answer
export type RatingAnswer = (typeof RATING_ANSWERS)[number];

// Whether a value names a rating scale
export function isRatingScale(value: unknown): value is RatingScale {
  // One of the two
  return typeof value === "string" && (RATING_SCALES as ReadonlyArray<string>).includes(value);
}

// Whether a value names a rating answer
export function isRatingAnswer(value: unknown): value is RatingAnswer {
  // One of the six
  return typeof value === "string" && (RATING_ANSWERS as ReadonlyArray<string>).includes(value);
}

// The scale an answer belongs to: rushed, right and slow are about pace; flat, OK and lively about liveliness
export function answerScale(answer: RatingAnswer): RatingScale {
  // Pace answers, then the rest
  return answer === "rushed" || answer === "right" || answer === "slow" ? "pace" : "liveliness";
}

// The speaker's own call on a take, saved before its results showed (decision 116)
export interface SelfRating {
  // What was asked about
  scale: RatingScale;
  // The answer tapped
  answer: RatingAnswer;
  // When it was tapped (ISO text)
  ratedAt: string;
}

// One round of a 4/3/2 loop: the same content three times in one sitting, each round shorter (decision 118)
export interface LoopTake {
  // The loop's id, shared by its three rounds
  id: string;
  // Which round, 1 to 3
  round: number;
  // The round's target length in seconds (its red light)
  targetSec: number;
}

// The four parts of the weekly check-in, in the order they are done (decision 100): the same passage read aloud, the same two-minute pitch, a story and a surprise question from matched pools
export const CHECK_IN_PARTS = ["read", "pitch", "story", "surprise"] as const;

// One part of the weekly check-in
export type CheckInPart = (typeof CHECK_IN_PARTS)[number];

// Whether a value names a part of the check-in
export function isCheckInPart(value: unknown): value is CheckInPart {
  // One of the four
  return typeof value === "string" && (CHECK_IN_PARTS as ReadonlyArray<string>).includes(value);
}

// What a take in the weekly check-in carries, linking the four parts (decision 100)
export interface CheckInTake {
  // The check-in's id: "ci-" and the day it was done, such as "ci-2026-10-21"
  id: string;
  // Its number: 1 for the first check-in (the baseline), counted in order
  week: number;
  // Which part this take is
  part: CheckInPart;
}

// The weekly check-in's choices and small history, kept in the settings (decision 100)
export interface CheckInSettings {
  // The day of the week it falls on (0 Sunday to 6 Saturday), when chosen; missing means the day of the first check-in
  day?: number;
  // Parts put aside with "Skip this part", by check-in id (the latest 60 check-ins)
  skipped?: Array<{ id: string; parts: CheckInPart[] }>;
  // The "Hear how far you've come" reminders put aside or opened, as days after the first check-in (7, 14, 30, 60...)
  seen?: number[];
  // Which check-in recordings are kept: every one (missing or "all"), or the first, the last 12 and the first of each month ("thinned")
  keep?: "all" | "thinned";
}

// A take's detailed readings, kept apart from the session in the "signals" collection so lists of sessions stay small; they are loaded only where they are drawn or measured (decision 98)
export interface SessionSignals {
  // Loudness readings taken every tenth of a second while recording (0 to 1, two decimals), for finding pauses; missing on older sessions. A recording made without the browser's levelling is scaled by one factor (loudnessScale) so its typical speech reads about 0.2 (decision 81)
  loudness?: number[];
  // Pitch readings taken with the loudness, in whole hertz, or null where there was no voice; missing on older sessions (decision 81)
  pitch?: (number | null)[];
  // Seconds from the start when each word of the transcript was first heard (a tenth of a second, approximate); missing on older sessions
  spokenTimes?: number[];
  // For a session with text on screen: seconds when each word of that text was first read, or null if it never was; missing on older sessions
  scriptTimes?: (number | null)[];
}

// The names of the detailed readings, in the order they are listed in the data model
export const SIGNAL_FIELDS = ["loudness", "pitch", "spokenTimes", "scriptTimes"] as const;

// One take's detailed readings as stored, under its session's id (decision 98)
export interface SignalsRecord extends SessionSignals {
  // The session they belong to
  sessionId: string;
}

// A session together with its detailed readings, as the take's page, the analysis and the coach request use it
export type FullSession = SessionRecord & SessionSignals;

// Small facts about the stored data itself, under the key "schema" (decision 98)
export interface MetaRecord {
  // The layout version the stored records have been moved to (2 since decision 98: readings apart from sessions)
  schema: number;
  // When the last move finished (ISO text)
  migratedAt: string;
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
  // When the speaking began and ended, in seconds from the start of the conversation (decision 120): your speech as the microphone heard it, their line from its first sound to its last. Missing on conversations from before, and when it could not be told
  at?: number;
  // (when it ended)
  end?: number;
  // True when this turn was cut short by the other speaker: you tapped or talked over them, or they cut in on a long turn of yours (decision 120)
  cut?: boolean;
}

// How hard the persona makes a conversation (decision 120): easy, normal (the usual) or hard
export type ConversationDifficulty = "easy" | "normal" | "hard";

// How turns ended in a conversation (decisions 101, 119 and 121): tap, automatically, live (AssemblyAI) or a phone call (the ElevenLabs agent)
export type ConversationTurnMode = "tap" | "auto" | "live" | "call";

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

// A conversation's timing measures (decision 120), worked out from its turns' times: null where the turns were not timed
export interface ConversationTimingRaw {
  // Median gap from the end of their line to the start of your reply, in seconds, or null
  replyGapMedian: number | null;
  // Times you cut them short
  interruptionsByYou: number | null;
  // Times they cut you short
  interruptionsReceived: number | null;
  // Seconds both of you were talking at once
  overlapSeconds: number | null;
  // Your turns that were only a listening sound ("mm-hm", "right")
  backchannels: number;
}

// The user's settings (one record)
export interface SettingsRecord {
  // Position in the v1 weekly focus list
  focusIndex: number;
  // The day the current focus began (ISO text)
  focusStartedOn: string;
  // How many recent sessions kept their audio before decision 98; still written so older copies of the app can read the settings, but no longer used
  audioRetention: number;
  // How many days of recordings keep their audio: 7, 14 or 30 (decision 98; missing means 14). Starred takes, marker takes and the very first recording keep theirs regardless
  recordingDays?: number;
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
  // "Send my recordings for deeper analysis": each saved take's audio goes once to the server for transcription and voice analysis (decision 91; missing means off)
  deepAnalysis?: boolean;
  // What the user wants to get better at most: one or two areas, picked at the welcome, on Today or in Settings (decision 97). Missing means never asked; an empty list means asked and left open (the usual mix)
  practiceFocus?: FocusAreaId[];
  // The weekly check-in's day, skipped parts, reminders seen and which recordings it keeps (decision 100; missing until the first is used)
  checkIn?: CheckInSettings;
  // How a turn of yours ends in a conversation: "tap" (tap Done), "auto" (ends when you stop talking; decision 101) or "live" (a streaming service's end-of-turn model, beta, uses live minutes; decision 119). Missing means automatically
  turnEnding?: "tap" | "auto" | "live" | "call";
  // "I'm using headphones": in a live conversation, talking over the persona stops them (decision 119; missing means off, since a phone speaker's sound would be heard as you)
  headphones?: boolean;
  // How hard the persona makes a conversation, the last one chosen before starting (decision 120; missing means normal)
  conversationDifficulty?: ConversationDifficulty;
}

// Where a measure came from (decision 90): the phone itself, a transcription service, the voice worker, or the coach's rubric
export type MetricSource = "device" | "transcript" | "voice" | "rubric";

// One measured value in a take's analysis, with where it came from, so a later, better engine can replace it without mixing definitions (decision 90)
export interface MetricValue {
  // The number, or null when it could not be measured on this take
  value: number | null;
  // Its unit, such as "words/min" or "%"
  unit: string;
  // Which kind of engine measured it
  source: MetricSource;
  // The exact engine, such as "device-v1" or "device-heuristic-v1"
  engine: string;
}

// One engine that contributed to an analysis, and its version
export interface EngineInfo {
  // Its name, such as "device"
  name: string;
  // Its version
  version: string;
  // When it ran (ISO text)
  at: string;
}

// One word of the transcript (lower case, letters and apostrophes only; empty for a piece with no letters) with the time it was first heard (seconds, approximate) and when the next word started (null when not known)
export interface TimedWord {
  // The word as heard
  w: string;
  // When it was first heard, or null when word times were not saved
  s: number | null;
  // When the next word was first heard, or null
  e: number | null;
}

// One silence of a quarter second or more between the first and last word
export interface PauseSpan {
  // When it started, in seconds
  start: number;
  // When it ended, in seconds
  end: number;
  // The position of the first word heard after it (in the timed words), or null without word times
  nextWord: number | null;
}

// What the analysis keeps so every phone measure can be worked out again without the audio (decision 90); the loudness and pitch readings themselves stay on the session
export interface AnalysisRaw {
  // The kind of session and its length
  mode: SessionMode;
  // Length in seconds
  durationSec: number;
  // The pause-word rate saved on the session (a reading only counts words added to its text)
  fillersPerMinute: number;
  // Each word with its time (null times when word times were not saved). Not stored since decision 98: it is rebuilt from the transcript and the take's word times when the measures are worked out again, and is missing once the take's readings were dropped
  timedWords?: TimedWord[];
  // Every pause of a quarter second or more
  pauses: PauseSpan[];
  // Where the pauses came from: the loudness readings, gaps between word times, or nowhere
  pauseSource: "loudness" | "word-gaps" | "none";
  // When speech started and ended, in seconds, or null when no speech was found
  speech: { first: number; last: number } | null;
  // Loudness while speaking, when recorded: the average, its spread as a share of the average, each third's average, and whether the browser levelled it
  loudness: { mean: number; cv: number; thirds: [number, number, number] | null; autoGain: boolean | null } | null;
  // Pitch, when recorded: the usual pitch in hertz, the 10th-to-90th percentile range and the spread in semitones, and how phrases ended
  pitch: { medianHz: number; rangeSt: number; sdSt: number; ends: { fall: number; level: number; rise: number } } | null;
  // Phrases that faded at the end, of those long enough to judge
  fading: { faded: number; stretches: number } | null;
  // The first 30 seconds against the rest: words a minute and pauses a minute, when the take is long enough
  firstPart: { firstWpm: number; restWpm: number; firstPausesPerMin: number; restPausesPerMin: number } | null;
  // Content words (stop words removed) with how often each was said, the 300 most used
  contentWords: Record<string, number>;
  // For a conversation: your share of the words, your questions, follow-ups and turns
  conversation?: { share: number | null; questions: number; followUps: number; turns: number; timing?: ConversationTimingRaw };
  // For a told story: what the phone's story checks found (decision 92)
  story?: StoryRaw;
}

// What the phone's story checks found in a told story, kept so its story measures can be worked out again (decision 92)
export interface StoryRaw {
  // Someone's words were reported ("she said", "I was like", a quote)
  dialogue: boolean;
  // How many specific details were heard (numbers, names, places, times), up to five
  details: number;
  // A turn or a problem ("but", "suddenly", "turns out")
  turn: boolean;
  // How many times "and then" was said
  andThen: number;
  // Whether the first sentence started in the action rather than a lead-in, or null with no words
  startsInAction: boolean | null;
  // A feeling word was heard
  feeling: boolean;
  // The last sentence stated a point or a change
  endsOnPoint: boolean;
  // For a guided story: how many of the five things beyond the facts were added (a feeling, someone's words, a turn, details, a point), and how many of its facts were heard of how many (decision 93)
  guided?: { added: number; factsHeard: number; facts: number };
}

// One rubric score from the coach: 0 to 3, with the speaker's words that back it
export interface RubricScore {
  // 0 (missing) to 3 (clearly there)
  score: number;
  // A short quote that backs the score
  quote: string;
}

// The coach's internal rubric for one take (decision 90): never shown as scores, kept for the profile
export interface RubricRecord {
  // Main point in the first sentence or two
  pointFirst: RubricScore;
  // Answers the question asked, or null when there was no question
  answersQuestion: RubricScore | null;
  // A clear opening, body and close
  structure: RubricScore;
  // Ends on a clear last line
  ending: RubricScore;
  // At least one specific example, number or story
  concreteExample: RubricScore;
  // Precise, vivid word choice
  wordChoice: RubricScore;
  // Devices used: contrast, rule of three, question, story
  devices: string[];
  // Hedges the coach judged unnecessary
  unnecessaryHedges: number;
  // Up to three stronger word choices, each from the speaker's own words
  wordSwaps: Array<{ said: string; stronger: string; why: string }>;
  // For a told story, the story scores (decision 92)
  story?: StoryRubric;
  // The model that scored it
  model: string;
  // When (ISO text)
  at: string;
}

// Everything measured about one take, kept apart from the session so the session stays small (decision 90)
export interface AnalysisRecord {
  // The session it belongs to
  sessionId: string;
  // The version of the measure definitions; a change means every analysis is worked out again
  schemaVersion: number;
  // When the measures were last worked out (ISO text)
  computedAt: string;
  // Which engines contributed
  engines: { device: EngineInfo; transcript?: EngineInfo; voice?: EngineInfo; rubric?: EngineInfo };
  // Every measure, by id (see src/core/analysis/metrics.ts)
  metrics: Record<string, MetricValue>;
  // What the phone measures are worked out from
  raw: AnalysisRaw;
  // The coach's rubric, once it arrived
  rubric?: RubricRecord;
  // What the server's deeper analysis found, when it ran (decision 91): kept so its measures can be worked out again
  server?: ServerAnalysis;
  // Phone values a server engine replaced, kept so no phone value is ever lost (decision 91)
  superseded?: Record<string, MetricValue>;
  // Where the deeper analysis of this take stands, with a quiet note for the take's page (decision 91)
  deep?: DeepStatus;
}

// One word as the transcription service heard it (decision 91): its text with punctuation, the cleaned word, its start and end in seconds, how sure the service was (0 to 1), and whether it is a hesitation sound such as "um"
export interface ServerWord {
  // The word as written, with any punctuation after it ("well," or "home.")
  text: string;
  // The same word cleaned to lower-case letters and apostrophes (empty for a piece with no letters)
  w: string;
  // When it started, in seconds
  s: number;
  // When it ended, in seconds
  e: number;
  // How sure the service was, 0 to 1
  conf: number;
}

// The transcription service's verbatim transcript of a take (decision 91)
export interface ServerTranscript {
  // The engine, such as "assemblyai-universal-3-pro"
  engine: string;
  // The whole text, punctuated, with hesitation sounds kept
  text: string;
  // Every word with its times and confidence
  words: ServerWord[];
  // When it was made (ISO text)
  at: string;
}

// The voice worker's findings for a take (decision 91); each number is null when the take had too little voice to measure it
export interface ServerVoice {
  // The engine, such as "voice-worker-1"
  engine: string;
  // The Praat version inside the worker
  praat: string;
  // Jitter (local), as a percentage
  jitterLocalPct: number | null;
  // Shimmer (local), in decibels
  shimmerLocalDb: number | null;
  // Harmonics-to-noise ratio, in decibels
  hnrDb: number | null;
  // Alpha ratio: energy from 1 to 5 kHz against 50 Hz to 1 kHz, in decibels
  alphaRatioDb: number | null;
  // Hammarberg index: strongest peak below 2 kHz against 2 to 5 kHz, in decibels
  hammarbergDb: number | null;
  // Share of voiced time in creak, as a percentage
  creakPct: number | null;
  // Syllables counted from loudness peaks (de Jong and Wempe 2009)
  syllables: number | null;
  // Syllables per second over the whole take
  speechRate: number | null;
  // Syllables per second of sounding time
  articulationRate: number | null;
  // Pitch from Praat: median, 10th and 90th percentiles in hertz, and the range and spread in semitones
  f0: { medianHz: number; p10Hz: number; p90Hz: number; rangeSt: number; sdSt: number } | null;
  // The audEERING model's scores (personal use only, decision 91), or null when the module is off
  emotion: { arousal: number; dominance: number; valence: number; model: string } | null;
  // When it was measured (ISO text)
  at: string;
}

// What the server's deeper analysis returned for a take: either part may be missing when it failed or is not set up
export interface ServerAnalysis {
  // The verbatim transcript, or null
  transcript: ServerTranscript | null;
  // The voice findings, or null
  voice: ServerVoice | null;
}

// Where a take's deeper analysis stands (decision 91)
export interface DeepStatus {
  // Sent and waiting, finished, finished in part, failed, or not sent
  status: "running" | "done" | "partial" | "failed" | "skipped";
  // A quiet note for the take's page (empty when there is nothing to say)
  note: string;
  // When this was last updated (ISO text)
  at: string;
}

// The coach's story scores for a told story, each 0 to 3 with a quote (decision 92)
export interface StoryRubric {
  // Opens in a way that makes you want to hear more, ideally in the action
  hook: RubricScore;
  // Something was at stake: a want, a problem, a risk
  stakes: RubricScore;
  // Specific, concrete detail a listener can picture
  detail: RubricScore;
  // Someone's words, said as they said them
  dialogue: RubricScore;
  // A turn: a "but" or a moment where things changed
  turn: RubricScore;
  // Ends on the point or the change, then stops
  point: RubricScore;
  // For a guided story: how far the plain facts were brought to life (decision 93)
  alive?: RubricScore;
}

// One of the user's stories (decision 92): its id is its seed's id, shared by every telling; the record keeps the title, which the user can change
export interface StoryRecord {
  // The seed's id: a prompt from the bank, or "moment-" and a moment note's id
  id: string;
  // The title shown in the library
  title: string;
  // When it was first told (ISO text)
  createdAt: string;
  // When the title last changed (ISO text), for joining with a backup
  updatedAt: string;
}

// One weekly coach summary (decision 90)
export interface SummaryRecord {
  // Unique id
  id: string;
  // When it was written (ISO text)
  createdAt: string;
  // One line on the week
  headline: string;
  // What improved, one line each
  improved: string[];
  // One pattern that keeps coming back
  pattern: string;
  // The one focus for next week
  focus: string;
  // A practice to try, or null
  suggestedDrill: string | null;
  // The model that wrote it
  model: string;
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
  // Each take's measures, keyed by session id (decision 90)
  analyses: AnalysisRecord;
  // Weekly coach summaries, keyed by id (decision 90)
  summaries: SummaryRecord;
  // The user's stories, keyed by their seed's id (decision 92)
  stories: StoryRecord;
  // Each take's detailed readings, keyed by session id (decision 98)
  signals: SignalsRecord;
  // Facts about the stored data itself, such as its layout version (decision 98)
  meta: MetaRecord;
}

// One collection name
export type CollectionName = keyof Collections;

// Every collection name, for creating and clearing storage
export const COLLECTION_NAMES: ReadonlyArray<CollectionName> = ["sessions", "challenges", "settings", "audio", "talks", "analyses", "summaries", "stories", "signals", "meta"];

// The collections that hold the user's own data, cleared by "Delete all my data" (the layout facts in "meta" stay, since they describe the database, not the user)
export const USER_COLLECTIONS: ReadonlyArray<CollectionName> = COLLECTION_NAMES.filter((name) => name !== "meta");

// Lookups kept by the database so a few questions need no full read: the takes still waiting for coach feedback (decision 99)
export const COLLECTION_INDEXES: Readonly<Partial<Record<CollectionName, ReadonlyArray<string>>>> = { sessions: ["feedbackStatus"] };
