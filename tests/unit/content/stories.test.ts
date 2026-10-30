// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the story content being checked
import { NEEDED_TYPES, STORY_FOCUSES, STORY_GROUPS, STORY_LENGTHS, STORY_PROMPTS, STORY_SHAPES, findStoryFocus, findStoryPrompt, findStoryShape, isStorySeed, momentIdOf, momentSeedId, momentTitle, nextNeeded, storyPromptForDay, suggestedTemplate } from "@/content/stories";

// Words that would make a prompt heavy rather than light (decision 92: everyday stories, never painful ones)
const HEAVY = /\b(die|died|death|dead|funeral|grief|accident|hospital|illness|sick|cancer|abuse|divorce|fired|worst|trauma|hurt|injur|fight|war|scar)/i;

// Group the checks about the story prompts and choices
describe("story content", () => {
  // Forty everyday prompts in eight groups of five, and twenty-four for the stories you'll need in four groups of six (decision 152), each with a unique id and a short title
  it("has forty everyday prompts, five a group, and twenty-four you'll need, six a group, each with an id and a short title", () => {
    // Ids, groups and titles
    expect([STORY_PROMPTS.length, new Set(STORY_PROMPTS.map((prompt) => prompt.id)).size, STORY_GROUPS.map((group) => STORY_PROMPTS.filter((prompt) => prompt.group === group.id).length), STORY_PROMPTS.every((prompt) => prompt.title.length > 0 && prompt.title.length <= 40)]).toEqual([64, 64, [5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6], true]);
  });

  // Each prompt asks for a story in plain words, ends with a full stop, and stays light
  it("keeps every prompt light, plain and short", () => {
    // Any prompt that breaks a rule
    const broken = STORY_PROMPTS.filter((prompt) => !(prompt.group === "toast" ? /^(Give a toast|Say a few words|Thank someone)/.test(prompt.text) : /^Tell me (about|how)/.test(prompt.text)) || !prompt.text.endsWith(".") || prompt.text.length > 90 || HEAVY.test(prompt.text) || HEAVY.test(prompt.title));
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

// Group the checks about the stories you'll need (decision 152)
describe("stories you'll need", () => {
  // Four kinds, each with six prompts in its own group, told with its own template
  it("has four kinds, each with its group, template and six prompts", () => {
    // Confirm each kind's prompts and template
    expect(NEEDED_TYPES.map((type) => [type.template, STORY_PROMPTS.filter((prompt) => prompt.group === type.group).length, suggestedTemplate(STORY_PROMPTS.find((prompt) => prompt.group === type.group)!.id)])).toEqual([["who-i-am", 6, "who-i-am"], ["interview", 6, "interview"], ["toast", 6, "toast"], ["choice", 6, "choice"]]);
  });

  // The next story you'll need takes the four kinds in turn by how many were told, and each kind's prompts in turn; other stories don't count
  it("takes the kinds in turn by how many were told, each kind's prompts in turn", () => {
    // Nothing told, then one of each kind told, then a second interview question, with an everyday story in between
    const picks = [nextNeeded([]), nextNeeded(["sp41"]), nextNeeded(["sp41", "sp01", "sp47"]), nextNeeded(["sp41", "sp47", "sp53", "sp59"]), nextNeeded(["sp41", "sp47", "sp53", "sp59", "sp42"])];
    // Confirm the kinds and prompts
    expect(picks.map((pick) => `${pick.type.template}:${pick.prompt.id}`)).toEqual(["who-i-am:sp41", "interview:sp47", "toast:sp53", "who-i-am:sp42", "interview:sp48"]);
  });

  // Today's story stays an everyday prompt, never one of the stories you'll need
  it("keeps today's story to the everyday prompts", () => {
    // Sixty days of today's story
    const groups = new Set(Array.from({ length: 60 }, (_, offset) => storyPromptForDay(new Date(2026, 9, 1 + offset)).group));
    // Confirm none of the four kinds' groups
    expect(["who", "interview", "toast", "values"].some((group) => groups.has(group as never))).toBe(false);
  });
});
