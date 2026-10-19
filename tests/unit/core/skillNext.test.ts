// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { nextToPractise } from "@/core/skillNext";

// Group the checks about the next lesson or drill
describe("nextToPractise", () => {
  // The first not yet practised, then the least practised, and nothing for an empty list
  it("picks the first new one, then the least practised", () => {
    // Confirm: none done, the first done, all done with the second least, and an empty list
    expect([nextToPractise(["a", "b", "c"], new Map()), nextToPractise(["a", "b", "c"], new Map([["a", 1]])), nextToPractise(["a", "b", "c"], new Map([["a", 2], ["b", 1], ["c", 2]])), nextToPractise([], new Map())]).toEqual(["a", "b", "b", undefined]);
  });
});
