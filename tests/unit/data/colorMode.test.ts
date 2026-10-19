// @vitest-environment jsdom
// Load the test helpers from the test runner
import { beforeEach, describe, expect, it } from "vitest";
// Load what is being checked
import { COLOR_MODE_SCRIPT, readColorMode, saveColorMode } from "@/data/colorMode";

// Start each check with nothing saved and no override
beforeEach(() => {
  // Clear storage
  localStorage.clear();
  // Clear the override
  document.documentElement.removeAttribute("data-mode");
});

// Group the checks about the light and dark choice
describe("colorMode", () => {
  // Nothing saved, or something unknown, means light (decision 70)
  it("is light unless dark or follow-the-device was saved", () => {
    // Nothing saved
    const empty = readColorMode();
    // An unknown word
    localStorage.setItem("voicelab-color-mode", "purple");
    // Confirm both are light
    expect([empty, readColorMode()]).toEqual(["light", "light"]);
  });

  // A choice is remembered and shown
  it("saves a choice and applies it to the page", () => {
    // Choose to follow the device
    saveColorMode("system");
    // Confirm it is read back and shown
    const followed = [readColorMode(), document.documentElement.getAttribute("data-mode")];
    // Back to light
    saveColorMode("light");
    // Confirm light clears both the override and the stored word
    expect([followed, [readColorMode(), document.documentElement.getAttribute("data-mode"), localStorage.getItem("voicelab-color-mode")]]).toEqual([["system", "system"], ["light", null, null]]);
  });

  // The early script also applies a saved follow-the-device choice, and leaves light alone
  it("has an early script that applies a saved device choice and ignores anything else", () => {
    // Save follow-the-device
    localStorage.setItem("voicelab-color-mode", "system");
    // Run the script
    new Function(COLOR_MODE_SCRIPT)();
    // What it set
    const followed = document.documentElement.getAttribute("data-mode");
    // Now an unknown word, from a clean page
    document.documentElement.removeAttribute("data-mode");
    localStorage.setItem("voicelab-color-mode", "purple");
    new Function(COLOR_MODE_SCRIPT)();
    // Confirm
    expect([followed, document.documentElement.getAttribute("data-mode")]).toEqual(["system", null]);
  });

  // The early script applies a saved choice before the page is drawn
  it("has an early script that applies a saved dark choice", () => {
    // Save dark without applying it
    localStorage.setItem("voicelab-color-mode", "dark");
    // Run the script as the browser would
    new Function(COLOR_MODE_SCRIPT)();
    // Confirm the page is dark
    expect(document.documentElement.getAttribute("data-mode")).toBe("dark");
  });
});
