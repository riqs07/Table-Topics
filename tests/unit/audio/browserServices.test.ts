// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the browser pieces being checked
import { WebSpeechTranscriber, browserRecordingServices, rmsFloatLevel, speechRecognitionSupported } from "@/audio/browserServices";


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
  // Every recognizer made, newest last, so checks can drive the current one
  static made: FakeRecognition[] = [];
  // Record each new recognizer
  constructor() { FakeRecognition.made.push(this); }
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

// The newest fake recognizer
const latest = () => FakeRecognition.made.at(-1)!;

// Put the fake in place of the browser's recognizer
function installFake() {
  // Forget recognizers from earlier checks
  FakeRecognition.made = [];
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
    expect([latest().lang, latest().continuous, latest().interimResults]).toEqual(["en-US", true, true]);
    // The browser hears some words
    latest().say(["So I went", true], [" home", false]);
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
    latest().say(["First part", true]);
    // The browser ends the run by itself
    latest().onend?.();
    // Let the restart pause pass
    vi.advanceTimersByTime(500);
    // Confirm a second run was started
    expect(FakeRecognition.made.length).toBe(2);
    // Confirm the second run is listening
    expect(latest().starts).toBe(1);
    // Second run hears words
    latest().say(["second part", true]);
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
    latest().onerror?.({ error: "not-allowed" });
    // Confirm the reason was reported
    expect(problems).toEqual(["microphone-blocked"]);
  });
});

// Group the checks about the level meter's reading
describe("rmsFloatLevel", () => {
  // Silence reads as zero
  it("reads silence as zero", () => {
    // Samples at zero are silence
    expect(rmsFloatLevel(new Float32Array(64))).toBe(0);
  });

  // A loud signal reads high, and never above one
  it("reads a loud signal near one, never above", () => {
    // Samples swinging fully between the extremes
    const loud = new Float32Array(64).map((_, index) => (index % 2 ? 1 : -1));
    // Confirm it is high and capped
    expect([rmsFloatLevel(loud) > 0.9, rmsFloatLevel(loud) <= 1]).toEqual([true, true]);
  });

  // A quiet voice still measures, where the old byte reading rounded it to almost nothing (decision 81)
  it("measures a quiet signal finely", () => {
    // A soft wave at a hundredth of full scale
    const soft = new Float32Array(256).map((_, index) => 0.01 * Math.sin((index / 256) * 2 * Math.PI * 8));
    // About 0.007, the wave's root-mean-square
    expect(Math.round(rmsFloatLevel(soft) * 1000)).toBe(7);
  });
});

// A fake of the browser's audio recorder whose stop event never arrives (seen in some browsers)
class SilentRecorder {
  // Recording until stopped
  state = "recording";
  // The file type
  mimeType = "audio/webm";
  // Handlers the app sets
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  // Starting delivers one piece of audio
  start() { this.ondataavailable?.({ data: new Blob(["voice"]) }); }
  // Stopping changes state but never fires the stop event
  stop() { this.state = "inactive"; }
}

// A fake of the browser's audio graph, with just what the level meter uses
class FakeAudioContext {
  // A waveform reader that reports silence
  createAnalyser() { return { fftSize: 0, getByteTimeDomainData: () => {} }; }
  // A microphone source that connects to anything
  createMediaStreamSource() { return { connect: () => {} }; }
  // Closing does nothing
  close() { return Promise.resolve(); }
}

// Group the checks about audio capture
describe("audio capture", () => {
  // A recorder that never says it stopped must not hang saving forever
  it("hands back the audio so far if the recorder never reports stopping", async () => {
    // Use fake timers so the wait can be skipped
    vi.useFakeTimers();
    // Put the fakes in place
    vi.stubGlobal("MediaRecorder", SilentRecorder);
    // The audio graph fake
    vi.stubGlobal("AudioContext", FakeAudioContext);
    // A stream whose tracks can be stopped
    const track = { stop: vi.fn() };
    // Start capturing
    const capture = browserRecordingServices.createCapture({ getTracks: () => [track] } as unknown as MediaStream);
    // Ask it to stop
    const stopped = capture.stop();
    // Let the safety wait run out
    await vi.advanceTimersByTimeAsync(5000);
    // Back to real timers
    vi.useRealTimers();
    // Confirm the audio so far came back and the microphone was released
    expect([(await stopped).size, track.stop.mock.calls.length]).toEqual([5, 1]);
  });
});
