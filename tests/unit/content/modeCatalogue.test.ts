// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the file system helpers, to check every address names a real page
import { existsSync } from "node:fs";
import { join } from "node:path";
// Load what is being checked
import { MODE_CATALOGUE } from "@/content/modeCatalogue";
// Load the small-talk units and voice drills, to check nothing is left out
import { UNITS } from "@/content/smallTalk";
import { VOICE_DRILLS } from "@/content/voice";

// Every entry in one list
const ENTRIES = MODE_CATALOGUE.flatMap((group) => group.entries);

// Group the checks about the list of every mode (decision 132)
describe("MODE_CATALOGUE", () => {
  // Each address opens a page the app has
  it("points every entry at a real page", () => {
    // The page part of each address
    const pages = ENTRIES.map((entry) => entry.href.split(/[?#]/)[0]!);
    // Pages with no page file (the home page is src/app/page.tsx)
    const missing = pages.filter((page) => !existsSync(join(process.cwd(), "src/app", page, "page.tsx")));
    // Confirm none
    expect(missing).toEqual([]);
  });

  // The five on Practice's main list are marked main, and names are not repeated
  it("marks the five main modes and repeats no name", () => {
    // Confirm the main five and unique names
    expect([ENTRIES.filter((entry) => entry.main).map((entry) => entry.name), new Set(ENTRIES.map((entry) => entry.name)).size === ENTRIES.length]).toEqual([["Rapid Fire", "Prepared speech", "Tell a story", "Talk with someone", "Read aloud"], true]);
  });

  // Every small-talk unit and every voice drill kind is listed, built from the content
  it("lists every small-talk unit and voice drill kind", () => {
    // The voice kinds with drills
    const kinds = new Set(VOICE_DRILLS.map((drill) => drill.kind));
    // Confirm each unit has an entry, and each kind's entry opens one of its drills
    expect([UNITS.every((unit) => ENTRIES.some((entry) => entry.href === `/small-talk/unit?id=${unit.id}`)), [...kinds].every((kind) => ENTRIES.some((entry) => entry.href === `/voice/drill?id=${VOICE_DRILLS.find((drill) => drill.kind === kind)!.id}`))]).toEqual([true, true]);
  });
});
