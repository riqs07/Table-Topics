// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the count-up rules
import { countUpValue, easeOut } from "@/core/countUp";

// Group the checks about counting up
describe("countUpValue", () => {
  // At the end it shows the real value
  it("ends on the final value", () => {
    // Confirm each shape
    expect(["3.4", "148", "1:04", "—"].map((value) => countUpValue(value, 1))).toEqual(["3.4", "148", "1:04", "—"]);
  });

  // At the start every number is zero, in its own shape
  it("starts from zero in the same shape", () => {
    // Confirm each shape
    expect(["3.4", "148", "1:04"].map((value) => countUpValue(value, 0))).toEqual(["0.0", "0", "0:00"]);
  });

  // Halfway, eased, is well past half
  it("eases out, so halfway is most of the way", () => {
    // Confirm the eased values
    expect([easeOut(0.5), countUpValue("100", 0.5), countUpValue("2:00", 0.5)]).toEqual([0.875, "88", "1:45"]);
  });

  // Words and dashes are never counted
  it("leaves anything that is not a number as it is", () => {
    // Confirm
    expect(countUpValue("n/a", 0.2)).toBe("n/a");
  });
});
