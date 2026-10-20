// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load the line voice being checked
import { speakAudio, speakQuestion, stopQuestionVoice, unlockQuestionVoice } from "@/audio/questionVoice";
// Load the saved recordings, for their lengths
import { VOICE_CLIPS } from "@/content/voiceClips";

// What the stand-in audio player does once asked to play
type Behaviour = "plays" | "load-fails" | "refused" | "fails-part-way" | "keeps-playing";

// How the next players behave
let behaviour: Behaviour = "plays";
// The addresses played
let played: string[] = [];
// How many players were made
let made = 0;
// How many times sound was paused
let paused = 0;
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
  // The address to play
  src = "";
  // Count the players made
  constructor() {
    // Counted
    made += 1;
  }
  // Note a pause
  pause(): void {
    // Counted
    paused += 1;
  }
  // Play as the check asks
  play(): Promise<void> {
    // Note the address
    played.push(this.src);
    // The phone refuses outright (no tap, or the format is not supported)
    if (behaviour === "refused") return Promise.reject(new DOMException("not allowed", "NotAllowedError"));
    // Otherwise things happen just after
    setTimeout(() => {
      // Sound starts and carries on until replaced
      if (behaviour === "keeps-playing") return this.onplaying?.();
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
  [behaviour, played, spoken, made, paused] = ["plays", [], [], 0, 0];
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

  // One player for every line, so a phone that allowed it once allows the rest; a line still playing finishes when the next starts, or when stopped (decision 83)
  it("uses one player, and finishes a line when replaced or stopped", async () => {
    // Lines that keep playing
    behaviour = "keeps-playing";
    // The first line starts
    const first = speakQuestion("Hi! I'm Maya.", "maya-01");
    // The second starts over it
    const second = speakQuestion("Oh nice!", "maya-16");
    // The first finishes
    const firstSeconds = await first;
    // Stopped, so the second finishes too
    stopQuestionVoice();
    // Its length
    const secondSeconds = await second;
    // At most one player, both lines played, both finished as recordings, and the player paused once
    expect([made <= 1, played, firstSeconds, secondSeconds, paused, spoken]).toEqual([true, ["/clips/maya-01.mp3", "/clips/maya-16.mp3"], VOICE_CLIPS["maya-01"]!.seconds, VOICE_CLIPS["maya-16"]!.seconds, 1, []]);
  });

  // A line with no recording and nothing prepared goes straight to the phone
  it("uses the phone's own voice for a line with no recording", async () => {
    // A line the app has no recording of
    const seconds = await speakQuestion("Something new", "zz01");
    // No player, the phone said it
    expect([played, spoken, seconds]).toEqual([[], ["Something new"], null]);
  });
});

// Group the checks about written lines (decision 84)
describe("speakAudio", () => {
  // Stand-in addresses for audio, which the test browser lacks
  const addresses = { made: 0, freed: 0 };
  // Swap them in
  beforeEach(() => {
    // Counted
    [addresses.made, addresses.freed] = [0, 0];
    // Make one
    Object.assign(URL, { createObjectURL: () => `blob:line-${(addresses.made += 1)}`, revokeObjectURL: () => void (addresses.freed += 1) });
  });

  // The line's audio plays on the shared player, then its address is let go; without audio, or if it will not play, the phone says it
  it("plays the audio, or has the phone say the line", async () => {
    // With audio
    await speakAudio(new Blob([new Uint8Array([1])], { type: "audio/mpeg" }), "Hi there.");
    // Without audio
    await speakAudio(null, "No audio here.");
    // Audio the phone refuses
    behaviour = "refused";
    // Said by the phone instead
    await speakAudio(new Blob([new Uint8Array([1])], { type: "audio/mpeg" }), "Refused line.");
    // Two played, both let go, and the phone said the other two
    expect([played, addresses.freed, spoken]).toEqual([["blob:line-1", "blob:line-2"], 2, ["No audio here.", "Refused line."]]);
  });

  // Unlocking plays a moment of silence on the shared player, so a line that arrives later may play without a tap
  it("unlocks the shared player with silence", () => {
    // Inside a tap
    unlockQuestionVoice();
    // The silence was played
    expect(played.map((url) => url.slice(0, 22))).toEqual(["data:audio/wav;base64,"]);
  });
});
