// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the focus measure being checked
import { headlineFor, headlineKind, measureFor, retryHeadline } from "@/core/focusMeasure";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Loudness readings (one every 100 ms): two seconds of speech, then a one-second pause, three times over
const TWO_PAUSES = [...Array(20).fill(0.5), ...Array(10).fill(0), ...Array(20).fill(0.5), ...Array(10).fill(0), ...Array(20).fill(0.5)];

// Group the checks about which number goes with each weekly focus
describe("measureFor", () => {
  // Filler week measures fillers
  it("measures pause words a minute in filler week", () => {
    // Confirm the measure's unit and reading
    const measure = measureFor("cut-fillers");
    // Confirm the unit
    expect(measure?.unit).toBe("pause words a minute");
    // Confirm it reads the filler rate
    expect(measure?.read(makeSession({ fillersPerMinute: 4.25 }))).toBe(4.25);
  });

  // Pace week measures speaking speed
  it("measures words a minute in pace week", () => {
    // Confirm the unit
    expect(measureFor("pace")?.unit).toBe("words a minute");
  });

  // Pausing week counts pauses from the loudness readings
  it("measures pauses a minute in pausing week", () => {
    // The measure
    const measure = measureFor("pausing");
    // Confirm the unit
    expect(measure?.unit).toBe("pauses a minute");
    // Two pauses in half a minute is four a minute
    expect(measure?.read(makeSession({ durationSec: 30, loudness: TWO_PAUSES }))).toBe(4);
  });

  // Sessions saved before loudness was kept have no pause count
  it("has no pause number for a session without loudness readings", () => {
    // Confirm nothing to read
    expect(measureFor("pausing")?.read(makeSession({ loudness: undefined }))).toBeNull();
  });

  // Openings, structure and closes need judgement, not a count (until the text checks in plan step D1)
  it("has no number for opening, structure, close, or the retired start-and-finish", () => {
    // Confirm none have one
    expect(["strong-opening", "clear-structure", "strong-close", "start-and-finish", "structure"].map(measureFor)).toEqual([null, null, null, null, null]);
  });
});

// Group the checks about the feedback headline
describe("headlineFor", () => {
  // A take under 30 seconds: a count, not a rate scaled up to a minute (decision 77)
  it("counts fillers on a short take", () => {
    // Two pause words in 11 seconds, and the kind of number the headline gives
    const session = makeSession({ focus: "cut-fillers", fillersPerMinute: (2 * 60) / 11, durationSec: 11 });
    // Confirm the sentence and its kind
    expect([headlineFor(session), headlineKind(session), headlineKind(makeSession({ focus: "structure" }))]).toEqual(["2 pause words in 11 seconds.", "fillers", null]);
  });

  // Filler week: one decimal place
  it("writes the filler rate in filler week", () => {
    // Confirm the sentence
    expect(headlineFor(makeSession({ focus: "cut-fillers", fillersPerMinute: 4.25 }))).toBe("4.3 pause words a minute.");
  });

  // Pace week: whole words
  it("writes the speaking speed in pace week", () => {
    // Confirm the sentence
    expect(headlineFor(makeSession({ focus: "pace", wordsPerMinute: 162.4 }))).toBe("162 words a minute.");
  });

  // Pausing week: one decimal place
  it("writes the pause rate in pausing week", () => {
    // Confirm the sentence
    expect(headlineFor(makeSession({ focus: "pausing", durationSec: 30, loudness: TWO_PAUSES }))).toBe("4.0 pauses a minute.");
  });

  // No number: no headline, so the one change leads (decision 67)
  it("gives no headline when nothing measures the focus", () => {
    // Confirm for an unmeasured focus, a retired one, and pausing without readings
    expect([headlineFor(makeSession({ focus: "strong-opening" })), headlineFor(makeSession({ focus: "start-and-finish" })), headlineFor(makeSession({ focus: "pausing", loudness: undefined }))]).toEqual([null, null, null]);
  });
});

// Group the checks about the retry headline
describe("retryHeadline", () => {
  // Filler week compares filler rates
  it("compares filler rates in filler week", () => {
    // Confirm the sentence
    expect(retryHeadline(makeSession({ focus: "cut-fillers", fillersPerMinute: 1.8 }), makeSession({ focus: "cut-fillers", fillersPerMinute: 4.2 }))).toBe("From 4.2 to 1.8 pause words a minute.");
  });

  // Pace week compares speeds
  it("compares speaking speed in pace week", () => {
    // Confirm the sentence
    expect(retryHeadline(makeSession({ focus: "pace", wordsPerMinute: 148 }), makeSession({ focus: "pace", wordsPerMinute: 181 }))).toBe("From 181 to 148 words a minute.");
  });

  // A change too small to matter is said plainly
  it("says when the number held steady", () => {
    // Confirm the sentence for fillers
    expect(retryHeadline(makeSession({ fillersPerMinute: 3.05 }), makeSession({ fillersPerMinute: 3.1 }))).toBe("Again about 3.1 pause words a minute.");
  });

  // Either try without readings: a plain statement
  it("uses a plain statement when a pause count is missing", () => {
    // Confirm the sentence
    expect(retryHeadline(makeSession({ focus: "pausing", durationSec: 30, loudness: TWO_PAUSES }), makeSession({ focus: "pausing", loudness: undefined }))).toBe("Your second try is in.");
  });

  // No number: a plain statement
  it("uses a plain statement when the focus has no number", () => {
    // Confirm the sentence
    expect(retryHeadline(makeSession({ focus: "structure" }), makeSession({ focus: "structure" }))).toBe("Your second try is in.");
  });
});
