// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { QUICK_PLAY_KINDS, quickPlay } from "@/core/quickPlay";
// Load the lookups, to check each pick opens something real
import { PROMPTS, TABLE_TOPICS } from "@/content/prompts";
import { findReading } from "@/content/readings";
import { findStoryPrompt } from "@/content/stories";
import { SCENARIOS, findPersona, findScenario } from "@/content/conversations";

// No conversations yet, and no coach
const NONE = { conversations: [], written: false };

// A random source that always gives the same number
const always = (value: number) => () => value;

// The prompt an address opens
const promptOf = (href: string) => new URLSearchParams(href.split("?")[1]).get("prompt") ?? "";

// Group the checks about Quick play's pick
describe("quickPlay", () => {
  // Each fifth of the random range picks one of the five kinds, in order, and 1 stays inside the list
  it("picks each of the five kinds", () => {
    // The kind for the middle of each fifth, and for the very ends
    const kinds = [0.1, 0.3, 0.5, 0.7, 0.9, 0, 1].map((value) => quickPlay(NONE, always(value)).kind);
    // Confirm all five in order, then the first and the last
    expect(kinds).toEqual([...QUICK_PLAY_KINDS, QUICK_PLAY_KINDS[0], QUICK_PLAY_KINDS[4]]);
  });

  // Every pick opens something that exists: a question, a task, a story prompt, a text, a situation with a person
  it("opens something real in each kind", () => {
    // Several picks of each kind, the second number choosing within the kind
    for (const [index, kind] of QUICK_PLAY_KINDS.entries()) {
      // A spread of choices inside the kind
      for (const inner of [0, 0.25, 0.5, 0.99]) {
        // The two numbers in turn: the kind, then what is in it
        const values = [(index + 0.5) / QUICK_PLAY_KINDS.length, inner];
        // The pick
        const pick = quickPlay(NONE, () => values.shift() ?? 0);
        // What it opens
        const prompt = promptOf(pick.href);
        // Whether it exists, by kind
        const real = kind === "Rapid Fire" ? pick.href.startsWith("/session?mode=talk&") && TABLE_TOPICS.some((item) => item.id === prompt)
          : kind === "Prepared speech" ? pick.href.startsWith("/session?mode=response&") && PROMPTS.some((item) => item.id === prompt)
          : kind === "Tell a story" ? pick.href.startsWith("/stories/tell?") && !!findStoryPrompt(prompt)
          : kind === "Read aloud" ? pick.href.startsWith("/session?mode=read&") && ["speech", "practice"].includes(findReading(prompt)?.kind ?? "")
          : pick.href.startsWith("/conversations/talk?") && !!findPersona(new URLSearchParams(pick.href.split("?")[1]).get("id") ?? "") && !!findScenario(new URLSearchParams(pick.href.split("?")[1]).get("situation") ?? "");
        // Confirm the kind and that it is real
        expect([pick.kind, real]).toEqual([kind, true]);
      }
    }
  });

  // A conversation is the same pick as its own Quick play: with the coach, the situation done least, started at once
  it("picks the conversation done least when the coach writes lines", () => {
    // Every situation done once but the third
    const conversations = SCENARIOS.filter((_, index) => index !== 2).map((scenario) => ({ scenarioId: scenario.id }));
    // The pick, landing on Talk with someone
    const pick = quickPlay({ conversations, written: true }, always(0.7));
    // Confirm the situation and the start
    expect([new URLSearchParams(pick.href.split("?")[1]).get("situation"), pick.href.endsWith("&start=1")]).toEqual([SCENARIOS[2]!.id, true]);
  });

  // Left to its own random source, it still picks one of the five
  it("uses Math.random by default", () => {
    // Confirm the kind is one of the five
    expect(QUICK_PLAY_KINDS).toContain(quickPlay(NONE).kind);
  });
});
