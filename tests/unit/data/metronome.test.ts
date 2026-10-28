// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load what is being checked
import { readMetronome, saveMetronome } from "@/data/metronome";

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

// Group the checks about the metronome choice (decision 128)
describe("metronome choice", () => {
  // Off at 82 with nothing saved; a saved choice is read back
  it("is off at 82 by default, and remembers a choice", () => {
    // Nothing saved
    const first = readMetronome();
    // Switch on at 90
    saveMetronome({ on: true, tempo: 90 });
    // Confirm the default, then the saved choice
    expect([first, readMetronome()]).toEqual([{ on: false, tempo: 82 }, { on: true, tempo: 90 }]);
  });

  // Values from an older version or another app never break the screen
  it("falls back to the default for broken or foreign values", () => {
    // What was read for each stored value
    const read = ["not json", "null", "42", JSON.stringify({ on: "yes", tempo: "fast" }), JSON.stringify({ on: true, tempo: 999 })].map((saved) => {
      // Store it
      localStorage.setItem("voicelab-metronome", saved);
      // Read it
      return readMetronome();
    });
    // Confirm the defaults, a wrong-typed choice read as off at 82, and a tempo kept in range
    expect(read).toEqual([{ on: false, tempo: 82 }, { on: false, tempo: 82 }, { on: false, tempo: 82 }, { on: false, tempo: 82 }, { on: true, tempo: 160 }]);
  });

  // Blocked storage (private browsing) reads the default and saving does not throw
  it("survives blocked storage", () => {
    // Every read and write throws
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      // As a blocked browser does
      throw new Error("blocked");
    });
    // Writes too
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      // As a blocked browser does
      throw new Error("blocked");
    });
    // Confirm the default and a quiet save
    expect([readMetronome(), (() => saveMetronome({ on: true, tempo: 100 }))()]).toEqual([{ on: false, tempo: 82 }, undefined]);
  });
});
