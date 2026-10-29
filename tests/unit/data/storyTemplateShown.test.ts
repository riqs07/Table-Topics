// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load what is being checked
import { readStoryTemplateShown, saveStoryTemplateShown } from "@/data/storyTemplateShown";

// Start each check with nothing saved
beforeEach(() => {
  // Clear storage
  localStorage.clear();
});

// Put back any blocked storage
afterEach(() => {
  // Undo the stand-ins
  vi.restoreAllMocks();
});

// Group the checks about showing a story's template while telling (decision 130)
describe("story template shown", () => {
  // On unless switched off; switching back on stores nothing
  it("is on by default, and remembers being switched off", () => {
    // Nothing saved
    const first = readStoryTemplateShown();
    // Switch off
    saveStoryTemplateShown(false);
    // Read back
    const off = [readStoryTemplateShown(), localStorage.getItem("voicelab-story-template")];
    // Switch on
    saveStoryTemplateShown(true);
    // Confirm on, off, then on with nothing stored
    expect([first, off, [readStoryTemplateShown(), localStorage.getItem("voicelab-story-template")]]).toEqual([true, [false, "off"], [true, null]]);
  });

  // A value from another app or an older version reads as on
  it("reads anything but off as on", () => {
    // Something else stored under the key
    localStorage.setItem("voicelab-story-template", "{\"shown\":false}");
    // Confirm on
    expect(readStoryTemplateShown()).toBe(true);
  });

  // Blocked storage (private browsing) reads on and saving does not throw
  it("survives blocked storage", () => {
    // Reads throw
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      // As a blocked browser does
      throw new Error("blocked");
    });
    // Writes throw
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      // As a blocked browser does
      throw new Error("blocked");
    });
    // Confirm on and a quiet save
    expect([readStoryTemplateShown(), (() => saveStoryTemplateShown(false))()]).toEqual([true, undefined]);
  });
});
