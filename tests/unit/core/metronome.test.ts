// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { DEFAULT_TEMPO, MAX_TEMPO, MIN_TEMPO, beatSeconds, beatsDue, clampTempo } from "@/core/metronome";

// Group the checks about the metronome's tempo (decision 128)
describe("metronome tempo", () => {
  // The user asked for 82 beats a minute to start with
  it("starts at 82 beats a minute", () => {
    // Confirm the default
    expect(DEFAULT_TEMPO).toBe(82);
  });

  // Tempos are whole and inside the range; anything broken falls back to the default
  it("keeps a tempo whole and in range", () => {
    // In range, rounded, too slow, too fast, and not a number
    const tempos = [clampTempo(90), clampTempo(90.6), clampTempo(10), clampTempo(400), clampTempo(Number.NaN), clampTempo(Number.POSITIVE_INFINITY)];
    // Confirm each
    expect(tempos).toEqual([90, 91, MIN_TEMPO, MAX_TEMPO, DEFAULT_TEMPO, DEFAULT_TEMPO]);
  });

  // The gap between beats is a minute shared between them
  it("turns a tempo into seconds between beats", () => {
    // 60 and 120 beats a minute, and 82
    expect([beatSeconds(60), beatSeconds(120), beatSeconds(82)]).toEqual([1, 0.5, 60 / 82]);
  });
});

// Group the checks about which beats are due (decision 128)
describe("beatsDue", () => {
  // Every beat before the end of the look-ahead, and where the next starts
  it("lists the beats inside the look-ahead", () => {
    // Beats every half second from 1, looking up to 2.2
    expect(beatsDue(1, 2.2, 0.5)).toEqual({ beats: [1, 1.5, 2], next: 2.5 });
  });

  // A next beat beyond the look-ahead waits for a later check
  it("lists nothing when the next beat is still ahead", () => {
    // Next beat at 3, looking up to 2.2
    expect(beatsDue(3, 2.2, 0.5)).toEqual({ beats: [], next: 3 });
  });

  // A beat exactly at the end belongs to the next check, so it is never played twice
  it("leaves a beat exactly at the end for the next check", () => {
    // Next beat at 2, looking up to 2
    expect(beatsDue(2, 2, 0.5)).toEqual({ beats: [], next: 2 });
  });
});
