// Today's practice: two or three short steps the app plans each day (see documents/plan-daily-practice.md)

// Load the day pickers and lookups for the spoken prompts and texts
import { PAUSE_DRILLS, PASSAGES, bookendForDay, promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the lessons
import { findLesson } from "@/content/lessons";
// Load the full speeches and their part lookups
import { FULL_SPEECHES } from "@/content/speeches";
import { findReading, findSpeech, partId } from "@/content/readings";
// Load the calendar-day helpers
import { dayKey, daysBetween, startOfDay } from "@/core/dates";
// Load the record types
import type { SessionMode, SessionRecord } from "@/data/records";

// Which part of the day's practice a step is
export type PlanStepKind = "warm-up" | "skill" | "spot";

// One step of today's practice
export interface PlanStep {
  // Warm up, skill, or on the spot
  kind: PlanStepKind;
  // The step's short name, such as "Warm up"
  label: string;
  // What it is, such as "Inaugural Address, part 3 of 12"
  title: string;
  // The kind of session it records
  mode: SessionMode;
  // The prompt, text, lesson or talk it uses
  promptId: string;
  // Speaking time in minutes, for the total
  minutes: number;
  // Where it starts (without the plan marker)
  href: string;
}

// What the plan is worked out from
export interface PlanInput {
  // Today
  day: Date;
  // Every saved session (the plan uses only those from before today, so it stays the same all day)
  sessions: ReadonlyArray<SessionRecord>;
  // This week's focus
  focusId: string;
  // A talk with a date coming up, with today's step for it, if any
  nextTalk: { id: string; title: string; headline: string } | null;
}

// The order speeches are offered in when none is under way: short and familiar first
const STARTER_ORDER = ["lincoln-second-inaugural", "jfk-inaugural", "fdr-infamy", "henry-liberty", "washington-atlanta", "fdr-first-inaugural", "eisenhower-farewell", "douglass-fourth"];

// A drill to practise: a session kind and the prompt it uses
interface Drill {
  // The kind of session
  mode: SessionMode;
  // The lesson, pause drill or passage
  promptId: string;
}

// The lessons for a list of ids, as drills
const lessons = (...ids: string[]): Drill[] => ids.map((id) => ({ mode: "lesson", promptId: id }));

// Every pause drill
const PAUSE: Drill[] = PAUSE_DRILLS.map((drill) => ({ mode: "pause", promptId: drill.id }));

// Every practice passage
const PRACTICE: Drill[] = PASSAGES.filter((passage) => passage.kind === "practice").map((passage) => ({ mode: "read", promptId: passage.id }));

// The skill drills for each weekly focus, taken in turn by day
const SKILL_DRILLS: Record<string, Drill[]> = {
  // Openings
  "strong-opening": lessons("l001", "l011"),
  // Closes
  "strong-close": lessons("l005", "l010"),
  // Structure (both names it has had)
  "clear-structure": lessons("l007", "l008", "l014"),
  // (the older name)
  structure: lessons("l007", "l008", "l014"),
  // Pausing
  pausing: [...PAUSE, ...lessons("l004")],
  // Fillers: steady reading builds the habit of pausing instead
  "cut-fillers": [...PRACTICE, ...lessons("l001")],
  // Pace
  pace: [...lessons("l003"), ...PRACTICE],
  // Finishing sentences
  "start-and-finish": [...lessons("l005"), ...PRACTICE],
  // Variety and warmth
  "vocal-variety": lessons("l016", "l006"),
  // (the older name)
  "warmth-and-energy": lessons("l016", "l006"),
};

// Calendar days since a fixed start, for taking things in turn
function dayNumber(day: Date): number {
  // Days since 1 January 2026 (negative before it, which the turns allow for)
  return daysBetween(new Date(2026, 0, 1), day);
}

// Take an item in turn by day
function inTurn<T>(list: ReadonlyArray<T>, day: Date): T {
  // Wrap around, keeping the index positive
  return list[((dayNumber(day) % list.length) + list.length) % list.length] as T;
}

// The warm-up: the next part of the speech under way, or of the next speech in the starter order
function warmUp(before: ReadonlyArray<SessionRecord>): PlanStep {
  // Parts read before today
  const read = new Set(before.filter((session) => session.mode === "read").map((session) => session.promptId));
  // Whether a speech still has a part to read
  const unfinished = (id: string) => (findSpeech(id)?.parts ?? []).some((_, index) => !read.has(`${id}-${index + 1}`));
  // The speech of the newest reading of a part, if it is unfinished (the list is newest first)
  const current = before.filter((session) => session.mode === "read").map((session) => /^(.+)-\d+$/.exec(session.promptId)?.[1]).find((id) => id !== undefined && findSpeech(id) !== undefined);
  // That speech, or the first unfinished one in the starter order, or any unfinished one, or the first
  const speechId = (current && unfinished(current) ? current : undefined) ?? STARTER_ORDER.find(unfinished) ?? FULL_SPEECHES.map((speech) => speech.id).find(unfinished) ?? STARTER_ORDER[0] ?? "";
  // The speech
  const speech = findSpeech(speechId) ?? FULL_SPEECHES[0]!;
  // Its first part not yet read (or the first, if all are)
  const part = Math.max(0, speech.parts.findIndex((_, index) => !read.has(partId(speech, index + 1)))) + 1;
  // The part's id
  const id = partId(speech, part);
  // The step
  return { kind: "warm-up", label: "Warm up", title: findReading(id)?.title ?? speech.title, mode: "read", promptId: id, minutes: 1, href: `/session?mode=read&prompt=${id}` };
}

// The skill drill for this week's focus
function skill(focusId: string, day: Date): PlanStep {
  // The drill for today
  const drill = inTurn(SKILL_DRILLS[focusId] ?? PRACTICE, day);
  // Its name
  const title = drill.mode === "lesson" ? `Lesson ${findLesson(drill.promptId)?.number}: ${findLesson(drill.promptId)?.title}` : drill.mode === "pause" ? `Pause drill: ${findReading(drill.promptId)?.title}` : (findReading(drill.promptId)?.title ?? "A short reading");
  // The step
  return { kind: "skill", label: "Skill", title, mode: drill.mode, promptId: drill.promptId, minutes: drill.mode === "lesson" ? 2 : 1, href: `/session?mode=${drill.mode}&prompt=${drill.promptId}` };
}

// Speaking on the spot: a talk coming up, or a Table Topic, an opening or closing drill, or once a week a prepared answer (always, until there is a first recording to measure progress from)
function spot(input: PlanInput, needsFirstRecording: boolean): PlanStep {
  // A talk coming up comes first
  if (input.nextTalk) return { kind: "spot", label: "Your talk", title: input.nextTalk.headline, mode: "rehearse", promptId: input.nextTalk.id, minutes: 3, href: `/session?mode=rehearse&prompt=${input.nextTalk.id}` };
  // The day in the week's turn
  const turn = ((dayNumber(input.day) % 7) + 7) % 7;
  // One day a week a prepared answer, and every day until the first one (only a prepared answer can be the first recording)
  if (turn === 6 || needsFirstRecording) {
    // Today's task
    const prompt = promptForDay(input.day);
    // The step
    return { kind: "spot", label: "Prepared answer", title: prompt.text, mode: "response", promptId: prompt.id, minutes: 3, href: `/session?mode=response&prompt=${prompt.id}` };
  }
  // Every other day, an opening or a closing drill (the week's focus decides which, if it is one of them)
  if (turn % 2 === 1) {
    // Opening or close
    const part = input.focusId === "strong-close" ? "close" : input.focusId === "strong-opening" ? "opening" : turn % 4 === 1 ? "opening" : "close";
    // Today's prompt for it
    const item = bookendForDay(input.day, part);
    // The step
    return { kind: "spot", label: part === "opening" ? "Opening drill" : "Closing drill", title: item.text, mode: "bookend", promptId: item.id, minutes: 1, href: `/session?mode=bookend&prompt=${item.id}` };
  }
  // Otherwise a Table Topic
  const topic = tableTopicForDay(input.day);
  // The step (the question stays hidden until the countdown, as in a real Table Topic)
  return { kind: "spot", label: "Table Topic", title: "A surprise question, answered on the spot", mode: "talk", promptId: topic.id, minutes: 2, href: `/session?mode=talk&prompt=${topic.id}` };
}

// Sessions recorded before today
function beforeToday(sessions: ReadonlyArray<SessionRecord>, day: Date): SessionRecord[] {
  // Earlier than today's midnight
  return sessions.filter((session) => new Date(session.createdAt) < startOfDay(day));
}

// Today's steps: the warm-up, the skill (once there are three practice days), and on the spot
export function dailyPlan(input: PlanInput): PlanStep[] {
  // Sessions before today, so the plan stays the same all day
  const before = beforeToday(input.sessions, input.day);
  // Days practised before today
  const practiceDays = new Set(before.map((session) => dayKey(new Date(session.createdAt)))).size;
  // New users get two steps
  // Whether there is no first recording yet to measure progress from
  const needsFirstRecording = !before.some((session) => session.isBaseline);
  // New users get two steps
  return practiceDays < 3 ? [warmUp(before), spot(input, needsFirstRecording)] : [warmUp(before), skill(input.focusId, input.day), spot(input, needsFirstRecording)];
}

// Which steps were done today: a session today of the same kind and prompt
export function planProgress(plan: ReadonlyArray<PlanStep>, sessions: ReadonlyArray<SessionRecord>, day: Date): boolean[] {
  // Today's sessions
  const today = sessions.filter((session) => dayKey(new Date(session.createdAt)) === dayKey(day));
  // Each step
  return plan.map((step) => today.some((session) => session.mode === step.mode && session.promptId === step.promptId));
}

// Speaking minutes plus listening back (about the same again), rounded: the time the plan takes
export function planMinutes(plan: ReadonlyArray<PlanStep>): number {
  // Twice the speaking time
  return plan.reduce((total, step) => total + step.minutes * 2, 0);
}

// A step's address inside the plan (numbered from 1), so the pages after it know which step comes next
export function planHref(step: PlanStep, number: number): string {
  // The step's own address with the plan marker
  return `${step.href}&plan=${number}`;
}
