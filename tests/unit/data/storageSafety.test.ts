// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load what is being checked
import { daysSinceExport, markExported, markNudgeDismissed, readSafetyFacts, requestPersistentStorage } from "@/data/storageSafety";

// A fixed "now"
const NOW = new Date(2026, 9, 18, 9);

// Start each check with nothing saved
beforeEach(() => localStorage.clear());
// Put the real browser pieces back
afterEach(() => vi.unstubAllGlobals());

// Group the checks about the browser side
describe("storageSafety", () => {
  // The day of the last copy is remembered and counted from
  it("remembers when a copy was saved", () => {
    // Nothing yet
    const before = daysSinceExport(NOW);
    // Save one
    markExported(NOW);
    // Confirm never, then today, then 3 days later
    expect([before, daysSinceExport(NOW), daysSinceExport(new Date(2026, 9, 21, 20))]).toEqual([null, 0, 3]);
  });

  // Asking for persistent storage asks only when not already promised, and copes without the feature
  it("asks the browser to keep the data, once", async () => {
    // A browser that has not promised yet and agrees when asked
    const persist = vi.fn(async () => true);
    // Stand it in
    vi.stubGlobal("navigator", { ...navigator, storage: { persisted: async () => false, persist } });
    // Ask
    const granted = await requestPersistentStorage();
    // A browser without the feature
    vi.stubGlobal("navigator", { ...navigator, storage: undefined });
    // Confirm granted, asked once, and unknown without the feature
    expect([granted, persist.mock.calls.length, await requestPersistentStorage()]).toEqual([true, 1, null]);
  });

  // The facts put together, including a reminder put aside today
  it("reads the facts the reminder needs", async () => {
    // Put a reminder aside today
    markNudgeDismissed(NOW);
    // Confirm what jsdom reports
    expect(await readSafetyFacts(4, NOW)).toEqual({ persisted: null, installed: false, iosSafari: false, sessionCount: 4, daysSinceExport: null, daysSinceDismissed: 0 });
  });
});
