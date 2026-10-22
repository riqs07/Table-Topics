// @vitest-environment jsdom
// Checks for the two intonation drills and the goal line (decision 117): the goal before the first take, the sentence in turn, the stress targets on the results, and the dial-back curves with their line
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
// Load the screens being checked
import { VoiceDrillScreen } from "@/components/screens/VoiceDrillScreen";
import { VoiceScreen } from "@/components/screens/VoiceScreen";
import { ShadowScreen } from "@/components/screens/ShadowScreen";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the content
import { DIALBACK_LINES, findShadowPassage, findVoiceDrill, SHIFT_SENTENCES } from "@/content/voice";
// Load the session builder
import { makeSession } from "../support/fixtures";

// Remove drawn screens after each check
afterEach(cleanup);

// A clock the check moves by hand
function fakeClock() {
  // The time now
  let time = new Date(2026, 9, 19, 10).getTime();
  // Read and move
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Stand-in recording pieces whose pitch swings by the given number of steps on each take in turn (a swinging voice, so a range can be read)
function services(swings: ReadonlyArray<number> = [4]): RecordingServices {
  // Which take is being recorded
  let take = -1;
  // The pieces
  return {
    // Speech is supported
    speechSupported: () => true,
    // A stand-in stream
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // A listener that hears nothing
    createTranscriber: () => ({ start: () => {}, stop: async () => "" }),
    // A capture: a steady level, and a pitch swinging around 180 Hz by this take's amount
    createCapture: () => {
      // The next take
      take += 1;
      // Its swing
      const swing = swings[take % swings.length] ?? 4;
      // Readings taken so far
      let reading = 0;
      // The capture
      return { level: () => 0.4, pitch: () => Math.round(180 * 2 ** ((swing * Math.sin((reading += 1) / 2)) / 12)), stop: async () => new Blob(["voice"]) };
    },
  };
}

// Draw a drill
function draw(drillId: string, options: { set?: number | null; swings?: number[]; repository?: Repository } = {}) {
  // The repository
  const repository = options.repository ?? createRepository(new MemoryStore());
  // The clock
  const clock = fakeClock();
  // Drawn
  render(<VoiceDrillScreen drillId={drillId} set={options.set ?? null} services={services(options.swings)} repository={repository} now={clock.now()} clock={clock.now} shuffle={(count) => Array.from({ length: count }, (_, index) => index)} />);
  // Hand back the pieces
  return { repository, clock };
}

// Record one take
async function recordTake(clock: { advance: (ms: number) => void }) {
  // Start
  fireEvent.click(await screen.findByRole("button", { name: /Record/ }));
  // The stop
  const stop = await screen.findByRole("button", { name: "Stop" });
  // A couple of seconds of readings
  await act(() => new Promise((resolve) => setTimeout(resolve, 1300)));
  // Time passes
  clock.advance(2500);
  // Stop
  await act(async () => void fireEvent.click(stop));
}

// The goal line before a drill
describe("goals", () => {
  // Before the first take of a drill, its goal; gone once recording
  it("shows the drill's goal before the first take", async () => {
    // The stress drill
    draw("p04");
    // The goal line
    expect((await screen.findByText(/Your highest pitch lands on the key word/)).closest("[data-goal]")?.textContent).toBe(`Goal: ${findVoiceDrill("p04")!.goal}`);
  });

  // Shadowing's first page has its goal too
  it("shows the goal before shadowing", async () => {
    // A passage
    render(<ShadowScreen passageId="s01" services={services()} repository={createRepository(new MemoryStore())} />);
    // The goal
    expect((await screen.findByText(/Your pace and melody close to the model’s/)).closest("[data-goal]")?.textContent).toBe(`Goal: ${findShadowPassage("s01")!.goal}`);
  });
});

// Same sentence, different stress
describe("Same sentence, different stress", () => {
  // The sentence named, its targets one per take, and the targets drawn on the results
  it("takes the named sentence, a target per take, then draws each target and peak", { timeout: 20_000 }, async () => {
    // The second sentence
    const { clock } = draw("p05", { set: 1, swings: [5] });
    // Which sentence of how many, and the first target
    expect((await screen.findByText(/Sentence 2 of 6/)).textContent).toContain("Take 1 of 3 · Stress “We”");
    // Its line
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(SHIFT_SENTENCES[1]!.text);
    // Another sentence leads to the third
    expect(screen.getByRole("link", { name: "Another sentence" }).getAttribute("href")).toBe("/voice/drill?id=p05&set=3");
    // Three takes
    for (let take = 0; take < 3; take += 1) await recordTake(clock);
    // The results: a planned-stress row per take, with its target circled and the peak's dot
    await waitFor(() => expect(document.querySelectorAll("[data-planned-stress]").length).toBe(3));
    // Each row has a target circle and a dot
    expect([document.querySelectorAll("[data-target]").length, document.querySelectorAll("[data-top]").length]).toEqual([3, 3]);
    // The headline counts the takes with the peak on the target
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/^\d of 3 takes got the peak on the target word\.$/);
  });

  // Without a sentence named, the next in turn by how often it was done
  it("takes the next sentence in turn when none is named", async () => {
    // Done twice before
    const repository = createRepository(new MemoryStore());
    // (twice)
    for (const id of ["a", "b"]) await repository.saveSession(makeSession({ id, mode: "voice", promptId: "p05" }));
    // Drawn without a sentence
    draw("p05", { repository });
    // The third sentence
    await screen.findByText(/Sentence 3 of 6/);
    // Its line
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(SHIFT_SENTENCES[2]!.text);
  });
});

// Exaggerate, then dial back
describe("Exaggerate, then dial back", () => {
  // Flat, exaggerated and natural, then each take's curve with its range, and the one line
  it("draws each take's curve with its range and says how much the natural take kept", { timeout: 20_000 }, async () => {
    // The fourth line; a small swing, a big one, a middling one
    const { clock, repository } = draw("p06", { set: 3, swings: [0.6, 9, 4] });
    // The first take
    expect((await screen.findByText(/Take 1 of 3 · Flat/)).textContent).toContain("Sentence 4 of 6");
    // The line
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(DIALBACK_LINES[3]);
    // Three takes
    for (let take = 0; take < 3; take += 1) await recordTake(clock);
    // A curve per take
    await waitFor(() => expect(document.querySelectorAll("[data-take-curve]").length).toBe(3));
    // A range on each take's line, and the headline on how much was kept
    expect([screen.getAllByText(/^Range: \d+ steps?\.$/).length, screen.getByRole("heading", { level: 1 }).textContent]).toEqual([3, expect.stringMatching(/^Your natural take kept .+ of the exaggerated range \(\d+ of \d+ steps\)\.$/)]);
    // Saved as a voice session
    await waitFor(async () => expect((await repository.listSessions()).map((session) => [session.mode, session.promptId, session.voice?.takes.map((take) => take.label)])).toEqual([["voice", "p06", ["Flat", "Exaggerated", "Natural"]]]));
  });
});

// The list on Your voice
describe("VoiceScreen", () => {
  // The new drills list how many sentences they turn through
  it("lists the new drills with their sentences", async () => {
    // Drawn
    render(<VoiceScreen repository={createRepository(new MemoryStore())} />);
    // Both rows
    expect([(await screen.findByRole("link", { name: /Same sentence, different stress/, hidden: true })).textContent, screen.getByRole("link", { name: /Exaggerate, then dial back/, hidden: true }).textContent]).toEqual([expect.stringContaining("6 sentences"), expect.stringContaining("6 sentences")]);
  });
});
