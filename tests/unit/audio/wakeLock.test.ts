// @vitest-environment jsdom
// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { holdScreenAwake } from "@/audio/wakeLock";

// A stand-in wake lock that counts requests and releases
function fakeWakeLock() {
  // The counts
  const counts = { requests: 0, releases: 0 };
  // The stand-in
  const wakeLock = { request: async () => { counts.requests += 1; return { release: async () => { counts.releases += 1; } }; } };
  // Both
  return { counts, wakeLock };
}

// Group the checks about keeping the screen on (decision 76)
describe("holdScreenAwake", () => {
  // Asks once, asks again when the page comes back, and lets go at the end
  it("holds the screen on, re-asks when the page is visible again, and releases", async () => {
    // A fake lock
    const { counts, wakeLock } = fakeWakeLock();
    // Hold it
    const release = holdScreenAwake(wakeLock);
    // Let the request settle
    await Promise.resolve(); await Promise.resolve();
    // The page comes back into view
    document.dispatchEvent(new Event("visibilitychange"));
    // Let it settle
    await Promise.resolve(); await Promise.resolve();
    // Let go
    release();
    // Let the release settle
    await Promise.resolve();
    // Confirm two requests and a release
    expect([counts.requests, counts.releases]).toEqual([2, 1]);
  });

  // A browser without a wake lock is fine
  it("does nothing where the browser has no wake lock", () => {
    // Confirm it returns a harmless release
    expect(() => holdScreenAwake(undefined)()).not.toThrow();
  });
});
