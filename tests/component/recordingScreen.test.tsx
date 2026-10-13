// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
// Load the screen being checked
import { RecordingScreen } from "@/components/screens/RecordingScreen";
// Load the recording contracts
import type { LiveText, RecordingProblem, RecordingServices } from "@/audio/services";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the prompt lists
import { PROMPTS, WARMUP_PROMPTS } from "@/content/prompts";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// Remove drawn screens and fake timers after each check
afterEach(() => {
  // Remove the screen
  cleanup();
  // Back to real timers
  vi.useRealTimers();
});

// Fake recording services that a check can drive by hand
function fakeServices(options: { supported?: boolean; micError?: string; finalText?: string } = {}) {
  // Callbacks the screen gave the transcriber
  let onText: (text: LiveText) => void = () => {};
  // Callback for problems
  let onProblem: (problem: RecordingProblem) => void = () => {};
  // The services the screen uses
  const services: RecordingServices = {
    // Speech support, on unless switched off
    speechSupported: () => options.supported ?? true,
    // The microphone, or a refusal
    openMicrophone: async () => {
      // Refuse the way the browser does, if asked to
      if (options.micError) throw new DOMException("refused", options.micError);
      // Otherwise hand back a stand-in stream
      return {} as MediaStream;
    },
    // A transcriber the check can drive
    createTranscriber: () => ({
      // Remember the callbacks
      start: (text, problem) => {
        // Keep the text callback
        onText = text;
        // Keep the problem callback
        onProblem = problem;
      },
      // Stopping returns the final words
      stop: async () => options.finalText ?? "Um, the best part of my week was the dog.",
    }),
    // A capture with a steady level and fixed audio
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
  // Hand back the services and ways to drive them
  return { services, say: (text: LiveText) => act(() => onText(text)), fail: (problem: RecordingProblem) => act(() => onProblem(problem)) };
}

// A clock the check controls, in milliseconds
function fakeClock(start = new Date(2026, 9, 13, 10).getTime()) {
  // Current time
  let time = start;
  // Read and move the clock
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Draw the screen with fakes and hand back what checks need
function draw(props: Partial<Parameters<typeof RecordingScreen>[0]> = {}, fakeOptions = {}) {
  // An empty repository unless given
  const repository = props.repository ?? createRepository(new MemoryStore());
  // Fake services
  const fake = fakeServices(fakeOptions);
  // A controllable clock
  const clock = fakeClock();
  // Record where the screen sends the user
  const navigate = vi.fn();
  // Draw it
  render(<RecordingScreen promptId={PROMPTS[0]!.id} mode="standard" retryOf={null} repository={repository} services={fake.services} clock={clock.now} navigate={navigate} {...props} />);
  // Hand back the pieces
  return { repository, fake, clock, navigate };
}

// Group the checks about the recording screen
describe("RecordingScreen", () => {
  // Before starting: the prompt, a plain privacy note, and the start action
  it("shows the prompt, the privacy note, and a way to start", async () => {
    // Draw the screen
    draw();
    // Confirm the prompt
    expect(await screen.findByText(PROMPTS[0]!.text)).toBeTruthy();
    // Confirm the privacy note
    expect(screen.getByText(/turned into text by your browser’s speech service/)).toBeTruthy();
    // Confirm the start action
    expect(screen.getByRole("button", { name: /Start speaking/ })).toBeTruthy();
  });

  // While recording, the words appear with fillers marked, and the meter shows
  it("shows live words with fillers marked while recording", async () => {
    // Draw the screen
    const { fake } = draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for the stop action
    await screen.findByRole("button", { name: /Stop/ });
    // The browser hears words
    await fake.say({ final: "Um, so I went", interim: "home" });
    // Confirm the filler is marked
    expect(screen.getByText("Um").className).toContain("text-filler");
    // Confirm the meter is shown
    expect(screen.getByRole("img", { name: "Microphone level" })).toBeTruthy();
  });

  // Stopping saves the session with its audio and opens its page
  it("saves the session and opens its page when stopped", async () => {
    // Draw the screen
    const { repository, clock, navigate } = draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for the stop action
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Speak for 40 seconds
    clock.advance(40_000);
    // Stop
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Read the saved session
    const [saved] = await repository.listSessions();
    // Confirm the details
    expect(saved).toMatchObject({ transcript: "Um, the best part of my week was the dog.", durationSec: 40, mode: "standard", isBaseline: true, feedbackStatus: "pending" });
    // Confirm the page it opened
    expect(navigate).toHaveBeenCalledWith(`/sessions?id=${saved!.id}`);
    // Confirm the audio was kept
    expect(await repository.getAudio(saved!.id)).toBeDefined();
  });

  // A retry shows last time's cue and saves the link to the first try
  it("shows the retry cue and links the retry to its first try", async () => {
    // A repository with a first try that has feedback
    const repository = createRepository(new MemoryStore());
    // Save the first try
    await repository.saveSession(makeSession({ id: "first", isBaseline: true, feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "Breathe, then say your first word." } }));
    // Draw the retry screen
    const { navigate } = draw({ repository, retryOf: "first" });
    // Confirm the cue is shown before starting
    expect(await screen.findByText("Breathe, then say your first word.")).toBeTruthy();
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Start speaking/ }));
    // Stop
    fireEvent.click(await screen.findByRole("button", { name: /Stop/ }));
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm the retry link was saved and it is not a baseline
    expect((await repository.listSessions()).find((session) => session.id !== "first")).toMatchObject({ retryOf: "first", isBaseline: false });
  });

  // A warm-up says 30 seconds and stops itself then
  it("stops a warm-up by itself at 30 seconds", async () => {
    // Use fake timers that still let promises run
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Draw a warm-up
    const { repository, clock, navigate } = draw({ mode: "warmup", promptId: WARMUP_PROMPTS[0]!.id });
    // Confirm the length is stated
    expect(await screen.findByText(/30 seconds/)).toBeTruthy();
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // Let 31 seconds pass
    clock.advance(31_000);
    // Let the timer tick
    await act(async () => vi.advanceTimersByTime(500));
    // Confirm it stopped and saved by itself
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm it was saved as a warm-up of at most 30 seconds
    expect((await repository.listSessions())[0]).toMatchObject({ mode: "warmup", durationSec: 30 });
  });

  // A blocked microphone is explained, with nothing saved
  it("explains a blocked microphone", async () => {
    // Draw with a refused microphone
    const { repository } = draw({}, { micError: "NotAllowedError" });
    // Try to start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Confirm the explanation
    expect(await screen.findByText(/microphone is blocked/)).toBeTruthy();
    // Confirm nothing was saved
    expect(await repository.listSessions()).toHaveLength(0);
  });

  // A browser that cannot transcribe is named, and recording is not offered
  it("explains a browser that cannot turn speech into text", async () => {
    // Draw without speech support
    draw({}, { supported: false });
    // Confirm the explanation
    expect(await screen.findByText(/cannot turn speech into text/)).toBeTruthy();
    // Confirm no start action
    expect(screen.queryByRole("button", { name: /Start speaking/ })).toBeNull();
  });

  // A problem during recording stops it with an explanation
  it("explains a problem reported during recording", async () => {
    // Draw the screen
    const { fake } = draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // The speech service drops out
    await fake.fail("speech-offline");
    // Confirm the explanation
    expect(await screen.findByText(/speech service could not be reached/)).toBeTruthy();
  });

  // Nothing heard means nothing saved, and a gentle explanation
  it("saves nothing when no words were heard", async () => {
    // Draw with an empty transcript
    const { repository, navigate } = draw({}, { finalText: "" });
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Stop
    fireEvent.click(await screen.findByRole("button", { name: /Stop/ }));
    // Confirm the explanation
    expect(await screen.findByText(/did not catch any words/)).toBeTruthy();
    // Confirm nothing was saved and the page did not change
    expect([await repository.listSessions(), navigate.mock.calls.length]).toEqual([[], 0]);
  });

  // Discarding stops without saving and goes home
  it("discards without saving", async () => {
    // Draw the screen
    const { repository, navigate } = draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Discard
    fireEvent.click(await screen.findByRole("button", { name: /discard this one/ }));
    // Confirm it went home
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/"));
    // Confirm nothing was saved
    expect(await repository.listSessions()).toHaveLength(0);
  });

  // The space bar starts and stops recording on a computer
  it("starts and stops with the space bar", async () => {
    // Draw the screen
    const { navigate } = draw();
    // Wait for the screen
    await screen.findByRole("button", { name: /Start speaking/ });
    // Press space to start
    fireEvent.keyDown(window, { key: " " });
    // Confirm recording
    await screen.findByRole("button", { name: /Stop/ });
    // Press space to stop
    fireEvent.keyDown(window, { key: " " });
    // Confirm it saved and moved on
    await waitFor(() => expect(navigate).toHaveBeenCalled());
  });
});
