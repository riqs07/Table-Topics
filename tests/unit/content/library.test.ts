// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the prompt library and picker
import { PROMPTS, WARMUP_PROMPTS, findPrompt, promptForDay, warmupPromptForDay } from "@/content/prompts";
// Load the challenge list and picker
import { CHALLENGES, challengeForWeek } from "@/content/challenges";

// Build a local date in October 2026
const oct = (day: number, hour = 12) => new Date(2026, 9, day, hour);

// Group the checks about the prompt library
describe("prompt library", () => {
  // Enough variety for a month of daily practice without repeats
  it("has at least 30 prompts with unique ids", () => {
    // Confirm the count
    expect(PROMPTS.length).toBeGreaterThanOrEqual(30);
    // Confirm ids are unique
    expect(new Set(PROMPTS.map((prompt) => prompt.id)).size).toBe(PROMPTS.length);
  });

  // Prompts are short enough to read at a glance and end like a sentence
  it("keeps every prompt short and complete", () => {
    // Check every prompt
    for (const prompt of PROMPTS) expect(prompt.text).toMatch(/^.{10,80}[.?]$/);
  });
});

// Group the checks about choosing today's prompt
describe("promptForDay", () => {
  // The same day always gives the same prompt, even at different times
  it("gives the same prompt all day", () => {
    // Confirm morning and evening match
    expect(promptForDay(oct(12, 7)).id).toBe(promptForDay(oct(12, 22)).id);
  });

  // The next day gives a different prompt
  it("changes from one day to the next", () => {
    // Confirm two days differ
    expect(promptForDay(oct(13)).id).not.toBe(promptForDay(oct(12)).id);
  });

  // A month of days has no repeats
  it("does not repeat within 30 days", () => {
    // Collect 30 days of prompts
    const ids = Array.from({ length: 30 }, (_, index) => promptForDay(new Date(2026, 9, 1 + index, 12)).id);
    // Confirm all are different
    expect(new Set(ids).size).toBe(30);
  });

  // "Or choose another" moves to a different prompt
  it("gives a different prompt when asked for another", () => {
    // Confirm the swapped prompt differs
    expect(promptForDay(oct(12), 1).id).not.toBe(promptForDay(oct(12), 0).id);
  });
});

// Group the checks about weekly challenges
describe("challenges", () => {
  // Enough for a few months
  it("has at least 12 challenges", () => {
    // Confirm the count
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(12);
  });

  // Challenges start easy and repeat once the list is used up
  it("starts at the first challenge and cycles", () => {
    // Confirm the first week
    expect(challengeForWeek(0)).toBe(CHALLENGES[0]);
    // Confirm it wraps around
    expect(challengeForWeek(CHALLENGES.length)).toBe(CHALLENGES[0]);
  });
});

// Group the checks about warm-up prompts
describe("warm-up prompts", () => {
  // Enough for a few weeks of warm-ups, with ids that never clash with full prompts
  it("has at least 20 warm-up prompts with their own ids", () => {
    // Confirm the count
    expect(WARMUP_PROMPTS.length).toBeGreaterThanOrEqual(20);
    // Confirm every id starts with w and none clash with full prompts
    expect(WARMUP_PROMPTS.every((prompt) => prompt.id.startsWith("w") && !PROMPTS.some((full) => full.id === prompt.id))).toBe(true);
  });

  // Warm-up prompts are shorter still, so they can be answered in 30 seconds
  it("keeps warm-up prompts very short", () => {
    // Check every prompt
    for (const prompt of WARMUP_PROMPTS) expect(prompt.text).toMatch(/^.{8,60}[.?]$/);
  });

  // A day's warm-up is fixed, like the main prompt, and changes daily
  it("gives one warm-up a day", () => {
    // Confirm morning and evening match
    expect(warmupPromptForDay(oct(12, 7)).id).toBe(warmupPromptForDay(oct(12, 22)).id);
    // Confirm the next day differs
    expect(warmupPromptForDay(oct(13)).id).not.toBe(warmupPromptForDay(oct(12)).id);
  });

  // Any saved prompt id can be turned back into its text
  it("finds a prompt's text by id, full or warm-up", () => {
    // Confirm a full prompt
    expect(findPrompt(PROMPTS[0]!.id)).toBe(PROMPTS[0]);
    // Confirm a warm-up prompt
    expect(findPrompt(WARMUP_PROMPTS[0]!.id)).toBe(WARMUP_PROMPTS[0]);
  });
});
