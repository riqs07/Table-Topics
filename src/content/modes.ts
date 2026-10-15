// Every way to practise, in plain words: what it is for, how long it takes, what you get afterwards (UX round, 2026-10-15)

// Load the session kind type
import type { SessionMode } from "@/data/records";

// The three jobs the app is organised around
export type JobId = "talk" | "spot" | "skill";

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
  { id: "spot", name: "Speak on the spot", blurb: "Surprise questions, prepared answers, openings, Q&A.", href: "/practice" },
  // One skill at a time
  { id: "skill", name: "Build a skill", blurb: "Short lessons, speeches to read, pause and word drills.", href: "/skills" },
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
  // A prepared answer
  { id: "prepared", job: "spot", name: "Prepared answer", subtitle: "2 minutes to think, then speak", length: "about 5 min", youDo: "Read a speaking task, plan it for up to 2 minutes with a hint, then speak for about 3.", youGet: "Your time against a 3:00 goal, this week's number, and one fix." },
  // Openings and closings
  { id: "openings", job: "spot", name: "Openings and closings", subtitle: "the first or last 45 seconds", length: "1 min", youDo: "Practise only how a talk starts or how it ends.", youGet: "The pause before your first word, or how cleanly you finished." },
  // Q&A practice
  { id: "qa", job: "spot", name: "Q&A practice", subtitle: "answer likely questions", length: "1 min a question", youDo: "Answer the questions an audience would ask after your talk or prepared answer.", youGet: "Your time against a 1:00 goal, and whether you answered directly." },
  // Lessons
  { id: "lessons", job: "skill", name: "Lessons", subtitle: "one practical tip each", length: "2 to 3 min", youDo: "Read a short tip, then practise it on a text written for it.", youGet: "A check made for that one skill." },
  // Readings
  { id: "readings", job: "skill", name: "Readings", subtitle: "famous speeches and passages", length: "1 to 3 min", youDo: "Read a speech or passage aloud, at your own pace.", youGet: "Which words were missed, your pace, and your pauses." },
  // Pause drills
  { id: "pause-drills", job: "skill", name: "Pause drills", subtitle: "pause where the text is marked", length: "1 min", youDo: "Read a passage and pause for a second at each mark.", youGet: "How many pauses you took against the marks." },
  // Tricky words
  { id: "tricky-words", job: "skill", name: "Tricky words", subtitle: "crisp consonants", length: "1 min", youDo: "Read a list of words that are easy to swallow.", youGet: "Which words came through clearly." },
];

// How each kind of session is explained before recording ("rehearse" is a run of your talk)
const SESSION_TO_MODE: Readonly<Partial<Record<SessionMode, string>>> = {
  // A Table Topic
  talk: "table-topic",
  // A prepared answer
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
};

// The catalogue entry that explains a kind of session, if it has one
export function modeForSession(mode: SessionMode): ModeInfo | undefined {
  // Look up the entry
  return MODES.find((item) => item.id === SESSION_TO_MODE[mode]);
}
