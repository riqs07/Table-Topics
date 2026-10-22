// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the model pitch and the shadowing steps
import { SHADOW_PITCH } from "@/content/shadowPitch";
import { SHADOW_PASSAGES, shadowSteps } from "@/content/voice";
import { VOICE_CLIPS } from "@/content/voiceClips";

// Every shadowing step
const STEPS = SHADOW_PASSAGES.flatMap((passage) => shadowSteps(passage));

// Group the checks on the model voice's pitch (decision 111)
describe("shadowing model pitch", () => {
  // Every step has its readings, no longer than its recording (run `pnpm shadow-pitch` after recording a clip again)
  it("has readings for every step, within its recording's length", () => {
    // Each step: has an entry, and fits its clip
    expect(STEPS.filter((step) => !SHADOW_PITCH[step.voiceId] || SHADOW_PITCH[step.voiceId]!.length > Math.ceil(VOICE_CLIPS[step.voiceId]!.seconds * 10) + 1).map((step) => step.voiceId)).toEqual([]);
  });

  // Most steps have enough voice to draw (a breathy or creaky clip may not, and shadowing then says so)
  it("has enough voice to draw for most steps", () => {
    // Steps with at least five voiced readings
    const drawn = STEPS.filter((step) => (SHADOW_PITCH[step.voiceId] ?? []).filter((reading) => reading !== null).length >= 5);
    // Nearly all
    expect(drawn.length).toBeGreaterThanOrEqual(STEPS.length - 3);
  });

  // Readings are speaking pitches in whole hertz
  it("holds speaking pitches", () => {
    // Every voiced reading
    const all = Object.values(SHADOW_PITCH).flat().filter((reading): reading is number => reading !== null);
    // Inside the reader's range, whole numbers
    expect(all.every((reading) => reading >= 70 && reading <= 500 && Number.isInteger(reading))).toBe(true);
  });
});
