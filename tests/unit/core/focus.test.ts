// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the weekly focus rules being checked
import { V1_FOCUSES, WEEKLY_FOCUSES, currentFocus } from "@/core/focus";

// Build a local date for a day in 2026 (month counted from 1) at noon
const day = (month: number, date: number, hour = 12) => new Date(2026, month - 1, date, hour);

// Group the checks about the list of focuses
describe("weekly focus list", () => {
  // The PRD lists five focuses in a fixed order for a new user
  it("follows the PRD order", () => {
    // Confirm the ids are in the PRD's order
    expect(WEEKLY_FOCUSES.map((focus) => focus.id)).toEqual(["start-and-finish", "cut-fillers", "pace", "structure", "warmth-and-energy"]);
  });

  // Warmth and energy needs audio analysis, which v1 does not have
  it("leaves out focuses that need audio analysis in v1", () => {
    // Confirm the v1 list has the first four only
    expect(V1_FOCUSES.map((focus) => focus.id)).toEqual(["start-and-finish", "cut-fillers", "pace", "structure"]);
  });
});

// Group the checks about which focus is active
describe("currentFocus", () => {
  // During the first week nothing changes
  it("keeps the starting focus for the first seven days", () => {
    // Work out the focus six days after starting
    const result = currentFocus({ focusIndex: 0, focusStartedOn: day(10, 12) }, day(10, 18, 23));
    // Confirm it is still the first focus
    expect(result.focus.id).toBe("start-and-finish");
    // Confirm the stored start date does not move
    expect(result.focusStartedOn).toEqual(day(10, 12, 0));
  });

  // After a week the next focus begins
  it("moves to the next focus on day seven", () => {
    // Work out the focus exactly a week after starting
    const result = currentFocus({ focusIndex: 0, focusStartedOn: day(10, 12) }, day(10, 19, 8));
    // Confirm it moved to the second focus
    expect(result.focus.id).toBe("cut-fillers");
    // Confirm the new index is saved
    expect(result.focusIndex).toBe(1);
    // Confirm the start date moved forward one week
    expect(result.focusStartedOn).toEqual(day(10, 19, 0));
  });

  // A user who is away for weeks catches up by the number of weeks missed
  it("advances one focus per full week that has passed", () => {
    // Work out the focus three weeks and two days after starting
    const result = currentFocus({ focusIndex: 0, focusStartedOn: day(10, 1) }, day(10, 24));
    // Confirm it advanced three times
    expect(result.focus.id).toBe("structure");
    // Confirm the start date is the most recent week boundary
    expect(result.focusStartedOn).toEqual(day(10, 22, 0));
  });

  // After the last v1 focus the cycle begins again
  it("wraps back to the first focus after the last v1 focus", () => {
    // Work out the focus a week after starting the last v1 focus
    const result = currentFocus({ focusIndex: 3, focusStartedOn: day(10, 1) }, day(10, 8));
    // Confirm it wrapped to the first focus, skipping warmth and energy
    expect(result.focus.id).toBe("start-and-finish");
    // Confirm the saved index wrapped too
    expect(result.focusIndex).toBe(0);
  });

  // A device clock set backwards must not break anything
  it("keeps the current focus if the clock is earlier than the start date", () => {
    // Work out the focus on a date before the start
    const result = currentFocus({ focusIndex: 2, focusStartedOn: day(10, 12) }, day(10, 5));
    // Confirm the focus is unchanged
    expect(result.focus.id).toBe("pace");
    // Confirm the start date is unchanged
    expect(result.focusStartedOn).toEqual(day(10, 12, 0));
  });

  // A saved index outside the v1 list (for example from a later version) is brought back into range
  it("brings an out-of-range saved index back into the v1 list", () => {
    // Work out the focus with an index past the end of the list
    const result = currentFocus({ focusIndex: 5, focusStartedOn: day(10, 12) }, day(10, 12));
    // Confirm it maps onto the list (5 wraps to 1)
    expect(result.focus.id).toBe("cut-fillers");
  });

  // A week is seven calendar days even when the clocks change (November 1, 2026 in the test time zone)
  it("counts a week across a clock change as seven calendar days", () => {
    // Work out the focus one week after a start just before the clocks change
    const result = currentFocus({ focusIndex: 0, focusStartedOn: day(10, 29) }, day(11, 5, 0));
    // Confirm it advanced exactly once
    expect(result.focus.id).toBe("cut-fillers");
  });
});
