// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { DRAW_FLICKS, drawDelays, drawSteps } from "@/core/topicDraw";
// Load the Rapid Fire topics
import { TABLE_TOPICS } from "@/content/prompts";

// The topics' words
const POOL = TABLE_TOPICS.map((topic) => topic.text);

// Group the checks about the topic draw (decision 133)
describe("drawSteps", () => {
  // Others first, never repeated, never the real one, then the real one
  it("ends on the real topic after distinct others", () => {
    // A draw
    const steps = drawSteps(POOL[0]!, POOL, 7);
    // The others
    const others = steps.slice(0, -1);
    // Confirm the length, the last, no repeats, and the real one not among the others
    expect([steps.length, steps.at(-1), new Set(others).size, others.includes(POOL[0]!)]).toEqual([DRAW_FLICKS + 1, POOL[0], DRAW_FLICKS, false]);
  });

  // The same seed gives the same order; another seed another
  it("is repeatable by seed", () => {
    // Confirm the same, and different
    expect([JSON.stringify(drawSteps(POOL[3]!, POOL, 42)) === JSON.stringify(drawSteps(POOL[3]!, POOL, 42)), JSON.stringify(drawSteps(POOL[3]!, POOL, 42)) === JSON.stringify(drawSteps(POOL[3]!, POOL, 43))]).toEqual([true, false]);
  });

  // A small pool gives fewer flicks; an empty one just the topic; a zero seed still works
  it("copes with small pools and odd seeds", () => {
    // Confirm each
    expect([drawSteps("a", ["a", "b", "b"], 1), drawSteps("a", [], 1), drawSteps("a", ["a", "b"], 0)]).toEqual([["b", "a"], ["a"], ["b", "a"]]);
  });
});

// Group the checks about the draw's timing (decision 133)
describe("drawDelays", () => {
  // Fast at first, slowing, about a second and a half in all
  it("slows down towards the end", () => {
    // The delays for a full draw
    const delays = drawDelays(DRAW_FLICKS + 1);
    // Confirm the first, the last, that each is at least the one before, and the total
    expect([delays[0], delays.at(-1), delays.every((delay, index) => index === 0 || delay >= delays[index - 1]!), delays.reduce((sum, delay) => sum + delay, 0)]).toEqual([50, 260, true, 1479]);
  });

  // One step: the slowest delay, as the last step of any draw
  it("handles one step", () => {
    // Confirm a single full delay
    expect(drawDelays(1)).toEqual([260]);
  });
});
