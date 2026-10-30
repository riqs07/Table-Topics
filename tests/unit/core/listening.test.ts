// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { hearingsAllowed, listenResult, nextStory, storiesInOrder, storyPieces } from "@/core/listening";
// Load the stories
import { LISTEN_STORIES, findListenStory, listenLines } from "@/content/listening";
// Load the people, to check each story's teller exists
import { findPersona } from "@/content/conversations";
// Load the record type
import type { ListenProgress } from "@/data/records";

// A progress entry last heard at a time
const heard = (lastAt: string): ListenProgress => ({ plays: 1, firstAt: lastAt, lastAt, lastCaught: 0, bestCaught: 0, detailCount: 3, lastCore: false });

// Group the checks about the stories as written (decision 150)
describe("LISTEN_STORIES", () => {
  // Unique ids, a real teller, three a level, at least three details each, and every marked phrase really in the words
  it("has well-formed stories", () => {
    // The ids
    const ids = LISTEN_STORIES.map((story) => story.id);
    // Phrases not found in their story
    const missing = LISTEN_STORIES.flatMap((story) => [story.core, ...story.details].filter((detail) => !story.text.includes(detail.phrase)).map((detail) => `${story.id}: ${detail.phrase}`));
    // How many each level has
    const levels = [1, 2, 3].map((level) => LISTEN_STORIES.filter((story) => story.level === level).length);
    // Confirm each rule
    expect([new Set(ids).size === ids.length, LISTEN_STORIES.every((story) => findPersona(story.personaId) !== undefined), levels, LISTEN_STORIES.every((story) => story.details.length >= 3), missing]).toEqual([true, true, [3, 3, 3], true, []]);
  });

  // A story is 20 to 40 seconds at a speaking pace (about 2.5 words a second): roughly 40 to 100 words
  it("keeps every story between about 20 and 40 seconds", () => {
    // Stories outside the range, with their word counts
    const odd = LISTEN_STORIES.map((story) => [story.id, story.text.split(/\s+/).length] as const).filter(([, words]) => words < 40 || words > 100);
    // Confirm none
    expect(odd).toEqual([]);
  });

  // Each story's own example picks up what mattered, at least two details, and answers warmly; and passes every check
  it("has an example reply that hears what mattered and passes every check", () => {
    // Stories whose example misses something, and what
    const failing = LISTEN_STORIES.flatMap((story) => {
      // The example's result
      const result = listenResult(story, story.example);
      // What failed
      return [...result.checks.filter((check) => !check.passed).map((check) => check.id), ...(result.warm ? [] : ["not warm"])].map((what) => `${story.id}: ${what}`);
    });
    // Confirm none
    expect(failing).toEqual([]);
  });

  // Every recorded line has a unique id and a tag kept out of the words
  it("gives every recorded line a unique id and a tag", () => {
    // Every line
    const lines = LISTEN_STORIES.flatMap(listenLines);
    // Confirm unique, three a story, tags in brackets
    expect([new Set(lines.map((line) => line.id)).size, lines.length, lines.every((line) => /^\[[^\]]+\]$/.test(line.tag) && !line.text.includes("["))]).toEqual([lines.length, LISTEN_STORIES.length * 3, true]);
  });
});

// Group the checks about a reply to a story
describe("listenResult", () => {
  // A good reply catches details and what mattered; a reply about yourself catches nothing and is not warm
  it("marks the details and what mattered, and answers warmly only when it was heard", () => {
    // The radio
    const story = findListenStory("ls-radio")!;
    // A reply that hears the grandad and two details
    const good = listenResult(story, "Wow, a 1956 radio, the same as your grandad's, for twenty pounds? What was it like when it hissed?");
    // A reply about yourself, with advice
    const poor = listenResult(story, "I go to flea markets. I once found a lamp there. You should sell it online.");
    // Confirm what each caught, and the closing
    expect([[good.caught, good.core, good.warm], [poor.caught, poor.core, poor.warm]]).toEqual([[3, "grandad", true], [0, null, false]]);
    // And which checks the poor one failed
    expect(poor.checks.filter((check) => !check.passed).map((check) => check.id)).toEqual(["react", "details", "their-feeling", "core", "question", "stays", "no-advice"]);
  });

  // Level 3 stories leave out the reaction check; a story's own feeling word counts when the general list misses it
  it("leaves the reaction out on level 3 and counts the story's own feeling words", () => {
    // The offer, level 3
    const story = findListenStory("ls-new-team")!;
    // A reply naming the feeling only with a word from the story's own list ("daunting" is not a general feeling word)
    const result = listenResult(story, "Presenting every month seems daunting.");
    // Confirm there is no reaction check, and the feeling check passed on the story's word
    expect([result.checks.some((check) => check.id === "react"), result.checks.find((check) => check.id === "their-feeling")]).toEqual([false, { id: "their-feeling", label: "Named how it felt for them", passed: true, evidence: "“daunting”" }]);
  });

  // An empty reply catches nothing and fails every check
  it("catches nothing in an empty reply", () => {
    // The first story, nothing said
    const result = listenResult(LISTEN_STORIES[0]!, "");
    // Confirm nothing passed
    expect([result.caught, result.core, result.warm, result.checks.some((check) => check.passed)]).toEqual([0, null, false, false]);
  });
});

// Group the checks about marking the story for the reveal
describe("storyPieces", () => {
  // The pieces join back into the story, with what mattered, caught and missed details marked in order
  it("marks what mattered and each detail, and joins back into the words", () => {
    // The first sale
    const story = findListenStory("ls-first-sale")!;
    // A reply catching the architect only
    const pieces = storyPieces(story, listenResult(story, "An architect bought it? Your first sale!"));
    // Confirm the words are unchanged and the marks in order
    expect([pieces.map((piece) => piece.text).join(""), pieces.filter((piece) => piece.mark).map((piece) => [piece.mark, piece.text])]).toEqual([story.text, [["missed", "the green door"], ["caught", "an architect"], ["missed", "fifty years ago"], ["missed", "five pounds"], ["core", "My first ever sale!"], ["missed", "framing the five pound note"]]]);
  });

  // A detail inside what mattered gives way to it; a phrase not in the words is left plain
  it("lets what mattered win an overlap and skips a phrase not found", () => {
    // A made-up story whose detail sits inside what mattered, plus one not in the words
    const story = { ...LISTEN_STORIES[0]!, text: "I ran the whole thing today.", core: { ...LISTEN_STORIES[0]!.core, phrase: "ran the whole thing" }, details: [] };
    // Pieces with an overlapping detail and a missing one
    const pieces = storyPieces(story, { details: [{ phrase: "whole", heard: "whole" }, { phrase: "nowhere", heard: null }] });
    // Confirm only what mattered is marked
    expect(pieces).toEqual([{ text: "I ", mark: null }, { text: "ran the whole thing", mark: "core" }, { text: " today.", mark: null }]);
  });
});

// Group the checks about which story comes next
describe("nextStory", () => {
  // By level first, then the oldest heard; a damaged entry counts as oldest
  it("offers the first unheard by level, then the oldest heard", () => {
    // In the order offered
    const ordered = storiesInOrder();
    // Everything heard, the fourth longest ago
    const all = Object.fromEntries(ordered.map((story, index) => [story.id, heard(index === 3 ? "2026-10-01T10:00:00Z" : "2026-10-29T10:00:00Z")]));
    // Everything heard, one damaged
    const damaged = { ...all, [ordered[6]!.id]: { plays: 2 } as unknown as ListenProgress };
    // Confirm the order is by level, and each pick
    expect([ordered.map((story) => story.level), nextStory({}).id, nextStory({ [ordered[0]!.id]: heard("2026-10-30T10:00:00Z") }).id, nextStory(all).id, nextStory(damaged).id]).toEqual([[1, 1, 1, 2, 2, 2, 3, 3, 3], ordered[0]!.id, ordered[1]!.id, ordered[3]!.id, ordered[6]!.id]);
  });

  // Level 1 may be heard twice, the rest once
  it("allows two hearings on level 1 and one after", () => {
    // One of each level
    expect([1, 2, 3].map((level) => hearingsAllowed(LISTEN_STORIES.find((story) => story.level === level)!))).toEqual([2, 1, 1]);
  });
});
