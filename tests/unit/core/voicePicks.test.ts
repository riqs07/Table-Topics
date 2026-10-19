// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { nextShadowPassage, nextVoiceDrill, warmupRoutine } from "@/core/voicePicks";
// Load the content
import { SHADOW_PASSAGES, VOICE_DRILLS } from "@/content/voice";

// Group the checks about which warm-up and drill come next (decision 80)
describe("voice picks", () => {
  // A routine is one move from each set, the same all day, different on most days, and "another" changes it
  it("builds a routine of one move from each set", () => {
    // Two times on one day, the next day, and another routine
    const [morning, evening, tomorrow, another] = [warmupRoutine(new Date(2026, 9, 19, 8)), warmupRoutine(new Date(2026, 9, 19, 20)), warmupRoutine(new Date(2026, 9, 20, 8)), warmupRoutine(new Date(2026, 9, 19, 8), 1)].map((routine) => routine.map((move) => move.id).join());
    // A week of routines, as names
    const week = Array.from({ length: 7 }, (_, day) => warmupRoutine(new Date(2026, 9, 19 + day)).map((move) => move.id).join());
    // Confirm the sets, that it holds all day, and that it changes
    expect([warmupRoutine(new Date(2026, 9, 19, 8)).map((move) => move.set), morning, tomorrow !== morning, another !== morning, new Set(week).size]).toEqual([["breath", "mouth", "say"], evening, true, true, 7]);
  });

  // The next drill of a kind is the one done least, first in order among those
  it("picks the drill done least", () => {
    // The volume drills
    const volume = VOICE_DRILLS.filter((drill) => drill.kind === "volume");
    // The first done twice, the second once
    const counts = new Map([[volume[0]!.id, 2], [volume[1]!.id, 1]]);
    // Confirm the third (never done), and the first with no counts
    expect([nextVoiceDrill("volume", counts).id, nextVoiceDrill("volume", new Map()).id, nextShadowPassage(new Map([[SHADOW_PASSAGES[0]!.id, 1]])).id]).toEqual([volume[2]!.id, volume[0]!.id, SHADOW_PASSAGES[1]!.id]);
  });
});
