// Today's practice: one step from each of three lanes, taken in turn by day, then a Learn card (see documents/plan-daily-mix-and-connection.md)

// Load the day pickers and lookups for the spoken prompts and texts
import { PAUSE_DRILLS, PASSAGES, bookendForDay, promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the lessons
import { findLesson } from "@/content/lessons";
// Load the full speeches and their part lookups
import { FULL_SPEECHES } from "@/content/speeches";
import { findReading, findSpeech, partId } from "@/content/readings";
// Load the calendar-day helpers
import { dayKey, daysBetween, startOfDay } from "@/core/dates";
// Load the small-talk questions and lessons
import { SMALL_TALK_LESSONS, drillForDay, smallTalkForDay } from "@/content/smallTalk";
// Load the next Learn card
import { nextCard, type LearnProgress } from "@/core/learn";
// Load the cards, for a review once every card is read
import { LEARN_CARDS } from "@/content/learn";
// Load the record types
import type { SessionMode, SessionRecord } from "@/data/records";

// Which lane of the day's practice a step comes from
export type PlanLane = "delivery" | "thinking" | "connection" | "learn";

// One step of today's practice
export interface PlanStep {
  // Its lane
  lane: PlanLane;
  // A recorded session, or a Learn card
  kind: "session" | "card";
  // The step's short name, such as "Warm up"
  label: string;
  // What it is, such as "Inaugural Address, part 3 of 12"
  title: string;
  // The kind of session it records (none for a card)
  mode: SessionMode | null;
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
  // Learn progress (only what was read before today is used, so the plan stays the same all day)
  learn?: LearnProgress;
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
  return { lane: "delivery", kind: "session", label: "Warm up", title: findReading(id)?.title ?? speech.title, mode: "read", promptId: id, minutes: 1, href: `/session?mode=read&prompt=${id}` };
}

// The skill drill for this week's focus
function skill(focusId: string, day: Date): PlanStep {
  // The drill for today
  const drill = inTurn(SKILL_DRILLS[focusId] ?? PRACTICE, day);
  // Its name
  const title = drill.mode === "lesson" ? `Lesson ${findLesson(drill.promptId)?.number}: ${findLesson(drill.promptId)?.title}` : drill.mode === "pause" ? `Pause drill: ${findReading(drill.promptId)?.title}` : (findReading(drill.promptId)?.title ?? "A short reading");
  // The step
  return { lane: "delivery", kind: "session", label: "Skill", title, mode: drill.mode, promptId: drill.promptId, minutes: drill.mode === "lesson" ? 2 : 1, href: `/session?mode=${drill.mode}&prompt=${drill.promptId}` };
}

// The Delivery lane's turns: the speech under way, the week's focus drill, the speech again, a pause drill, the focus drill again
const DELIVERY_TURNS = ["speech", "skill", "speech", "pause", "skill"] as const;
// The On-the-spot lane's turns: a Table Topic, an everyday question, an opening or closing drill, again, then a prepared speech once a week
const THINKING_TURNS = ["talk", "smalltalk", "bookend", "talk", "smalltalk", "bookend", "response"] as const;

// Take a lane's turn for a day
function turnOf<T>(turns: ReadonlyArray<T>, day: Date): T {
  // In turn by day, wrapping around
  return inTurn(turns, day);
}

// Delivery: how you sound. The first days always continue the speech, a one-minute first win
function delivery(input: PlanInput, before: ReadonlyArray<SessionRecord>, firstDays: boolean): PlanStep {
  // Today's turn (the speech in the first days)
  const turn = firstDays ? "speech" : turnOf(DELIVERY_TURNS, input.day);
  // A practice passage instead, in pausing week, when the focus drill is already a pause drill
  if (turn === "pause" && input.focusId === "pausing") {
    // The passage
    const passage = inTurn(PRACTICE, input.day);
    // The step
    return { lane: "delivery", kind: "session", label: "Read aloud", title: findReading(passage.promptId)?.title ?? "A practice passage", mode: "read", promptId: passage.promptId, minutes: 1, href: `/session?mode=read&prompt=${passage.promptId}` };
  }
  // A pause drill, taken in turn by day
  if (turn === "pause") {
    // The drill
    const drill = inTurn(PAUSE, input.day);
    // The step
    return { lane: "delivery", kind: "session", label: "Pause drill", title: findReading(drill.promptId)?.title ?? "A pause drill", mode: "pause", promptId: drill.promptId, minutes: 1, href: `/session?mode=pause&prompt=${drill.promptId}` };
  }
  // The week's focus drill, or the speech under way
  return turn === "skill" ? skill(input.focusId, input.day) : warmUp(before);
}

// On the spot: speaking without a script. A talk coming up comes first; the first days are always a light Table Topic
function thinking(input: PlanInput, firstDays: boolean): PlanStep {
  // A talk coming up comes first
  if (input.nextTalk) return { lane: "thinking", kind: "session", label: "Your talk", title: input.nextTalk.headline, mode: "rehearse", promptId: input.nextTalk.id, minutes: 3, href: `/session?mode=rehearse&prompt=${input.nextTalk.id}` };
  // Today's turn (a Table Topic in the first days)
  const turn = firstDays ? "talk" : turnOf(THINKING_TURNS, input.day);
  // A prepared speech, once a week
  if (turn === "response") {
    // Today's task
    const prompt = promptForDay(input.day);
    // The step
    return { lane: "thinking", kind: "session", label: "Prepared speech", title: prompt.text, mode: "response", promptId: prompt.id, minutes: 3, href: `/session?mode=response&prompt=${prompt.id}` };
  }
  // An everyday small-talk question
  if (turn === "smalltalk") {
    // Today's question
    const question = smallTalkForDay(input.day);
    // The step
    return { lane: "thinking", kind: "session", label: "Small talk", title: question.text, mode: "smalltalk", promptId: question.id, minutes: 1, href: `/session?mode=smalltalk&prompt=${question.id}` };
  }
  // An opening or a closing drill (the week's focus decides which, if it is one of them)
  if (turn === "bookend") {
    // Opening or close, alternating by week otherwise
    const part = input.focusId === "strong-close" ? "close" : input.focusId === "strong-opening" ? "opening" : Math.floor(dayNumber(input.day) / 7) % 2 === 0 ? "opening" : "close";
    // Today's prompt for it
    const item = bookendForDay(input.day, part);
    // The step
    return { lane: "thinking", kind: "session", label: part === "opening" ? "Opening drill" : "Closing drill", title: item.text, mode: "bookend", promptId: item.id, minutes: 1, href: `/session?mode=bookend&prompt=${item.id}` };
  }
  // A Table Topic
  const topic = tableTopicForDay(input.day);
  // The step (the question stays hidden until the countdown, as in a real Table Topic)
  return { lane: "thinking", kind: "session", label: "Table Topic", title: "A surprise question, answered on the spot", mode: "talk", promptId: topic.id, minutes: 2, href: `/session?mode=talk&prompt=${topic.id}` };
}

// The lesson labels by unit
const LESSON_LABELS = { answering: "Small-talk lesson", asking: "Asking lesson", listening: "Listening lesson" } as const;

// Connection: real conversations. The next small-talk lesson (answering, then asking, then listening); once they are done, a follow-up drill and a listening drill on alternate days
function connection(input: PlanInput, before: ReadonlyArray<SessionRecord>): PlanStep {
  // Lessons answered before today
  const answered = new Set(before.filter((session) => session.mode === "smalltalk").map((session) => session.promptId));
  // The next lesson not yet answered
  const lesson = SMALL_TALK_LESSONS.find((item) => !answered.has(item.id));
  // A lesson
  if (lesson) return { lane: "connection", kind: "session", label: `${LESSON_LABELS[lesson.unit]} ${lesson.number}`, title: lesson.title, mode: "smalltalk", promptId: lesson.id, minutes: 1, href: `/session?mode=smalltalk&prompt=${lesson.id}` };
  // Lessons finished: asking one day, listening the next
  const asking = dayNumber(input.day) % 2 === 0;
  // Today's drill
  const drill = drillForDay(asking ? "asking" : "listening", input.day);
  // The step (a story stays hidden until it is heard)
  return { lane: "connection", kind: "session", label: asking ? "Follow-up" : "Listening", title: asking ? drill.text : "A short story to respond to", mode: "smalltalk", promptId: drill.id, minutes: 1, href: `/session?mode=smalltalk&prompt=${drill.id}` };
}

// Learn: one card every day. The next card not read before today; once every card is read, the first card due for review today (or reviewed today, so the step stays put after it is done); none when nothing is due
function learnStep(input: PlanInput): PlanStep | null {
  // Today's start and end
  const start = startOfDay(input.day);
  // The end of today
  const end = new Date(start.getTime() + 86_400_000);
  // Progress
  const progress = input.learn ?? {};
  // Cards read before today
  const learned = Object.fromEntries(Object.entries(progress).filter(([, item]) => new Date(item.readAt) < start));
  // The next card not yet read
  const card = nextCard(learned);
  // A new card
  if (card) return { lane: "learn", kind: "card", label: "Learn", title: card.title, mode: null, promptId: card.id, minutes: 1, href: `/learn/card?id=${card.id}` };
  // Every card read: the first one due today, or already reviewed today
  const review = LEARN_CARDS.find((item) => {
    // Its progress
    const own = progress[item.id];
    // Due by the end of today, or answered today
    return !!own && (new Date(own.dueAt) < end || (!!own.recalledAt && new Date(own.recalledAt) >= start));
  });
  // A review, or nothing
  return review ? { lane: "learn", kind: "card", label: "Learn · review", title: review.title, mode: null, promptId: review.id, minutes: 1, href: `/learn/card?id=${review.id}` } : null;
}

// Sessions recorded before today
function beforeToday(sessions: ReadonlyArray<SessionRecord>, day: Date): SessionRecord[] {
  // Earlier than today's midnight
  return sessions.filter((session) => new Date(session.createdAt) < startOfDay(day));
}

// Today's steps: one from each lane, then a Learn card; new users (fewer than three practice days) get Delivery, On the spot and the card
export function dailyPlan(input: PlanInput): PlanStep[] {
  // Sessions before today, so the plan stays the same all day
  const before = beforeToday(input.sessions, input.day);
  // Days practised before today
  const practiceDays = new Set(before.map((session) => dayKey(new Date(session.createdAt)))).size;
  // Whether these are the first days
  const firstDays = practiceDays < 3;
  // Two gentle speaking steps at first, then all three lanes
  const speaking = firstDays ? [delivery(input, before, true), thinking(input, true)] : [delivery(input, before, false), thinking(input, false), connection(input, before)];
  // The day's Learn card, when there is one
  const card = learnStep(input);
  // Speaking first, then the card
  return card ? [...speaking, card] : speaking;
}

// Which steps were done today: a session today of the same kind and prompt, or a card read or reviewed today
export function planProgress(plan: ReadonlyArray<PlanStep>, sessions: ReadonlyArray<SessionRecord>, day: Date, learn: LearnProgress = {}): boolean[] {
  // Today's sessions
  const today = sessions.filter((session) => dayKey(new Date(session.createdAt)) === dayKey(day));
  // Each step
  return plan.map((step) => {
    // A card's progress
    const card = learn[step.promptId];
    // A card: read today, or its recall answered today
    if (step.kind === "card") return !!card && (dayKey(new Date(card.readAt)) === dayKey(day) || (!!card.recalledAt && dayKey(new Date(card.recalledAt)) === dayKey(day)));
    // A session of the same kind and prompt today
    return today.some((session) => session.mode === step.mode && session.promptId === step.promptId);
  });
}

// Speaking minutes plus listening back (about the same again; a card has nothing to hear back): the time the plan takes
export function planMinutes(plan: ReadonlyArray<PlanStep>): number {
  // Twice the speaking time, once for a card
  return plan.reduce((total, step) => total + step.minutes * (step.kind === "card" ? 1 : 2), 0);
}

// A step's address inside the plan (numbered from 1), so the pages after it know which step comes next
export function planHref(step: PlanStep, number: number): string {
  // The step's own address with the plan marker
  return `${step.href}&plan=${number}`;
}
