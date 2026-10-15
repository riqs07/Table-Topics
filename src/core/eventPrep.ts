// Event prep: a countdown plan from today to the day of a talk (plan step B1)

// Load the calendar-day helper
import { daysBetween } from "@/core/dates";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// How much of the text shows while rehearsing: all of it, cue words only, or nothing
export type Ladder = "full" | "keywords" | "none";

// The kinds of day in a plan, in the order they come
export type StepKind = "early" | "sections" | "opening-close" | "run" | "keywords" | "memory" | "dress" | "warmup";

// One day's step
export interface PrepStep {
  // What kind of practice the day holds
  kind: StepKind;
}

// One thing to rehearse today
export interface PrepTask {
  // The section to rehearse (counted from 0), or null for the whole talk
  sectionIndex: number | null;
  // How much text to show
  ladder: Ladder;
  // How many runs are asked for
  times: number;
  // Name shown to the user
  label: string;
}

// The furthest ahead a full plan reaches, in days (default agreed 2026-10-15)
export const PLAN_HORIZON_DAYS = 30;

// The phases before the full rehearsal, in order
const PHASES: ReadonlyArray<StepKind> = ["sections", "opening-close", "run", "keywords", "memory"];

// Short plans, chosen by hand so the most useful phases survive (keyed by days before the full rehearsal)
const SHORT_PLANS: Readonly<Record<number, ReadonlyArray<StepKind>>> = {
  // One day: a whole run with the text
  1: ["run"],
  // Two days: the opening and close, then keywords
  2: ["opening-close", "keywords"],
  // Three days: sections, a whole run, then memory
  3: ["sections", "run", "memory"],
  // Four days: everything but keywords
  4: ["sections", "opening-close", "run", "memory"],
};

// Split a talk into sections at blank lines (a line with only spaces counts as blank)
export function talkSections(body: string): string[] {
  // Split, tidy, and drop empty pieces
  const sections = body.split(/\n[ \t]*\n\s*/).map((section) => section.trim()).filter((section) => section.length > 0);
  // A talk with no blank lines is one section
  return sections.length > 0 ? sections : [body.trim()];
}

// One sentence reduced to its cue: the first two words, plus any words the speaker marked with stars
function cueFor(sentence: string): string {
  // The words of the sentence
  const words = sentence.trim().split(/\s+/);
  // Two words or fewer: the sentence is its own cue
  if (words.length <= 2) return sentence.trim();
  // The first two words
  const opening = words.slice(0, 2).join(" ");
  // Marked phrases after the opening words
  const marked = (sentence.trim().slice(opening.length).match(/\*[^*]+\*/g) ?? []).map((phrase) => ` ${phrase} …`).join("");
  // The opening, a gap, and the marked phrases
  return `${opening} …${marked}`;
}

// The text at a rung of the memory ladder
export function memoryLadder(text: string, ladder: Ladder): string {
  // All of it
  if (ladder === "full") return text;
  // Nothing
  if (ladder === "none") return "";
  // Cue words, keeping the lines and blank lines of the original
  return text
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : (line.match(/[^.!?]+[.!?]*/g) ?? []).filter((sentence) => sentence.trim() !== "").map(cueFor).join(" ")))
    .join("\n");
}

// Whole calendar days from today to the talk's date ("2026-10-22"); 0 on the day, negative after it
export function daysUntil(eventDate: string, today: Date): number {
  // Read the year, month and day
  const [year, month, day] = eventDate.split("-").map(Number);
  // Count days between the local dates
  return daysBetween(today, new Date(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

// How far away a talk's date is, in words
export function daysAway(days: number): string {
  // Past, today, tomorrow, or a number of days
  return days < 0 ? "date passed" : days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
}

// The plan from today to the talk, one step a day; null once the date has passed
export function eventPlan(daysLeft: number): PrepStep[] | null {
  // Past dates have no plan
  if (daysLeft < 0) return null;
  // Too far ahead for a full plan
  if (daysLeft > PLAN_HORIZON_DAYS) return [{ kind: "early" }];
  // Days before the full rehearsal (the day before) and the warm-up (the day itself)
  const before = Math.max(0, daysLeft - 1);
  // The phases for those days: a hand-made short plan, or equal shares of every phase
  const phases = SHORT_PLANS[before] ?? Array.from({ length: before }, (_, day) => PHASES[Math.floor((day * PHASES.length) / before)] as StepKind);
  // The full rehearsal the day before, if there is a day before
  const dress: StepKind[] = daysLeft >= 1 ? ["dress"] : [];
  // The phases, the full rehearsal, then the warm-up
  return [...phases, ...dress, "warmup" as const].map((kind) => ({ kind }));
}

// What to rehearse on a step, for a talk with a number of sections
export function stepTasks(step: PrepStep, sectionCount: number): PrepTask[] {
  // A whole-talk task at a rung of the ladder
  const whole = (ladder: Ladder, times = 1, label = "The whole talk"): PrepTask[] => [{ sectionIndex: null, ladder, times, label }];
  // Each kind of day
  switch (step.kind) {
    // Each section once, with the text
    case "sections":
      return Array.from({ length: sectionCount }, (_, index) => ({ sectionIndex: index, ladder: "full" as const, times: 1, label: `Section ${index + 1}` }));
    // The first and last sections twice each, or the whole talk twice if it is one section
    case "opening-close":
      return sectionCount >= 2
        ? [
            { sectionIndex: 0, ladder: "full", times: 2, label: "The opening" },
            { sectionIndex: sectionCount - 1, ladder: "full", times: 2, label: "The close" },
          ]
        : whole("full", 2);
    // A whole run with the text
    case "run":
      return whole("full");
    // A whole run from cue words
    case "keywords":
      return whole("keywords");
    // A whole run from memory
    case "memory":
      return whole("none");
    // The full rehearsal, from memory
    case "dress":
      return whole("none");
    // One easy run from cue words on the day
    case "warmup":
      return whole("keywords");
    // Open practice far ahead of the date
    case "early":
      return whole("full");
  }
}

// How many of each task's runs are done, from today's rehearsals of the talk (never more than asked)
export function taskProgress(tasks: ReadonlyArray<PrepTask>, today: ReadonlyArray<SessionRecord>): number[] {
  // Count matching rehearsals for each task
  return tasks.map((task) => Math.min(task.times, today.filter((session) => (session.sectionIndex ?? null) === task.sectionIndex).length));
}

// What a step asks, as the end of a sentence
const STEP_TEXT: Readonly<Record<StepKind, string>> = {
  // Far ahead
  early: "rehearse any part you like; the full plan starts 30 days before.",
  // Sections
  sections: "rehearse each section once, with the text.",
  // Opening and close
  "opening-close": "rehearse the opening and the close, twice each.",
  // Whole run
  run: "one whole run-through, with the text.",
  // Keywords
  keywords: "one whole run from keywords only.",
  // Memory
  memory: "one whole run from memory.",
  // Full rehearsal
  dress: "a full rehearsal, from memory, timed.",
  // Warm-up (not used; the day itself has its own sentence)
  warmup: "an easy run from keywords.",
};

// What a later day holds, as a sentence of its own (for the list of coming days)
export function stepText(kind: StepKind): string {
  // The day itself
  if (kind === "warmup") return "The day of the talk: warm up, then one easy run from keywords.";
  // Any other day, starting with a capital
  return STEP_TEXT[kind].charAt(0).toUpperCase() + STEP_TEXT[kind].slice(1);
}

// The sentence for the home screen: how long is left and what to do today
export function prepHeadline(daysLeft: number, step: PrepStep): string {
  // How long is left
  const when = daysLeft === 0 ? "Your talk is today." : daysLeft === 1 ? "Your talk is tomorrow." : `Your talk is in ${daysLeft} days.`;
  // The day itself has a warm-up
  if (step.kind === "warmup") return `${when} Warm up with the tongue twisters, then one easy run from keywords.`;
  // Otherwise today's step
  return `${when} Today: ${STEP_TEXT[step.kind]}`;
}

// One whole run of a talk
export interface RunTime {
  // The session's id
  id: string;
  // When it was recorded (ISO text)
  createdAt: string;
  // How long it took
  seconds: number;
}

// The length of every whole run of a talk, oldest first
export function runTimes(sessions: ReadonlyArray<SessionRecord>, talkId: string): RunTime[] {
  // Whole rehearsals of this talk
  return sessions
    .filter((session) => session.mode === "rehearse" && session.promptId === talkId && (session.sectionIndex ?? null) === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((session) => ({ id: session.id, createdAt: session.createdAt, seconds: session.durationSec }));
}
