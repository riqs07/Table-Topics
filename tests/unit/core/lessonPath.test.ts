// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the lesson path being checked
import { lessonPath } from "@/core/lessonPath";

// Group the checks about the done and next marks on the lesson path
describe("lessonPath", () => {
  // Nothing practised: the first lesson is next
  it("makes the first lesson next for a new user", () => {
    // Confirm the marks
    expect(lessonPath(["a", "b", "c"], new Map())).toEqual(["next", "open", "open"]);
  });

  // Practised lessons are done; the first one not done is next
  it("makes the first lesson not yet done next", () => {
    // Lessons one and three practised
    const counts = new Map([["a", 2], ["c", 1]]);
    // Confirm the marks
    expect(lessonPath(["a", "b", "c", "d"], counts)).toEqual(["done", "next", "done", "open"]);
  });

  // Everything done: no next
  it("has no next when every lesson is done", () => {
    // Confirm the marks
    expect(lessonPath(["a", "b"], new Map([["a", 1], ["b", 1]]))).toEqual(["done", "done"]);
  });
});
