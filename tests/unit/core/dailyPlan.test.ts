// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the plan rules being checked
import { dailyPlan, planHref, planMinutes, planProgress } from "@/core/dailyPlan";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Friday 16 October 2026, mid-morning
const DAY = new Date(2026, 9, 16, 10);
// A session on a given number of days before DAY
const daysAgo = (days: number, overrides = {}) => makeSession({ id: `s${days}-${Math.random()}`, createdAt: new Date(2026, 9, 16 - days, 9).toISOString(), ...overrides });
// Three earlier practice days, so the full plan applies
const regular = [daysAgo(1), daysAgo(2), daysAgo(3, { mode: "response", isBaseline: true })];

// Group the checks about today's practice
describe("dailyPlan", () => {
  // A new user gets two steps: the warm-up and speaking on the spot
  it("gives a new user two steps", () => {
    // Confirm the kinds
    expect(dailyPlan({ day: DAY, sessions: [], focusId: "pausing", nextTalk: null }).map((step) => step.kind)).toEqual(["warm-up", "spot"]);
  });

  // In the first days, speaking on the spot is always a light Table Topic, never a long prepared speech
  it("speaks on the spot with a Table Topic in the first days, every day of the week", () => {
    // The last step's kind over seven days for a new user
    const modes = new Set(Array.from({ length: 7 }, (_, offset) => dailyPlan({ day: new Date(2026, 9, 16 + offset, 10), sessions: [], focusId: "pausing", nextTalk: null }).at(-1)?.mode));
    // Confirm only Table Topics
    expect([...modes]).toEqual(["talk"]);
  });

  // After three practice days, a skill step for the week's focus joins in the middle
  it("adds a skill step for the week's focus", () => {
    // The plan in pausing week
    const plan = dailyPlan({ day: DAY, sessions: regular, focusId: "pausing", nextTalk: null });
    // Confirm three steps, the middle one a pause drill or the pausing lesson
    expect([plan.map((step) => step.kind), ["pause", "lesson"].includes(plan[1]!.mode)]).toEqual([["warm-up", "skill", "spot"], true]);
  });

  // The warm-up starts a speech at its first part, then carries on where the last reading left off
  it("warms up with the next part of the speech under way", () => {
    // A user who read parts 1 and 2 of Kennedy's inaugural
    const sessions = [...regular, daysAgo(1, { mode: "read", promptId: "jfk-inaugural-2" }), daysAgo(2, { mode: "read", promptId: "jfk-inaugural-1" })];
    // Confirm part 3 of that speech, and part 1 of the starter speech for a new user
    expect([dailyPlan({ day: DAY, sessions, focusId: "pausing", nextTalk: null })[0]?.promptId, dailyPlan({ day: DAY, sessions: [], focusId: "pausing", nextTalk: null })[0]?.promptId]).toEqual(["jfk-inaugural-3", "lincoln-second-inaugural-1"]);
  });

  // The plan does not change during the day as steps are done
  it("stays the same all day", () => {
    // The plan in the morning
    const morning = dailyPlan({ day: DAY, sessions: regular, focusId: "pausing", nextTalk: null });
    // After reading the warm-up today
    const later = dailyPlan({ day: DAY, sessions: [makeSession({ id: "t", mode: "read", promptId: morning[0]!.promptId, createdAt: new Date(2026, 9, 16, 9).toISOString() }), ...regular], focusId: "pausing", nextTalk: null });
    // Confirm the same steps
    expect(later).toEqual(morning);
  });

  // A talk coming up takes the on-the-spot step
  it("puts a talk coming up in the last step", () => {
    // The plan with a talk
    const last = dailyPlan({ day: DAY, sessions: regular, focusId: "pausing", nextTalk: { id: "talk-1", title: "Pitch", headline: "Your talk is in 3 days." } }).at(-1);
    // Confirm a rehearsal of it
    expect([last?.mode, last?.promptId, last?.title]).toEqual(["rehearse", "talk-1", "Your talk is in 3 days."]);
  });

  // Across a week, speaking on the spot takes turns
  it("takes turns at speaking on the spot", () => {
    // The kinds over seven days
    const modes = new Set(Array.from({ length: 7 }, (_, offset) => dailyPlan({ day: new Date(2026, 9, 16 + offset, 10), sessions: regular, focusId: "pausing", nextTalk: null }).at(-1)?.mode));
    // Confirm Table Topics, opening or closing drills, and a prepared speech all appear
    expect([...modes].sort()).toEqual(["bookend", "response", "talk"]);
  });

  // The plan takes about five to ten minutes, listening back included
  it("fits in about five to ten minutes", () => {
    // The totals over two weeks
    const totals = Array.from({ length: 14 }, (_, offset) => planMinutes(dailyPlan({ day: new Date(2026, 9, 16 + offset, 10), sessions: regular, focusId: "clear-structure", nextTalk: null })));
    // Confirm every day is between 4 and 12 minutes
    expect(totals.every((total) => total >= 4 && total <= 12)).toBe(true);
  });
});

// Group the checks about progress through the plan
describe("planProgress", () => {
  // A step is done when a session of its kind and prompt was recorded today
  it("marks steps done by today's sessions only", () => {
    // Today's plan
    const plan = dailyPlan({ day: DAY, sessions: regular, focusId: "pausing", nextTalk: null });
    // The warm-up read today, and the skill done yesterday
    const sessions = [makeSession({ id: "a", mode: "read", promptId: plan[0]!.promptId, createdAt: new Date(2026, 9, 16, 9).toISOString() }), daysAgo(1, { mode: plan[1]!.mode, promptId: plan[1]!.promptId })];
    // Confirm only the warm-up
    expect(planProgress(plan, sessions, DAY)).toEqual([true, false, false]);
  });

  // A step's address carries its number in the plan
  it("marks a step's address with its number", () => {
    // Confirm the marker
    expect(planHref(dailyPlan({ day: DAY, sessions: [], focusId: "pausing", nextTalk: null })[0]!, 1)).toBe("/session?mode=read&prompt=lincoln-second-inaugural-1&plan=1");
  });
});
