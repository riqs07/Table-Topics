// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the recording rules being checked
import { MIN_SECONDS, formatClock, maxSeconds, targetSeconds, thinkSeconds, timeSignal, timingSentence } from "@/core/recordingRules";

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
  // A 10-second countdown, a 1:00 to 2:00 window, and it stops itself at 3:00 so running over can be seen
  it("gives a 10-second countdown, a 1:00 to 2:00 window, and stops at 3:00", () => {
    // Confirm the countdown, top of the window, and limit
    expect([thinkSeconds("talk"), targetSeconds("talk"), maxSeconds("talk")]).toEqual([10, 120, 180]);
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
    expect([timingSentence("talk", 52), timingSentence("talk", 107), timingSentence("talk", 132), timingSentence("talk", 150), timingSentence("talk", 161)]).toEqual([
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

// Group the checks about a Record Response
describe("Record Response", () => {
  // Two minutes to think, a three-minute goal, and it stops itself at four
  it("gives 2 minutes to think, aims for 3:00, and stops at 4:00", () => {
    // Confirm the think time, goal, and limit
    expect([thinkSeconds("response"), targetSeconds("response"), maxSeconds("response")]).toEqual([120, 180, 240]);
  });

  // No thinking time for the older kinds of session
  it("has no thinking time for a one-minute session or a warm-up", () => {
    // Confirm none
    expect([thinkSeconds("standard"), thinkSeconds("warmup")]).toEqual([0, 0]);
  });

  // Off, then yellow 45 seconds before the goal, then red past it
  it("turns the light yellow from 2:15 and red past 3:00", () => {
    // Confirm the light at each boundary
    expect([0, 134.9, 135, 180, 180.1].map((seconds) => timeSignal("response", seconds))).toEqual(["none", "none", "yellow", "yellow", "red"]);
  });

  // One plain sentence on the timing
  it("says how the length compared with the goal", () => {
    // Confirm under, on, and over
    expect([timingSentence("response", 170), timingSentence("response", 180), timingSentence("response", 192)]).toEqual(["2:50 against a 3:00 goal, 10 seconds to spare.", "3:00 against a 3:00 goal, right on time.", "3:12 against a 3:00 goal, 12 seconds over."]);
  });
});
