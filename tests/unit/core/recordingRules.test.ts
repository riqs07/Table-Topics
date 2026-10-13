// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the recording rules being checked
import { formatClock, maxSeconds, targetSeconds } from "@/core/recordingRules";

// Group the checks about how long recordings run
describe("recording length", () => {
  // A full session aims for about a minute and stops itself at three
  it("aims for a minute and stops a full session at three minutes", () => {
    // Confirm the target
    expect(targetSeconds("standard")).toBe(60);
    // Confirm the limit
    expect(maxSeconds("standard")).toBe(180);
  });

  // A warm-up is 30 seconds and stops itself then
  it("stops a warm-up at 30 seconds", () => {
    // Confirm the target and the limit match
    expect([targetSeconds("warmup"), maxSeconds("warmup")]).toEqual([30, 30]);
  });
});

// Group the checks about the timer display
describe("formatClock", () => {
  // Minutes and two-digit seconds
  it("shows minutes and seconds", () => {
    // Confirm short and long times
    expect([formatClock(0), formatClock(42), formatClock(61.9), formatClock(180)]).toEqual(["0:00", "0:42", "1:01", "3:00"]);
  });
});
