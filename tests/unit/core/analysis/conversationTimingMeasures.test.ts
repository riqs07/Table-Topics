// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the phone measures
import { deviceMetrics, extractRaw } from "@/core/analysis/device";
// Load a session maker
import { makeSession } from "../../../support/fixtures";

// Group the checks on the conversation timing measures in the registry (decision 120)
describe("conversation timing measures", () => {
  // A timed conversation gets all five, with their engines
  it("records the five timing measures for a timed conversation", () => {
    // Timed turns: her line, your reply 0.5 s later, her line cut short by you, a listening sound
    const session = makeSession({ mode: "conversation", conversation: { turns: [{ who: "them", text: "Hi I'm Maya", seconds: 2, at: 0, end: 2 }, { who: "you", text: "hi Maya I'm Sam", seconds: 2, at: 2.5, end: 4.5 }, { who: "them", text: "Nice to meet you, so what", seconds: 2, at: 5, end: 7, cut: true }, { who: "you", text: "sorry go on", seconds: 1, at: 6.8, end: 8 }, { who: "you", text: "mm-hm", seconds: 0.5, at: 9, end: 9.5 }], turnMode: "live" } });
    // The measures
    const metrics = deviceMetrics(extractRaw(session));
    // Values and engines (the gaps are 0.5 and 0, talked over, so the median is 0.25, said as 0.3)
    expect(["conv.reply_gap_median_s", "conv.interruptions_by_you", "conv.interruptions_received", "conv.overlap_s", "conv.backchannels"].map((id) => [metrics[id]?.value, metrics[id]?.engine])).toEqual([[0.3, "device-turn-times-v1"], [1, "device-turn-times-v1"], [0, "device-turn-times-v1"], [0.2, "device-turn-times-v1"], [1, "device-wordlist-v1"]]);
  });

  // An older conversation: the timed measures are empty, not zero
  it("leaves timed measures empty without times", () => {
    // No times
    const metrics = deviceMetrics(extractRaw(makeSession({ mode: "conversation", conversation: { turns: [{ who: "them", text: "Hi", seconds: 2 }, { who: "you", text: "hello", seconds: 2 }] } })));
    // Empty, and listening sounds counted as none
    expect([metrics["conv.reply_gap_median_s"]?.value, metrics["conv.overlap_s"]?.value, metrics["conv.backchannels"]?.value]).toEqual([null, null, 0]);
  });
});
