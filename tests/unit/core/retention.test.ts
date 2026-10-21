// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { DEFAULT_RECORDING_DAYS, READINGS_DAYS, audioToDrop, keptWhole, readingsToDrop, recordingDays } from "@/core/retention";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// The fake clock's "now": noon on 21 October 2026
const NOW = new Date("2026-10-21T12:00:00.000Z");
// A time a number of days (and hours) before now
const daysAgo = (days: number, hours = 0) => new Date(NOW.getTime() - (days * 24 + hours) * 3_600_000).toISOString();

// Group the checks about which takes keep their recording (decision 98)
describe("recording retention", () => {
  // The default keeps two weeks; anything older loses its audio
  it("keeps the last 14 days of recordings by default", () => {
    // A take from today, one just inside the window, one just outside, and one long ago
    const sessions = [makeSession({ id: "today", createdAt: daysAgo(0), audioKey: "a1" }), makeSession({ id: "inside", createdAt: daysAgo(13, 23), audioKey: "a2" }), makeSession({ id: "outside", createdAt: daysAgo(14, 1), audioKey: "a3" }), makeSession({ id: "old", createdAt: daysAgo(200), audioKey: "a4" })];
    // Confirm the two older ones go
    expect(audioToDrop(sessions, NOW, DEFAULT_RECORDING_DAYS).map((session) => session.id)).toEqual(["outside", "old"]);
  });

  // The rule depends on age alone: a busy fortnight keeps every take, a quiet one keeps none extra
  it("never depends on how many takes there are", () => {
    // Fifty takes this week
    const busy = Array.from({ length: 50 }, (_, index) => makeSession({ id: `b${index}`, createdAt: daysAgo(index % 7), audioKey: `k${index}` }));
    // Confirm none go
    expect(audioToDrop(busy, NOW, 14)).toEqual([]);
  });

  // Starred takes, marker takes and the very first recording keep their audio however old
  it("keeps starred, marker and first recordings whatever their age", () => {
    // Four old takes: starred, a marker, the first recording, and an ordinary one
    const sessions = [makeSession({ id: "starred", createdAt: daysAgo(400), audioKey: "a", starred: true }), makeSession({ id: "marker", createdAt: daysAgo(90), audioKey: "b", marker: true }), makeSession({ id: "first", createdAt: daysAgo(365), audioKey: "c", isBaseline: true }), makeSession({ id: "plain", createdAt: daysAgo(90), audioKey: "d" })];
    // Confirm only the ordinary one goes, and the three are kept whole
    expect([audioToDrop(sessions, NOW, 7).map((session) => session.id), sessions.map((session) => keptWhole(session))]).toEqual([["plain"], [true, true, true, false]]);
  });

  // A take whose audio is already gone is not listed again, so running twice changes nothing
  it("lists nothing twice", () => {
    // An old take with no audio left
    const gone = makeSession({ id: "gone", createdAt: daysAgo(60), audioKey: null });
    // Confirm it is not listed
    expect(audioToDrop([gone], NOW, 14)).toEqual([]);
  });

  // Only the offered choices are used; a damaged value falls back to the default, so it can never delete more
  it("reads the chosen number of days, defaulting to 14", () => {
    // The choices, a missing one, and damaged ones
    expect([recordingDays({ recordingDays: 7 }), recordingDays({ recordingDays: 30 }), recordingDays({}), recordingDays(null), recordingDays({ recordingDays: 0 }), recordingDays({ recordingDays: -3 }), recordingDays({ recordingDays: 1.5 })]).toEqual([7, 30, 14, 14, 14, 14, 14]);
  });
});

// Group the checks about which takes keep their detailed readings (decision 98)
describe("readings retention", () => {
  // Readings stay for 30 days, then go, unless the take is kept whole
  it("drops readings after 30 days for takes that are not kept whole", () => {
    // Takes with readings: recent, just inside, just outside, starred, a marker, and the first recording
    const sessions = [makeSession({ id: "recent", createdAt: daysAgo(3) }), makeSession({ id: "inside", createdAt: daysAgo(READINGS_DAYS - 1) }), makeSession({ id: "outside", createdAt: daysAgo(READINGS_DAYS, 1) }), makeSession({ id: "starred", createdAt: daysAgo(90), starred: true }), makeSession({ id: "marker", createdAt: daysAgo(90), marker: true }), makeSession({ id: "first", createdAt: daysAgo(300), isBaseline: true })];
    // Every one has readings stored
    const withReadings = new Set(sessions.map((session) => session.id));
    // Confirm only the one past 30 days goes
    expect(readingsToDrop(sessions, withReadings, NOW).map((session) => session.id)).toEqual(["outside"]);
  });

  // A take without stored readings (already dropped, or never had any) is not listed, so running again changes nothing
  it("lists only takes that still have readings", () => {
    // Two old takes, one with readings left
    const sessions = [makeSession({ id: "has", createdAt: daysAgo(60) }), makeSession({ id: "none", createdAt: daysAgo(60), trimmedAt: daysAgo(20) })];
    // Confirm only the first is listed
    expect(readingsToDrop(sessions, new Set(["has"]), NOW).map((session) => session.id)).toEqual(["has"]);
  });
});
