// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load Node's file tools to read the source files
import { readdirSync, readFileSync, statSync } from "node:fs";
// Load Node's path tools to build file paths
import { join } from "node:path";
// Load the raw-style finder being checked
import { findRawStyles } from "../../support/rawStyles";

// Group the checks about the raw-style finder itself
describe("findRawStyles", () => {
  // Hex colors are the most common raw color
  it("finds hex colors", () => {
    // Confirm a hex color in a style is caught
    expect(findRawStyles(`<div style={{ color: "#ff0000" }} />`)).toEqual(["#ff0000"]);
  });

  // Color functions are raw colors too
  it("finds rgb, hsl and oklch color functions", () => {
    // Confirm each function form is caught
    expect(findRawStyles(`a: rgb(1,2,3); b: hsl(1 2% 3%); c: oklch(0.5 0.1 20)`)).toEqual(["rgb(", "hsl(", "oklch("]);
  });

  // Built-in Tailwind palette classes would bypass the theme
  it("finds built-in Tailwind color classes", () => {
    // Confirm palette and black/white classes are caught
    expect(findRawStyles(`className="bg-blue-500 text-white border-zinc-200"`)).toEqual(["bg-blue-500", "text-white", "border-zinc-200"]);
  });

  // Arbitrary Tailwind values can hide a raw color or font
  it("finds arbitrary Tailwind color and font values", () => {
    // Confirm bracketed values are caught
    expect(findRawStyles(`className="bg-[#123456] font-['Inter']"`)).toEqual(["bg-[#123456]", "font-['Inter']"]);
  });

  // Fonts must come from the theme too
  it("finds raw font families", () => {
    // Confirm a fontFamily style is caught
    expect(findRawStyles(`style={{ fontFamily: "Inter" }}`)).toEqual(["fontFamily"]);
  });

  // Role classes are the approved way and must not be flagged
  it("allows theme role classes", () => {
    // Confirm role classes pass
    expect(findRawStyles(`className="bg-paper text-ink-muted border-rule font-display bg-accent text-accent-ink"`)).toEqual([]);
  });
});

// List every file under a folder, skipping some folders
function listFiles(folder: string, skip: string[]): string[] {
  // Read the folder's entries
  return readdirSync(folder).flatMap((entry) => {
    // Build the full path
    const path = join(folder, entry);
    // Skip excluded folders and files
    if (skip.includes(path)) return [];
    // Recurse into subfolders, or keep the file
    return statSync(path).isDirectory() ? listFiles(path, skip) : [path];
  });
}

// Group the check over the real code
describe("components and screens", () => {
  // Theme files are the only place raw colors and fonts may live
  const files = listFiles("src", ["src/theme", "src/app/globals.css"]);

  // Every source file outside the theme folder must use roles only
  it.each(files)("%s contains no raw colors or fonts", (file) => {
    // Confirm the file has no raw styles
    expect(findRawStyles(readFileSync(file, "utf8"))).toEqual([]);
  });
});
