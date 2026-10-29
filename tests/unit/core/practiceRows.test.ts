// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { FEATURED_BY_GROUP, ROWS_SHOWN, VOICE_ROWS, featureFirst, nextClearSound, splitRows, voiceRowsByNeed } from "@/core/practiceRows";
// Load the content
import { PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";
import { VOICE_DRILLS } from "@/content/voice";

// Group the checks about what Practice shows at once (decision 108)
describe("practice rows", () => {
  // A group shows three rows, a focus group four, and the rest go under "See all"
  it("shows a few rows and keeps the rest for See all", () => {
    // Five rows
    const rows = ["a", "b", "c", "d", "e"];
    // Confirm the split with and without a focus, and a short list left whole
    expect([splitRows(rows, false), splitRows(rows, true), splitRows(["a", "b"], false), ROWS_SHOWN]).toEqual([{ shown: ["a", "b", "c"], more: ["d", "e"] }, { shown: ["a", "b", "c", "d"], more: ["e"] }, { shown: ["a", "b"], more: [] }, 3]);
  });

  // The voice modes come least done first, the usual order on a tie, with the word lists counted under clear sounds
  it("orders the voice modes by what was done least", () => {
    // Clear sounds done twice (once a drill, once a word list), volume and pausing once each
    const counts = new Map<string, number>([[VOICE_DRILLS.find((drill) => drill.kind === "clear")!.id, 1], [TRICKY_WORDS[0]!.id, 1], [VOICE_DRILLS.find((drill) => drill.kind === "volume")!.id, 1], [PAUSE_DRILLS[0]!.id, 1]]);
    // Confirm the usual order with nothing done, and the order after
    expect([voiceRowsByNeed(new Map()), voiceRowsByNeed(counts)]).toEqual([VOICE_ROWS, ["pitch", "tone", "shadowing", "volume", "pausing", "clear"]]);
  });

  // Clear sounds' next item runs through its drills, then the word lists, then the one done least
  it("takes clear sounds' drills, then the word lists, as one list", () => {
    // The clear drills
    const drills = VOICE_DRILLS.filter((drill) => drill.kind === "clear");
    // Every drill done once
    const allDrills = new Map(drills.map((drill) => [drill.id, 1] as const));
    // And every list too, the second drill twice
    const everything = new Map([...allDrills, ...TRICKY_WORDS.map((list) => [list.id, 1] as const), [drills[1]!.id, 2] as const]);
    // Confirm the first drill, then the first word list, then the first done least
    expect([nextClearSound(new Map()), nextClearSound(allDrills), nextClearSound(everything)]).toEqual([{ id: drills[0]!.id, href: `/voice/drill?id=${drills[0]!.id}` }, { id: TRICKY_WORDS[0]!.id, href: `/session?mode=read&prompt=${TRICKY_WORDS[0]!.id}` }, { id: drills[0]!.id, href: `/voice/drill?id=${drills[0]!.id}` }]);
  });
});

// Group the checks about the big card on Practice (decision 136)
describe("featureFirst", () => {
  // The main ways, as Practice lists them
  const MAIN = ["Rapid Fire", "Prepared speech", "Tell a story", "Talk with someone", "Read aloud"].map((name) => ({ name }));
  // Just the names of a split
  const names = (split: ReturnType<typeof featureFirst<{ name: string }>>) => split && [split.featured.name, split.rest.map((row) => row.name), split.forFocus];

  // With no focus, the first way is big, not marked
  it("puts the first way first when there is no focus", () => {
    // Confirm
    expect(names(featureFirst(MAIN, []))).toEqual(["Rapid Fire", ["Prepared speech", "Tell a story", "Talk with someone", "Read aloud"], false]);
  });

  // The first focus group's way is big and marked, the rest keep their order
  it("puts the focus's way first, the rest in their usual order", () => {
    // Confirm stories, and conversation before voice
    expect([names(featureFirst(MAIN, ["stories"])), names(featureFirst(MAIN, ["conversation", "voice"]))]).toEqual([["Tell a story", ["Rapid Fire", "Prepared speech", "Talk with someone", "Read aloud"], true], ["Talk with someone", ["Rapid Fire", "Prepared speech", "Tell a story", "Read aloud"], true]]);
  });

  // A focus whose way is not on the list falls through to the next, then to the first; an empty list gives nothing
  it("skips a focus way that is missing, and handles an empty list", () => {
    // A list without Read aloud
    const short = MAIN.filter((row) => row.name !== FEATURED_BY_GROUP.voice);
    // Confirm the fall-throughs and the empty case
    expect([names(featureFirst(short, ["voice", "stories"])), names(featureFirst(short, ["voice"])), featureFirst([], ["stories"])]).toEqual([["Tell a story", ["Rapid Fire", "Prepared speech", "Talk with someone"], true], ["Rapid Fire", ["Prepared speech", "Tell a story", "Talk with someone"], false], null]);
  });
});
