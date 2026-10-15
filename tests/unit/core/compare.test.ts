// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the comparison helpers being checked
import { earlierTake, practiceDay } from "@/core/compare";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Build an ISO time on a day in October 2026 at noon local time
const oct = (day: number, hour = 12) => new Date(2026, 9, day, hour).toISOString();

// Sessions on several days: the same prompt on day 1 and day 14, others in between
const SESSIONS = [
  // The first time with prompt p001
  makeSession({ id: "a", promptId: "p001", createdAt: oct(1) }),
  // A different prompt
  makeSession({ id: "b", promptId: "p002", createdAt: oct(5) }),
  // The same prompt again later
  makeSession({ id: "c", promptId: "p001", createdAt: oct(10) }),
  // And again on day 14
  makeSession({ id: "d", promptId: "p001", createdAt: oct(14) }),
];

// Group the checks about finding an earlier take to compare with
describe("earlierTake", () => {
  // The comparison is with the very first time this prompt was recorded
  it("finds the first earlier recording of the same prompt", () => {
    // Confirm day 14 compares with day 1
    expect(earlierTake(SESSIONS, SESSIONS[3]!)?.id).toBe("a");
  });

  // Nothing to compare with the first time a prompt is recorded
  it("finds nothing for a prompt's first recording", () => {
    // Confirm none for the first take and for a one-off prompt
    expect([earlierTake(SESSIONS, SESSIONS[0]!), earlierTake(SESSIONS, SESSIONS[1]!)]).toEqual([null, null]);
  });

  // A retry the same day is already compared on its own screen, so it is not offered again
  it("ignores takes from the same day", () => {
    // A retry an hour after the day-14 take
    const retry = makeSession({ id: "e", promptId: "p002", createdAt: oct(5, 13) });
    // Confirm nothing, because the only earlier p002 take is the same day
    expect(earlierTake([...SESSIONS, retry], retry)).toBeNull();
  });

  // A rehearsal is compared with an earlier run of the same part of the talk, not a different section
  it("matches rehearsals by section", () => {
    // Earlier runs: the whole talk, then section 1
    const whole = makeSession({ id: "w", mode: "rehearse", promptId: "talk", createdAt: oct(1, 9) });
    // Section 1, a day later
    const opening = makeSession({ id: "o", mode: "rehearse", promptId: "talk", sectionIndex: 0, createdAt: oct(2, 9) });
    // Today: section 1 again, and a whole run
    const openingAgain = makeSession({ id: "o2", mode: "rehearse", promptId: "talk", sectionIndex: 0, createdAt: oct(5, 9) });
    // A whole run today
    const wholeAgain = makeSession({ id: "w2", mode: "rehearse", promptId: "talk", sectionIndex: null, createdAt: oct(5, 10) });
    // Confirm each finds its own kind
    expect([earlierTake([whole, opening, openingAgain], openingAgain)?.id, earlierTake([whole, opening, wholeAgain], wholeAgain)?.id]).toEqual(["o", "w"]);
  });
});

// Group the checks about practice day numbers
describe("practiceDay", () => {
  // Day 1 is the day of the first recording ever
  it("counts days from the first recording", () => {
    // Confirm day 1 and day 14
    expect([practiceDay(SESSIONS, new Date(oct(1, 20))), practiceDay(SESSIONS, new Date(oct(14, 8)))]).toEqual([1, 14]);
  });
});
