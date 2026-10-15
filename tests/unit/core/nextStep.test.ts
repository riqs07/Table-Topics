// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the recommender being checked
import { nextStep } from "@/core/nextStep";
// Load the day's pickers
import { bookendForDay, drillForDay, promptForDay, tableTopicForDay } from "@/content/prompts";

// A fixed day
const DAY = new Date(2026, 9, 15, 10);

// Group the checks about the one recommended next step
describe("nextStep", () => {
  // A dated talk comes first
  it("recommends today's plan when a talk has a date", () => {
    // Confirm the step
    expect(nextStep({ day: DAY, sessionCount: 4, focusId: "pausing", nextTalk: { id: "t1", title: "Pitch", headline: "Your talk is in 3 days. Today: one whole run from keywords only." } })).toEqual({
      label: "“Pitch”",
      detail: "Your talk is in 3 days. Today: one whole run from keywords only.",
      href: "/talk?id=t1",
      action: "Open today’s plan",
      why: "Your talk comes first.",
    });
  });

  // A new user starts with a prepared answer, which becomes their starting point
  it("starts a new user with a prepared answer", () => {
    // The step
    const step = nextStep({ day: DAY, sessionCount: 0, focusId: "strong-opening", nextTalk: null });
    // Confirm where it leads and why
    expect([step.href, step.why]).toEqual([`/session?mode=response&prompt=${promptForDay(DAY).id}`, "Your first prepared answer becomes your starting point, to compare with later."]);
  });

  // After that, the week's focus picks the mode that trains it
  it("matches the mode to the week's focus", () => {
    // The step for each focus
    const href = (focusId: string) => nextStep({ day: DAY, sessionCount: 3, focusId, nextTalk: null }).href;
    // Confirm each
    expect(["strong-opening", "strong-close", "clear-structure", "pausing", "cut-fillers", "start-and-finish"].map(href)).toEqual([
      `/session?mode=bookend&prompt=${bookendForDay(DAY, "opening").id}`,
      `/session?mode=bookend&prompt=${bookendForDay(DAY, "close").id}`,
      `/session?mode=response&prompt=${promptForDay(DAY).id}`,
      `/session?mode=pause&prompt=${drillForDay(DAY).id}`,
      `/session?mode=talk&prompt=${tableTopicForDay(DAY).id}`,
      `/session?mode=response&prompt=${promptForDay(DAY).id}`,
    ]);
  });

  // The step says what it is in plain words, with the week's focus as the reason
  it("names the step plainly, with the focus as the reason", () => {
    // The step for an opening week
    const step = nextStep({ day: DAY, sessionCount: 3, focusId: "strong-opening", nextTalk: null });
    // Confirm the wording
    expect([step.label, step.detail, step.action, step.why]).toEqual(["Opening drill · 45 seconds", bookendForDay(DAY, "opening").text, "Start", "This week’s focus is a strong opening."]);
  });
});
