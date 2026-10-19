// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { topWordsToWatch, updateWordsToWatch } from "@/core/wordsToWatch";

// Group the checks about words to watch (decision 80)
describe("words to watch", () => {
  // Missed words go up, words caught again go down and leave at nothing, plain forms only
  it("counts misses and lets caught words go", () => {
    // Two drills
    const first = updateWordsToWatch({}, ["Tuesday.", "statistics", "Tuesday"], []);
    // The second: one caught, one missed again
    const second = updateWordsToWatch(first, ["statistics"], ["tuesday", "never-listed"]);
    // Confirm both, and the order shown
    expect([first, second, topWordsToWatch({ ...second, february: 3 })]).toEqual([{ tuesday: 2, statistics: 1 }, { statistics: 2, tuesday: 1 }, ["february", "statistics", "tuesday"]]);
  });
});
