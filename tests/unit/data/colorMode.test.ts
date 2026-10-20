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
  // Nothing saved, or something unknown, means follow the device (decision 89; light until then, decision 70)
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
    // Confirm it is read back, shown (no attribute means light) and stored
    const light = [readColorMode(), document.documentElement.getAttribute("data-mode"), localStorage.getItem("voicelab-color-mode")];
    // Back to following the device
    saveColorMode("system");
    // Confirm the device choice sets the attribute and clears the stored word
    expect([light, [readColorMode(), document.documentElement.getAttribute("data-mode"), localStorage.getItem("voicelab-color-mode")]]).toEqual([["light", null, "light"], ["system", "system", null]]);
  });

  // The early script follows the device when nothing (or something unknown) is saved, and keeps a saved light choice light
  it("has an early script that follows the device by default and honours a saved light choice", () => {
    // Nothing saved, on a page drawn without the attribute
    new Function(COLOR_MODE_SCRIPT)();
    // What it set
    const empty = document.documentElement.getAttribute("data-mode");
    // An unknown word
    localStorage.setItem("voicelab-color-mode", "purple");
    new Function(COLOR_MODE_SCRIPT)();
    // What it set
    const unknown = document.documentElement.getAttribute("data-mode");
    // A saved light choice, on a page drawn following the device
    localStorage.setItem("voicelab-color-mode", "light");
    new Function(COLOR_MODE_SCRIPT)();
    // Confirm the device twice, then light (no attribute)
    expect([empty, unknown, document.documentElement.getAttribute("data-mode")]).toEqual(["system", "system", null]);
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
