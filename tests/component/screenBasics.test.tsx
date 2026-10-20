// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a hook and acting on it
import { act, cleanup, renderHook } from "@testing-library/react";
// Load the hook being checked
import { useScreenBasics } from "@/components/screens/screenBasics";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";

// Put the real clock back and remove drawn hooks after each check
afterEach(() => {
  // Remove the hook
  cleanup();
  // Real timers again
  vi.useRealTimers();
});

// Tell the page it was hidden or shown
function setVisible(visible: boolean) {
  // What the browser would say
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (visible ? "visible" : "hidden") });
  // The event the browser fires
  act(() => void document.dispatchEvent(new Event("visibilitychange")));
}

// Group the checks about the shared screen starting points (decision 86)
describe("useScreenBasics", () => {
  // Regression: an installed app left open overnight showed yesterday when it came back
  it("moves to the new day when the page comes back on a later day", () => {
    // The clock at 11 pm
    vi.useFakeTimers({ toFake: ["Date"] });
    // Tuesday night
    vi.setSystemTime(new Date(2026, 9, 13, 23));
    // Draw it with the real clock
    const { result } = renderHook(() => useScreenBasics({ repository: createRepository(new MemoryStore()) }));
    // The day at first
    const first = result.current.today?.getDate();
    // Hidden, then shown later that night
    setVisible(false);
    // Half an hour on
    vi.setSystemTime(new Date(2026, 9, 13, 23, 30));
    // Shown
    setVisible(true);
    // Still the same moment (no reload on the same day)
    const sameDay = result.current.today?.getHours();
    // Hidden overnight
    setVisible(false);
    // The next morning
    vi.setSystemTime(new Date(2026, 9, 14, 8));
    // Shown
    setVisible(true);
    // Tuesday, still Tuesday at 11 pm, then Wednesday
    expect([first, sameDay, result.current.today?.getDate()]).toEqual([13, 23, 14]);
  });

  // A fixed moment given by a check never moves
  it("keeps a given moment", () => {
    // A fixed moment
    const now = new Date(2026, 9, 13, 23);
    // Draw it
    const { result } = renderHook(() => useScreenBasics({ repository: createRepository(new MemoryStore()), now }));
    // Shown again, on a real later day
    setVisible(true);
    // Still the given moment
    expect(result.current.today).toBe(now);
  });
});
