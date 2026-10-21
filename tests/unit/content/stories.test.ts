// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the story content being checked
import { STORY_FOCUSES, STORY_GROUPS, STORY_LENGTHS, STORY_PROMPTS, STORY_SHAPES, findStoryFocus, findStoryPrompt, findStoryShape, isStorySeed, momentIdOf, momentSeedId, momentTitle, storyPromptForDay } from "@/content/stories";

// Words that would make a prompt heavy rather than light (decision 92: everyday stories, never painful ones)
const HEAVY = /\b(die|died|death|dead|funeral|grief|accident|hospital|illness|sick|cancer|abuse|divorce|fired|worst|trauma|hurt|injur|fight|war|scar)/i;

// Group the checks about the story prompts and choices
describe("story content", () => {
  // About forty prompts, in eight groups of five, each with a unique id and a short title
  it("has about forty prompts, five a group, each with an id and a short title", () => {
    // Ids, groups and titles
    expect([STORY_PROMPTS.length, new Set(STORY_PROMPTS.map((prompt) => prompt.id)).size, STORY_GROUPS.map((group) => STORY_PROMPTS.filter((prompt) => prompt.group === group.id).length), STORY_PROMPTS.every((prompt) => prompt.title.length > 0 && prompt.title.length <= 40)]).toEqual([40, 40, [5, 5, 5, 5, 5, 5, 5, 5], true]);
  });

  // Each prompt asks for a story in plain words, ends with a full stop, and stays light
  it("keeps every prompt light, plain and short", () => {
    // Any prompt that breaks a rule
    const broken = STORY_PROMPTS.filter((prompt) => !prompt.text.startsWith("Tell me about") || !prompt.text.endsWith(".") || prompt.text.length > 90 || HEAVY.test(prompt.text) || HEAVY.test(prompt.title));
    // None
    expect(broken).toEqual([]);
  });

  // One prompt a day, every one before any repeats, neighbouring days from different groups
  it("takes every prompt in turn by day", () => {
    // Forty days of prompts
    const days = Array.from({ length: 40 }, (_, offset) => storyPromptForDay(new Date(2026, 9, 1 + offset)));
    // Confirm all forty, and no two days in a row from the same group
    expect([new Set(days.map((prompt) => prompt.id)).size, days.some((prompt, index) => index > 0 && prompt.group === days[index - 1]!.group)]).toEqual([40, false]);
  });

  // Moment seeds go both ways, and only known ids are seeds
  it("makes and reads a moment seed", () => {
    // Each case
    expect([momentSeedId("abc"), momentIdOf("moment-abc"), momentIdOf("sp01"), isStorySeed("sp01"), isStorySeed("moment-abc"), isStorySeed("moment-"), isStorySeed("t001"), findStoryPrompt("nope")]).toEqual(["moment-abc", "abc", null, true, true, false, false, undefined]);
  });

  // Shapes, focuses and lengths, with Classic and no focus as the fallbacks
  it("lists the shapes, focuses and lengths", () => {
    // Ids and fallbacks
    expect([STORY_SHAPES.map((shape) => shape.id), STORY_FOCUSES.map((focus) => focus.id), STORY_LENGTHS.map((length) => length.id), findStoryShape("nope").id, findStoryFocus(null), STORY_SHAPES.every((shape) => shape.beats.length >= 3)]).toEqual([["classic", "but-therefore", "then-now", "small-moment"], ["middle", "dialogue", "detail", "point", "minute"], ["short", "full"], "classic", null, true]);
  });

  // A moment's title is its first eight words
  it("titles a moment by its first words", () => {
    // Short, long and empty
    expect([momentTitle("the kettle sang"), momentTitle("one two three four five six seven eight nine"), momentTitle("  ")]).toEqual(["the kettle sang", "one two three four five six seven eight…", "A moment"]);
  });
});
