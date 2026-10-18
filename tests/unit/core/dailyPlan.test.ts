// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the plan rules being checked
import { dailyPlan, planHref, planMinutes, planProgress } from "@/core/dailyPlan";
// Load the Learn rules, for a card read
import { firstRead } from "@/core/learn";
// Load the cards
import { LEARN_CARDS } from "@/content/learn";
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
  // A new user gets two gentle steps: the next part of a speech, then a Table Topic, every day of their first days
  it("gives a new user a reading and a Table Topic", () => {
    // The plans over a week for a new user
    const plans = Array.from({ length: 7 }, (_, offset) => dailyPlan({ day: dayAfter(offset), sessions: [], focusId: "pausing", nextTalk: null }));
    // Confirm two lanes, always a reading then a Table Topic
    expect(new Set(plans.map((plan) => plan.map((step) => `${step.lane}:${step.mode}`).join(" ")))).toEqual(new Set(["delivery:read thinking:talk"]));
  });

  // After three practice days, one step from each of the three lanes
  it("takes one step from each lane", () => {
    // Confirm the lanes
    expect(regularPlan(DAY).map((step) => step.lane)).toEqual(["delivery", "thinking", "connection"]);
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

  // Connection alternates the next small-talk lesson and the next Learn card
  it("offers the next small-talk lesson or the next Learn card", () => {
    // Two days in a row
    const steps = [regularPlan(DAY)[2], regularPlan(dayAfter(1))[2]];
    // Confirm one lesson (the first) and one card (the first)
    expect(new Set(steps.map((step) => step?.promptId))).toEqual(new Set(["stl1", LEARN_CARDS[0]?.id]));
  });

  // What counts as done for Connection comes from before today, so reading a card today does not change today's plan
  it("uses only progress from before today", () => {
    // A day whose Connection step is a card
    const day = [DAY, dayAfter(1)].find((candidate) => regularPlan(candidate)[2]?.kind === "card")!;
    // The plan in the morning
    const morning = regularPlan(day);
    // After reading that card today
    const later = regularPlan(day, { learn: { [morning[2]!.promptId]: firstRead(day) } });
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
    // A day whose Connection step is a card
    const day = [DAY, dayAfter(1)].find((candidate) => regularPlan(candidate)[2]?.kind === "card")!;
    // Its plan
    const plan = regularPlan(day);
    // The Delivery step done today, the On-the-spot step done yesterday, the card read today
    const sessions = [makeSession({ id: "a", mode: plan[0]!.mode!, promptId: plan[0]!.promptId, createdAt: new Date(day.getTime() - 3_600_000).toISOString() }), makeSession({ id: "b", mode: plan[1]!.mode!, promptId: plan[1]!.promptId, createdAt: new Date(day.getTime() - 86_400_000).toISOString() })];
    // Confirm the first and the card
    expect(planProgress(plan, sessions, day, { [plan[2]!.promptId]: firstRead(day) })).toEqual([true, false, true]);
  });

  // A step's address carries its number in the plan, cards included
  it("marks a step's address with its number", () => {
    // The first step for a new user, and a card step
    const card = [DAY, dayAfter(1)].map((day) => regularPlan(day)[2]).find((step) => step?.kind === "card")!;
    // Confirm both markers
    expect([planHref(dailyPlan({ day: DAY, sessions: [], focusId: "pausing", nextTalk: null })[0]!, 1), planHref(card, 3)]).toEqual(["/session?mode=read&prompt=lincoln-second-inaugural-1&plan=1", `/learn/card?id=${card.promptId}&plan=3`]);
  });
});
