// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { cleanOutline, outlineFromQuery, outlineQuery, pointsCovered } from "@/core/outline";

// Group the checks about a short speech's plan
describe("outline", () => {
  // A plan needs a topic and a point; extra and empty points are dropped; an unknown length becomes two minutes
  it("tidies a plan", () => {
    // Confirm the cases
    expect([cleanOutline("  ", ["a"], 2), cleanOutline("Topic", [" ", ""], 2), cleanOutline(" My dog ", ["walks", " ", "food", "naps", "toys", "vets"], 7)]).toEqual([null, null, { topic: "My dog", points: ["walks", "food", "naps", "toys"], goalMinutes: 2 }]);
  });

  // The plan goes into the address and comes back the same
  it("round-trips through an address", () => {
    // A plan with awkward characters
    const plan = { topic: "Why I run & swim", points: ["Health?", "Friends = fun"], goalMinutes: 3 };
    // Confirm it comes back unchanged
    expect(outlineFromQuery(new URLSearchParams(outlineQuery(plan)))).toEqual(plan);
  });

  // A point counts when at least half of its key words were said, whatever their ending
  it("finds which points were covered", () => {
    // What was said
    const said = "I started practising speaking every morning, and honestly my confidence grew. The hardest part was finding time.";
    // Confirm: covered, covered by a different ending, not covered
    expect(pointsCovered(["Practise every morning", "Confidence grows", "Joining a club near work"], said)).toEqual([true, true, false]);
  });
});
