// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { detectPitch, summarizePitch, toSteps, usualPitch } from "@/core/pitch";

// The sample rate of a typical phone microphone
const RATE = 48_000;
// A slice of 2048 samples of a voice-like sound: a fundamental with two weaker overtones
function voice(hertz: number, size = 2048): Float32Array {
  // The slice
  const samples = new Float32Array(size);
  // Each sample
  for (let index = 0; index < size; index++) {
    // Time in seconds
    const time = index / RATE;
    // The tone and its overtones
    samples[index] = 0.3 * Math.sin(2 * Math.PI * hertz * time) + 0.15 * Math.sin(2 * Math.PI * 2 * hertz * time) + 0.08 * Math.sin(2 * Math.PI * 3 * hertz * time);
  }
  // Hand it back
  return samples;
}

// Group the checks about pitch detection (decision 80)
describe("detectPitch", () => {
  // Low, middle and high speaking voices come back within a hertz or two
  it("finds the pitch of low, middle and high voices", () => {
    // Three voices
    const found = [95, 180, 310].map((hertz) => detectPitch(voice(hertz), RATE) ?? 0);
    // Confirm each is close
    expect(found.map((value, index) => Math.abs(value - [95, 180, 310][index]!) < 2)).toEqual([true, true, true]);
  });

  // Silence and noise have no pitch
  it("gives no pitch for silence or noise", () => {
    // Noise from a fixed sequence, so the check is repeatable
    let seed = 7;
    // A slice of noise
    const noise = Float32Array.from({ length: 2048 }, () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.6);
    // Confirm both
    expect([detectPitch(new Float32Array(2048), RATE), detectPitch(noise, RATE)]).toEqual([null, null]);
  });
});

// Group the checks about what a run of readings shows
describe("summarizePitch", () => {
  // A statement falls at the end, a question rises, and a flat line is level
  it("reads how a take ended", () => {
    // Steady at 200, then down, up or level for the last three readings
    const take = (ending: number) => [200, null, 200, 205, 198, 202, 200, ending, ending, ending];
    // Confirm each
    expect([summarizePitch(take(165)).end, summarizePitch(take(245)).end, summarizePitch(take(201)).end]).toEqual(["fall", "rise", "level"]);
  });

  // The range is in steps, and an octave slip is ignored
  it("measures the range and ignores slips", () => {
    // From 180 to 240, with one reading at double pitch; the range runs from the 10th to the 90th percentile (190 to 230, about three steps)
    const readings = [180, 190, 200, 210, 220, 230, 240, 400];
    // Confirm the range, and that the slip is dropped
    expect([summarizePitch(readings).rangeSteps, toSteps(readings, usualPitch(readings)!).at(-1)]).toEqual([3, null]);
  });

  // No voice, nothing to say
  it("says nothing without voiced readings", () => {
    // Confirm
    expect(summarizePitch([null, null])).toEqual({ voiced: 0, rangeSteps: null, end: null });
  });
});
