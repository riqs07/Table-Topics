// Every way to practise, in plain words: what it is for, how long it takes, what you get afterwards (UX round, 2026-10-15)

// Load the session kind type
import type { SessionMode } from "@/data/records";

// The jobs the app is organised around
export type JobId = "talk" | "spot" | "skill" | "connect";

// One job, as shown on Today and in the menu
export interface Job {
  // Stable id
  id: JobId;
  // Its name
  name: string;
  // One line on what it covers
  blurb: string;
  // Where it lives
  href: string;
}

// The jobs, in order
export const JOBS: ReadonlyArray<Job> = [
  // A talk with a date or an audience
  { id: "talk", name: "Prepare a talk", blurb: "Your own talk: a plan to the day, section by section.", href: "/rehearse" },
  // Speaking without a script
  { id: "spot", name: "Speak on the spot", blurb: "Surprise questions, prepared speeches, openings and closings.", href: "/practice" },
  // One skill at a time
  { id: "skill", name: "Build a skill", blurb: "Short lessons, speeches to read, pause and word drills.", href: "/skills" },
  // Everyday conversation
  { id: "connect", name: "Small talk", blurb: "Everyday questions, answered with a short story.", href: "/small-talk" },
];

// One way to practise
export interface ModeInfo {
  // Stable id
  id: string;
  // The job it belongs to
  job: JobId;
  // Its plain name
  name: string;
  // A few words on what it is
  subtitle: string;
  // How long it takes
  length: string;
  // What you do, as a sentence
  youDo: string;
  // What you see afterwards, as a sentence
  youGet: string;
}

// Every way to practise, grouped by job
export const MODES: ReadonlyArray<ModeInfo> = [
  // Your own talks
  { id: "talks", job: "talk", name: "Your talks", subtitle: "a plan to the day of your talk", length: "5 to 20 min a day", youDo: "Paste your talk, set its date, and rehearse it section by section with less and less text.", youGet: "Each day's step, how much of your script you covered, and how long each run took." },
  // A Table Topic
  { id: "table-topic", job: "spot", name: "Table Topic", subtitle: "surprise question", length: "1 to 2 min", youDo: "A light question appears, you get 10 seconds, then you speak.", youGet: "Your time against the 1:00 to 2:00 window, your fillers and pauses, and one fix." },
  // A prepared speech
  { id: "prepared", job: "spot", name: "Prepared speech", subtitle: "2 minutes to plan, then speak for 2 to 4", length: "about 6 min", youDo: "Read a speaking task, plan it for up to 2 minutes with a hint, then speak for 2 to 4 minutes, with green, yellow and red lights.", youGet: "Your time against the 2:00 to 4:00 window, this week's number, and one fix." },
  // Openings and closings
  { id: "openings", job: "spot", name: "Openings and closings", subtitle: "the first or last 45 seconds", length: "1 min", youDo: "Practise only how a talk starts or how it ends.", youGet: "The pause before your first word, or how cleanly you finished." },
  // Q&A practice (removed from the app, decision 61; kept so old Q&A answers still find their name)
  { id: "qa", job: "spot", name: "Q&A practice", subtitle: "answer likely questions", length: "1 min a question", youDo: "Answer the questions an audience would ask after your talk or prepared speech.", youGet: "Your time against a 1:00 goal, and whether you answered directly." },
  // Lessons
  { id: "lessons", job: "skill", name: "Lessons", subtitle: "one practical tip each", length: "2 to 3 min", youDo: "Read a short tip, then practise it on a text written for it.", youGet: "A check made for that one skill." },
  // Readings
  { id: "readings", job: "skill", name: "Readings", subtitle: "famous speeches and passages", length: "30 seconds to 2 min", youDo: "Read a speech or passage aloud, at your own pace. Whole speeches come in parts of about a minute.", youGet: "Which words were missed, your pace, and your pauses." },
  // Pause drills
  { id: "pause-drills", job: "skill", name: "Pause drills", subtitle: "pause where the text is marked", length: "1 min", youDo: "Read a passage and pause for a second at each mark.", youGet: "How many pauses you took against the marks." },
  // Tricky words
  { id: "tricky-words", job: "skill", name: "Tricky words", subtitle: "crisp consonants", length: "1 min", youDo: "Read a list of words that are easy to swallow.", youGet: "Which words came through clearly." },
  // Small talk
  { id: "small-talk", job: "connect", name: "Small talk", subtitle: "everyday questions", length: "under a minute", youDo: "Hear an everyday question, like \u201cHow was your weekend?\u201d, and answer with one short story: a moment, a hook, how it felt, and a question back.", youGet: "Which of the four you heard yourself do, and one change." },
  // One moment a day
  { id: "moments", job: "connect", name: "One moment a day", subtitle: "a short private voice note", length: "under a minute", youDo: "Say one thing from today worth telling, while you still remember it.", youGet: "A list of your own stories to draw on when someone asks what you have been up to." },
];

// How each kind of session is explained before recording ("rehearse" is a run of your talk)
const SESSION_TO_MODE: Readonly<Partial<Record<SessionMode, string>>> = {
  // A Table Topic
  talk: "table-topic",
  // A prepared speech
  response: "prepared",
  // An opening or closing drill
  bookend: "openings",
  // An answer to a likely question
  qa: "qa",
  // A run of your own talk
  rehearse: "talks",
  // Reading aloud
  read: "readings",
  // A pause drill
  pause: "pause-drills",
  // A lesson
  lesson: "lessons",
  // A small-talk answer
  smalltalk: "small-talk",
  // A moment note
  moment: "moments",
};

// The catalogue entry that explains a kind of session, if it has one
export function modeForSession(mode: SessionMode): ModeInfo | undefined {
  // Look up the entry
  return MODES.find((item) => item.id === SESSION_TO_MODE[mode]);
}
