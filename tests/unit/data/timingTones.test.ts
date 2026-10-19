// @vitest-environment jsdom
// Load the test helpers from the test runner
import { beforeEach, describe, expect, it } from "vitest";
// Load what is being checked
import { readTimingTones, saveTimingTones } from "@/data/timingTones";

// Start each check with nothing saved
beforeEach(() => {
  // Clear storage
  localStorage.clear();
});

// Group the checks about the timing tones choice (decision 77)
describe("timingTones", () => {
  // Off unless switched on; switching off stores nothing
  it("is off by default, and remembers being switched on", () => {
    // Nothing saved
    const first = readTimingTones();
    // Switch on
    saveTimingTones(true);
    // Read back
    const on = [readTimingTones(), localStorage.getItem("voicelab-timing-tones")];
    // Switch off
    saveTimingTones(false);
    // Confirm off, on, then off with nothing stored
    expect([first, on, [readTimingTones(), localStorage.getItem("voicelab-timing-tones")]]).toEqual([false, [true, "on"], [false, null]]);
  });
});
