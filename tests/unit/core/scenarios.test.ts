// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { firstTries, nextScenarios, situationParts } from "@/core/scenarios";
// Load the scenarios and the cards
import { SCENARIOS, findScenario } from "@/content/scenarios";
import { LEARN_CARDS } from "@/content/learn";
// Load the record type
import type { ScenarioProgress } from "@/data/records";

// A progress entry
const answered = (firstTier: string, lastTier: string, lastAt = "2026-10-17T10:00:00.000Z"): ScenarioProgress => ({ firstTier, lastTier, firstAt: "2026-10-16T10:00:00.000Z", lastAt });

// Group the checks about scenario questions
describe("scenarios", () => {
  // Every item is well formed: unique ids, three or four replies, exactly one best, never an obvious giveaway in position
  it("has well-formed items", () => {
    // The ids
    const ids = SCENARIOS.map((scenario) => scenario.id);
    // Where the best reply sits in each
    const bestPlaces = SCENARIOS.map((scenario) => scenario.options.findIndex((option) => option.tier === "best"));
    // Confirm unique, sizes, one best each, and the best reply not always in the same place
    expect([new Set(ids).size === ids.length, SCENARIOS.every((scenario) => scenario.options.length >= 3 && scenario.options.length <= 4), SCENARIOS.every((scenario) => scenario.options.filter((option) => option.tier === "best").length === 1), new Set(bestPlaces).size > 1]).toEqual([true, true, true, true]);
  });

  // Cards point only at real scenarios, each used once
  it("links cards to real scenarios, each once", () => {
    // The scenarios cards use
    const used = LEARN_CARDS.flatMap((card) => (card.scenario ? [card.scenario] : []));
    // Confirm they exist and none repeats
    expect([used.every((id) => !!findScenario(id)), new Set(used).size === used.length, used.length]).toEqual([true, true, SCENARIOS.length]);
  });

  // A move missed last time comes back in a new situation; then unseen ones; then the rest
  it("brings a missed move back in a new situation", () => {
    // Missed the brutal week (listening first); the interview has the same move and is unseen
    const round = nextScenarios({ "sc-brutal-week": answered("flat", "flat") });
    // Confirm the interview comes first, then unseen ones in order
    expect(round.map((scenario) => scenario.id)).toEqual(["sc-interview", "sc-job-offer", "sc-half-marathon"]);
  });

  // Once everything is answered right, the least recently answered come first
  it("falls back to the least recently answered", () => {
    // Every scenario answered best, the second one longest ago
    const progress = Object.fromEntries(SCENARIOS.map((scenario, index) => [scenario.id, answered("best", "best", index === 1 ? "2026-10-01T10:00:00.000Z" : `2026-10-1${index % 9}T10:00:00.000Z`)]));
    // Confirm the oldest first
    expect(nextScenarios(progress)[0]?.id).toBe(SCENARIOS[1]?.id);
  });

  // First tries count only the first answer
  it("counts first tries", () => {
    // One best first, one improved later
    expect(firstTries({ a: answered("best", "best"), b: answered("misstep", "best") })).toEqual({ best: 1, total: 2 });
  });
});

// The situation split into its set-up and the other person's line, for the friend's speech bubble (second design pass, Desktop Screens "SceneReply")
describe("situationParts", () => {
  it("splits a situation at the quoted line", () => {
    // The set-up before the quote, the quote itself as the line
    expect(situationParts("At lunch, Priya puts her phone down, grinning. “I just got the offer. I start in March!”")).toEqual({ setup: "At lunch, Priya puts her phone down, grinning.", line: "“I just got the offer. I start in March!”" });
  });

  it("keeps a situation with words after the quote whole", () => {
    // Text after the quote means the line is not the last thing said, so nothing is split off
    expect(situationParts("Marcus says: “We should wait.” You think waiting would cost you.")).toEqual({ setup: "Marcus says: “We should wait.” You think waiting would cost you.", line: null });
  });

  it("keeps a situation with no quote whole", () => {
    // No line to give the friend
    expect(situationParts("You're asking IT for a new laptop.")).toEqual({ setup: "You're asking IT for a new laptop.", line: null });
  });

  it("names a speaker only where a situation has a line of theirs, and the name is in its words", () => {
    // Every named scenario has a line, and its name appears in the situation
    expect(SCENARIOS.filter((scenario) => scenario.who).every((scenario) => situationParts(scenario.situation).line !== null && scenario.situation.includes(scenario.who!))).toBe(true);
  });
});
