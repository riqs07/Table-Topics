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
  // Nothing saved, or something unknown, means follow the device
  it("follows the device unless light or dark was saved", () => {
    // Nothing saved
    const empty = readColorMode();
    // An unknown word
    localStorage.setItem("voicelab-color-mode", "purple");
    // Confirm both follow the device
    expect([empty, readColorMode()]).toEqual(["system", "system"]);
  });

  // A choice is remembered and shown
  it("saves a choice and applies it to the page", () => {
    // Choose light
    saveColorMode("light");
    // Confirm it is read back and shown
    expect([readColorMode(), document.documentElement.getAttribute("data-mode")]).toEqual(["light", "light"]);
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
