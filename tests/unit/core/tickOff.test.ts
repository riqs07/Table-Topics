// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { freshTicks, readTicked } from "@/core/tickOff";

// Group the checks about ticking off steps on Today (decision 141)
describe("tickOff", () => {
  // Only a day and a list of text keys is a record; anything else, from an old version or another app, is none
  it("reads only a well-formed record", () => {
    // Confirm the good one and the others
    expect([readTicked({ day: "2026-10-29", keys: ["a"] }), readTicked(null), readTicked("x"), readTicked({ day: 5, keys: [] }), readTicked({ day: "2026-10-29", keys: [1] }), readTicked({ date: "2026-10-29", steps: ["a"] })]).toEqual([{ day: "2026-10-29", keys: ["a"] }, null, null, null, null, null]);
  });

  // The done steps not yet ticked off today are fresh; the record keeps every one once
  it("finds the fresh steps and keeps each once", () => {
    // Confirm a first look, a second look with one more done, and nothing new
    expect([freshTicks(null, "d1", ["a"]), freshTicks({ day: "d1", keys: ["a"] }, "d1", ["a", "b"]), freshTicks({ day: "d1", keys: ["a", "b"] }, "d1", ["a", "b"])]).toEqual([{ fresh: ["a"], next: { day: "d1", keys: ["a"] } }, { fresh: ["b"], next: { day: "d1", keys: ["a", "b"] } }, { fresh: [], next: { day: "d1", keys: ["a", "b"] } }]);
  });

  // Yesterday's record counts as nothing ticked today
  it("starts afresh on a new day", () => {
    // Confirm
    expect(freshTicks({ day: "d1", keys: ["a"] }, "d2", ["a"])).toEqual({ fresh: ["a"], next: { day: "d2", keys: ["a"] } });
  });
});
