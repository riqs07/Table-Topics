// Today's practice: four steps, a Learn card, the warm-up reading, then two kinds of practice picked from the bank, taken in turn by day (decision 51; see documents/plan-daily-mix-and-connection.md); day one opens with free talk instead (decision 78); with a focus, the card and the first pick come from it (decision 97)

// Load the day pickers and lookups for the spoken prompts and texts
import { PAUSE_DRILLS, PASSAGES, findPrompt, promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the lessons
import { findLesson } from "@/content/lessons";
// Load the speeches' index and the reading names (not the speeches' text, which is most of the app's download; decision 88)
import { SPEECH_INDEX } from "@/content/speechIndex";
import { findSpeechSummary, partId, readingTitle } from "@/content/readingIndex";
// Load the calendar-day helpers
import { dayKey, daysBetween, startOfDay } from "@/core/dates";
// Load today's story prompt (decision 92)
import { storyPromptForDay } from "@/content/stories";
// Load today's guided story (decision 93)
import { guidedStoryForDay } from "@/content/guidedStories";
// Load the small-talk questions and lessons
import { SMALL_TALK_LESSONS, UNITS, drillForDay, findUnit, smallTalkForDay, unitOf, type UnitId } from "@/content/smallTalk";
// Load the next Learn card
import { nextCard, type LearnProgress } from "@/core/learn";
// Load the record types
import type { ScenarioProgress, SessionMode, SessionRecord } from "@/data/records";
// Load how many scenarios a quick round holds
import { QUICK_COUNT } from "@/core/scenarios";
// Load the step type and the rules about steps, which pages use without the plan (decision 88)
import { stepKey, type PlanLane, type PlanStep } from "@/core/planSteps";
// The step type and rules, for code that already loads the plan
export { nextStepIndex, planHref, planMinutes, stepKey, type PlanLane, type PlanStep } from "@/core/planSteps";
// Load the user's focus: which area leads today, and its kinds of practice (decision 97)
import { focusForDay, type FocusArea, type FocusAreaId, type PickKind } from "@/core/practiceFocus";
// Load the voice picks and names (decision 80)
import { VOICE_ROTATION, nextShadowPassage, nextVoiceDrill, warmupRoutine } from "@/core/voicePicks";
import { VOICE_MODE_NAMES } from "@/content/voice";

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
  // Days a warm-up routine was finished (only those before today are used)
  warmupDays?: ReadonlyArray<string>;
  // What the user wants to get better at most, one or two areas (decision 97; none or missing means the usual mix)
  practiceFocus?: ReadonlyArray<FocusAreaId>;
  // Today's weekly check-in, when today is a check-in day: its id and number (decision 100; missing or null otherwise)
  checkIn?: { id: string; week: number; baseline: boolean } | null;
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
  const unfinished = (id: string) => Array.from({ length: findSpeechSummary(id)?.partCount ?? 0 }, (_, index) => index).some((index) => !read.has(`${id}-${index + 1}`));
  // The speech of the newest reading of a part, if it is unfinished (the list is newest first)
  const current = before.filter((session) => session.mode === "read").map((session) => /^(.+)-\d+$/.exec(session.promptId)?.[1]).find((id) => id !== undefined && findSpeechSummary(id) !== undefined);
  // That speech, or the first unfinished one in the starter order, or any unfinished one, or the first
  const speechId = (current && unfinished(current) ? current : undefined) ?? STARTER_ORDER.find(unfinished) ?? SPEECH_INDEX.map((speech) => speech.id).find(unfinished) ?? STARTER_ORDER[0] ?? "";
  // The speech
  const speech = findSpeechSummary(speechId) ?? SPEECH_INDEX[0]!;
  // Its first part not yet read (or the first, if all are)
  const part = Math.max(0, Array.from({ length: speech.partCount }, (_, index) => index).findIndex((index) => !read.has(partId(speech, index + 1)))) + 1;
  // The part's id
  const id = partId(speech, part);
  // The step
  return { lane: "warmup", kind: "session", label: "Warm up", title: readingTitle(id) ?? speech.title, mode: "read", promptId: id, minutes: 1, href: `/session?mode=read&prompt=${id}` };
}

// The skill drill for this week's focus
function skill(focusId: string, day: Date): PlanStep {
  // The drill for today
  const drill = inTurn(SKILL_DRILLS[focusId] ?? PRACTICE, day);
  // Its name
  const title = drill.mode === "lesson" ? `Lesson ${findLesson(drill.promptId)?.number}: ${findLesson(drill.promptId)?.title}` : drill.mode === "pause" ? `Pause drill: ${readingTitle(drill.promptId)}` : (readingTitle(drill.promptId) ?? "A short reading");
  // The step
  return { lane: "delivery", kind: "session", label: "Skill", title, mode: drill.mode, promptId: drill.promptId, minutes: drill.mode === "lesson" ? 2 : 1, href: `/session?mode=${drill.mode}&prompt=${drill.promptId}` };
}

// The bank in three groups, each with its lane: speaking on the spot, delivery skills, and conversation
const GROUPS: ReadonlyArray<{ lane: PlanLane; kinds: ReadonlyArray<PickKind> }> = [
  // On the spot: Rapid Fire, an open story, Rapid Fire again (in the place the retired opening or closing drill had; decision 106), a guided story, a prepared speech; a story is two turns in five, so about twice a week, never twice in a row, open and guided in turn (decisions 92 and 93)
  { lane: "spot", kinds: ["talk", "story", "talk", "guided", "response"] },
  // Delivery: the week's focus drill, a voice drill (the voice modes in turn; decision 80), a pause drill
  { lane: "delivery", kinds: ["skill", "voice", "pause"] },
  // Conversation: the next Connect lesson or drill, a round of quick scenarios, an everyday question (decision 72)
  { lane: "connection", kinds: ["connect", "scenarios", "smalltalk"] },
];

// The two groups the day picks from, taken in turn by day, so each group comes up two days in three
const GROUP_PAIRS: ReadonlyArray<readonly [number, number]> = [[0, 2], [1, 0], [2, 1]];

// Kinds kept out of the first days (a prepared speech is long, the focus's own too)
const NOT_FIRST_DAYS: ReadonlyArray<PickKind> = ["response", "focus-speech"];

// The lane each kind belongs to: its bank group's, and on the spot for a focus's own lessons and speeches (they work on structure and speaking up)
function laneOf(kind: PickKind): PlanLane {
  // The bank group holding it, or on the spot
  return GROUPS.find((group) => group.kinds.includes(kind))?.lane ?? "spot";
}

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

// The step for a kind of practice on a day (a focus's own lesson or speech is taken from its lists, in turn)
function pickStep(kind: PickKind, lane: PlanLane, input: PlanInput, before: ReadonlyArray<SessionRecord>, area: FocusArea | null = null, turn = 0): PlanStep {
  // A lesson from the focus's list, in turn
  if (kind === "focus-lesson" && area && area.lessons.length > 0) {
    // Today's lesson
    const lesson = findLesson(area.lessons[((turn % area.lessons.length) + area.lessons.length) % area.lessons.length]!);
    // The step (a missing lesson cannot happen with the fixed lists; the week's skill drill stands in)
    return lesson ? { lane, kind: "session", label: "Lesson", title: `Lesson ${lesson.number}: ${lesson.title}`, mode: "lesson", promptId: lesson.id, minutes: 2, href: `/session?mode=lesson&prompt=${lesson.id}` } : { ...skill(input.focusId, input.day), lane };
  }
  // A prepared speech from the focus's list, in turn
  if (kind === "focus-speech" && area && area.speeches.length > 0) {
    // Today's task
    const prompt = findPrompt(area.speeches[((turn % area.speeches.length) + area.speeches.length) % area.speeches.length]!) ?? promptForDay(input.day);
    // The step
    return { lane, kind: "session", label: "Prepared speech", title: prompt.text, mode: "response", promptId: prompt.id, minutes: 3, href: `/session?mode=response&prompt=${prompt.id}` };
  }
  // A prepared speech
  if (kind === "response") {
    // Today's task
    const prompt = promptForDay(input.day);
    // The step
    return { lane, kind: "session", label: "Prepared speech", title: prompt.text, mode: "response", promptId: prompt.id, minutes: 3, href: `/session?mode=response&prompt=${prompt.id}` };
  }
  // A story: today's prompt, set up on its own page (the short length is chosen first there inside the plan; decision 92)
  if (kind === "story") {
    // Today's prompt
    const prompt = storyPromptForDay(input.day);
    // The step: a minute to plan and about a minute to tell
    return { lane, kind: "session", label: "Story", title: prompt.text, mode: "story", promptId: prompt.id, minutes: 2, href: `/stories/tell?prompt=${prompt.id}` };
  }
  // A guided story: today's facts to make a story of, set up on its own page with its own focus (decision 93)
  if (kind === "guided") {
    // Today's guided story
    const guided = guidedStoryForDay(input.day);
    // The step: a minute to plan and about a minute to tell
    return { lane, kind: "session", label: "Guided story", title: guided.title, mode: "story", promptId: guided.id, minutes: 2, href: `/stories/tell?prompt=${guided.id}` };
  }
  // The week's focus drill
  if (kind === "skill") return { ...skill(input.focusId, input.day), lane };
  // A voice drill: warm-up, clear sounds, volume, pitch and stress, tone or shadowing, in turn
  if (kind === "voice") return { ...voiceStep(input, before), lane };
  // A pause drill (a practice passage in pausing week, when the focus drill may already be one)
  if (kind === "pause") {
    // In pausing week, a practice passage
    if (input.focusId === "pausing") {
      // The passage
      const passage = inTurn(PRACTICE, input.day);
      // The step
      return { lane, kind: "session", label: "Read aloud", title: readingTitle(passage.promptId) ?? "A practice passage", mode: "read", promptId: passage.promptId, minutes: 1, href: `/session?mode=read&prompt=${passage.promptId}` };
    }
    // The drill
    const drill = inTurn(PAUSE, input.day);
    // The step
    return { lane, kind: "session", label: "Pause drill", title: readingTitle(drill.promptId) ?? "A pause drill", mode: "pause", promptId: drill.promptId, minutes: 1, href: `/session?mode=pause&prompt=${drill.promptId}` };
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
  // A Rapid Fire question (once called Table Topic; decision 85)
  const topic = tableTopicForDay(input.day);
  // The step (the question stays hidden until the countdown, as in a Toastmasters Table Topic)
  return { lane, kind: "session", label: "Rapid Fire", title: "A surprise question, answered on the spot", mode: "talk", promptId: topic.id, minutes: 2, href: `/session?mode=talk&prompt=${topic.id}` };
}

// The voice drill: the voice modes taken in turn by how many were done before today (a warm-up counts by its day, since it records nothing), each mode's next drill the one done least (decision 80)
function voiceStep(input: PlanInput, before: ReadonlyArray<SessionRecord>): PlanStep {
  // Voice sessions before today
  const voiceBefore = before.filter((session) => session.mode === "voice");
  // Warm-ups finished before today
  const warmupsBefore = (input.warmupDays ?? []).filter((day) => day < dayKey(input.day)).length;
  // The mode whose turn it is
  const pick = VOICE_ROTATION[(voiceBefore.length + warmupsBefore) % VOICE_ROTATION.length]!;
  // A warm-up routine, no recording
  if (pick === "warmup") return { lane: "delivery", kind: "warmup", label: VOICE_MODE_NAMES.warmup, title: warmupRoutine(input.day).map((move) => move.name).join(", "), mode: null, promptId: "warmup", minutes: 1, href: "/voice/warmup" };
  // How often each drill or passage was done
  const counts = new Map<string, number>();
  // Count them
  for (const session of voiceBefore) counts.set(session.promptId, (counts.get(session.promptId) ?? 0) + 1);
  // Shadowing: the next passage
  if (pick === "shadow") {
    // The passage
    const passage = nextShadowPassage(counts);
    // The step
    return { lane: "delivery", kind: "session", label: VOICE_MODE_NAMES.shadow, title: passage.title, mode: "voice", promptId: passage.id, minutes: 3, href: `/voice/shadow?id=${passage.id}` };
  }
  // A drill of the mode
  const drill = nextVoiceDrill(pick, counts);
  // The step
  return { lane: "delivery", kind: "session", label: VOICE_MODE_NAMES[pick], title: drill.title, mode: "voice", promptId: drill.id, minutes: 1, href: `/voice/drill?id=${drill.id}` };
}

// The step for a talk coming up, in a pick's place
function talkStep(talk: NonNullable<PlanInput["nextTalk"]>, lane: PlanLane): PlanStep {
  // A rehearsal of today's part of it
  return { lane, kind: "session", label: "Your talk", title: talk.headline, mode: "rehearse", promptId: talk.id, minutes: 3, href: `/session?mode=rehearse&prompt=${talk.id}` };
}

// The focus's pick for today: the leading area's kinds in turn on its own days (gentler in the first days), or nothing without a focus (decision 97)
function focusPick(input: PlanInput, before: ReadonlyArray<SessionRecord>, firstDays: boolean, offset = 0): { step: PlanStep; area: FocusArea } | null {
  // Today's roles for the areas
  const today = focusForDay(input.practiceFocus, dayNumber(input.day));
  // No focus
  if (!today) return null;
  // The leading area's kinds (without the long ones in the first days; never empty, as every area has a short kind)
  const kinds = today.pick.picks.filter((kind) => !firstDays || !NOT_FIRST_DAYS.includes(kind));
  // Its kind today, taking turns by how often it has led
  const kind = kinds[(((today.turn + offset) % kinds.length) + kinds.length) % kinds.length]!;
  // The step, in the kind's own lane
  return { step: pickStep(kind, laneOf(kind), input, before, today.pick, today.turn + offset), area: today.pick };
}

// The day's two picks from the bank (a talk coming up takes the first). With a focus, the first is the focus's and the second comes from whichever of today's two groups is not the focus pick's lane, so the rest stays mixed (decision 97)
function picks(input: PlanInput, before: ReadonlyArray<SessionRecord>, firstDays: boolean): PlanStep[] {
  // Today's two groups
  const pair = inTurn(GROUP_PAIRS, input.day);
  // The focus's pick, if there is a focus
  const focused = focusPick(input, before, firstDays);
  // No focus: one step from each of today's groups, as always
  if (!focused) {
    // One step from each
    const steps = pair.map((group) => pickStep(kindFor(group, input.day, firstDays), GROUPS[group]!.lane, input, before));
    // A talk coming up comes first
    if (input.nextTalk) steps[0] = talkStep(input.nextTalk, steps[0]!.lane);
    // The two
    return steps;
  }
  // Today's group that is not the focus pick's lane (the pair is two different groups, so one always differs)
  const group = pair.find((index) => GROUPS[index]!.lane !== focused.step.lane) ?? pair[0];
  // Its kind today, or the next one if it would repeat the focus's step
  const mixed = [0, 1].map((offset) => pickStep(kindFor(group, input.day, firstDays, offset), GROUPS[group]!.lane, input, before)).find((step) => step.mode !== focused.step.mode || step.promptId !== focused.step.promptId)!;
  // The focus first, then the mixed pick
  const steps = [focused.step, mixed];
  // A talk coming up takes the focus's place when the focus is that talk, otherwise the mixed pick's
  if (input.nextTalk) steps[focused.area.id === "talk" ? 0 : 1] = talkStep(input.nextTalk, steps[focused.area.id === "talk" ? 0 : 1]!.lane);
  // The two
  return steps;
}

// The lesson labels by unit
const LESSON_LABELS: Readonly<Record<UnitId, string>> = { answering: "Small-talk lesson", asking: "Asking lesson", listening: "Listening lesson", news: "News lesson", room: "Reading the room lesson", starting: "Starting and ending lesson", deeper: "Going deeper lesson" };

// The units whose drills take turns once every lesson is done: every unit but answering, in the units' order (asking, listening, news, then reading the room, starting and ending, and going deeper; decision 95)
const DRILL_TURNS: ReadonlyArray<UnitId> = UNITS.map((unit) => unit.id).filter((id) => id !== "answering");

// Connection: real conversations. The next small-talk lesson (answering, then asking, news and listening, then reading the room, starting and ending, and going deeper); once they are done, each unit's drill in turn
function connection(input: PlanInput, before: ReadonlyArray<SessionRecord>): PlanStep {
  // Lessons answered before today
  const answered = new Set(before.filter((session) => session.mode === "smalltalk").map((session) => session.promptId));
  // The next lesson not yet answered
  const lesson = SMALL_TALK_LESSONS.find((item) => !answered.has(item.id));
  // A lesson
  if (lesson) return { lane: "connection", kind: "session", label: `${LESSON_LABELS[lesson.unit]} ${lesson.number}`, title: lesson.title, mode: "smalltalk", promptId: lesson.id, minutes: 1, href: `/session?mode=smalltalk&prompt=${lesson.id}` };
  // Drills already done before today (not lessons), so the units take turns by practice rather than by date (the conversation pick comes up every few days, which would always land on the same unit)
  const drillsDone = before.filter((session) => session.mode === "smalltalk" && unitOf(session.promptId) !== "answering" && !SMALL_TALK_LESSONS.some((item) => item.id === session.promptId)).length;
  // Lessons finished: the units' drills in turn
  const unit = DRILL_TURNS[drillsDone % DRILL_TURNS.length]!;
  // Today's drill
  const drill = drillForDay(unit, input.day);
  // The step (a story stays hidden until it is heard)
  return { lane: "connection", kind: "session", label: findUnit(unit).words.history, title: unit === "listening" ? "A short story to respond to" : drill.text, mode: "smalltalk", promptId: drill.id, minutes: 1, href: `/session?mode=smalltalk&prompt=${drill.id}` };
}

// Learn: one card every day, the next one not read before today; none once every card is read (decision 67)
function learnStep(input: PlanInput): PlanStep | null {
  // Today's start
  const start = startOfDay(input.day);
  // Progress
  const progress = input.learn ?? {};
  // Cards read before today
  const learned = Object.fromEntries(Object.entries(progress).filter(([, item]) => new Date(item.readAt) < start));
  // The focus that gives today's card, if any (decision 97)
  const focus = focusForDay(input.practiceFocus, dayNumber(input.day));
  // The next card not yet read, from the focus's sets first
  const card = nextCard(learned, focus?.card.learnSets ?? []);
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

// The weekly check-in as a step: about six minutes, four parts in a row, on its own page (decision 100)
function checkInStep(checkIn: NonNullable<PlanInput["checkIn"]>): PlanStep {
  // The step (the first is the starting point, said as such)
  return { lane: "checkin", kind: "checkin", label: checkIn.baseline ? "Your first check-in" : "Weekly check-in", title: "Read, pitch, story and a surprise question", mode: null, promptId: checkIn.id, minutes: 6, href: "/check-in/run" };
}

// Today's steps: the Learn card (when there is one), the warm-up reading, then two picks from the bank; on day one, free talk comes first in place of the reading. On a check-in day the check-in takes the place of the reading and both picks, and the Learn card stays (decision 100)
export function dailyPlan(input: PlanInput): PlanStep[] {
  // Sessions before today, so the plan stays the same all day
  const before = beforeToday(input.sessions, input.day);
  // The day's Learn card, when there is one
  const card = learnStep(input);
  // Day one: free talk, the card, then the two picks
  if (before.length === 0) return [FIRST_TALK, ...(card ? [card] : []), ...picks(input, before, true)];
  // A check-in day: the check-in, then the card (the check-in already reads aloud, speaks on the spot and tells a story, so the reading and the picks would only make the day long)
  if (input.checkIn) return [checkInStep(input.checkIn), ...(card ? [card] : [])];
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
  // With a focus, its next kind first (decision 97)
  const focused = focusPick(input, before, firstDays, 1);
  // One suggestion from each group, one along from today's kind
  const practice = [...(focused ? [focused.step] : []), ...GROUPS.map((group, index) => pickStep(kindFor(index, input.day, firstDays, 1), group.lane, input, before))].filter((step, index, all) => !inPlan(step) && all.findIndex((other) => other.mode === step.mode && other.promptId === step.promptId) === index);
  // The next card not yet read, counting today's reading, from the focus's sets first
  const card = nextCard(input.learn ?? {}, focusForDay(input.practiceFocus, dayNumber(input.day))?.card.learnSets ?? []);
  // Another card, when there is one not in the plan
  const learn: PlanStep[] = card && !plan.some((item) => item.promptId === card.id) ? [{ lane: "learn", kind: "card", label: "Learn", title: card.title, mode: null, promptId: card.id, minutes: 1, href: `/learn/card?id=${card.id}` }] : [];
  // At most four
  return [...practice, ...learn].slice(0, 4);
}

// Which steps were done today: a session today of the same kind and prompt, a card read today (or, on older progress, its recall answered today), a round of scenarios answered today, a warm-up finished today, or today's check-in with every part done or skipped
export function planProgress(plan: ReadonlyArray<PlanStep>, sessions: ReadonlyArray<SessionRecord>, day: Date, learn: LearnProgress = {}, scenarios: Readonly<Record<string, ScenarioProgress>> = {}, warmupDays: ReadonlyArray<string> = [], checkInFinished = false): boolean[] {
  // Today's sessions
  const today = sessions.filter((session) => dayKey(new Date(session.createdAt)) === dayKey(day));
  // Each step
  return plan.map((step) => {
    // A warm-up: finished today
    if (step.kind === "warmup") return warmupDays.includes(dayKey(day));
    // The check-in: every part done or skipped (decision 100)
    if (step.kind === "checkin") return checkInFinished;
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

// Which steps were put off today with "Can't speak now?" (a skip from another day counts for nothing; decision 77)
export function planSkipped(plan: ReadonlyArray<PlanStep>, skipped: { day: string; steps: ReadonlyArray<string> } | undefined, day: Date): boolean[] {
  // Today's skips only
  const today = skipped && skipped.day === dayKey(day) ? skipped.steps : [];
  // Each step
  return plan.map((step) => today.includes(stepKey(step)));
}

// The one thing Today suggests once the day's steps are done: a specific session for the area leading today (decision 97)
export function focusSuggestion(area: FocusArea, day: Date): { action: string; href: string } {
  // Each area's next thing to do
  switch (area.id) {
    // Another story, one along from today's
    case "stories":
      return { action: "Tell another story", href: `/stories/tell?prompt=${storyPromptForDay(day, 1).id}` };
    // A whole conversation with one of the four people
    case "conversation":
      return { action: "Talk with someone", href: "/conversations" };
    // Another Rapid Fire question, two along from today's
    case "spot":
      return { action: "One more Rapid Fire", href: `/session?mode=talk&prompt=${tableTopicForDay(day, 2).id}` };
    // The voice drills
    case "voice":
      return { action: "A voice drill", href: "/voice" };
    // A short speech of your own: an update, a pitch, a plan
    case "work":
      return { action: "Plan a short speech", href: "/practice/outline" };
    // Your own talk, rehearsed section by section (the talk pages hidden by decision 49 still work)
    case "talk":
      return { action: "Rehearse your talk", href: "/rehearse" };
  }
}

// Today's suggestion for the focus leading today, or nothing without a focus
export function todaysFocusSuggestion(input: PlanInput): { action: string; href: string; phrase: string } | null {
  // Today's roles for the areas
  const today = focusForDay(input.practiceFocus, dayNumber(input.day));
  // The leading area's suggestion, with its name for the band
  return today ? { ...focusSuggestion(today.pick, input.day), phrase: today.pick.phrase } : null;
}
