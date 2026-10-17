// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the length helpers being checked
import { lengthLabel, readingTime } from "@/core/readingLength";

// Group the checks about reading lengths
describe("reading lengths", () => {
  // 140 words take a minute
  it("times a text at 140 words a minute", () => {
    // Confirm 70 words take 30 seconds
    expect(readingTime(Array(70).fill("word").join(" "))).toBe(30);
  });

  // Short texts are said in tens of seconds, longer ones in half minutes
  it("says the time the way people do", () => {
    // Confirm several lengths
    expect([lengthLabel(32), lengthLabel(44), lengthLabel(61), lengthLabel(95), lengthLabel(118), lengthLabel(560)]).toEqual(["about 30 seconds", "about 40 seconds", "about 1 minute", "about 1½ minutes", "about 2 minutes", "about 9½ minutes"]);
  });
});
