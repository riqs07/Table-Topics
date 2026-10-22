// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { cleanPitch, cleanSteps, dropLoneReadings, fillShortGaps, foldOctaves, medianFilter, semitonesFrom, smoothForDrawing, smoothPath } from "@/core/pitchClean";

// Group the checks on cleaning pitch readings (decision 111)
describe("pitch cleaning", () => {
  // An overtone caught by the detector reads twice as high, and is folded back down; one an octave low is doubled
  it("folds octave slips back against their neighbours", () => {
    // A steady voice with one reading an octave high and one an octave low
    const readings = [200, 202, 198, 400, 201, 199, 100, 200, 203];
    // Folded
    expect(foldOctaves(readings)).toEqual([200, 202, 198, 200, 201, 199, 200, 200, 203]);
  });

  // A real jump of a few steps is a voice moving, not a slip
  it("leaves real jumps alone", () => {
    // A rise of five steps (about a third)
    const readings = [200, 200, 200, 267, 267, 267];
    // Unchanged
    expect(foldOctaves(readings)).toEqual(readings);
  });

  // One jumpy reading cannot make a spike, and silence stays silence
  it("smooths with a running median that keeps gaps", () => {
    // A spike and a gap
    const readings = [200, 200, 260, 200, 200, null, 210];
    // Smoothed
    expect(medianFilter(readings)).toEqual([200, 200, 200, 200, 205, null, 205]);
  });

  // A lone reading between silences is noise
  it("drops lone voiced readings", () => {
    // One lone reading, then a run of two
    expect(dropLoneReadings([null, 300, null, 200, 210, null])).toEqual([null, null, null, 200, 210, null]);
  });

  // A gap shorter than about 150 ms is filled; longer gaps stay as breaks
  it("fills short gaps and keeps long ones", () => {
    // One missing reading, then two missing readings (200 ms)
    const filled = fillShortGaps([200, null, 220, 220, null, null, 230], 100);
    // The first filled on the line, the second kept
    expect(filled).toEqual([200, 210, 220, 220, null, null, 230]);
  });

  // The cleaning runs in order, and steps are worked out around the take's usual pitch
  it("cleans and turns readings into steps around the usual pitch", () => {
    // An octave slip, a lone click, and a short gap
    const readings = [null, 400, null, null, 200, 200, 400, 200, null, 200, 200, 200];
    // Cleaned
    expect(cleanPitch(readings, 100)).toEqual([null, null, null, null, 200, 200, 200, 200, 200, 200, 200, 200]);
    // In steps: all on the usual pitch
    expect(cleanSteps(readings, 100)).toEqual({ steps: [null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0], usualHz: 200 });
    // An octave above the usual is twelve steps
    expect(semitonesFrom([400, null, 100], 200)).toEqual([12, null, -12]);
  });

  // No voice at all: no usual pitch, and nothing to draw
  it("handles a take with no voice", () => {
    // All silent
    expect(cleanSteps([null, null, null], 100)).toEqual({ steps: [null, null, null], usualHz: null });
  });
});

// Group the checks on the drawn path
describe("smoothPath", () => {
  // A run of points becomes one smooth curve; a gap starts a new one; a lone point is a dot
  it("draws smooth runs broken at gaps", () => {
    // Two points, a gap, then one point
    const path = smoothPath([{ x: 0, y: 10 }, { x: 10, y: 20 }, null, { x: 30, y: 5 }]);
    // A curve, then a dot
    expect(path).toBe("M0 10C1.7 11.7 8.3 18.3 10 20M30 5h0.1");
  });

  // Nothing to draw
  it("draws nothing for no points", () => {
    // Empty
    expect(smoothPath([null, null])).toBe("");
  });

  // The curve passes through every point
  it("passes through each point", () => {
    // Three points
    const path = smoothPath([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 0 }]);
    // Starts on the first, reaches the middle, ends on the last
    expect([path.startsWith("M0 0C"), path.includes(" 10 10C"), path.endsWith(" 20 0")]).toEqual([true, true, true]);
  });
});

// Smoothing for drawing (decision 114)
describe("smoothForDrawing", () => {
  // A step becomes a slope
  it("spreads a step from one level to another over its neighbours, rising each reading, and keeps breaks", () => {
    // A level, a jump, a break, a lone reading
    const drawn = smoothForDrawing([0, 0, 0, 0, 6, 6, 6, 6, null, 2]);
    // Rising through the jump
    expect(drawn.slice(1, 7).every((value, index, all) => index === 0 || (value ?? 0) > (all[index - 1] ?? 0))).toBe(true);
    // The break stays a break, and the lone reading is its own
    expect(drawn.slice(8)).toEqual([null, 2]);
  });

  // A flat line stays flat
  it("leaves a level line as it is", () => {
    // Five readings at 3
    expect(smoothForDrawing([3, 3, 3, 3, 3])).toEqual([3, 3, 3, 3, 3]);
  });
});
