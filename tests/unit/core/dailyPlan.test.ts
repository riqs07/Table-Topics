// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the plan rules being checked
import { dailyPlan, moreToDo, nextStepIndex, planHref, planMinutes, planProgress, planSkipped, stepKey } from "@/core/dailyPlan";
// Load the Learn rules, for a card read
import { firstRead } from "@/core/learn";
// Load the cards
import { LEARN_CARDS } from "@/content/learn";
// Load the small-talk lessons
import { SMALL_TALK_LESSONS } from "@/content/smallTalk";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Friday 16 October 2026, mid-morning
const DAY = new Date(2026, 9, 16, 10);
// A session on a given number of days before DAY
const daysAgo = (days: number, overrides = {}) => makeSession({ id: `s${days}-${Math.random()}`, createdAt: new Date(2026, 9, 16 - days, 9).toISOString(), ...overrides });
// Three earlier practice days, so the full plan applies
const regular = [daysAgo(1), daysAgo(2), daysAgo(3, { mode: "response", isBaseline: true })];
// A day a number of days after DAY
const dayAfter = (offset: number) => new Date(2026, 9, 16 + offset, 10);
// The plan for a regular user on a day
const regularPlan = (day: Date, extra: Partial<Parameters<typeof dailyPlan>[0]> = {}) => dailyPlan({ day, sessions: regular, focusId: "pausing", nextTalk: null, ...extra });

// Group the checks about today's practice
describe("dailyPlan", () => {
  // Every day: a Learn card, the warm-up reading, then two picks from the bank
  it("starts with a Learn card, then the warm-up, then two picks", () => {
    // A regular user's plan
    const plan = regularPlan(DAY);
    // Confirm its shape
    expect([plan.length, plan[0]?.kind, plan[0]?.promptId, plan[1]?.label, plan[1]?.mode]).toEqual([4, "card", LEARN_CARDS[0]?.id, "Warm up", "read"]);
  });

  // Day one opens with half a minute of free talk, then the card, then two picks: no reading aloud first (decision 78)
  it("opens day one with free talk", () => {
    // A new user's plan, and the same user's on day two (one session yesterday)
    const [first, second] = [dailyPlan({ day: DAY, sessions: [], focusId: "pausing", nextTalk: null }), dailyPlan({ day: DAY, sessions: [daysAgo(1)], focusId: "pausing", nextTalk: null })];
    // Confirm free talk then the card on day one, and the usual card then warm-up on day two
    expect([first.length, first[0]?.mode, first[0]?.title, first[1]?.kind, second[0]?.kind, second[1]?.label]).toEqual([4, "free", "Say anything about your day", "card", "card", "Warm up"]);
  });

  // The two picks come from two different groups, a different pair each day, and a group never offers the same kind twice in a row
  it("picks two kinds from different groups, varied by day", () => {
    // The picks over three weeks
    const days = Array.from({ length: 21 }, (_, offset) => regularPlan(dayAfter(offset)).slice(2));
    // Each group's kinds in the order they came up
    const byGroup = (lane: string) => days.flatMap((picks) => picks.filter((step) => step.lane === lane).map((step) => step.label.split(" ")[0]));
    // Whether a list repeats an item twice in a row
    const repeats = (items: ReadonlyArray<string | undefined>) => items.some((item, index) => index > 0 && item === items[index - 1]);
    // Every kind that came up
    const kinds = new Set(days.flatMap((picks) => picks.map((step) => step.mode)));
    // Confirm two groups a day, no repeats within a group, and every kind of practice comes up (in pausing week the pause pick is a practice reading)
    expect([days.every((picks) => picks.length === 2 && picks[0]?.lane !== picks[1]?.lane), repeats(byGroup("spot")), repeats(byGroup("delivery")), repeats(byGroup("connection")), ["talk", "bookend", "response", "pause", "read", "smalltalk"].filter((kind) => !kinds.has(kind as never))]).toEqual([true, false, false, false, []]);
  });

  // The first days keep the long prepared speech out
  it("keeps prepared speeches out of the first days", () => {
    // A new user's picks over three weeks
    const modes = Array.from({ length: 21 }, (_, offset) => dailyPlan({ day: dayAfter(offset), sessions: [], focusId: "pausing", nextTalk: null }).slice(2).map((step) => step.mode)).flat();
    // Confirm none
    expect(modes.includes("response")).toBe(false);
  });

  // The conversation pick is the next small-talk lesson
  it("offers the next small-talk lesson in the conversation pick", () => {
    // A day whose picks include the Connect lesson
    const step = Array.from({ length: 9 }, (_, offset) => regularPlan(dayAfter(offset)).find((item) => item.lane === "connection" && item.label.includes("lesson"))).find(Boolean);
    // Confirm the first lesson
    expect(step?.promptId).toBe("stl1");
  });

  // Once every card is read, there is no Learn step (cards have no review since decision 67)
  it("drops the Learn step once every card is read", () => {
    // Every card read a while ago
    const read = Object.fromEntries(LEARN_CARDS.map((card) => [card.id, firstRead(new Date(2026, 8, 1))]));
    // Confirm the warm-up comes first and no step is a card
    expect([regularPlan(DAY, { learn: read })[0]?.label, regularPlan(DAY, { learn: read }).some((step) => step.kind === "card")]).toEqual(["Warm up", false]);
  });

  // After the answering lessons come the asking, listening and news ones; once every lesson is done, a follow-up, a story and some news in turn
  it("moves on to asking, listening and news, then takes their drills in turn", () => {
    // Every answering lesson answered earlier
    const answered = SMALL_TALK_LESSONS.filter((lesson) => lesson.unit === "answering").map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // Every lesson answered earlier
    const allLessons = SMALL_TALK_LESSONS.map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // The Connect step on a day, if the day picks it
    const connect = (day: Date, sessions: ReturnType<typeof daysAgo>[]) => regularPlan(day, { sessions: [...regular, ...sessions] }).find((step) => step.lane === "connection" && step.label !== "Small talk");
    // The lesson after the answering ones, on the first day that picks it
    const lesson = Array.from({ length: 9 }, (_, offset) => connect(dayAfter(offset), answered)).find(Boolean);
    // A day whose picks include the Connect step
    const day = Array.from({ length: 9 }, (_, offset) => dayAfter(offset)).find((candidate) => connect(candidate, allLessons))!;
    // The drill after none, one and two earlier drills (they take turns by practice, not by date)
    const drills = [0, 1, 2].map((done) => connect(day, [...allLessons, ...["sa01", "sls01"].slice(0, done).map((promptId, index) => daysAgo(20 + index, { mode: "smalltalk", promptId }))]));
    // Confirm the first asking lesson, then follow-ups and stories (a story's text hidden)
    expect([lesson?.label, lesson?.promptId, new Set(drills.map((step) => step?.label)), drills.find((step) => step?.label === "Listening")?.title]).toEqual(["Asking lesson 1", "sal1", new Set(["Follow-up", "Listening", "News"]), "A short story to respond to"]);
  });

  // What counts as read comes from before today, so reading a card today does not change today's plan
  it("uses only progress from before today", () => {
    // The plan in the morning
    const morning = regularPlan(DAY);
    // After reading that card today
    const later = regularPlan(DAY, { learn: { [morning[0]!.promptId]: firstRead(DAY) } });
    // Confirm the same plan
    expect(later).toEqual(morning);
  });

  // The warm-up continues the speech under way, from the next part
  it("continues the speech under way", () => {
    // A user who read parts 1 and 2 of Kennedy's inaugural
    const sessions = [...regular, daysAgo(1, { mode: "read", promptId: "jfk-inaugural-2" }), daysAgo(2, { mode: "read", promptId: "jfk-inaugural-1" })];
    // Confirm part 3
    expect(regularPlan(DAY, { sessions })[1]?.promptId).toBe("jfk-inaugural-3");
  });

  // A talk coming up takes the first pick
  it("puts a talk coming up in the first pick", () => {
    // The plan with a talk
    const step = regularPlan(DAY, { nextTalk: { id: "talk-1", title: "Pitch", headline: "Your talk is in 3 days." } })[2];
    // Confirm a rehearsal of it
    expect([step?.mode, step?.promptId, step?.title]).toEqual(["rehearse", "talk-1", "Your talk is in 3 days."]);
  });

  // The plan takes about five to fourteen minutes, listening back included
  it("fits in a few minutes", () => {
    // The totals over three weeks
    const totals = Array.from({ length: 21 }, (_, offset) => planMinutes(regularPlan(dayAfter(offset))));
    // Confirm every day is between 4 and 16 minutes
    expect(totals.every((total) => total >= 4 && total <= 16)).toBe(true);
  });
});

// Group the checks about what to do after the plan
describe("moreToDo", () => {
  // Up to four more things, none already in the plan: one from each group, then another card
  it("suggests more from each group and another card, none from the plan", () => {
    // The plan and its suggestions, read the plan's card today
    const plan = regularPlan(DAY);
    // The suggestions once the day's card is read
    const more = moreToDo({ day: DAY, sessions: regular, focusId: "pausing", nextTalk: null, learn: { [plan[0]!.promptId]: firstRead(DAY) } }, plan);
    // Confirm at most four, none in the plan, and the last is the next card
    expect([more.length >= 3 && more.length <= 4, more.some((step) => plan.some((item) => item.mode === step.mode && item.promptId === step.promptId)), more.at(-1)?.promptId]).toEqual([true, false, LEARN_CARDS[1]?.id]);
  });
});

// Group the checks about progress through the plan
describe("planProgress", () => {
  // A session step is done by a session today; a card step by reading the card today
  it("marks steps done by today's sessions and cards", () => {
    // The day
    const day = DAY;
    // Its plan
    const plan = regularPlan(day);
    // The warm-up done today, the first pick done yesterday, the card read today
    const sessions = [makeSession({ id: "a", mode: plan[1]!.mode!, promptId: plan[1]!.promptId, createdAt: new Date(day.getTime() - 3_600_000).toISOString() }), makeSession({ id: "b", mode: plan[2]!.mode!, promptId: plan[2]!.promptId, createdAt: new Date(day.getTime() - 86_400_000).toISOString() })];
    // Confirm the card and the warm-up
    expect(planProgress(plan, sessions, day, { [plan[0]!.promptId]: firstRead(day) })).toEqual([true, true, false, false]);
  });

  // Quick scenarios are in the conversation group's turn (decision 72): no recording, counted once, done after a round's worth of answers today
  it("offers a round of quick scenarios, done after three answers today", () => {
    // A new user's plan on a day the conversation pick is scenarios
    const day = new Date(2026, 9, 13, 10);
    // The plan
    const plan = dailyPlan({ day, sessions: [], focusId: "pausing", nextTalk: null });
    // The scenarios step
    const step = plan.find((item) => item.kind === "scenarios")!;
    // An answer on a day
    const answer = (at: Date) => ({ firstTier: "best", lastTier: "best", firstAt: at.toISOString(), lastAt: at.toISOString() });
    // Two answered today, then three, then three yesterday
    const done = (count: number, at: Date) => planProgress([step], [], day, {}, Object.fromEntries(Array.from({ length: count }, (_, index) => [`sc-${index}`, answer(at)])))[0];
    // Confirm its look, its address in the plan, its time, and when it is done
    expect([step.label, step.lane, step.mode, planHref(step, 4), planMinutes([step]), done(2, day), done(3, day), done(3, new Date(2026, 9, 12, 10))]).toEqual(["Quick scenarios", "connection", null, "/learn/scenarios?plan=4", 2, false, true, false]);
  });

  // A step's address carries its number in the plan, cards included
  it("marks a step's address with its number", () => {
    // The plan
    const plan = regularPlan(DAY);
    // Confirm both markers
    expect([planHref(plan[0]!, 1), planHref(plan[1]!, 2)]).toEqual([`/learn/card?id=${LEARN_CARDS[0]?.id}&plan=1`, "/session?mode=read&prompt=lincoln-second-inaugural-1&plan=2"]);
  });
});

// Group the checks about putting a step off ("Can't speak now?", decision 77)
describe("planSkipped", () => {
  // Today's skips mark their steps; another day's mean nothing
  it("marks steps put off today only", () => {
    // The plan
    const plan = regularPlan(DAY);
    // The warm-up put off today, then the same list dated yesterday
    const today = planSkipped(plan, { day: "2026-10-16", steps: [stepKey(plan[1]!)] }, DAY);
    // Yesterday's
    const yesterday = planSkipped(plan, { day: "2026-10-15", steps: [stepKey(plan[1]!)] }, DAY);
    // Confirm both, and that nothing saved means nothing skipped
    expect([today, yesterday, planSkipped(plan, undefined, DAY)]).toEqual([[false, true, false, false], [false, false, false, false], [false, false, false, false]]);
  });

  // The next step passes over steps done or put off, and none is left once every step is one or the other
  it("offers the first step neither done nor put off", () => {
    // Card done, warm-up put off
    const partly = nextStepIndex([true, false, false, false], [false, true, false, false]);
    // Everything done or put off
    const none = nextStepIndex([true, false, true, true], [false, true, false, false]);
    // Confirm the third step, then none
    expect([partly, none]).toEqual([2, -1]);
  });
});
