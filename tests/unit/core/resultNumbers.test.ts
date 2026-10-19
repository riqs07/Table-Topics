// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the numbers builder being checked
import { resultChanges, resultNumbers } from "@/core/resultNumbers";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Group the checks about the compact row of numbers on a session's page
describe("resultNumbers", () => {
  // Without loudness readings, three numbers: fillers, speed, and length
  it("gives fillers, speed and length", () => {
    // A 2:14 session
    const session = makeSession({ fillersPerMinute: 2.4, wordsPerMinute: 128.4, durationSec: 134 });
    // Confirm the three numbers with their labels
    expect(resultNumbers(session, null)).toEqual([
      { label: "fillers a minute", value: "2.4" },
      { label: "words a minute", value: "128" },
      { label: "long", value: "2:14" },
    ]);
  });

  // With a pause count, it comes last, with a singular label for one
  it("adds the pauses when they were measured", () => {
    // A short session
    const session = makeSession({ fillersPerMinute: 0, wordsPerMinute: 140, durationSec: 61 });
    // Confirm the fourth number, singular for one pause
    expect(resultNumbers(session, 1).at(-1)).toEqual({ label: "pause", value: "1" });
  });

  // Several pauses use the plural
  it("uses the plural for several pauses", () => {
    // Confirm the label
    expect(resultNumbers(makeSession(), 4).at(-1)).toEqual({ label: "pauses", value: "4" });
  });
});

// Group the checks about a retry's numbers beside the first try's
describe("resultChanges", () => {
  // Each number on both tries, with pauses only when both were measured
  it("pairs each number, adding pauses only when both tries have them", () => {
    // Two tries
    const first = makeSession({ fillersPerMinute: 4.25, wordsPerMinute: 150, durationSec: 13 });
    // The retry
    const second = makeSession({ fillersPerMinute: 1.8, wordsPerMinute: 140, durationSec: 64 });
    // Confirm with both pause counts, then with one missing
    expect([resultChanges(first, second, { before: 1, after: 3 }).at(-1), resultChanges(first, second, { before: null, after: 3 })]).toEqual([
      // Pauses, plural on both
      { label: "pauses", before: "1", after: "3" },
      // No pause row
      [{ label: "fillers a minute", before: "4.3", after: "1.8" }, { label: "words a minute", before: "150", after: "140" }, { label: "long", before: "0:13", after: "1:04" }],
    ]);
  });
});
