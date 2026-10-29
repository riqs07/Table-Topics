// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load Node's file reader
import { existsSync, readFileSync } from "node:fs";
// Load Node's path tools
import { join } from "node:path";
// Load the list of drawings
import { DRAWINGS } from "@/components/script/Drawing";

// Group the checks about the hand-drawn people's files (decision 134)
describe("DRAWINGS", () => {
  // Each file is there, and is an SVG a browser will draw as an image (an image SVG without its namespace shows nothing at all), the size it is listed with
  it("points at SVG files that will draw as images, at their listed size", () => {
    // Check each
    const checks = Object.values(DRAWINGS).map(({ src: path, width, height }) => {
      // Where it is on disk
      const file = join(process.cwd(), "public", path);
      // Whether it is there
      if (!existsSync(file)) return [path, "missing"];
      // Its text
      const text = readFileSync(file, "utf8");
      // Whether its root names the SVG namespace and the listed size
      return [path, text.includes(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"`) ? "ok" : "not drawable at its size"];
    });
    // Confirm all are fine
    expect(checks).toEqual(Object.values(DRAWINGS).map(({ src }) => [src, "ok"]));
  });
});
