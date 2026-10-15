// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the openings and closings checks being checked
import { bookendResult } from "@/core/bookend";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A run of the same loudness reading, one per tenth of a second
const run = (level: number, ticks: number) => Array<number>(ticks).fill(level);

// Group the checks about an opening drill's result
describe("bookendResult for an opening", () => {
  // A full breath before the first word, and a clean first word
  it("praises a pause before the first word and a clean start", () => {
    // 1.5 seconds of quiet, then speech
    const session = makeSession({ mode: "bookend", transcript: "Good evening, everyone. Tonight is about courage.", loudness: [...run(0, 15), ...run(0.5, 40)] });
    // Confirm both sentences
    expect(bookendResult("opening", session)).toEqual({ headline: "You waited 1.5 seconds before your first word. Good.", detail: "You opened with “Good evening, everyone. Tonight”." });
  });

  // Rushing in with a filler
  it("names a rushed start and a filler opening", () => {
    // Speech straight away
    const session = makeSession({ mode: "bookend", transcript: "So, um, today I want to talk about tools.", loudness: run(0.5, 40) });
    // Confirm both sentences
    expect(bookendResult("opening", session)).toEqual({ headline: "You started after 0.0 seconds. Try waiting a full breath.", detail: "You opened with “So, um”. Start on your first real word instead." });
  });
});

// Group the checks about a closing drill's result
describe("bookendResult for a close", () => {
  // A clean last line
  it("praises a close without fillers", () => {
    // A clean close; the voice holds up
    const session = makeSession({ mode: "bookend", transcript: "Pick one customer and call them this week. Thank you.", loudness: [...run(0.5, 30), ...run(0, 10)] });
    // Confirm both sentences
    expect(bookendResult("close", session)).toEqual({ headline: "No fillers in your closing.", detail: "None of your sentences faded at the end." });
  });

  // A close that trails off
  it("names fillers that crept into the close", () => {
    // A trailing close
    const session = makeSession({ mode: "bookend", transcript: "And that is the plan, so, yeah, that's it I guess.", loudness: [] });
    // Confirm the fillers are named, and that loudness was missing
    expect(bookendResult("close", session)).toEqual({ headline: "Fillers crept into your closing: so, yeah, I guess.", detail: "Loudness was not recorded, so endings could not be checked." });
  });
});
