// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load what is being checked
import { newlyTicked } from "@/data/stepsTicked";

// Clear storage and stand-ins after each check
afterEach(() => {
  // Empty storage
  localStorage.clear();
  // Put storage back
  vi.restoreAllMocks();
});

// Group the checks about the stored record of ticked-off steps (decision 141)
describe("newlyTicked", () => {
  // A step is ticked off once, then never again that day
  it("ticks each step off once", () => {
    // Confirm the first look, the second, and a new step
    expect([newlyTicked("d1", ["a"]), newlyTicked("d1", ["a"]), newlyTicked("d1", ["a", "b"])]).toEqual([["a"], [], ["b"]]);
  });

  // Broken text or another app's value under the key counts as nothing ticked, and is replaced
  it("copes with broken or foreign stored values", () => {
    // Broken text
    localStorage.setItem("voicelab-steps-ticked", "{not json");
    // The first look
    const first = newlyTicked("d1", ["a"]);
    // Another app's shape
    localStorage.setItem("voicelab-steps-ticked", JSON.stringify({ items: [1, 2] }));
    // Confirm both start afresh, and the record is ours again
    expect([first, newlyTicked("d1", ["a"]), JSON.parse(localStorage.getItem("voicelab-steps-ticked") ?? "null")]).toEqual([["a"], ["a"], { day: "d1", keys: ["a"] }]);
  });

  // Blocked storage gives no moment rather than one on every visit
  it("ticks nothing off when storage is blocked", () => {
    // Storage that throws
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    // Confirm none
    expect(newlyTicked("d1", ["a"])).toEqual([]);
  });
});
