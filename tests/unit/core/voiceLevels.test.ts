// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { levelScale, playbackGain } from "@/core/voiceLevels";
// Load the microphone settings check
import { autoGainApplied } from "@/audio/microphoneSettings";

// Group the checks about evening out an unlevelled recording (decision 81)
describe("levelScale", () => {
  // The typical speech reading is brought to 0.2, within limits
  it("brings typical speech to the reference level", () => {
    // Quiet speech, loud speech, very quiet speech (capped), and silence
    expect([levelScale([0.01, 0.04, 0.04, 0.04, 0.04]), levelScale([0.5, 0.5, 0.5]), levelScale([0.001, 0.001, 0.001]), levelScale([0, 0, 0])]).toEqual([5, 0.5, 30, 1]);
  });
});

// Group the checks about the playback boost
describe("playbackGain", () => {
  // Half the scaling factor, between no boost and six times
  it("boosts quiet recordings, never above six times", () => {
    // A levelled recording, a quiet one, a very quiet one, and a loud one
    expect([playbackGain(undefined), playbackGain(5), playbackGain(30), playbackGain(0.5)]).toEqual([1, 2.5, 6, 1]);
  });
});

// Group the checks about what the browser did with the microphone
describe("autoGainApplied", () => {
  // What the track reports, or null when it cannot say
  it("reads the levelling setting from the track", () => {
    // A stream whose track reports a setting
    const stream = (value: unknown) => ({ getAudioTracks: () => [{ getSettings: () => ({ autoGainControl: value }) }] }) as unknown as MediaStream;
    // Off, on, not reported, and no track
    expect([autoGainApplied(stream(false)), autoGainApplied(stream(true)), autoGainApplied(stream(undefined)), autoGainApplied({ getAudioTracks: () => [] } as unknown as MediaStream)]).toEqual([false, true, null, null]);
  });
});
