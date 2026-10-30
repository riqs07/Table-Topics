// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the guided stories being checked
import { GUIDED_LEVELS, GUIDED_STORIES, factsOf, findGuidedLevel, findGuidedStory, guidedLevel, guidedStoryForDay } from "@/content/guidedStories";
// Load the story seed helpers, which know guided stories too
import { STORY_PROMPTS, isStorySeed, isStoryFocus, seedText } from "@/content/stories";
// Load the story checks, to keep the facts flat
import { dialogueIn, pointIn, turnIn } from "@/core/storyChecks";
// Load the content-word reader the missing-facts check uses
import { contentStems } from "@/core/guidedStory";

// Words that would make a guided story heavy rather than light (decision 93: everyday and light, never traumatic)
const HEAVY = /\b(die|died|death|dead|funeral|grief|accident|hospital|illness|sick|cancer|abuse|divorce|fired|worst|trauma|hurt|injur|fight|war|scar|blood|crash|police|stolen|robbed)/i;

// Every piece of text a guided story shows
const textsOf = (story: (typeof GUIDED_STORIES)[number]) => [story.title, ...story.facts, story.twist ?? "", ...story.nudges];

// Group the checks about the guided stories
describe("guided story content", () => {
  // Forty-eight over the five levels of the dial (decision 153), each id unique and not shared with a bank prompt, each with 3 to 5 facts and 2 to 3 nudges
  it("has forty-eight, each with 3 to 5 facts and 2 to 3 nudges, and unique ids", () => {
    // All the ids, the bank's too
    const ids = [...GUIDED_STORIES.map((story) => story.id), ...STORY_PROMPTS.map((prompt) => prompt.id)];
    // Confirm the count, the unique ids, the id form, and the fact and nudge counts
    expect([GUIDED_STORIES.length, new Set(ids).size === ids.length, GUIDED_STORIES.every((story) => /^gs\d{2}$/.test(story.id)), GUIDED_STORIES.filter((story) => story.facts.length < 3 || story.facts.length > 5).map((story) => story.id), GUIDED_STORIES.filter((story) => story.nudges.length < 2 || story.nudges.length > 3).map((story) => story.id)]).toEqual([48, true, true, [], []]);
  });

  // Plain, short and light: facts are statements ending in a full stop (the dial's loose details are short phrases without one; decision 153), nudges are questions, nothing heavy
  it("keeps every fact plain and every nudge a question, all light", () => {
    // Any story that breaks a rule
    const broken = GUIDED_STORIES.filter((story) => story.title.length > 30 || [...story.facts, ...(story.twist ? [story.twist] : [])].some((fact) => (findGuidedLevel(guidedLevel(story)).ordered || story.level === "shuffled" ? !fact.endsWith(".") || fact.length > 70 : fact.endsWith(".") || fact.length > 40)) || story.nudges.some((nudge) => !nudge.endsWith("?") || nudge.length > 60) || textsOf(story).some((text) => HEAVY.test(text)));
    // None
    expect(broken.map((story) => story.id)).toEqual([]);
  });

  // The facts are flat on purpose: no feeling, dialogue, turn or point in them, so anything the comparison finds came from the user; and every fact has a content word to listen for
  it("keeps the facts flat, with something to listen for in each", () => {
    // Any fact that already does the user's work, or has nothing to match on
    const broken = GUIDED_STORIES.flatMap((story) => factsOf(story).filter((fact) => dialogueIn(fact) !== null || turnIn(fact) !== null || pointIn(fact) !== null || contentStems(fact).length === 0));
    // None
    expect(broken).toEqual([]);
  });

  // Five levels: just the facts, a twist, shuffled, connect these, make it a… (decision 153); each starts with a focus the user can change
  it("splits over the five levels of the dial, each with a starting focus", () => {
    // How many each level has
    const counts = GUIDED_LEVELS.map((level) => GUIDED_STORIES.filter((story) => guidedLevel(story) === level.id).length);
    // Confirm the levels, the counts, twists only on the second, four loose details on the last two, a template only on "Make it a…", and the focuses (decision 153)
    expect([GUIDED_LEVELS.map((level) => level.id), counts, GUIDED_STORIES.filter((story) => guidedLevel(story) === "harder").every((story) => !!story.twist), GUIDED_STORIES.filter((story) => story.twist).every((story) => guidedLevel(story) === "harder"), GUIDED_STORIES.filter((story) => story.level === "connect" || story.level === "make-it").every((story) => story.facts.length === 4), GUIDED_STORIES.filter((story) => story.template).map((story) => story.level), GUIDED_STORIES.every((story) => isStoryFocus(story.focus))]).toEqual([["easier", "harder", "shuffled", "connect", "make-it"], [12, 12, 6, 10, 8], true, true, true, Array(8).fill("make-it"), true]);
  });

  // The zoo story the user described: plain facts, a gorilla twist
  it("includes the user's own example, the zoo", () => {
    // The story
    const zoo = GUIDED_STORIES.find((story) => story.title === "A day at the zoo");
    // Confirm its facts and twist, with the twist last among the facts kept
    expect([zoo?.facts, zoo ? factsOf(zoo).at(-1) : null]).toEqual([["You went to the zoo.", "You got a hot dog.", "You saw a gorilla."], "The gorilla was staring right at you."]);
  });

  // Guided ids are story seeds, with their title as their words; unknown ids are not
  it("names guided stories as seeds by their title", () => {
    // Each case
    expect([isStorySeed("gs01"), findGuidedStory("gs99"), seedText("gs13"), seedText("sp01")?.guided, seedText("moment-abc")]).toEqual([true, undefined, { text: "A day at the zoo", title: "A day at the zoo", guided: true }, false, undefined]);
  });

  // One a day, every one before any repeats
  it("takes every guided story in turn by day", () => {
    // Forty-eight days of them, every level of the dial (decision 153)
    const days = Array.from({ length: 48 }, (_, offset) => guidedStoryForDay(new Date(2026, 9, 1 + offset)).id);
    // Confirm all forty-eight, and the next day starts the round again
    expect([new Set(days).size, guidedStoryForDay(new Date(2026, 9, 49)).id]).toEqual([48, days[0]]);
  });
});
