// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the progress calculations being checked
import { baselineProgress, historyRows, retryComparison, shouldBeBaseline, trendSeries } from "@/core/progress";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Build an ISO time on a day in October 2026 at noon UTC
const oct = (day: number, hour = 12) => new Date(Date.UTC(2026, 9, day, hour)).toISOString();

// A small history: baseline, two first tries, and one retry
const SESSIONS = [
  // The first-ever session
  makeSession({ id: "s1", createdAt: oct(2), isBaseline: true, fillersPerMinute: 6, promptId: "p1" }),
  // A first try
  makeSession({ id: "s2", createdAt: oct(5), fillersPerMinute: 4.2, promptId: "p2" }),
  // A retry of s2
  makeSession({ id: "s3", createdAt: oct(5, 13), fillersPerMinute: 1.8, promptId: "p2", retryOf: "s2" }),
  // The latest first try
  makeSession({ id: "s4", createdAt: oct(8), fillersPerMinute: 3.1, promptId: "p3" }),
];

// Group the checks about comparing a retry with its first try
describe("retryComparison", () => {
  // The retry result screen needs before, after, and whether it improved
  it("gives before, after, and the direction of change", () => {
    // Compare s3 with s2
    expect(retryComparison(SESSIONS[2]!, SESSIONS[1]!)).toEqual({ before: 4.2, after: 1.8, improved: true, same: false });
  });

  // A change too small to matter is reported as the same
  it("treats a difference under 0.2 a minute as the same", () => {
    // Compare two nearly equal sessions
    const result = retryComparison(makeSession({ fillersPerMinute: 3.05 }), makeSession({ fillersPerMinute: 3.1 }));
    // Confirm it counts as the same
    expect(result.same).toBe(true);
  });
});

// Group the checks about progress since the first recording
describe("baselineProgress", () => {
  // History opens with first recording versus latest
  it("compares the first recording with the latest session", () => {
    // Work out progress
    const progress = baselineProgress(SESSIONS);
    // Confirm the numbers and date
    expect(progress).toEqual({ baselineDate: oct(2), baseline: 6, latest: 3.1, percentChange: -48 });
  });

  // With no baseline there is no progress to show
  it("returns null without a baseline", () => {
    // Confirm nothing is returned for an empty history
    expect(baselineProgress([])).toBeNull();
  });

  // With only the baseline there is nothing to compare yet
  it("returns null when the baseline is the only session", () => {
    // Confirm nothing is returned for one session
    expect(baselineProgress([SESSIONS[0]!])).toBeNull();
  });
});

// Group the checks about the trend line
describe("trendSeries", () => {
  // Retries are left out so the line compares like with like
  it("lists first tries in time order, without retries", () => {
    // Confirm the values, oldest first
    expect(trendSeries([...SESSIONS].reverse())).toEqual([6, 4.2, 3.1]);
  });
});

// Group the checks about the history list
describe("historyRows", () => {
  // Each row is a first try, with its retry beside it if there was one
  it("pairs retries with their first try, newest first", () => {
    // Build the rows
    const rows = historyRows(SESSIONS);
    // Confirm the ids, retry pairing, and order
    expect(rows.map((row) => [row.session.id, row.retry?.id ?? null])).toEqual([["s4", null], ["s2", "s3"], ["s1", null]]);
  });
});

// A warm-up session on the 10th, between full sessions
const WITH_WARMUP = [...SESSIONS, makeSession({ id: "w1", createdAt: oct(9), fillersPerMinute: 0.5, mode: "warmup", promptId: "w001" })];

// Group the checks about warm-ups and progress
describe("warm-ups and progress", () => {
  // Warm-ups never become the starting point
  it("makes the first full session the baseline, never a warm-up", () => {
    // Confirm a warm-up is not a baseline even when it is the very first session
    expect(shouldBeBaseline([], "warmup")).toBe(false);
    // Confirm the first full session is, even after warm-ups
    expect(shouldBeBaseline([makeSession({ mode: "warmup" })], "standard")).toBe(true);
    // Confirm later full sessions are not
    expect(shouldBeBaseline([makeSession({ isBaseline: true })], "standard")).toBe(false);
  });

  // Reading aloud never becomes the starting point, and reading sessions stay out of the trend (reading a text has fewer fillers by nature)
  it("keeps read-aloud sessions out of the baseline and the trend", () => {
    // Confirm the baseline rule and the trend
    expect([shouldBeBaseline([], "read"), shouldBeBaseline([], "pause"), trendSeries([...WITH_WARMUP, makeSession({ id: "r1", createdAt: oct(10), fillersPerMinute: 0.1, mode: "read", promptId: "r001" }), makeSession({ id: "d1", createdAt: oct(11), fillersPerMinute: 0.2, mode: "pause", promptId: "d001" }), makeSession({ id: "h1", createdAt: oct(11, 14), fillersPerMinute: 0.3, mode: "rehearse", promptId: "talk-1" })])]).toEqual([false, false, [6, 4.2, 3.1]]);
  });

  // The first Record Response becomes the starting point; a Table Topic never does
  it("makes the first Record Response the baseline, never a Table Topic", () => {
    // Confirm both
    expect([shouldBeBaseline([], "response"), shouldBeBaseline([], "talk")]).toEqual([true, false]);
  });

  // The trend leaves warm-ups out
  it("leaves warm-ups out of the trend", () => {
    // Confirm the values match the trend without the warm-up
    expect(trendSeries(WITH_WARMUP)).toEqual([6, 4.2, 3.1]);
  });

  // Progress compares full sessions only, even if a warm-up is the latest
  it("leaves warm-ups out of progress since the first recording", () => {
    // Add a warm-up after everything else
    const latestIsWarmup = [...SESSIONS, makeSession({ id: "w2", createdAt: oct(12), fillersPerMinute: 0.1, mode: "warmup" })];
    // Confirm the latest full session is used
    expect(baselineProgress(latestIsWarmup)?.latest).toBe(3.1);
  });

  // History still lists warm-ups, so the record is complete
  it("keeps warm-ups in the history list", () => {
    // Confirm the warm-up has its own row
    expect(historyRows(WITH_WARMUP).map((row) => row.session.id)).toContain("w1");
  });
});
