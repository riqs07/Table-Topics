// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the prompt library and picker
import { PASSAGES, PAUSE_DRILLS, PROMPTS, STRUCTURE_HINT, TABLE_TOPICS, WARMUP_PROMPTS, drillForDay, findPassage, findPrompt, passageForDay, promptForDay, tableTopicForDay, warmupPromptForDay } from "@/content/prompts";
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

  // Record Response prompts are speaking tasks an audience would hear (decision 22)
  it("labels every prompt with the kind of talk it asks for, with each kind well stocked", () => {
    // Every prompt names its kind
    for (const prompt of PROMPTS) expect(["explain", "persuade", "toast", "update", "story", "opinion"]).toContain(prompt.talkKind);
    // The four kinds added for speakers each have at least three prompts
    for (const kind of ["explain", "persuade", "toast", "update"]) expect(PROMPTS.filter((prompt) => prompt.talkKind === kind).length).toBeGreaterThanOrEqual(3);
  });

  // Prompts retired on 2026-10-15 leave the rotation, but old sessions still show their text
  it("keeps retired prompts findable but out of the rotation", () => {
    // Out of the rotation
    expect(PROMPTS.some((prompt) => prompt.id === "p001")).toBe(false);
    // Still findable
    expect(findPrompt("p001")?.text).toBe("Describe a small thing that made your week better.");
  });

  // Prompts are short enough to read at a glance and end like a sentence
  it("keeps every prompt short and complete", () => {
    // Check every prompt
    for (const prompt of PROMPTS) expect(prompt.text).toMatch(/^.{10,80}[.?]$/);
  });
});

// Group the checks about the Table Topic and Record Response content
describe("mode content", () => {
  // Table Topics are light, short-answer questions
  it("has at least 30 short Table Topics with their own ids", () => {
    // Confirm the count and that every id is a "t" id, unique across all lists
    expect([TABLE_TOPICS.length >= 30, TABLE_TOPICS.every((topic) => /^t\d{3}$/.test(topic.id)), new Set([...PROMPTS, ...WARMUP_PROMPTS, ...TABLE_TOPICS].map((prompt) => prompt.id)).size]).toEqual([true, true, PROMPTS.length + WARMUP_PROMPTS.length + TABLE_TOPICS.length]);
    // Confirm each is short enough to take in at a glance
    for (const topic of TABLE_TOPICS) expect(topic.text).toMatch(/^.{8,60}[.?]$/);
  });

  // Every Record Response prompt has two or three angles to help shape an answer
  it("gives every Record Response prompt two or three short angles", () => {
    // Check every prompt
    for (const prompt of PROMPTS) {
      // Confirm the number of angles
      expect(prompt.angles?.length).toBeGreaterThanOrEqual(2);
      // Confirm no more than three
      expect(prompt.angles?.length).toBeLessThanOrEqual(3);
      // Confirm each is a short phrase
      for (const angle of prompt.angles ?? []) expect(angle.length).toBeLessThanOrEqual(90);
    }
  });

  // One structure that fits any answer
  it("offers one four-step structure", () => {
    // Confirm the steps
    expect(STRUCTURE_HINT.map((step) => step.label)).toEqual(["Point", "Reason", "Example", "Point again"]);
  });

  // The Table Topic of the day rotates like the main prompt, and can be found later by id
  it("picks a Table Topic for the day and finds it by id", () => {
    // Today's topic
    const topic = tableTopicForDay(oct(12, 7));
    // Confirm it holds all day, changes the next day, and can be looked up
    expect([tableTopicForDay(oct(12, 22)).id, tableTopicForDay(oct(13)).id !== topic.id, findPrompt(topic.id)?.text]).toEqual([topic.id, true, topic.text]);
  });
});

// Group the checks about the read-aloud passages
describe("read-aloud passages", () => {
  // Public-domain speeches and passages written for the app, each with its own id
  it("has public-domain speeches and practice passages with their own ids", () => {
    // Speeches
    const speeches = PASSAGES.filter((passage) => passage.kind === "speech");
    // Practice passages
    const practice = PASSAGES.filter((passage) => passage.kind === "practice");
    // Confirm at least five of each, "r" ids, and ids unique across every list
    expect([speeches.length >= 5, practice.length >= 5, PASSAGES.every((passage) => /^r\d{3}$/.test(passage.id)), new Set([...PROMPTS, ...TABLE_TOPICS, ...WARMUP_PROMPTS, ...PASSAGES, ...PAUSE_DRILLS].map((item) => item.id)).size]).toEqual([true, true, true, PROMPTS.length + TABLE_TOPICS.length + WARMUP_PROMPTS.length + PASSAGES.length + PAUSE_DRILLS.length]);
  });

  // Every speech says who gave it and when (all before 1962, so public domain or a U.S. government work)
  it("credits every speech with a speaker and a year", () => {
    // Check every speech
    for (const passage of PASSAGES.filter((item) => item.kind === "speech")) expect(passage.source).toMatch(/^.+, (1[78]\d\d|19[0-6]\d)$/);
  });

  // Passages are long enough to practise with but short enough for one sitting
  it("keeps passages between 40 and 300 words", () => {
    // Check every passage
    for (const passage of PASSAGES) expect(passage.body.split(/\s+/).length).toBeGreaterThanOrEqual(40);
    // And the upper bound
    for (const passage of PASSAGES) expect(passage.body.split(/\s+/).length).toBeLessThanOrEqual(300);
  });

  // The passage of the day rotates, and passages can be looked up by id (also through findPrompt, for history labels)
  it("picks a passage for the day and finds it by id", () => {
    // Today's passage
    const passage = passageForDay(oct(12));
    // Confirm both lookups
    expect([findPassage(passage.id)?.title, findPrompt(passage.id)?.text]).toEqual([passage.title, passage.title]);
  });
});

// Group the checks about the pause drills
describe("pause drills", () => {
  // Passages with marked pause points, each with its own id
  it("has pause drills with at least four marked pauses each", () => {
    // Confirm the count and ids
    expect([PAUSE_DRILLS.length >= 4, PAUSE_DRILLS.every((drill) => /^d\d{3}$/.test(drill.id) && drill.kind === "pause")]).toEqual([true, true]);
    // Confirm each has at least four " / " marks
    for (const drill of PAUSE_DRILLS) expect(drill.body.split(" / ").length - 1).toBeGreaterThanOrEqual(4);
  });

  // The drill of the day rotates and can be found by id
  it("picks a drill for the day and finds it by id", () => {
    // Today's drill
    const drill = drillForDay(oct(12));
    // Confirm the lookups
    expect([findPassage(drill.id)?.title, findPrompt(drill.id)?.text]).toEqual([drill.title, drill.title]);
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
