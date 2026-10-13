// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the focus measure being checked
import { headlineFor, measureFor, retryHeadline } from "@/core/focusMeasure";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Group the checks about which number goes with each weekly focus
describe("measureFor", () => {
  // Filler week measures fillers
  it("measures fillers a minute in filler week", () => {
    // Confirm the measure's unit and reading
    const measure = measureFor("cut-fillers");
    // Confirm the unit
    expect(measure?.unit).toBe("fillers a minute");
    // Confirm it reads the filler rate
    expect(measure?.read(makeSession({ fillersPerMinute: 4.25 }))).toBe(4.25);
  });

  // Pace week measures speaking speed
  it("measures words a minute in pace week", () => {
    // Confirm the unit
    expect(measureFor("pace")?.unit).toBe("words a minute");
  });

  // Finishing sentences and structure cannot be measured from a transcript, so there is no number
  it("has no number for start-and-finish or structure", () => {
    // Confirm both have none
    expect([measureFor("start-and-finish"), measureFor("structure")]).toEqual([null, null]);
  });
});

// Group the checks about the feedback headline
describe("headlineFor", () => {
  // Filler week: one decimal place
  it("writes the filler rate in filler week", () => {
    // Confirm the sentence
    expect(headlineFor(makeSession({ focus: "cut-fillers", fillersPerMinute: 4.25 }))).toBe("4.3 fillers a minute.");
  });

  // Pace week: whole words
  it("writes the speaking speed in pace week", () => {
    // Confirm the sentence
    expect(headlineFor(makeSession({ focus: "pace", wordsPerMinute: 162.4 }))).toBe("162 words a minute.");
  });

  // No number: name the focus instead
  it("names the focus when there is no number", () => {
    // Confirm the sentence
    expect(headlineFor(makeSession({ focus: "start-and-finish" }))).toBe("Start and finish.");
  });
});

// Group the checks about the retry headline
describe("retryHeadline", () => {
  // Filler week compares filler rates
  it("compares filler rates in filler week", () => {
    // Confirm the sentence
    expect(retryHeadline(makeSession({ focus: "cut-fillers", fillersPerMinute: 1.8 }), makeSession({ focus: "cut-fillers", fillersPerMinute: 4.2 }))).toBe("From 4.2 to 1.8 fillers a minute.");
  });

  // Pace week compares speeds
  it("compares speaking speed in pace week", () => {
    // Confirm the sentence
    expect(retryHeadline(makeSession({ focus: "pace", wordsPerMinute: 148 }), makeSession({ focus: "pace", wordsPerMinute: 181 }))).toBe("From 181 to 148 words a minute.");
  });

  // A change too small to matter is said plainly
  it("says when the number held steady", () => {
    // Confirm the sentence for fillers
    expect(retryHeadline(makeSession({ fillersPerMinute: 3.05 }), makeSession({ fillersPerMinute: 3.1 }))).toBe("Again about 3.1 fillers a minute.");
  });

  // No number: a plain statement
  it("uses a plain statement when the focus has no number", () => {
    // Confirm the sentence
    expect(retryHeadline(makeSession({ focus: "structure" }), makeSession({ focus: "structure" }))).toBe("Your second try is in.");
  });
});
