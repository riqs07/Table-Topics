// Today's practice: four steps, a Learn card, the warm-up reading, then two kinds of practice picked from the bank, taken in turn by day (decision 51; see documents/plan-daily-mix-and-connection.md); day one opens with free talk instead (decision 78)

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
import { SMALL_TALK_LESSONS, drillForDay, smallTalkForDay, unitOf } from "@/content/smallTalk";
// Load the next Learn card
import { nextCard, type LearnProgress } from "@/core/learn";
// Load the record types
import type { ScenarioProgress, SessionMode, SessionRecord } from "@/data/records";
// Load how many scenarios a quick round holds
import { QUICK_COUNT } from "@/core/scenarios";

// Where a step of the day's practice comes from: the Learn card, the warm-up, or one of the bank's three groups (speaking on the spot, delivery skills, conversation)
export type PlanLane = "learn" | "warmup" | "spot" | "delivery" | "connection";

// One step of today's practice
export interface PlanStep {
  // Its lane
  lane: PlanLane;
  // A recorded session, a Learn card, or a round of quick scenarios (decision 72)
  kind: "session" | "card" | "scenarios";
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
  return { lane: "warmup", kind: "session", label: "Warm up", title: findReading(id)?.title ?? speech.title, mode: "read", promptId: id, minutes: 1, href: `/session?mode=read&prompt=${id}` };
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

// One kind of practice the day can pick
type PickKind = "talk" | "response" | "bookend" | "skill" | "pause" | "connect" | "smalltalk" | "scenarios";

// The bank in three groups, each with its lane: speaking on the spot, delivery skills, and conversation
const GROUPS: ReadonlyArray<{ lane: PlanLane; kinds: ReadonlyArray<PickKind> }> = [
  // On the spot: a Table Topic, an opening or closing, a prepared speech
  { lane: "spot", kinds: ["talk", "bookend", "response"] },
  // Delivery: the week's focus drill, a pause drill
  { lane: "delivery", kinds: ["skill", "pause"] },
  // Conversation: the next Connect lesson or drill, a round of quick scenarios, an everyday question (decision 72)
  { lane: "connection", kinds: ["connect", "scenarios", "smalltalk"] },
];

// The two groups the day picks from, taken in turn by day, so each group comes up two days in three
const GROUP_PAIRS: ReadonlyArray<readonly [number, number]> = [[0, 2], [1, 0], [2, 1]];

// Kinds kept out of the first days (a prepared speech is long)
const NOT_FIRST_DAYS: ReadonlyArray<PickKind> = ["response"];

// The kind a group offers on a day: the group's kinds taken in turn by how often the group has come up, so it never repeats on consecutive appearances (plus an offset for "keep going" suggestions)
function kindFor(group: number, day: Date, firstDays: boolean, offset = 0): PickKind {
  // The group's kinds (a gentler list in the first days)
  const kinds = GROUPS[group]!.kinds.filter((kind) => !firstDays || !NOT_FIRST_DAYS.includes(kind));
  // The day's number
  const number = dayNumber(day);
  // Which three-day cycle, and where in it
  const cycle = Math.floor(number / GROUP_PAIRS.length);
  // The place in the cycle, kept positive
  const place = ((number % GROUP_PAIRS.length) + GROUP_PAIRS.length) % GROUP_PAIRS.length;
  // How many times the group has come up before today in this cycle
  const earlier = GROUP_PAIRS.slice(0, place).filter((pair) => pair.includes(group)).length;
  // Its appearance count, from which the kind follows
  const appearance = cycle * 2 + earlier + offset;
  // The kind, wrapping round
  return kinds[((appearance % kinds.length) + kinds.length) % kinds.length]!;
}

// The step for a kind of practice on a day
function pickStep(kind: PickKind, lane: PlanLane, input: PlanInput, before: ReadonlyArray<SessionRecord>): PlanStep {
  // A prepared speech
  if (kind === "response") {
    // Today's task
    const prompt = promptForDay(input.day);
    // The step
    return { lane, kind: "session", label: "Prepared speech", title: prompt.text, mode: "response", promptId: prompt.id, minutes: 3, href: `/session?mode=response&prompt=${prompt.id}` };
  }
  // An opening or a closing drill (the week's focus decides which, if it is one of them)
  if (kind === "bookend") {
    // Opening or close, alternating by week otherwise
    const part = input.focusId === "strong-close" ? "close" : input.focusId === "strong-opening" ? "opening" : Math.floor(dayNumber(input.day) / 7) % 2 === 0 ? "opening" : "close";
    // Today's prompt for it
    const item = bookendForDay(input.day, part);
    // The step
    return { lane, kind: "session", label: part === "opening" ? "Opening drill" : "Closing drill", title: item.text, mode: "bookend", promptId: item.id, minutes: 1, href: `/session?mode=bookend&prompt=${item.id}` };
  }
  // The week's focus drill
  if (kind === "skill") return { ...skill(input.focusId, input.day), lane };
  // A pause drill (a practice passage in pausing week, when the focus drill may already be one)
  if (kind === "pause") {
    // In pausing week, a practice passage
    if (input.focusId === "pausing") {
      // The passage
      const passage = inTurn(PRACTICE, input.day);
      // The step
      return { lane, kind: "session", label: "Read aloud", title: findReading(passage.promptId)?.title ?? "A practice passage", mode: "read", promptId: passage.promptId, minutes: 1, href: `/session?mode=read&prompt=${passage.promptId}` };
    }
    // The drill
    const drill = inTurn(PAUSE, input.day);
    // The step
    return { lane, kind: "session", label: "Pause drill", title: findReading(drill.promptId)?.title ?? "A pause drill", mode: "pause", promptId: drill.promptId, minutes: 1, href: `/session?mode=pause&prompt=${drill.promptId}` };
  }
  // The next Connect lesson or drill
  if (kind === "connect") return { ...connection(input, before), lane };
  // A round of quick scenarios: choose the best reply, then say it (decision 72)
  if (kind === "scenarios") return { lane, kind: "scenarios", label: "Quick scenarios", title: "Choose the best reply, then say it", mode: null, promptId: "scenarios", minutes: 2, href: "/learn/scenarios" };
  // An everyday small-talk question
  if (kind === "smalltalk") {
    // Today's question
    const question = smallTalkForDay(input.day);
    // The step
    return { lane, kind: "session", label: "Small talk", title: question.text, mode: "smalltalk", promptId: question.id, minutes: 1, href: `/session?mode=smalltalk&prompt=${question.id}` };
  }
  // A Table Topic
  const topic = tableTopicForDay(input.day);
  // The step (the question stays hidden until the countdown, as in a real Table Topic)
  return { lane, kind: "session", label: "Table Topic", title: "A surprise question, answered on the spot", mode: "talk", promptId: topic.id, minutes: 2, href: `/session?mode=talk&prompt=${topic.id}` };
}

// The day's two picks from the bank (a talk coming up takes the first)
function picks(input: PlanInput, before: ReadonlyArray<SessionRecord>, firstDays: boolean): PlanStep[] {
  // Today's two groups
  const pair = inTurn(GROUP_PAIRS, input.day);
  // One step from each
  const steps = pair.map((group) => pickStep(kindFor(group, input.day, firstDays), GROUPS[group]!.lane, input, before));
  // A talk coming up comes first
  if (input.nextTalk) steps[0] = { lane: steps[0]!.lane, kind: "session", label: "Your talk", title: input.nextTalk.headline, mode: "rehearse", promptId: input.nextTalk.id, minutes: 3, href: `/session?mode=rehearse&prompt=${input.nextTalk.id}` };
  // The two
  return steps;
}

// The lesson labels by unit
const LESSON_LABELS = { answering: "Small-talk lesson", asking: "Asking lesson", listening: "Listening lesson", news: "News lesson" } as const;

// Connection: real conversations. The next small-talk lesson (answering, then asking, then listening, then news); once they are done, a follow-up, a story and some news in turn
function connection(input: PlanInput, before: ReadonlyArray<SessionRecord>): PlanStep {
  // Lessons answered before today
  const answered = new Set(before.filter((session) => session.mode === "smalltalk").map((session) => session.promptId));
  // The next lesson not yet answered
  const lesson = SMALL_TALK_LESSONS.find((item) => !answered.has(item.id));
  // A lesson
  if (lesson) return { lane: "connection", kind: "session", label: `${LESSON_LABELS[lesson.unit]} ${lesson.number}`, title: lesson.title, mode: "smalltalk", promptId: lesson.id, minutes: 1, href: `/session?mode=smalltalk&prompt=${lesson.id}` };
  // Drills already done before today (not lessons), so the units take turns by practice rather than by date (the conversation pick comes up every few days, which would always land on the same unit)
  const drillsDone = before.filter((session) => session.mode === "smalltalk" && unitOf(session.promptId) !== "answering" && !SMALL_TALK_LESSONS.some((item) => item.id === session.promptId)).length;
  // Lessons finished: asking, listening and news in turn
  const unit = (["asking", "listening", "news"] as const)[drillsDone % 3]!;
  // Today's drill
  const drill = drillForDay(unit, input.day);
  // The step (a story stays hidden until it is heard)
  return { lane: "connection", kind: "session", label: unit === "asking" ? "Follow-up" : unit === "news" ? "News" : "Listening", title: unit === "listening" ? "A short story to respond to" : drill.text, mode: "smalltalk", promptId: drill.id, minutes: 1, href: `/session?mode=smalltalk&prompt=${drill.id}` };
}

// Learn: one card every day, the next one not read before today; none once every card is read (decision 67)
function learnStep(input: PlanInput): PlanStep | null {
  // Today's start
  const start = startOfDay(input.day);
  // Progress
  const progress = input.learn ?? {};
  // Cards read before today
  const learned = Object.fromEntries(Object.entries(progress).filter(([, item]) => new Date(item.readAt) < start));
  // The next card not yet read
  const card = nextCard(learned);
  // A new card
  if (card) return { lane: "learn", kind: "card", label: "Learn", title: card.title, mode: null, promptId: card.id, minutes: 1, href: `/learn/card?id=${card.id}` };
  // Every card read: no Learn step (cards have no review since decision 67)
  return null;
}

// Sessions recorded before today
function beforeToday(sessions: ReadonlyArray<SessionRecord>, day: Date): SessionRecord[] {
  // Earlier than today's midnight
  return sessions.filter((session) => new Date(session.createdAt) < startOfDay(day));
}

// Whether these are the first days (fewer than three days practised before today)
function inFirstDays(before: ReadonlyArray<SessionRecord>): boolean {
  // Days practised before today
  return new Set(before.map((session) => dayKey(new Date(session.createdAt)))).size < 3;
}

// The very first step on day one: half a minute of free talk, so the first thing a new user does is speak (decision 78)
const FIRST_TALK: PlanStep = { lane: "warmup", kind: "session", label: "Free talk", title: "Say anything about your day", mode: "free", promptId: "free", minutes: 1, href: "/session?mode=free&prompt=free" };

// Today's steps: the Learn card (when there is one), the warm-up reading, then two picks from the bank; on day one, free talk comes first in place of the reading
export function dailyPlan(input: PlanInput): PlanStep[] {
  // Sessions before today, so the plan stays the same all day
  const before = beforeToday(input.sessions, input.day);
  // The day's Learn card, when there is one
  const card = learnStep(input);
  // Day one: free talk, the card, then the two picks
  if (before.length === 0) return [FIRST_TALK, ...(card ? [card] : []), ...picks(input, before, true)];
  // The card, the warm-up, then the two picks
  return [...(card ? [card] : []), warmUp(before), ...picks(input, before, inFirstDays(before))];
}

// More to do once today's practice is done: from each group, the next kind after today's (or its first, if it was not picked), skipping anything already in the plan, then another Learn card; at most four
export function moreToDo(input: PlanInput, plan: ReadonlyArray<PlanStep>): PlanStep[] {
  // Sessions before today
  const before = beforeToday(input.sessions, input.day);
  // Whether these are the first days
  const firstDays = inFirstDays(before);
  // Whether a step is already in the plan
  const inPlan = (step: PlanStep) => plan.some((item) => item.mode === step.mode && item.promptId === step.promptId);
  // One suggestion from each group, one along from today's kind
  const practice = GROUPS.map((group, index) => pickStep(kindFor(index, input.day, firstDays, 1), group.lane, input, before)).filter((step) => !inPlan(step));
  // The next card not yet read, counting today's reading
  const card = nextCard(input.learn ?? {});
  // Another card, when there is one not in the plan
  const learn: PlanStep[] = card && !plan.some((item) => item.promptId === card.id) ? [{ lane: "learn", kind: "card", label: "Learn", title: card.title, mode: null, promptId: card.id, minutes: 1, href: `/learn/card?id=${card.id}` }] : [];
  // At most four
  return [...practice, ...learn].slice(0, 4);
}

// Which steps were done today: a session today of the same kind and prompt, a card read today (or, on older progress, its recall answered today), or a round of scenarios answered today
export function planProgress(plan: ReadonlyArray<PlanStep>, sessions: ReadonlyArray<SessionRecord>, day: Date, learn: LearnProgress = {}, scenarios: Readonly<Record<string, ScenarioProgress>> = {}): boolean[] {
  // Today's sessions
  const today = sessions.filter((session) => dayKey(new Date(session.createdAt)) === dayKey(day));
  // Each step
  return plan.map((step) => {
    // Scenarios: a round's worth answered today
    if (step.kind === "scenarios") return Object.values(scenarios).filter((item) => dayKey(new Date(item.lastAt)) === dayKey(day)).length >= QUICK_COUNT;
    // A card's progress
    const card = learn[step.promptId];
    // A card: read today, or its recall answered today
    if (step.kind === "card") return !!card && (dayKey(new Date(card.readAt)) === dayKey(day) || (!!card.recalledAt && dayKey(new Date(card.recalledAt)) === dayKey(day)));
    // A session of the same kind and prompt today
    return today.some((session) => session.mode === step.mode && session.promptId === step.promptId);
  });
}

// A step's key, the same all day: its kind, its kind of session and what it uses
export function stepKey(step: PlanStep): string {
  // Joined with colons
  return `${step.kind}:${step.mode ?? ""}:${step.promptId}`;
}

// Which steps were put off today with "Can't speak now?" (a skip from another day counts for nothing; decision 77)
export function planSkipped(plan: ReadonlyArray<PlanStep>, skipped: { day: string; steps: ReadonlyArray<string> } | undefined, day: Date): boolean[] {
  // Today's skips only
  const today = skipped && skipped.day === dayKey(day) ? skipped.steps : [];
  // Each step
  return plan.map((step) => today.includes(stepKey(step)));
}

// The next step to offer: the first neither done nor put off today (-1 when none is left)
export function nextStepIndex(done: ReadonlyArray<boolean>, skipped: ReadonlyArray<boolean>): number {
  // The first open one
  return done.findIndex((isDone, index) => !isDone && !skipped[index]);
}

// Speaking minutes plus listening back (about the same again; a card or a round of scenarios has nothing to hear back): the time the plan takes
export function planMinutes(plan: ReadonlyArray<PlanStep>): number {
  // Twice the speaking time for a session, once otherwise
  return plan.reduce((total, step) => total + step.minutes * (step.kind === "session" ? 2 : 1), 0);
}

// A step's address inside the plan (numbered from 1), so the pages after it know which step comes next
export function planHref(step: PlanStep, number: number): string {
  // The step's own address with the plan marker (after a ? when the address has no query yet)
  return `${step.href}${step.href.includes("?") ? "&" : "?"}plan=${number}`;
}
