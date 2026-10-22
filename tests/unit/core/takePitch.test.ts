// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { alignScriptWithServer, scriptTexts, takeAlignment, takePitch } from "@/core/takePitch";
// Load the made-up takes
import { madeSession, makeTake, ZOO_PHRASES } from "../../support/pitchTake";

// The zoo story
const take = makeTake(ZOO_PHRASES);

// Group the checks on what a take can draw (decision 111)
describe("takePitch", () => {
  // The service's words win, and are exact
  it("prefers the deeper analysis's words", () => {
    // With the service's words
    const result = takePitch(madeSession("a", take), { serverWords: take.serverWords });
    // Ready, exact
    expect(result.state === "ready" && result.pitch.precision).toBe("exact");
  });

  // Without them, the phone's word times, rough
  it("falls back to the phone's word times", () => {
    // Without the service
    const result = takePitch(madeSession("a", take));
    // Ready, rough
    expect(result.state === "ready" && result.pitch.precision).toBe("rough");
  });

  // An older take whose readings were dropped, one never recorded, one too quiet, one with no words
  it("says why nothing can be drawn", () => {
    // Each case
    const states = [
      // Dropped by the retention rule
      takePitch(madeSession("a", take, { trimmedAt: "2026-10-01T00:00:00.000Z", pitch: undefined })).state,
      // Never recorded
      takePitch(madeSession("a", take, { pitch: undefined })).state,
      // A whisper: almost no voiced readings
      takePitch(madeSession("a", take, { pitch: take.pitch.map((reading, index) => (index < 5 ? reading : null)) })).state,
      // Voice, but no words caught
      takePitch(madeSession("a", take, { transcript: "", spokenTimes: [] })).state,
    ];
    // In order
    expect(states).toEqual(["trimmed", "none", "quiet", "no-words"]);
  });

  // A reading uses the script's words, numbered as in the script, and with the service's times when it ran
  it("aligns a script's words, exactly when the service ran", () => {
    // A script of the first phrase
    const script = "So last *Saturday* I went to the zoo.";
    // Its words as shown
    expect(scriptTexts(script)).toEqual(["So", "last", "Saturday", "I", "went", "to", "the", "zoo."]);
    // With the service's words: exact, numbered by the script
    const exact = alignScriptWithServer(scriptTexts(script), take.serverWords.slice(0, 8));
    // Each word at the service's time
    expect([exact.precision, exact.words[2]!.ref, exact.words[2]!.start]).toEqual(["exact", 2, take.serverWords[2]!.s]);
    // With the read times instead: rough, numbered by the script
    const rough = takeAlignment(madeSession("a", take, { scriptTimes: take.spokenTimes.slice(0, 8) }), { script });
    // Rough, eight words
    expect([rough?.precision, rough?.words.length]).toEqual(["rough", 8]);
  });
});
