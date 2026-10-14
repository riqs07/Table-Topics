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

// Group the checks about a Table Topic, timed by Toastmasters rules
describe("Table Topic", () => {
  // Up to 45 seconds to think, a 1:00 to 2:00 window, and it stops itself at 3:00 so running over can be seen
  it("gives 45 seconds to think, a 1:00 to 2:00 window, and stops at 3:00", () => {
    // Confirm the think time, top of the window, and limit
    expect([THINK_SECONDS, targetSeconds("talk"), maxSeconds("talk")]).toEqual([45, 120, 180]);
  });

  // The Toastmasters lights: green at 1:00, yellow at 1:30, red at 2:00 (staying on), and over time past 2:30
  it("shows green at 1:00, yellow at 1:30, red at 2:00, and over time past 2:30", () => {
    // Confirm the light at each boundary
    expect([0, 59.9, 60, 89.9, 90, 119.9, 120, 150, 150.1].map((seconds) => timeSignal("talk", seconds))).toEqual(["none", "none", "green", "green", "yellow", "yellow", "red", "red", "overtime"]);
  });

  // The other kinds of session have no light
  it("shows no light for a one-minute session or a warm-up", () => {
    // Confirm there is no light even past their targets
    expect([timeSignal("standard", 170), timeSignal("warmup", 29)]).toEqual(["none", "none"]);
  });

  // After a Table Topic, one plain sentence on whether it would have qualified
  it("says whether the length would qualify in a contest", () => {
    // Confirm under, inside, in the grace, at the edge, and over
    expect([timingSentence(52), timingSentence(107), timingSentence(132), timingSentence(150), timingSentence(161)]).toEqual([
      // Under the minimum
      "0:52, under the 1:00 minimum. In a contest this would not qualify.",
      // Inside the window
      "1:47, inside the 1:00 to 2:00 window.",
      // Past red but inside the grace
      "2:12, past 2:00 but inside the 30-second grace.",
      // Exactly at the edge still qualifies
      "2:30, past 2:00 but inside the 30-second grace.",
      // Over the grace
      "2:41, over 2:30. In a contest this would not qualify.",
    ]);
  });
});
