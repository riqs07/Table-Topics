// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { lastCopyText, safetyNudge, type SafetyFacts } from "@/core/storageSafety";

// A device with enough practice, nothing saved, nothing put aside, not an iPhone
const BASE: SafetyFacts = { persisted: false, installed: false, iosSafari: false, sessionCount: 5, daysSinceExport: null, daysSinceDismissed: null };

// Group the checks about which reminder to show
describe("safetyNudge", () => {
  // Safari on an iPhone, not on the Home Screen: add it there first
  it("asks iPhone Safari users to add the app to the Home Screen first", () => {
    // Confirm: in Safari, on the Home Screen, protected anyway, and on another browser
    expect([safetyNudge({ ...BASE, iosSafari: true }), safetyNudge({ ...BASE, iosSafari: true, installed: true }), safetyNudge({ ...BASE, iosSafari: true, persisted: true }), safetyNudge(BASE)]).toEqual(["install", null, null, null]);
  });

  // A copy: first once there is plenty to lose, then every month
  it("asks for a copy once there is plenty to lose, then every 30 days", () => {
    // Confirm: 10 sessions and no copy, 29 days, 30 days
    expect([safetyNudge({ ...BASE, sessionCount: 10 }), safetyNudge({ ...BASE, daysSinceExport: 29 }), safetyNudge({ ...BASE, daysSinceExport: 30 })]).toEqual(["export", null, "export"]);
  });

  // Quiet before there is practice, and for two weeks after "Not now"
  it("stays quiet early on and after being put aside", () => {
    // Confirm: two sessions, put aside 13 days ago, 14 days ago
    expect([safetyNudge({ ...BASE, iosSafari: true, sessionCount: 2 }), safetyNudge({ ...BASE, iosSafari: true, daysSinceDismissed: 13 }), safetyNudge({ ...BASE, iosSafari: true, daysSinceDismissed: 14 })]).toEqual([null, null, "install"]);
  });
});

// Group the checks about the last-copy words
describe("lastCopyText", () => {
  // Never, today, yesterday, days ago
  it("says when the last copy was saved", () => {
    // Confirm each
    expect([lastCopyText(null), lastCopyText(0), lastCopyText(1), lastCopyText(12)]).toEqual(["No copy saved yet", "Last copy saved today", "Last copy saved yesterday", "Last copy saved 12 days ago"]);
  });
});
