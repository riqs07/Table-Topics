// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the plan rules being checked
import { dailyPlan, planHref, planMinutes, planProgress } from "@/core/dailyPlan";
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
  // A new user gets two gentle speaking steps, the next part of a speech then a Table Topic, and a Learn card, every day of their first days
  it("gives a new user a reading, a Table Topic and a Learn card", () => {
    // The plans over a week for a new user
    const plans = Array.from({ length: 7 }, (_, offset) => dailyPlan({ day: dayAfter(offset), sessions: [], focusId: "pausing", nextTalk: null }));
    // Confirm always a reading, a Table Topic, then a card
    expect(new Set(plans.map((plan) => plan.map((step) => `${step.lane}:${step.mode ?? step.kind}`).join(" ")))).toEqual(new Set(["delivery:read thinking:talk learn:card"]));
  });

  // After three practice days, one step from each of the three lanes, then the Learn card
  it("takes one step from each lane, then a Learn card", () => {
    // Confirm the lanes
    expect(regularPlan(DAY).map((step) => step.lane)).toEqual(["delivery", "thinking", "connection", "learn"]);
  });

  // Each lane takes turns across a week, never the same kind two days running
  it("takes turns within each lane across a week", () => {
    // The plans over a week
    const week = Array.from({ length: 7 }, (_, offset) => regularPlan(dayAfter(offset)));
    // Each lane's kinds by day
    const lane = (index: number) => week.map((plan) => `${plan[index]?.mode}:${plan[index]?.label.split(":")[0]}`);
    // Whether a lane repeats on consecutive days
    const repeats = (kinds: string[]) => kinds.some((kind, day) => day > 0 && kind === kinds[day - 1]);
    // The On-the-spot kinds seen
    const thinking = new Set(week.map((plan) => plan[1]?.mode));
    // Confirm no repeats in Delivery or On the spot, and every On-the-spot kind appears
    expect([repeats(lane(0)), repeats(lane(1)), [...thinking].sort()]).toEqual([false, false, ["bookend", "response", "smalltalk", "talk"]]);
  });

  // Connection is the next small-talk lesson every day; the Learn step is the next unread card
  it("offers the next small-talk lesson and the next Learn card every day", () => {
    // Two days in a row
    const plans = [regularPlan(DAY), regularPlan(dayAfter(1))];
    // Confirm the first lesson and the first card both days
    expect(plans.map((plan) => [plan[2]?.promptId, plan[3]?.promptId, plan[3]?.href])).toEqual([0, 1].map(() => ["stl1", LEARN_CARDS[0]?.id, `/learn/card?id=${LEARN_CARDS[0]?.id}`]));
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
    // Confirm nothing due means no card, a due card is reviewed, and the step stays and is done after the review
    expect([regularPlan(DAY, { learn: read }).length, morning[3]?.label, morning[3]?.promptId, regularPlan(DAY, { learn: after })[3]?.promptId, planProgress(morning, [], DAY, after)[3]]).toEqual([3, "Learn · review", LEARN_CARDS[2]?.id, LEARN_CARDS[2]?.id, true]);
  });

  // After the answering lessons come the asking and listening ones; once every lesson is done, a follow-up and a story on alternate days
  it("moves on to asking and listening, then alternates their drills", () => {
    // Every answering lesson answered earlier
    const answered = SMALL_TALK_LESSONS.filter((lesson) => lesson.unit === "answering").map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // Every lesson answered earlier
    const allLessons = SMALL_TALK_LESSONS.map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // The lesson step after the answering lessons, whichever day it falls on
    const lesson = regularPlan(DAY, { sessions: [...regular, ...answered] })[2];
    // Two days in a row with nothing left
    const drills = [DAY, dayAfter(1)].map((day) => regularPlan(day, { sessions: [...regular, ...allLessons] })[2]);
    // Confirm the first asking lesson, then one follow-up and one story (its text hidden)
    expect([lesson?.label, lesson?.promptId, new Set(drills.map((step) => step?.label)), drills.find((step) => step?.label === "Listening")?.title]).toEqual(["Asking lesson 1", "sal1", new Set(["Follow-up", "Listening"]), "A short story to respond to"]);
  });

  // What counts as read comes from before today, so reading a card today does not change today's plan
  it("uses only progress from before today", () => {
    // The plan in the morning
    const morning = regularPlan(DAY);
    // After reading that card today
    const later = regularPlan(DAY, { learn: { [morning[3]!.promptId]: firstRead(DAY) } });
    // Confirm the same plan
    expect(later).toEqual(morning);
  });

  // The Delivery lane continues the speech under way, from the next part
  it("continues the speech under way", () => {
    // A user who read parts 1 and 2 of Kennedy's inaugural
    const sessions = [...regular, daysAgo(1, { mode: "read", promptId: "jfk-inaugural-2" }), daysAgo(2, { mode: "read", promptId: "jfk-inaugural-1" })];
    // The first day this week whose Delivery step is the speech
    const reading = Array.from({ length: 7 }, (_, offset) => dailyPlan({ day: dayAfter(offset), sessions, focusId: "pausing", nextTalk: null })[0]).find((step) => step?.mode === "read" && step.label === "Warm up");
    // Confirm part 3
    expect(reading?.promptId).toBe("jfk-inaugural-3");
  });

  // A talk coming up takes the On-the-spot step
  it("puts a talk coming up in the On-the-spot step", () => {
    // The plan with a talk
    const step = regularPlan(DAY, { nextTalk: { id: "talk-1", title: "Pitch", headline: "Your talk is in 3 days." } })[1];
    // Confirm a rehearsal of it
    expect([step?.mode, step?.promptId, step?.title]).toEqual(["rehearse", "talk-1", "Your talk is in 3 days."]);
  });

  // The plan takes about five to twelve minutes, listening back included
  it("fits in a few minutes", () => {
    // The totals over two weeks
    const totals = Array.from({ length: 14 }, (_, offset) => planMinutes(regularPlan(dayAfter(offset))));
    // Confirm every day is between 4 and 14 minutes
    expect(totals.every((total) => total >= 4 && total <= 14)).toBe(true);
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
    // The Delivery step done today, the On-the-spot step done yesterday, the card read today
    const sessions = [makeSession({ id: "a", mode: plan[0]!.mode!, promptId: plan[0]!.promptId, createdAt: new Date(day.getTime() - 3_600_000).toISOString() }), makeSession({ id: "b", mode: plan[1]!.mode!, promptId: plan[1]!.promptId, createdAt: new Date(day.getTime() - 86_400_000).toISOString() })];
    // Confirm the first and the card
    expect(planProgress(plan, sessions, day, { [plan[3]!.promptId]: firstRead(day) })).toEqual([true, false, false, true]);
  });

  // A step's address carries its number in the plan, cards included
  it("marks a step's address with its number", () => {
    // The first step for a new user, and a card step
    const card = regularPlan(DAY)[3]!;
    // Confirm both markers
    expect([planHref(dailyPlan({ day: DAY, sessions: [], focusId: "pausing", nextTalk: null })[0]!, 1), planHref(card, 4)]).toEqual(["/session?mode=read&prompt=lincoln-second-inaugural-1&plan=1", `/learn/card?id=${card.promptId}&plan=4`]);
  });
});
