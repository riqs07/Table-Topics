// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the plan rules being checked
import { dailyPlan, moreToDo, planHref, planMinutes, planProgress } from "@/core/dailyPlan";
// Load the Learn rules, for a card read
import { afterRecall, firstRead } from "@/core/learn";
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
    // A new user's plan and a regular user's
    const plans = [dailyPlan({ day: DAY, sessions: [], focusId: "pausing", nextTalk: null }), regularPlan(DAY)];
    // Confirm the shape of both
    expect(plans.map((plan) => [plan.length, plan[0]?.kind, plan[0]?.promptId, plan[1]?.label, plan[1]?.mode])).toEqual([0, 1].map(() => [4, "card", LEARN_CARDS[0]?.id, "Warm up", "read"]));
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

  // Once every card is read, the Learn step is a card due for review, and it stays put after the review; none when nothing is due
  it("reviews a due card once every card is read", () => {
    // Every card read a while ago, due again in a month
    const read = Object.fromEntries(LEARN_CARDS.map((card) => [card.id, { ...firstRead(new Date(2026, 8, 1)), dueAt: new Date(2026, 10, 20).toISOString() }]));
    // The same with the third card due today
    const due = { ...read, [LEARN_CARDS[2]!.id]: { ...read[LEARN_CARDS[2]!.id]!, dueAt: new Date(2026, 9, 16, 8).toISOString() } };
    // The morning's plan
    const morning = regularPlan(DAY, { learn: due });
    // After answering it right today (due again in a week)
    const after = { ...due, [LEARN_CARDS[2]!.id]: afterRecall(due[LEARN_CARDS[2]!.id], true, DAY) };
    // Confirm nothing due means no card (the warm-up first), a due card is reviewed, and the step stays and is done after the review
    expect([regularPlan(DAY, { learn: read })[0]?.label, morning[0]?.label, morning[0]?.promptId, regularPlan(DAY, { learn: after })[0]?.promptId, planProgress(morning, [], DAY, after)[0]]).toEqual(["Warm up", "Learn · review", LEARN_CARDS[2]?.id, LEARN_CARDS[2]?.id, true]);
  });

  // After the answering lessons come the asking and listening ones; once every lesson is done, a follow-up and a story on alternate days
  it("moves on to asking and listening, then alternates their drills", () => {
    // Every answering lesson answered earlier
    const answered = SMALL_TALK_LESSONS.filter((lesson) => lesson.unit === "answering").map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // Every lesson answered earlier
    const allLessons = SMALL_TALK_LESSONS.map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // The Connect step on a day, if the day picks it
    const connect = (day: Date, sessions: ReturnType<typeof daysAgo>[]) => regularPlan(day, { sessions: [...regular, ...sessions] }).find((step) => step.lane === "connection" && step.label !== "Small talk");
    // The lesson after the answering ones, on the first day that picks it
    const lesson = Array.from({ length: 9 }, (_, offset) => connect(dayAfter(offset), answered)).find(Boolean);
    // The drills over two weeks with nothing left
    const drills = Array.from({ length: 14 }, (_, offset) => connect(dayAfter(offset), allLessons)).filter(Boolean);
    // Confirm the first asking lesson, then follow-ups and stories (a story's text hidden)
    expect([lesson?.label, lesson?.promptId, new Set(drills.map((step) => step?.label)), drills.find((step) => step?.label === "Listening")?.title]).toEqual(["Asking lesson 1", "sal1", new Set(["Follow-up", "Listening"]), "A short story to respond to"]);
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

  // A step's address carries its number in the plan, cards included
  it("marks a step's address with its number", () => {
    // The plan
    const plan = regularPlan(DAY);
    // Confirm both markers
    expect([planHref(plan[0]!, 1), planHref(plan[1]!, 2)]).toEqual([`/learn/card?id=${LEARN_CARDS[0]?.id}&plan=1`, "/session?mode=read&prompt=lincoln-second-inaugural-1&plan=2"]);
  });
});
