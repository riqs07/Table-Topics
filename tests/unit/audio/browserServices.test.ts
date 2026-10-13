// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the browser pieces being checked
import { WebSpeechTranscriber, rmsLevel, speechRecognitionSupported } from "@/audio/browserServices";

// The most recently created fake recognizer, so checks can drive it
let latest: FakeRecognition;

// A fake of the browser's speech recognizer, with just what the app uses
class FakeRecognition {
  // Settings the app sets
  lang = ""; continuous = false; interimResults = false;
  // Handlers the app sets
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  // How many times start was called
  starts = 0;
  // Remember the newest recognizer
  constructor() { latest = this; }
  // Starting just counts
  start() { this.starts += 1; }
  // Stopping ends the run, as the browser does
  stop() { this.onend?.(); }
  // Send results the way the browser does: a list of [alternatives] with an isFinal flag
  say(...items: Array<[string, boolean]>) {
    // Build the browser's result shape
    const results = items.map(([transcript, isFinal]) => Object.assign([{ transcript }], { isFinal }));
    // Deliver it
    this.onresult?.({ results });
  }
}

// Put the fake in place of the browser's recognizer
function installFake() {
  // The app looks for either name; Safari and Chrome use the webkit one
  vi.stubGlobal("webkitSpeechRecognition", FakeRecognition);
}

// Remove fakes after each check
afterEach(() => vi.unstubAllGlobals());

// Group the checks about live transcription
describe("WebSpeechTranscriber", () => {
  // Without a recognizer, the app knows to explain
  it("reports when the browser cannot transcribe", () => {
    // Confirm unsupported with nothing installed
    expect(speechRecognitionSupported()).toBe(false);
    // Install the fake
    installFake();
    // Confirm supported now
    expect(speechRecognitionSupported()).toBe(true);
  });

  // Words come through as they are heard, in English, continuously
  it("passes live words through and listens continuously", () => {
    // Install the fake
    installFake();
    // Collect what is shown
    const shown: Array<{ final: string; interim: string }> = [];
    // Start transcribing
    new WebSpeechTranscriber().start((text) => shown.push(text), () => {});
    // Confirm the settings
    expect([latest.lang, latest.continuous, latest.interimResults]).toEqual(["en-US", true, true]);
    // The browser hears some words
    latest.say(["So I went", true], [" home", false]);
    // Confirm they were passed on
    expect(shown.at(-1)).toEqual({ final: "So I went", interim: "home" });
  });

  // The browser stops listening by itself after a pause; the transcriber carries on
  it("restarts when the browser stops by itself, keeping earlier words", async () => {
    // Install the fake
    installFake();
    // Use fake timers for the short restart pause
    vi.useFakeTimers();
    // Start transcribing
    const transcriber = new WebSpeechTranscriber();
    // Begin
    transcriber.start(() => {}, () => {});
    // First run hears words
    latest.say(["First part", true]);
    // The browser ends the run by itself
    latest.onend?.();
    // Let the restart pause pass
    vi.advanceTimersByTime(500);
    // Confirm it started again
    expect(latest.starts).toBe(2);
    // Second run hears words
    latest.say(["second part", true]);
    // Back to real timers for stopping
    vi.useRealTimers();
    // Confirm stopping gives both parts
    expect(await transcriber.stop()).toBe("First part second part");
  });

  // Blocked microphones and similar problems stop the session with a reason
  it("reports a blocking problem instead of restarting forever", () => {
    // Install the fake
    installFake();
    // Collect reported problems
    const problems: string[] = [];
    // Start transcribing
    new WebSpeechTranscriber().start(() => {}, (reason) => problems.push(reason));
    // The browser refuses the microphone
    latest.onerror?.({ error: "not-allowed" });
    // Confirm the reason was reported
    expect(problems).toEqual(["microphone-blocked"]);
  });
});

// Group the checks about the level meter's reading
describe("rmsLevel", () => {
  // Silence reads as zero
  it("reads silence as zero", () => {
    // Samples at the midpoint (128) are silence
    expect(rmsLevel(new Uint8Array(64).fill(128))).toBe(0);
  });

  // A loud signal reads high, and never above one
  it("reads a loud signal near one, never above", () => {
    // Samples swinging fully between the extremes
    const loud = new Uint8Array(64).map((_, index) => (index % 2 ? 255 : 0));
    // Confirm it is high and capped
    expect(rmsLevel(loud)).toBeGreaterThan(0.9);
    // Confirm the cap
    expect(rmsLevel(loud)).toBeLessThanOrEqual(1);
  });
});
