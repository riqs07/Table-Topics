// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load the line voice being checked
import { speakQuestion } from "@/audio/questionVoice";
// Load the saved recordings, for their lengths
import { VOICE_CLIPS } from "@/content/voiceClips";

// What the stand-in audio player does once asked to play
type Behaviour = "plays" | "load-fails" | "refused" | "fails-part-way";

// How the next players behave
let behaviour: Behaviour = "plays";
// The addresses players were made for
let played: string[] = [];
// What the phone's own voice said
let spoken: string[] = [];

// A stand-in for the browser's audio player
class FakeAudio {
  // Sound started
  onplaying: (() => void) | null = null;
  // Sound ended
  onended: (() => void) | null = null;
  // Loading or playing failed
  onerror: (() => void) | null = null;
  // Note the address
  constructor(url: string) {
    // Noted
    played.push(url);
  }
  // Play as the check asks
  play(): Promise<void> {
    // The phone refuses outright (no tap, or the format is not supported)
    if (behaviour === "refused") return Promise.reject(new DOMException("not allowed", "NotAllowedError"));
    // Otherwise things happen just after
    setTimeout(() => {
      // The file never loads: an error before any sound
      if (behaviour === "load-fails") return this.onerror?.();
      // Sound starts
      this.onplaying?.();
      // Then ends, or fails part-way
      if (behaviour === "fails-part-way") this.onerror?.();
      // Ends
      else this.onended?.();
    }, 0);
    // Accepted
    return Promise.resolve();
  }
}

// A stand-in for one thing for the phone's voice to say
class FakeUtterance {
  // Its language
  lang = "";
  // When it ends
  onend: (() => void) | null = null;
  // When it fails
  onerror: (() => void) | null = null;
  // The words
  constructor(readonly text: string) {}
}

// Swap in the stand-ins before each check
beforeEach(() => {
  // Start clean
  [behaviour, played, spoken] = ["plays", [], []];
  // The audio player
  vi.stubGlobal("Audio", FakeAudio);
  // The phone's voice parts
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  // The phone's voice, which notes what it said and finishes at once
  vi.stubGlobal("speechSynthesis", { cancel: () => {}, speak: (utterance: FakeUtterance) => void (spoken.push(utterance.text), setTimeout(() => utterance.onend?.(), 0)) });
});

// Put the browser back after each check
afterEach(() => vi.unstubAllGlobals());

// Group the checks about saying a line (decision 82)
describe("speakQuestion", () => {
  // A line with a saved recording plays it and hands back its length
  it("plays the saved recording and hands back its length", async () => {
    // Say an everyday question
    const seconds = await speakQuestion("How was your weekend?", "st01");
    // The recording, its length, and nothing from the phone
    expect([played, seconds, spoken]).toEqual([["/clips/st01.mp3"], VOICE_CLIPS.st01!.seconds, []]);
  });

  // A recording that cannot load, or that the phone refuses, is said by the phone instead
  it("falls back to the phone's own voice when the recording cannot play", async () => {
    // A file that never loads
    behaviour = "load-fails";
    // Said
    const missing = await speakQuestion("How was your weekend?", "st01");
    // A refusal
    behaviour = "refused";
    // Said again
    const refused = await speakQuestion("How was your weekend?", "st01");
    // Both tried the recording, then the phone said it; no recording length either time
    expect([played.length, spoken, missing, refused]).toEqual([2, ["How was your weekend?", "How was your weekend?"], null, null]);
  });

  // A recording that fails part-way is not said again from the start
  it("carries on when a recording fails part-way", async () => {
    // Sound starts, then fails
    behaviour = "fails-part-way";
    // Said
    const seconds = await speakQuestion("How was your weekend?", "st01");
    // Nothing from the phone
    expect([seconds, spoken]).toEqual([VOICE_CLIPS.st01!.seconds, []]);
  });

  // A line with no recording and nothing prepared goes straight to the phone
  it("uses the phone's own voice for a line with no recording", async () => {
    // A line the app has no recording of
    const seconds = await speakQuestion("Something new", "zz01");
    // No player, the phone said it
    expect([played, spoken, seconds]).toEqual([[], ["Something new"], null]);
  });
});
