// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the contrast calculator being checked
import { contrastRatio } from "@/theme/contrast";

// Group the checks about color contrast (WCAG 2 formula)
describe("contrastRatio", () => {
  // Black on white is the maximum possible contrast
  it("gives 21 for black on white", () => {
    // Confirm the known maximum
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  // A color against itself has no contrast
  it("gives 1 for identical colors", () => {
    // Confirm the known minimum
    expect(contrastRatio("#7a7a7a", "#7a7a7a")).toBeCloseTo(1, 5);
  });

  // The order of the two colors must not matter
  it("is the same whichever color is the text", () => {
    // Confirm swapping the colors gives the same ratio
    expect(contrastRatio("#336699", "#f0e0d0")).toBeCloseTo(contrastRatio("#f0e0d0", "#336699"), 10);
  });

  // A known published value: #767676 on white is just above the 4.5 AA threshold
  it("matches a known reference value", () => {
    // Confirm the reference ratio of about 4.54
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  // Three-digit shorthand is common in CSS
  it("accepts three-digit hex colors", () => {
    // Confirm #000 and #fff behave like their six-digit forms
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
  });

  // A typo in a theme file must fail loudly, not pass silently
  it("rejects a value that is not a hex color", () => {
    // Confirm a named color is refused
    expect(() => contrastRatio("red", "#ffffff")).toThrow(/hex color/);
  });
});
