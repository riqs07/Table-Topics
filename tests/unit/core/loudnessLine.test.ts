// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { thickPieces } from "@/core/loudnessLine";

// Group the checks on loudness as thickness (decision 111)
describe("thickPieces", () => {
  // Louder readings make thicker pieces; a gap in the voice makes none
  it("draws louder stretches thicker", () => {
    // Four readings, the third silent; quiet then loud
    const pieces = thickPieces([0, 0, null, 0, 0], [0.1, 0.1, 0.01, 0.4, 0.4], 0.4, 100, [{ index: 0, left: 0, width: 100 }], [{ start: 0, end: 0.4 }]);
    // The quiet piece thin, the loud piece thickest
    expect(pieces.map((piece) => [piece.x1, piece.x2, piece.width])).toEqual([[0, 25, 4], [75, 100, 10]]);
  });

  // Nothing to draw against
  it("draws nothing without words or loudness", () => {
    // No slots, and no loudness
    expect([thickPieces([0, 0], [0.2, 0.2], 0.2, 100, [], []), thickPieces([0, 0], [0, 0], 0, 100, [{ index: 0, left: 0, width: 10 }], [{ start: 0, end: 0.1 }])]).toEqual([[], []]);
  });
});
