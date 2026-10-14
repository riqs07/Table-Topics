// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the recording rules being checked
import { MIN_SECONDS, THINK_SECONDS, formatClock, maxSeconds, targetSeconds, timeSignal, timingSentence } from "@/core/recordingRules";

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

// Group the checks about the shortest recording kept
describe("minimum length", () => {
  // Under ten seconds gives unreliable rates (a five-second clip once read as 240 words a minute)
  it("keeps recordings of at least ten seconds", () => {
    // Confirm the minimum
    expect(MIN_SECONDS).toBe(10);
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

// Group the checks about the three-minute talk
describe("three-minute talk", () => {
  // Up to 45 seconds to think, a three-minute goal, and room to run over before it stops itself at four
  it("gives 45 seconds to think, aims for three minutes, and stops at four", () => {
    // Confirm the think time, target, and limit
    expect([THINK_SECONDS, targetSeconds("talk"), maxSeconds("talk")]).toEqual([45, 180, 240]);
  });

  // The light: off, then yellow in the last 45 seconds before the goal, then red past it
  it("turns the light yellow 45 seconds before the goal and red after it", () => {
    // Confirm the light at several moments
    expect([timeSignal("talk", 0), timeSignal("talk", 134.9), timeSignal("talk", 135), timeSignal("talk", 180), timeSignal("talk", 180.1)]).toEqual(["none", "none", "caution", "caution", "over"]);
  });

  // The other kinds of session have no light
  it("shows no light for a one-minute session or a warm-up", () => {
    // Confirm there is no light even past their targets
    expect([timeSignal("standard", 170), timeSignal("warmup", 29)]).toEqual(["none", "none"]);
  });

  // After a talk, one plain sentence on the timing
  it("says how the timing went against the goal", () => {
    // Confirm under, on, and over
    expect([timingSentence(170), timingSentence(180), timingSentence(192)]).toEqual(["2:50 against a 3:00 goal, 10 seconds to spare.", "3:00 against a 3:00 goal, right on time.", "3:12 against a 3:00 goal, 12 seconds over."]);
  });
});
