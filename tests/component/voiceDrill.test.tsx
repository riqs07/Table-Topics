// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screen being checked
import { VoiceDrillScreen } from "@/components/screens/VoiceDrillScreen";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the drills
import { findVoiceDrill } from "@/content/voice";

// Remove drawn screens after each check
afterEach(cleanup);

// A clock the check moves by hand
function fakeClock(start = new Date(2026, 9, 19, 10).getTime()) {
  // Current time
  let time = start;
  // Read and move it
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Fake recording services: a steady level, and the words each take's listener hears in turn
function fakeServices(options: { supported?: boolean; heard?: string[]; level?: number } = {}): RecordingServices {
  // The words still to hand out, one per take
  const heard = [...(options.heard ?? [])];
  // The services
  return {
    // Speech support, on unless switched off
    speechSupported: () => options.supported ?? true,
    // A stand-in stream
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // A listener that hands back the next take's words
    createTranscriber: () => ({ start: () => {}, stop: async () => heard.shift() ?? "" }),
    // A capture with a steady level and fixed audio
    createCapture: () => ({ level: () => options.level ?? 0.5, stop: async () => new Blob(["voice"]) }),
  };
}

// Draw the drill with fakes
function draw(drillId: string, options: { supported?: boolean; heard?: string[]; level?: number; repository?: Repository } = {}) {
  // An empty repository unless given
  const repository = options.repository ?? createRepository(new MemoryStore());
  // The clock
  const clock = fakeClock();
  // Draw it, with the guessing game in the takes' own order
  render(<VoiceDrillScreen drillId={drillId} services={fakeServices(options)} repository={repository} now={clock.now()} clock={clock.now} shuffle={(count) => Array.from({ length: count }, (_, index) => index)} />);
  // Hand back the pieces
  return { repository, clock };
}

// Record one take of the given length
async function recordTake(clock: { advance: (ms: number) => void }, ms = 2500) {
  // Start
  fireEvent.click(await screen.findByRole("button", { name: /Record|Try again/ }));
  // Wait for the stop shape
  const stop = await screen.findByRole("button", { name: "Stop" });
  // Let a few loudness readings in
  await act(() => new Promise((resolve) => setTimeout(resolve, 250)));
  // Time passes
  clock.advance(ms);
  // Stop
  await act(async () => void fireEvent.click(stop));
}

// Group the checks about the voice drill page
describe("VoiceDrillScreen", () => {
  // A volume drill: three takes, the results with the loudness bars, saved as a voice session, with the next drill offered
  it("records each take of a volume drill, then shows and saves the results", async () => {
    // Draw the first three-rooms drill
    const { repository, clock } = draw("v01");
    // The first take's line and what it trains
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, !!screen.getByText(/Take 1 of 3 · Friend beside you/), !!screen.getByText(findVoiceDrill("v01")!.intro)]).toEqual(["Good morning, everyone. Let’s get started.", true, true]);
    // Three takes
    for (let take = 0; take < 3; take += 1) await recordTake(clock);
    // The results: the same level each time is not three clear steps
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("Make each step a clear jump up.");
    // One bar and one line per take
    expect([within(screen.getByRole("list", { name: "How loud each take was" })).getAllByRole("listitem").length, within(screen.getByRole("list", { name: "Your takes" })).getAllByRole("listitem").map((item) => item.querySelector("p")?.textContent)]).toEqual([3, ["Friend beside you", "Meeting room", "Back of the hall"]]);
    // Saved as a voice session with its lines, then the next volume drill offered
    await waitFor(async () => expect((await repository.listSessions()).map((session) => [session.mode, session.promptId, session.voice?.kind, session.voice?.takes.length, session.audioKey])).toEqual([["voice", "v01", "volume", 3, null]]));
    // The band leads to the next volume drill
    expect((await screen.findByRole("link", { name: /Next drill/ })).getAttribute("href")).toBe("/voice/drill?id=v02");
  });

  // A take under a second is not kept
  it("asks again for a take too short to measure", async () => {
    // Draw a volume drill
    const { clock } = draw("v04");
    // A very short take
    await recordTake(clock, 400);
    // Explained, and still on the first take
    expect([!!(await screen.findByRole("alert")).textContent?.includes("too short"), !!screen.getByText(/Take 1 of 2/)]).toEqual([true, true]);
  });

  // Silence is not kept either
  it("asks again when nothing was heard", async () => {
    // Draw a volume drill with a silent microphone
    const { clock } = draw("v04", { level: 0 });
    // A silent take
    await recordTake(clock);
    // Explained, and still on the first take
    expect([!!(await screen.findByRole("alert")).textContent?.includes("did not catch anything"), !!screen.getByText(/Take 1 of 2/)]).toEqual([true, true]);
  });

  // Clear sounds: the hard words are named, offered for a slow round, and added to the words to watch
  it("names the words hard to catch and keeps them to watch", async () => {
    // The everyday tricky words, with "probably" not heard in the first half
    const { repository, clock } = draw("c04", { heard: ["specific statistics particularly February library", "recognize comfortable temperature vegetable sixth clothes", "probably"] });
    // Both takes
    for (let take = 0; take < 2; take += 1) await recordTake(clock);
    // The headline and the first take's line
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, !!screen.getByText("Hard to catch: probably.")]).toEqual(["1 word was hard to catch.", true]);
    // The word is kept to watch
    await waitFor(async () => expect((await repository.getSettings(new Date())).wordsToWatch).toEqual({ probably: 1 }));
    // The slow round
    fireEvent.click(screen.getByRole("button", { name: "Say them slowly" }));
    // Its line is the hard word
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("probably");
    // Record it
    await recordTake(clock);
    // Caught this time
    expect((await screen.findByText("Every word came through this time.")).getAttribute("role")).toBe("status");
  });

  // Clear sounds needs the browser to hear words
  it("explains when the browser cannot hear words for clear sounds", async () => {
    // A browser without speech recognition
    draw("c01", { supported: false });
    // Explained, with no way to start
    expect([(await screen.findByRole("alert")).textContent, screen.queryByRole("button", { name: /Record/ })]).toEqual(["This browser cannot turn speech into text. Use Chrome, Edge, or Safari.", null]);
  });

  // Stress: the guessing game plays the takes back and scores the guesses
  it("ends the stress drill with a guessing game", async () => {
    // The stress drill
    const { clock } = draw("p04");
    // Its six takes
    for (let take = 0; take < 6; take += 1) await recordTake(clock);
    // Start the game
    fireEvent.click(await screen.findByRole("button", { name: "Start the game" }));
    // The first round plays the first take: guess right
    fireEvent.click(within(screen.getByRole("group", { name: "Choices" })).getByRole("button", { name: "I" }));
    // Marked right
    expect(screen.getByText("Right.")).toBeTruthy();
    // The next round: guess wrong
    fireEvent.click(screen.getByRole("button", { name: "Next round" }));
    // Pick the first choice again
    fireEvent.click(within(screen.getByRole("group", { name: "Choices" })).getByRole("button", { name: "I" }));
    // Told which it was
    expect(screen.getByText("Not quite: that was “didn’t”.")).toBeTruthy();
  });

  // A save that fails says so and offers to try again, keeping the results on screen
  it("offers to try again when the drill cannot be saved", async () => {
    // A repository that refuses to save sessions
    const repository = createRepository(new MemoryStore());
    // Refuse
    repository.saveSession = async () => {
      // The browser's storage said no
      throw new Error("quota");
    };
    // Draw the drop drill
    const { clock } = draw("v04", { repository });
    // Both takes
    for (let take = 0; take < 2; take += 1) await recordTake(clock);
    // Said, with the way to try again, and the results still there
    expect([(await screen.findByText("This drill could not be saved.")).textContent, !!screen.getByRole("button", { name: "Try saving again" }), !!screen.getByRole("list", { name: "Your takes" }), screen.queryByRole("link", { name: /Next drill/ })]).toEqual(["This drill could not be saved.", true, true, null]);
  });

  // An unknown drill says so
  it("says when a drill cannot be found", async () => {
    // A drill that does not exist
    draw("nope");
    // Said, with the way back
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, screen.getByRole("link", { name: "See every voice drill" }).getAttribute("href")]).toEqual(["That drill could not be found.", "/voice"]);
  });
});
