// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load what is being checked
import { readDevTools, saveDevTools } from "@/data/devTools";

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

// Group the checks about the developer link's switch (decision 132)
describe("devTools", () => {
  // Off unless switched on; switching off stores nothing
  it("is off by default, and remembers being switched on", () => {
    // Nothing saved
    const first = readDevTools();
    // Switch on
    saveDevTools(true);
    // Read back
    const on = [readDevTools(), localStorage.getItem("voicelab-dev-tools")];
    // Switch off
    saveDevTools(false);
    // Confirm off, on, then off with nothing stored
    expect([first, on, [readDevTools(), localStorage.getItem("voicelab-dev-tools")]]).toEqual([false, [true, "on"], [false, null]]);
  });

  // Blocked storage (private browsing) reads off and saving does not throw
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
    // Confirm off and a quiet save
    expect([readDevTools(), (() => saveDevTools(true))()]).toEqual([false, undefined]);
  });
});
