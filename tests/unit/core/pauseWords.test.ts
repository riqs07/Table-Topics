// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { fluencyJudged, pauseWordsShown } from "@/core/pauseWords";

// Group the checks about the pause-word settings (decision 79)
describe("pause-word settings", () => {
  // Shown unless switched off or the user stammers; fluency judged unless the user stammers
  it("shows pause words and judges fluency unless told not to", () => {
    // The three cases
    const cases = [{}, { showPauseWords: false }, { stammer: true }];
    // Confirm each
    expect(cases.map((settings) => [pauseWordsShown(settings), fluencyJudged(settings)])).toEqual([[true, true], [false, true], [false, false]]);
  });
});
