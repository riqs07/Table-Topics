// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the server renderer and the browser hydrator, to check the first drawing matches
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
// Load the screen being checked
import { RecordingScreen } from "@/components/screens/RecordingScreen";
// Load the recording contracts
import type { LiveText, MicPermission, RecordingProblem, RecordingServices } from "@/audio/services";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the prompt lists
import { PASSAGES, PAUSE_DRILLS, PROMPTS, TABLE_TOPICS, WARMUP_PROMPTS } from "@/content/prompts";
// Load the lessons
import { findLesson } from "@/content/lessons";
// Load a sample session builder
import { makeSession, makeTalk } from "../support/fixtures";
// Load today's practice, to put a step off
import { loadDailyPlan } from "@/data/dailyPlan";
import { planHref } from "@/core/dailyPlan";

// Remove drawn screens and fake timers after each check
afterEach(() => {
  // Remove the screen
  cleanup();
  // Back to real timers
  vi.useRealTimers();
});

// Fake recording services that a check can drive by hand
function fakeServices(options: { supported?: boolean; micError?: string; finalText?: string | string[]; permission?: MicPermission; voice?: boolean } = {}) {
  // What the voice was asked to say
  const said: string[] = [];
  // How many times the microphone was asked for
  let micAsks = 0;
  // Callbacks the screen gave the transcriber
  let onText: (text: LiveText) => void = () => {};
  // Callback for problems
  let onProblem: (problem: RecordingProblem) => void = () => {};
  // The microphone's one track, which a check can end
  const track = new EventTarget();
  // The final words each listener gives in turn (one listener per part, when a take is paused); the last repeats
  const finals = Array.isArray(options.finalText) ? [...options.finalText] : [options.finalText ?? "Um, the best part of my week was the dog."];
  // The services the screen uses
  const services: RecordingServices = {
    // Speech support, on unless switched off
    speechSupported: () => options.supported ?? true,
    // The microphone, or a refusal
    openMicrophone: async () => {
      // Count the ask
      micAsks += 1;
      // Refuse the way the browser does, if asked to
      if (options.micError) throw new DOMException("refused", options.micError);
      // Otherwise hand back a stand-in stream with one audio track
      return { getTracks: () => [], getAudioTracks: () => [track] } as unknown as MediaStream;
    },
    // A voice that notes what it said, only when the check asks for one
    ...(options.voice ? { speak: async (text: string) => void said.push(text) } : {}),
    // The permission check, only when the check gives one (like a browser that can say)
    ...(options.permission ? { micPermission: async () => options.permission ?? "unknown" } : {}),
    // A transcriber the check can drive
    createTranscriber: () => ({
      // Remember the callbacks
      start: (text, problem) => {
        // Keep the text callback
        onText = text;
        // Keep the problem callback
        onProblem = problem;
      },
      // Stopping returns the next final words
      stop: async () => (finals.length > 1 ? finals.shift() : finals[0]) ?? "",
    }),
    // A capture with a steady level and fixed audio
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
  // Hand back the services and ways to drive them
  return { services, say: (text: LiveText) => act(() => onText(text)), fail: (problem: RecordingProblem) => act(() => onProblem(problem)), micAsks: () => micAsks, said, endMic: () => act(() => void track.dispatchEvent(new Event("ended"))) };
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
  // Before starting: the prompt and the start action, with no notes around them (the privacy line lives on the microphone screen and in Settings, decision 63)
  it("shows the prompt and a way to start, without extra notes", async () => {
    // Draw the screen
    draw();
    // Confirm the prompt
    expect(await screen.findByText(PROMPTS[0]!.text)).toBeTruthy();
    // Confirm no privacy footnote or how-this-works note
    expect([screen.queryByText(/turned into text/), screen.queryByRole("note", { name: "How this works" })]).toEqual([null, null]);
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

  // The loudness readings taken for the meter are saved with the session, for finding pauses
  it("saves the loudness readings with the session", async () => {
    // Use fake timers that still let promises run
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Draw the screen
    const { repository, clock, navigate } = draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Let 20 seconds pass in ticks
    for (let tick = 0; tick < 20; tick++) {
      // Move the clock a second
      clock.advance(1_000);
      // Let the timer run
      await act(async () => vi.advanceTimersByTime(100));
    }
    // Stop
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm readings were saved (the fake capture reads 0.5)
    const [saved] = await repository.listSessions();
    // At least one reading per tick
    expect([(saved!.loudness?.length ?? 0) >= 20, saved!.loudness?.[0]]).toEqual([true, 0.5]);
  });

  // Every recording asks for the microphone without the browser's levelling, and saves pitch with the loudness (decision 81)
  it("asks for the microphone without levelling and saves the pitch", async () => {
    // The options the microphone was asked with
    const asked: unknown[] = [];
    // Fake services with a capture that reads a pitch, and a microphone that notes how it was asked
    const fake = fakeServices();
    // The services
    const services: RecordingServices = { ...fake.services, openMicrophone: async (options) => { asked.push(options); return fake.services.openMicrophone(options); }, createCapture: () => ({ level: () => 0.5, pitch: () => 182.4, stop: async () => new Blob(["voice"]) }) };
    // Use fake timers that still let promises run
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Draw the screen with them
    const { repository, clock, navigate } = draw({ services });
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Ten seconds in ticks
    for (let tick = 0; tick < 10; tick++) {
      // Move the clock a second
      clock.advance(1_000);
      // Let the timer run
      await act(async () => vi.advanceTimersByTime(100));
    }
    // Stop
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved session
    const [saved] = await repository.listSessions();
    // Asked without levelling; pitch kept in whole hertz, one per loudness reading; the fake stream cannot say what the browser did
    expect([asked[0], saved!.pitch?.[0], saved!.pitch?.length === saved!.loudness?.length, saved!.autoGain]).toEqual([{ autoGain: false }, 182, true, undefined]);
  });

  // A retry shows last time's cue and saves the link to the first try
  it("shows the retry cue and links the retry to its first try", async () => {
    // A repository with a first try that has feedback
    const repository = createRepository(new MemoryStore());
    // Save the first try
    await repository.saveSession(makeSession({ id: "first", isBaseline: true, feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "Breathe, then say your first word." } }));
    // Draw the retry screen
    const { navigate, clock } = draw({ repository, retryOf: "first" });
    // Confirm the cue is shown before starting
    expect(await screen.findByText("Breathe, then say your first word.")).toBeTruthy();
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Speak for 20 seconds
    clock.advance(20_000);
    // Stop
    fireEvent.click(stop);
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
    expect(await screen.findByText("aim for 30 seconds")).toBeTruthy();
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

  // Start a Table Topic: the briefing, then the topic with its 10-second countdown, then recording by itself
  async function startTableTopic(clock: { advance: (ms: number) => void }) {
    // Show the topic
    fireEvent.click(await screen.findByRole("button", { name: /Show my topic/ }));
    // Let the countdown run out
    clock.advance(11_000);
    // Let the timer tick
    await act(async () => vi.advanceTimersByTime(500));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
  }

  // A Table Topic briefs first and keeps the question hidden until it starts
  it("briefs the user before a Table Topic without showing the question", async () => {
    // Draw a Table Topic
    draw({ mode: "talk", promptId: TABLE_TOPICS[0]!.id });
    // Confirm the briefing
    expect(await screen.findByText(/Your topic is hidden/)).toBeTruthy();
    // Confirm the question is hidden
    expect(screen.queryByText(TABLE_TOPICS[0]!.text)).toBeNull();
  });

  // Showing the topic starts a 10-second countdown with no early start, then recording begins by itself
  it("counts down 10 seconds after showing the topic, then starts recording", async () => {
    // Use fake timers that still let promises run
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Draw a Table Topic
    const { clock } = draw({ mode: "talk", promptId: TABLE_TOPICS[0]!.id });
    // Show the topic
    fireEvent.click(await screen.findByRole("button", { name: /Show my topic/ }));
    // Confirm the question and the one countdown (no second clock), and that there is no early start
    expect([!!(await screen.findByText(TABLE_TOPICS[0]!.text)), !!screen.getByText("starting in 10"), screen.queryByText("0:10"), screen.queryByRole("button", { name: /Ready/ })]).toEqual([true, true, null, null]);
    // Let 11 seconds pass
    clock.advance(11_000);
    // Let the timer tick
    await act(async () => vi.advanceTimersByTime(500));
    // Confirm recording began by itself
    expect(await screen.findByRole("button", { name: /Stop/ })).toBeTruthy();
  });

  // The Toastmasters lights: green at 1:00, yellow at 1:30, red at 2:00, and over time past 2:30
  it("shows the timing light during a Table Topic", async () => {
    // Use fake timers that still let promises run
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Draw a Table Topic
    const { clock } = draw({ mode: "talk", promptId: TABLE_TOPICS[0]!.id });
    // Get to recording
    await startTableTopic(clock);
    // Read the light's state
    const light = () => screen.getByRole("status", { name: "Timing light" }).getAttribute("data-signal");
    // Confirm it starts off
    expect(light()).toBe("none");
    // The light and its words after moving the clock forward
    const after = async (ms: number) => {
      // Move the clock
      clock.advance(ms);
      // Let the timer tick
      await act(async () => vi.advanceTimersByTime(200));
      // Read both
      return [light(), screen.getByRole("status", { name: "Timing light" }).textContent];
    };
    // Confirm each light with words for screen readers: 1:05, 1:35, 2:05, 2:35
    expect([await after(65_000), await after(30_000), await after(30_000), await after(30_000)]).toEqual([
      // Green
      ["green", "Green: the minimum is met"],
      // Yellow
      ["yellow", "Yellow: start wrapping up"],
      // Red
      ["red", "Red: finish now"],
      // Over time
      ["overtime", "Over 2:30: past the limit"],
    ]);
  });

  // A Record Response shows the prompt, then two minutes to think with hints
  it("gives two minutes to think with hints before a Record Response", async () => {
    // Draw a Record Response
    draw({ mode: "response" });
    // Confirm the prompt is shown up front with the thinking time
    expect([!!(await screen.findByText(PROMPTS[0]!.text)), !!screen.getByRole("button", { name: /Start thinking.*2 minutes to prepare/ })]).toEqual([true, true]);
    // Begin thinking
    fireEvent.click(screen.getByRole("button", { name: /Start thinking/ }));
    // Confirm the countdown, the structure, and this prompt's angles
    expect([!!(await screen.findByText("2:00")), !!screen.getByText("Point again"), ...PROMPTS[0]!.angles!.map((angle) => !!screen.getByText(angle))]).toEqual([true, true, ...PROMPTS[0]!.angles!.map(() => true)]);
  });

  // Thinking can end early, and the hints stay in view while speaking
  it("starts a Record Response early and keeps the hints in view", async () => {
    // Draw a Record Response
    draw({ mode: "response" });
    // Begin thinking
    fireEvent.click(await screen.findByRole("button", { name: /Start thinking/ }));
    // Say ready
    fireEvent.click(await screen.findByRole("button", { name: /Ready/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // Confirm the angles are still visible
    expect(screen.getByText(PROMPTS[0]!.angles![0]!)).toBeTruthy();
  });

  // The prepared speech light: green at 2:00, yellow at 3:00, red at 4:00
  it("shows the timing light during a Record Response", async () => {
    // Use fake timers that still let promises run
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Draw a Record Response
    const { clock } = draw({ mode: "response" });
    // Begin thinking, then start early
    fireEvent.click(await screen.findByRole("button", { name: /Start thinking/ }));
    // Say ready
    fireEvent.click(await screen.findByRole("button", { name: /Ready/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // Read the light
    const light = () => [screen.getByRole("status", { name: "Timing light" }).getAttribute("data-signal"), screen.getByRole("status", { name: "Timing light" }).textContent];
    // The light after moving the clock forward
    const after = async (ms: number) => {
      // Move the clock
      clock.advance(ms);
      // Let the timer tick
      await act(async () => vi.advanceTimersByTime(200));
      // Read it
      return light();
    };
    // Confirm 2:20, 3:05 and 4:10
    expect([await after(140_000), await after(45_000), await after(65_000)]).toEqual([["green", "Green: the minimum is met"], ["yellow", "Yellow: start wrapping up"], ["red", "Red: finish now"]]);
  });

  // Reading aloud shows the passage with its source, and keeps it in view while recording
  it("shows the passage to read before and during recording", async () => {
    // Draw a read-aloud session on the first passage
    draw({ mode: "read", promptId: PASSAGES[0]!.id });
    // Confirm the title, the source, and the start action
    expect([!!(await screen.findByText(PASSAGES[0]!.title)), !!screen.getByText(PASSAGES[0]!.source), !!screen.getByRole("button", { name: /Start reading/ })]).toEqual([true, true, true]);
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Start reading/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // Confirm the passage text is still on screen
    expect(screen.getByTestId("passage").textContent).toContain(PASSAGES[0]!.body.split(" ").slice(0, 4).join(" "));
  });

  // While reading, the words already read light up and the next word is marked
  it("lights up the words as they are read", async () => {
    // Draw a read-aloud session on the Gettysburg Address
    const { fake } = draw({ mode: "read", promptId: PASSAGES[0]!.id });
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start reading/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // Read the first three words
    await fake.say({ final: "Four score", interim: "and" });
    // The words in the passage, in order
    const marks = Array.from(screen.getByTestId("passage").querySelectorAll("[data-read]")).slice(0, 5).map((word) => word.getAttribute("data-read"));
    // Confirm three read, the fourth is next, the fifth is ahead
    expect(marks).toEqual(["read", "read", "read", "current", "ahead"]);
  });

  // While the reader is speaking but recognition has matched nothing, the text still moves on at a reading pace (so it scrolls without hands); recognised words take over when they arrive
  it("keeps the text moving at a reading pace when recognition lags", async () => {
    // Draw a read-aloud session (the fake microphone hears steady speech)
    const { fake } = draw({ mode: "read", promptId: PASSAGES[0]!.id });
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start reading/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // The passage
    const passage = screen.getByTestId("passage");
    // About a second of speaking with nothing recognised moves the guide on by a word or two, while no word is lit as read
    await waitFor(() => expect(Number(passage.getAttribute("data-guide"))).toBeGreaterThanOrEqual(2), { timeout: 3000 });
    // Nothing marked read yet
    const readBefore = passage.querySelectorAll('[data-read="read"]').length;
    // Recognition catches up well past the guide
    await fake.say({ final: "Four score and seven years ago our fathers brought forth", interim: "" });
    // Confirm no words were lit by the pace alone, and the guide is at least the recognised place
    expect([readBefore, Number(passage.getAttribute("data-guide")) >= 10]).toEqual([0, true]);
  });

  // The times words were first heard are saved with the session
  it("saves when each word was first heard", async () => {
    // Draw a read-aloud session on the Gettysburg Address
    const { fake, clock, repository, navigate } = draw({ mode: "read", promptId: PASSAGES[0]!.id }, { finalText: "Four score and seven" });
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start reading/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Two words after two seconds
    clock.advance(2_000);
    // Heard
    await fake.say({ final: "Four score", interim: "" });
    // Two more after twelve
    clock.advance(10_000);
    // Heard
    await fake.say({ final: "Four score and seven", interim: "" });
    // Stop
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved session
    const [saved] = await repository.listSessions();
    // Confirm the spoken times and the first script words' times
    expect([saved!.spokenTimes, saved!.scriptTimes?.slice(0, 5)]).toEqual([[2, 2, 12, 12], [2, 2, 12, 12, null]]);
  });

  // A reading counts only fillers added to the text, so "so" in the Gettysburg Address is not one
  it("does not count words of the text as fillers", async () => {
    // A reading whose transcript is the text itself, "so" included
    const { clock, repository, navigate } = draw({ mode: "read", promptId: PASSAGES[0]!.id }, { finalText: "so conceived and so dedicated can long endure" });
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start reading/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Read for twelve seconds
    clock.advance(12_000);
    // Stop
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm no fillers were counted
    expect((await repository.listSessions())[0]?.fillersPerMinute).toBe(0);
  });

  // On a retry, your own note comes first, with the coach's cue under it
  it("shows your own note before the coach's cue on a retry", async () => {
    // A repository with a first try that has notes and feedback
    const repository = createRepository(new MemoryStore());
    // The first try
    await repository.saveSession(makeSession({ id: "first", promptId: PROMPTS[0]!.id, selfReview: { worked: "", change: "Start without the um", tags: [], skipped: false, savedAt: "2026-10-16T10:00:00.000Z" }, feedback: { keep: "k", change: "c", retryCue: "Breathe, then begin." }, feedbackStatus: "done" }));
    // Draw the retry
    draw({ retryOf: "first", repository });
    // Confirm both, yours first
    expect([!!(await screen.findByText("Start without the um")), !!screen.getByText("Coach: Breathe, then begin.")]).toEqual([true, true]);
  });

  // Without the coach's feedback, the retry carries the cue picked from the first try's numbers, labelled as such
  it("falls back to the cue from the numbers on a retry", async () => {
    // A repository with a fast first try that has a note but no feedback
    const repository = createRepository(new MemoryStore());
    // The first try
    await repository.saveSession(makeSession({ id: "first", promptId: PROMPTS[0]!.id, fillersPerMinute: 1, wordsPerMinute: 190, selfReview: { worked: "", change: "Start without the um", tags: [], skipped: false, savedAt: "2026-10-16T10:00:00.000Z" }, feedback: null, feedbackStatus: "pending" }));
    // Draw the retry
    draw({ retryOf: "first", repository });
    // Confirm both, yours first
    expect([!!(await screen.findByText("Start without the um")), !!screen.getByText("From your numbers: Take a breath at every full stop.")]).toEqual([true, true]);
  });

  // A small-talk lesson teaches before you answer: the idea, a flat answer beside a better one, the question, and the recipe with its beat marked
  it("teaches a small-talk lesson before the question", async () => {
    // Draw lesson 3, "Give a hook"
    draw({ mode: "smalltalk", promptId: "stl3" });
    // The lesson
    const lesson = await screen.findByRole("region", { name: "The lesson" });
    // Confirm the title, the flat and better answers, the question, and the hook marked on the strip
    expect([within(lesson).getByRole("heading").textContent, !!within(lesson).getByText(/I watched a movie/), !!within(lesson).getByText(/I finally watched Dune/), screen.getByRole("heading", { level: 1 }).textContent, within(screen.getByRole("list", { name: "The recipe" })).getAllByRole("listitem")[1]?.className.includes("border-accent")]).toEqual(["Lesson 3: Give a hook", true, true, "Seen anything good lately?", true]);
  });

  // The question is said aloud first, then recording starts by itself, and the answer is saved as small talk
  it("says the question aloud, then records the answer", async () => {
    // Draw an everyday question with a voice
    const { fake, clock, repository } = draw({ mode: "smalltalk", promptId: "st01" }, { voice: true, finalText: "I built an app it was fun did you do anything good" });
    // Hear the question
    fireEvent.click(await screen.findByRole("button", { name: /Hear the question/ }));
    // Recording starts once it has been said
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Confirm the voice said the question, and the timing light shows the small-talk window
    expect([fake.said, screen.getByText("aim for 0:20 to 0:45")?.tagName]).toEqual([["How was your weekend?"], "P"]);
    // Speak past the minimum
    clock.advance(25_000);
    // Stop
    fireEvent.click(stop);
    // Confirm it was saved as small talk, for this question
    await waitFor(async () => expect((await repository.listSessions()).map((session) => [session.mode, session.promptId])).toEqual([["smalltalk", "st01"]]));
  });

  // Asking: what they say is shown, said aloud, and a follow-up of a few seconds is kept
  it("says a remark aloud and keeps a short follow-up question", async () => {
    // Draw "We got a kitten last week." with a voice
    const { fake, clock, repository } = draw({ mode: "smalltalk", promptId: "sa08" }, { voice: true, finalText: "what is the kitten called" });
    // Confirm who is speaking, the remark, and the asking recipe
    expect([!!(await screen.findByText("They say")), screen.getByRole("heading", { level: 1 }).textContent, within(screen.getByRole("list", { name: "The recipe" })).getAllByRole("listitem")[0]?.textContent]).toEqual([true, "We got a kitten last week.", "1. OpenStart with what, how or why."]);
    // Hear it
    fireEvent.click(screen.getByRole("button", { name: /Hear it/ }));
    // Recording starts once it has been said
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Ask for three seconds, under the usual ten-second minimum
    clock.advance(3_000);
    // Stop
    fireEvent.click(stop);
    // Confirm the voice said it, and the follow-up was kept with no listen-back step waiting
    await waitFor(async () => expect([fake.said, (await repository.listSessions()).map((session) => [session.promptId, session.selfReview])]).toEqual([["We got a kitten last week."], [["sa08", undefined]]]));
  });

  // Listening: the story is said aloud but not shown, so you listen the way you would in person
  it("keeps a story hidden and says it aloud", async () => {
    // Draw the train story with a voice
    const { fake } = draw({ mode: "smalltalk", promptId: "sls01" }, { voice: true, finalText: "no way" });
    // Confirm the heading, and that the story's words are not on screen
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, screen.queryByText(/fell asleep on my shoulder/)]).toEqual(["Listen to their story.", null]);
    // Hear it
    fireEvent.click(screen.getByRole("button", { name: /Hear the story/ }));
    // Recording starts once it has been said
    await screen.findByRole("button", { name: /Stop/ });
    // Confirm the voice told the story
    expect(fake.said[0]).toContain("fell asleep on my shoulder");
  });

  // A moment note is private: saved without feedback or a listening step, then back to the Small talk page
  it("saves a moment privately and goes back to Small talk", async () => {
    // Draw a moment note
    const { clock, repository, navigate } = draw({ mode: "moment", promptId: "moment" });
    // Confirm the question
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("What's one thing from today worth telling?");
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Start speaking/ }));
    // Recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Speak past the minimum
    clock.advance(15_000);
    // Stop
    fireEvent.click(stop);
    // Wait for the way back
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/small-talk/unit?id=answering#moments"));
    // The saved note
    const [saved] = await repository.listSessions();
    // Confirm it needs no feedback and no listening step
    expect([saved?.mode, saved?.feedbackStatus, saved?.selfReview]).toEqual(["moment", "done", undefined]);
  });

  // Asked what you have been up to, your moments from this week are there as material (and not for other questions)
  it("shows this week's moments beside a question about what you have been up to", async () => {
    // A repository with a moment from two days ago
    const repository = createRepository(new MemoryStore());
    // The moment
    await repository.saveSession(makeSession({ id: "m1", mode: "moment", promptId: "moment", transcript: "I fixed the bike chain myself", createdAt: new Date(2026, 9, 11, 9).toISOString(), feedbackStatus: "done" }));
    // Draw "How was your weekend?"
    draw({ mode: "smalltalk", promptId: "st01", repository });
    // Confirm the moment is shown
    expect(within(await screen.findByRole("region", { name: "Your moments this week" })).getByText("I fixed the bike chain myself")).toBeTruthy();
    // Draw "How's work going?" instead
    cleanup();
    // The work question
    draw({ mode: "smalltalk", promptId: "st10", repository });
    // Give the load time to finish
    await screen.findByRole("list", { name: "The recipe" });
    // Confirm no moments
    expect(screen.queryByRole("region", { name: "Your moments this week" })).toBeNull();
  });

  // Inside today's practice, the saved session opens with the plan step, and the page says which step it is
  it("keeps today's practice step through to the saved session", async () => {
    // Draw step 1 of the plan
    const { clock, navigate } = draw({ planStep: 1 });
    // The step line
    const line = await screen.findByText(/^Today’s practice · step 1/);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Speak past the minimum
    clock.advance(12_000);
    // Stop
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm the line and the plan marker on the next page
    expect([!!line, /^\/sessions\?id=.+&plan=1$/.test(String(navigate.mock.calls[0]?.[0]))]).toEqual([true, true]);
  });

  // "Can't speak now?" puts a speaking step off for today, without counting it as done, and moves on to the first open step (decision 77)
  it("puts a step off for today and moves on", async () => {
    // A repository past day one (a session yesterday), so the plan is the card, the warm-up and two picks
    const repository = createRepository(new MemoryStore());
    // Yesterday's session
    await repository.saveSession(makeSession({ id: "yesterday", createdAt: new Date(2026, 9, 12, 9).toISOString() }));
    // The plan on the fake clock's day
    const plan = await loadDailyPlan(repository, new Date(2026, 9, 13, 10));
    // The warm-up: step 2
    const warmUp = plan.steps[1]!;
    // Draw that step
    const { navigate } = draw({ repository, planStep: 2, mode: warmUp.mode!, promptId: warmUp.promptId });
    // Put it off
    fireEvent.click(await screen.findByRole("button", { name: /Can’t speak now/ }));
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The plan afterwards
    const after = await loadDailyPlan(repository, new Date(2026, 9, 13, 10));
    // Confirm it went to the first open step (the card, which needs no speaking), and the warm-up is put off but not done
    expect([navigate.mock.calls[0]?.[0], after.skipped, after.done[1]]).toEqual([planHref(plan.steps[0]!, 1), [false, true, false, false], false]);
  });

  // The reading step offers a one-minute warm-up first, which comes back to it (decision 80)
  it("offers a warm-up before the reading step", async () => {
    // A repository past day one, so step 2 is the reading
    const repository = createRepository(new MemoryStore());
    // Yesterday's session
    await repository.saveSession(makeSession({ id: "yesterday", createdAt: new Date(2026, 9, 12, 9).toISOString() }));
    // The plan on the fake clock's day
    const plan = await loadDailyPlan(repository, new Date(2026, 9, 13, 10));
    // The reading: step 2
    const reading = plan.steps[1]!;
    // Draw that step
    draw({ repository, planStep: 2, mode: reading.mode!, promptId: reading.promptId });
    // Confirm the link leads to the warm-up and back
    expect((await screen.findByRole("link", { name: "Warm up first" })).getAttribute("href")).toBe(`/voice/warmup?then=${encodeURIComponent(planHref(reading, 2))}`);
  });

  // Outside today's practice, or once speaking, there is nothing to put off
  it("offers no skip outside today's practice", async () => {
    // Draw a plain session
    draw();
    // Wait for the screen
    await screen.findByRole("button", { name: /Start speaking/ });
    // Confirm no skip
    expect(screen.queryByRole("button", { name: /Can’t speak now/ })).toBeNull();
  });

  // With timing tones switched on, the light's changes are heard: one tone at green, two at red (decision 77)
  it("plays timing tones when switched on", async () => {
    // Use fake timers that still let promises run
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Tones on
    localStorage.setItem("voicelab-timing-tones", "on");
    // The cues played
    const played: string[] = [];
    // Services with a cue player that notes each cue
    const services = { ...fakeServices().services, createCuePlayer: () => ({ prime: () => {}, play: (cue: string) => void played.push(cue), close: () => {} }) };
    // Draw a Table Topic
    const { clock } = draw({ mode: "talk", promptId: TABLE_TOPICS[0]!.id, services });
    // Get to recording
    await startTableTopic(clock);
    // Move past green, then past red
    for (const ms of [61_000, 60_000]) {
      // Move the clock
      clock.advance(ms);
      // Let the timer tick
      await act(async () => vi.advanceTimersByTime(200));
    }
    // Switch tones off again for other checks
    localStorage.removeItem("voicelab-timing-tones");
    // Confirm one tone, then two
    expect(played).toEqual(["one", "two"]);
  });

  // A pause drill shows its pause marks as visible pause signs, not slashes
  it("shows the pause marks in a pause drill", async () => {
    // Draw a pause drill
    draw({ mode: "pause", promptId: PAUSE_DRILLS[0]!.id });
    // Wait for the passage
    const passage = await screen.findByTestId("passage");
    // Confirm one pause sign per mark and no raw slashes
    expect([screen.getAllByLabelText("pause here").length, passage.textContent?.includes(" / ")]).toEqual([PAUSE_DRILLS[0]!.body.split(" / ").length - 1, false]);
  });

  // Rehearsing shows your saved talk and its goal, and the memory ladder moves from full text to keywords to nothing
  it("shows the saved talk when rehearsing, and steps down the memory ladder", async () => {
    // A repository with a talk
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveTalk(makeTalk());
    // Draw a rehearsal of it
    draw({ mode: "rehearse", promptId: "talk-1", repository });
    // Confirm the title, the text, the goal, and the start action
    expect([!!(await screen.findByText("Team update")), !!screen.getByTestId("passage"), !!screen.getByText("aim for a 5:00 goal"), !!screen.getByRole("button", { name: /Start rehearsing/ })]).toEqual([true, true, true, true]);
    // Step to keywords
    fireEvent.click(screen.getByRole("button", { name: "Keywords" }));
    // Confirm cue words only
    expect(screen.getByTestId("passage").textContent).toBe("Good morning … This quarter … First, the … Second, faster … Third, the … Thank you.");
    // Step to memory
    fireEvent.click(screen.getByRole("button", { name: "From memory" }));
    // Confirm the text is gone and that rung is marked
    expect([screen.queryByTestId("passage"), screen.getByRole("button", { name: "From memory" }).getAttribute("aria-pressed")]).toEqual([null, "true"]);
  });

  // A rehearsal can start on a rung of the ladder, as today's plan asks
  it("starts on the rung of the ladder it is given", async () => {
    // A repository with a talk
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveTalk(makeTalk());
    // Draw a rehearsal from memory
    draw({ mode: "rehearse", promptId: "talk-1", repository, ladder: "none" });
    // Confirm no text once the talk has loaded
    expect([!!(await screen.findByText("Team update")), screen.queryByTestId("passage")]).toEqual([true, null]);
  });

  // Rehearsing one section shows only that section, without the whole talk's goal, and saves which section it was
  it("rehearses one section and saves which one", async () => {
    // A repository with a talk in three sections
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveTalk(makeTalk({ body: "Good morning.\n\nWe shipped three things.\n\nThank you." }));
    // Draw a rehearsal of the middle section
    const { clock, navigate } = draw({ mode: "rehearse", promptId: "talk-1", repository, sectionIndex: 1 });
    // Confirm only that section shows, named as such, with no goal
    expect([(await screen.findByTestId("passage")).textContent, !!screen.getByText("Your talk · section 2 of 3"), screen.queryByText("aim for a 5:00 goal")]).toEqual(["We shipped three things.", true, null]);
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Start rehearsing/ }));
    // Speak for 20 seconds
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Advance the clock
    clock.advance(20_000);
    // Stop
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm the section was saved
    expect((await repository.listSessions())[0]?.sectionIndex).toBe(1);
  });

  // Practising is focus mode: no tab bar, only a close button, which goes too while recording so a stray tap cannot lose the take
  it("hides the tab bar while practising, with a way out until recording starts", async () => {
    // Draw the screen
    draw();
    // Confirm no tab bar, and a close button back to Practice
    expect([screen.queryByRole("navigation", { name: "Main" }), (await screen.findByRole("link", { name: "Close, back to Practice" })).getAttribute("href")]).toEqual([null, "/practice"]);
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // Confirm the close button is gone too (discarding is the way out)
    expect(screen.queryByRole("link", { name: /^Close/ })).toBeNull();
  });

  // A lesson shows its tip and its practice text, with stressed words in bold and no raw asterisks
  it("shows a lesson's tip and practice text", async () => {
    // The key-word lesson, which marks words to stress
    const lesson = findLesson("l006")!;
    // Draw it
    draw({ mode: "lesson", promptId: lesson.id });
    // Confirm the lesson title, the tip, bold words, and the start action
    expect([!!(await screen.findByText(`Lesson ${lesson.number}: ${lesson.title}`)), !!screen.getByText(lesson.tip), (await screen.findByTestId("passage")).querySelectorAll("strong").length > 0, screen.getByTestId("passage").textContent?.includes("*"), !!screen.getByRole("button", { name: /Start reading/ })]).toEqual([true, true, true, false, true]);
  });

  // A one-minute session has no light
  it("shows no timing light in a one-minute session", async () => {
    // Draw a one-minute session
    draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // Confirm there is no light
    expect(screen.queryByRole("status", { name: "Timing light" })).toBeNull();
  });

  // Under ten seconds is too short to measure: nothing is saved, and the user is told
  it("does not save a recording under ten seconds", async () => {
    // Draw the screen
    const { repository, navigate, clock } = draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Only five seconds
    clock.advance(5_000);
    // Stop
    fireEvent.click(stop);
    // Confirm the explanation
    expect(await screen.findByText(/under 10 seconds/)).toBeTruthy();
    // Confirm nothing was saved and the page did not change
    expect([await repository.listSessions(), navigate.mock.calls.length]).toEqual([[], 0]);
  });

  // A failed save is explained instead of leaving the screen on "Saving…" forever
  it("explains when the session could not be saved", async () => {
    // A repository whose writes fail, the way a full or refused browser database does
    const repository = createRepository(new MemoryStore());
    // Make saving the audio fail
    repository.saveAudio = async () => {
      // Fail like the browser database does
      throw new DOMException("The operation failed.", "UnknownError");
    };
    // Draw the screen with it
    const { clock, navigate } = draw({ repository });
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Speak for 40 seconds
    clock.advance(40_000);
    // Stop
    fireEvent.click(stop);
    // Confirm the explanation names the browser's reason
    expect((await screen.findByRole("alert")).textContent).toMatch(/could not be saved.*The operation failed\./);
    // Confirm the screen is no longer saving, offers another try, and did not move on
    expect([screen.queryByText("Saving…"), !!screen.getByRole("button", { name: /Try again/ }), navigate.mock.calls.length]).toEqual([null, true, 0]);
  });

  // A blocked microphone is explained, with nothing saved
  it("explains a blocked microphone", async () => {
    // Draw with a refused microphone
    const { repository } = draw({}, { micError: "NotAllowedError" });
    // Try to start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Confirm the explanation, with the steps to allow it and a way to try again
    expect([!!(await screen.findByText(/microphone is blocked/)), within(screen.getByRole("list", { name: "How to allow the microphone" })).getAllByRole("listitem").length, !!screen.getByRole("button", { name: /Try again/ })]).toEqual([true, 3, true]);
    // Confirm nothing was saved
    expect(await repository.listSessions()).toHaveLength(0);
  });

  // Before the first ever recording, when the browser is about to ask: what the microphone is for, then the browser's question, then the start
  it("explains the microphone before the browser asks, once", async () => {
    // Each check starts with a fresh browser
    localStorage.clear();
    // Draw with a browser that will ask
    const { fake } = draw({}, { permission: "prompt" });
    // Give the browser's answer time to arrive
    await act(async () => {});
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Confirm the explanation shows instead of recording
    expect(await screen.findByRole("heading", { name: "VoiceLab listens through your microphone." })).toBeTruthy();
    // Confirm the microphone was not asked for yet
    expect(fake.micAsks()).toBe(0);
    // Allow it
    fireEvent.click(screen.getByRole("button", { name: /Allow microphone/ }));
    // Recording starts
    expect(await screen.findByRole("button", { name: /Stop/ })).toBeTruthy();
    // Draw again, as on a later visit
    cleanup();
    // The later visit
    draw({}, { permission: "prompt" });
    // Give the browser's answer time to arrive
    await act(async () => {});
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Confirm recording starts with no explanation this time
    expect([!!(await screen.findByRole("button", { name: /Stop/ })), screen.queryByRole("heading", { name: "VoiceLab listens through your microphone." })]).toEqual([true, null]);
  });

  // A browser that already allows the microphone needs no explanation
  it("skips the explanation when the microphone is already allowed", async () => {
    // A fresh browser
    localStorage.clear();
    // Draw with the microphone allowed
    draw({}, { permission: "granted" });
    // Give the browser's answer time to arrive
    await act(async () => {});
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Confirm recording starts straight away
    expect(await screen.findByRole("button", { name: /Stop/ })).toBeTruthy();
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
    const { repository, navigate, clock } = draw({}, { finalText: "" });
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Let 20 seconds pass
    clock.advance(20_000);
    // Stop
    fireEvent.click(stop);
    // Confirm the explanation
    expect(await screen.findByText(/did not catch any words/)).toBeTruthy();
    // Confirm nothing was saved and the page did not change
    expect([await repository.listSessions(), navigate.mock.calls.length]).toEqual([[], 0]);
  });

  // Discarding stops without saving, offers an undo, and lets the user start again (decision 77)
  it("discards without saving and offers an undo", async () => {
    // Draw the screen
    const { repository, navigate } = draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Discard
    fireEvent.click(await screen.findByRole("button", { name: "Discard" }));
    // Confirm the note and its undo
    expect([!!(await screen.findByText("Take discarded.")), !!screen.getByRole("button", { name: "Undo" })]).toEqual([true, true]);
    // Confirm nothing was saved, the page did not change, and a fresh start is offered
    expect([await repository.listSessions(), navigate.mock.calls.length, !!screen.getByRole("button", { name: /Start again/ })]).toEqual([[], 0, true]);
  });

  // Undo keeps the discarded take after all, saving it and opening its page
  it("saves a discarded take when undone", async () => {
    // Draw the screen
    const { repository, clock, fake, navigate } = draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // Words arrive
    await fake.say({ final: "So I went home", interim: "" });
    // Let 20 seconds pass
    clock.advance(20_000);
    // Discard
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    // Undo
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    // Confirm the session was saved and opened
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm one session
    expect(await repository.listSessions()).toHaveLength(1);
  });

  // Pausing stops the clock and the listening; resuming carries on and the words join up
  it("pauses and resumes, leaving the paused time out of the length", async () => {
    // Draw the screen
    const { repository, clock, fake, navigate } = draw({}, { finalText: ["So I went home", "and then I slept"] });
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    await screen.findByRole("button", { name: /Stop/ });
    // Words arrive
    await fake.say({ final: "So I went home", interim: "" });
    // Speak for 20 seconds
    clock.advance(20_000);
    // Pause
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    // Confirm the status says paused and the button now resumes
    expect([(await screen.findByRole("status", { name: "Paused" })).textContent, !!screen.getByRole("button", { name: "Resume" })]).toEqual([expect.stringContaining("Paused"), true]);
    // A minute passes while paused
    clock.advance(60_000);
    // Resume
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    // Speak for 10 more seconds
    clock.advance(10_000);
    // Stop
    fireEvent.click(await screen.findByRole("button", { name: /Stop/ }));
    // Wait for the save
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Read the saved session
    const [saved] = await repository.listSessions();
    // Confirm 30 seconds, not 90, and both parts of the words
    expect([saved?.durationSec, saved?.transcript]).toEqual([30, "So I went home and then I slept"]);
  });

  // Regression: without a clock passed in (as in the real app), recording must keep running across redraws
  it("keeps recording across redraws with the default clock", async () => {
    // Fake timers, so the real clock can be moved forward
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Fake services
    const fake = fakeServices();
    // Record where the screen sends the user
    const navigate = vi.fn();
    // Draw without a clock, as the real page does
    render(<RecordingScreen promptId={PROMPTS[0]!.id} mode="standard" retryOf={null} repository={createRepository(new MemoryStore())} services={fake.services} navigate={navigate} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Words arrive, causing redraws
    await fake.say({ final: "So I went home", interim: "" });
    // Move the real clock forward 20 seconds
    vi.setSystemTime(Date.now() + 20_000);
    // Stop
    fireEvent.click(stop);
    // Confirm the session was saved and opened
    await waitFor(() => expect(navigate).toHaveBeenCalled());
  });

  // The space bar starts and stops recording on a computer
  it("starts and stops with the space bar", async () => {
    // Draw the screen
    const { navigate, clock } = draw();
    // Wait for the screen
    await screen.findByRole("button", { name: /Start speaking/ });
    // Press space to start
    fireEvent.keyDown(window, { key: " " });
    // Confirm recording
    await screen.findByRole("button", { name: /Stop/ });
    // Speak for 20 seconds
    clock.advance(20_000);
    // Press space to stop
    fireEvent.keyDown(window, { key: " " });
    // Confirm it saved and moved on
    await waitFor(() => expect(navigate).toHaveBeenCalled());
  });

  // The space bar can be switched off in Settings (WCAG 2.1.4; decision 79)
  it("ignores the space bar when the shortcut is off", async () => {
    // Switched off
    localStorage.setItem("voicelab-space-shortcut", "off");
    // Draw the screen
    draw();
    // Wait for the screen
    await screen.findByRole("button", { name: /Start speaking/ });
    // Press space
    fireEvent.keyDown(window, { key: " " });
    // Confirm nothing started
    expect(screen.queryByRole("button", { name: /Stop/ })).toBeNull();
    // Back on for other checks
    localStorage.removeItem("voicelab-space-shortcut");
  });

  // The server cannot tell whether the browser supports speech, so its drawing must match the browser's first drawing
  it("draws the same first page on the server and in the browser", async () => {
    // Fixed props for both drawings
    const props = { promptId: PROMPTS[0]!.id, mode: "standard" as const, retryOf: null, repository: createRepository(new MemoryStore()), clock: () => new Date(2026, 9, 13, 10), navigate: vi.fn() };
    // On the server there is no speech recognition
    const html = renderToString(<RecordingScreen {...props} services={fakeServices({ supported: false }).services} />);
    // Put the server's page into the document
    const container = document.createElement("div");
    // Fill it with the server's drawing
    container.innerHTML = html;
    // Attach it
    document.body.appendChild(container);
    // Record any mismatch React reports
    const mismatch = vi.fn();
    // Take over the page in a browser that does support speech
    const root = await act(async () => hydrateRoot(container, <RecordingScreen {...props} services={fakeServices().services} />, { onRecoverableError: mismatch }));
    // Confirm no mismatch, and the start action is offered on the voice shape, with no band at the bottom (decision 75)
    expect([mismatch.mock.calls.length, !!container.querySelector("button[data-variant=\"start\"]")?.textContent?.includes("Start speaking"), !!container.querySelector("[data-action-band]")]).toEqual([0, true, false]);
    // Clean up
    act(() => root.unmount());
    // Remove the page
    container.remove();
  });

  // A browser without speech recognition is still told so after the page loads
  it("still explains missing speech support after taking over the server's page", async () => {
    // Fixed props for both drawings
    const props = { promptId: PROMPTS[0]!.id, mode: "standard" as const, retryOf: null, repository: createRepository(new MemoryStore()), clock: () => new Date(2026, 9, 13, 10), navigate: vi.fn() };
    // Services without speech support, as on both the server and this browser
    const services = fakeServices({ supported: false }).services;
    // Put the server's page into the document
    const container = document.createElement("div");
    // Fill it with the server's drawing
    container.innerHTML = renderToString(<RecordingScreen {...props} services={services} />);
    // Attach it
    document.body.appendChild(container);
    // Take over the page
    const root = await act(async () => hydrateRoot(container, <RecordingScreen {...props} services={services} />));
    // Confirm the explanation appears
    expect(container.textContent).toMatch(/cannot turn speech into text|speech/i);
    // Confirm it is shown as an alert
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    // Clean up
    act(() => root.unmount());
    // Remove the page
    container.remove();
  });

  // An openings drill shows its task, a tip, and the 45-second goal
  it("shows an opening drill's task, tip and goal", async () => {
    // Draw an opening drill
    draw({ mode: "bookend", promptId: "b001" });
    // Confirm the task, the tip, and the goal
    expect([!!(await screen.findByText("Open a talk on why your team needs a new tool.")), !!screen.getByText(/Stand still, breathe in, look up/), !!screen.getByText("aim for a 0:45 goal")]).toEqual([true, true, true]);
  });

  // A Q&A answer shows the question it answers, and saves it with the answer
  it("shows the question for a Q&A answer and saves it", async () => {
    // A repository with a rehearsal that has questions
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveSession(makeSession({ id: "r1", mode: "rehearse", questions: ["What does it cost?", "Why now?"] }));
    // Draw an answer to the second question
    const { clock, navigate } = draw({ mode: "qa", promptId: "r1", questionIndex: 1, repository });
    // Confirm the question and the one-minute goal
    expect([!!(await screen.findByText("Why now?")), !!screen.getByText("aim for a 1:00 goal")]).toEqual([true, true]);
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Start speaking/ }));
    // Speak for 20 seconds
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Advance the clock
    clock.advance(20_000);
    // Stop
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm the answer saved its question
    expect((await repository.listSessions()).find((session) => session.mode === "qa")).toMatchObject({ promptId: "r1", question: "Why now?" });
  });

  // Free talk (decision 73): an open invitation, no timing light, and saved as free talk
  it("invites free talk with no clock to beat, and saves it", async () => {
    // Draw free talk
    const { repository, clock, navigate } = draw({ mode: "free", promptId: "free" });
    // Confirm the invitation and the length line
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, !!screen.getByText("no time limit")]).toEqual(["Talk about anything.", true]);
    // Start, speak for 20 seconds, stop
    fireEvent.click(screen.getByRole("button", { name: /Start speaking/ }));
    // The stop button
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Confirm no timing light while speaking
    expect(screen.queryByRole("status", { name: "Timing light" })).toBeNull();
    // Advance and stop
    clock.advance(20_000);
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm it was saved as free talk
    expect((await repository.listSessions())[0]).toMatchObject({ mode: "free", promptId: "free" });
  });

  // A microphone that stops by itself (the phone locked) saves what was said instead of hanging (decision 76)
  it("saves what was said when the microphone stops by itself", async () => {
    // Draw a one-minute session
    const { repository, clock, navigate, fake } = draw();
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // Wait for recording
    await screen.findByRole("button", { name: "Stop" });
    // Speak for 20 seconds
    clock.advance(20_000);
    // The phone takes the microphone away
    await fake.endMic();
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm it was saved
    expect((await repository.listSessions()).length).toBe(1);
  });

  // The voice shape is the start and stop button, and there is no band at the bottom (decisions 74 and 75)
  it("starts and stops on the voice shape, with no band at the bottom", async () => {
    // Draw a one-minute session
    const { repository, clock, navigate } = draw();
    // The start shape, with its words and length
    const start = await screen.findByRole("button", { name: /Start speaking/ });
    // Confirm its words and that no band is drawn
    expect([start.textContent, document.querySelector("[data-action-band]")]).toEqual(["Start speakingabout a minute", null]);
    // Tap it
    fireEvent.click(start);
    // While recording, the shape is the stop button and still shows the level
    const shape = await screen.findByRole("button", { name: "Stop" });
    // Confirm the level is named inside it, and still no band
    expect([!!within(shape).getByRole("img", { name: "Microphone level" }), document.querySelector("[data-action-band]")]).toEqual([true, null]);
    // Speak for 20 seconds, then tap the shape
    clock.advance(20_000);
    fireEvent.click(shape);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm it was saved
    expect((await repository.listSessions()).length).toBe(1);
  });

  // A short speech (decision 73): the topic and points in view before and while speaking, a light against its length, and the plan saved with it
  it("shows a short speech's plan, times it against its length, and saves the plan", async () => {
    // The plan
    const outline = { topic: "Why I run", points: ["It clears my head", "I met friends"], goalMinutes: 1 };
    // Draw it
    const { repository, clock, navigate } = draw({ mode: "outline", promptId: "outline", outline });
    // Confirm the topic, the points and the goal
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, within(screen.getByRole("list", { name: "Your points" })).getAllByRole("listitem").map((item) => item.textContent), !!screen.getByText("aim for a 1:00 goal")]).toEqual(["Why I run", ["1It clears my head", "2I met friends"], true]);
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Start speaking/ }));
    // The stop button
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Confirm the points stay in view, with a timing light
    expect([!!screen.getByRole("list", { name: "Your points" }), !!screen.getByRole("status", { name: "Timing light" })]).toEqual([true, true]);
    // Advance and stop
    clock.advance(20_000);
    fireEvent.click(stop);
    // Wait for the page change
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Confirm the plan was saved with the session
    expect((await repository.listSessions())[0]).toMatchObject({ mode: "outline", outline });
  });

  // A lesson's [instruction] shows as a quiet instruction, not words to read
  it("shows a lesson's bracketed instruction in italics, without brackets", async () => {
    // Draw the blank-recovery lesson
    draw({ mode: "lesson", promptId: "l015" });
    // The instruction
    const instruction = await screen.findByText("Stop here and count to three in silence.");
    // Confirm it is set apart and has no brackets around it
    expect([instruction.tagName, screen.getByTestId("passage").textContent?.includes("[")]).toEqual(["EM", false]);
  });

  // While recording, the page says so plainly and the stop band looks different from the start band
  it("marks the recording state and sets the stop band apart", async () => {
    // Draw the screen
    draw();
    // The start band
    const start = await screen.findByRole("button", { name: /Start speaking/ });
    // Its look
    const startVariant = start.getAttribute("data-variant");
    // Start
    fireEvent.click(start);
    // The stop band
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Confirm the recording marker and the different look
    expect([!!screen.getByRole("status", { name: "Recording" }), startVariant, stop.getAttribute("data-variant")]).toEqual([true, "start", "stop"]);
  });
});
