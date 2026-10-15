// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the lessons and the other lists, to check ids are unique everywhere
import { LESSONS, findLesson } from "@/content/lessons";
import { PASSAGES, PAUSE_DRILLS, PROMPTS, TABLE_TOPICS, TRICKY_WORDS, WARMUP_PROMPTS, findPassage, findPrompt } from "@/content/prompts";

// Group the checks about the skill path
describe("skill path lessons", () => {
  // Ten lessons in order, each with its own id
  it("has ten numbered lessons with ids unique across every list", () => {
    // Every id in the app
    const ids = [...PROMPTS, ...TABLE_TOPICS, ...WARMUP_PROMPTS, ...PASSAGES, ...PAUSE_DRILLS, ...TRICKY_WORDS, ...LESSONS].map((item) => item.id);
    // Confirm the count, the numbering, the id pattern, and uniqueness
    expect([LESSONS.length, LESSONS.map((lesson) => lesson.number), LESSONS.every((lesson) => /^l\d{3}$/.test(lesson.id)), new Set(ids).size]).toEqual([10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], true, ids.length]);
  });

  // Every lesson teaches one practical tip, briefly, with a practice text built for it
  it("gives every lesson a short tip and a practice text", () => {
    // Check every lesson
    for (const lesson of LESSONS) {
      // Confirm the tip is brief
      expect(lesson.tip.length).toBeLessThanOrEqual(320);
      // Confirm the practice text is between 15 and 200 words
      expect(lesson.body.split(/\s+/).length).toBeGreaterThanOrEqual(15);
      // (and not too long)
      expect(lesson.body.split(/\s+/).length).toBeLessThanOrEqual(200);
    }
  });

  // Crisp consonants is one lesson; tongue twisters are one lesson, not the whole path
  it("includes crisp consonants and exactly one tongue-twister lesson", () => {
    // Confirm both
    expect([LESSONS.some((lesson) => lesson.title === "Crisp consonants"), LESSONS.filter((lesson) => /tongue/i.test(lesson.title)).length]).toEqual([true, 1]);
  });

  // Lessons are found by id, and their titles serve as prompt text in history
  it("finds a lesson by id", () => {
    // Confirm both lookups
    expect([findLesson("l002")?.title, findPrompt("l002")?.text]).toEqual(["Crisp consonants", "Crisp consonants"]);
  });
});

// Group the checks about the tricky-word lists in the library
describe("tricky words", () => {
  // A few lists of words that are easy to stumble on
  it("has at least three lists of at least eight words each", () => {
    // Confirm the count and ids
    expect([TRICKY_WORDS.length >= 3, TRICKY_WORDS.every((list) => /^k\d{3}$/.test(list.id) && list.kind === "words")]).toEqual([true, true]);
    // Confirm each list's length
    for (const list of TRICKY_WORDS) expect(list.body.split(",").length).toBeGreaterThanOrEqual(8);
    // Confirm they can be found like passages
    expect(findPassage(TRICKY_WORDS[0]!.id)?.title).toBe(TRICKY_WORDS[0]!.title);
  });
});
