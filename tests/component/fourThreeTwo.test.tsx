// @vitest-environment jsdom
// Checks for the 4/3/2 loop's screens (decision 118): the offer before a prepared speech and on a story's set-up, a round moving on to the next without the question, the last round asking it, and the three rounds compared on the last round's results
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { RecordingScreen } from "@/components/screens/RecordingScreen";
import { TellStoryScreen } from "@/components/screens/TellStoryScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the session builder
import { makeSession } from "../support/fixtures";

// Remove drawn screens after each check
afterEach(cleanup);

// A fixed "now"
const NOW = new Date(2026, 9, 22, 18);

// Stand-in recording pieces
function services(): RecordingServices {
  // The pieces
  return {
    // Speech is supported
    speechSupported: () => true,
    // A microphone with no tracks
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // A transcriber that hears a sentence
    createTranscriber: () => ({ start: () => {}, stop: async () => "First I want to tell you about the plan and why it matters to all of us." }),
    // A capture with a steady level
    createCapture: () => ({ level: () => 0.4, stop: async () => new Blob(["voice"]) }),
  };
}

// A clock the check moves by hand
function fakeClock() {
  // The time now
  let time = new Date(2026, 9, 22, 10).getTime();
  // Read and move
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Draw a prepared speech round, record for the given seconds and stop
async function recordRound(repository: Repository, loop: { id: string | null; round: number } | null, seconds: number) {
  // The clock and the way on
  const [clock, navigate] = [fakeClock(), vi.fn()];
  // Drawn
  render(<RecordingScreen promptId="p008" mode="response" retryOf={null} repository={repository} services={services()} clock={clock.now} navigate={navigate} loop={loop} />);
  // Start: round 1 starts its planning time, which Ready cuts short; later rounds start speaking at once
  fireEvent.click(await screen.findByRole("button", { name: loop && loop.round > 1 ? new RegExp(`Start round ${loop.round}`) : /Start thinking/ }));
  // Round 1: skip the rest of the planning
  if (!loop || loop.round === 1) fireEvent.click(await screen.findByRole("button", { name: /Ready/ }));
  // The stop
  const stop = await screen.findByRole("button", { name: /Stop/ });
  // Time passes
  clock.advance(seconds * 1000);
  // Stop
  fireEvent.click(stop);
  // Hand back the way on
  return { navigate };
}

// The offer
describe("the offer", () => {
  // Before a prepared speech: the way into three rounds, with the times
  it("offers three rounds before a prepared speech", async () => {
    // Drawn
    render(<RecordingScreen promptId="p008" mode="response" retryOf={null} repository={createRepository(new MemoryStore())} services={services()} navigate={vi.fn()} />);
    // The offer
    const offer = await screen.findByRole("link", { name: "Tell it three times, shorter each time" });
    // Where it leads, and the times beside it
    expect([offer.getAttribute("href"), offer.parentElement?.textContent]).toEqual(["/session?mode=response&prompt=p008&loop=new&round=1", "Tell it three times, shorter each time4:00, then 3:00, then 2:00"]);
  });

  // A story's set-up: a switch, which changes where Start leads
  it("offers three rounds on a story's set-up", async () => {
    // Drawn
    render(<TellStoryScreen storyId="sp01" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Short
    fireEvent.click(await screen.findByRole("button", { name: /Short/ }));
    // The switch, with the short story's times
    const toggle = screen.getByRole("checkbox", { name: /Tell it three times, shorter each time/ });
    // (the times)
    expect(screen.getByText("2:00, then 1:30, then 1:00")).toBeTruthy();
    // On
    fireEvent.click(toggle);
    // Start leads to round 1 of a new loop
    expect(screen.getByRole("link", { name: /Start/ }).getAttribute("href")).toBe("/session?mode=story&prompt=sp01&shape=classic&length=short&loop=new&round=1");
  });
});

// The rounds
describe("the rounds", () => {
  // Round 1 is saved with a new loop and its target, then round 2 opens with no question in between
  it("saves round 1 and goes straight on to round 2", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Round 1, 3:50
    const { navigate } = await recordRound(repository, { id: null, round: 1 }, 230);
    // On to round 2
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved round
    const [saved] = await repository.listSessions();
    // Its loop, and the next round's address with the same id; no question asked
    expect([saved!.loop?.round, saved!.loop?.targetSec, navigate.mock.calls[0]![0], screen.queryByRole("heading", { name: "How did that feel?" })]).toEqual([1, 240, `/session?mode=response&prompt=p008&loop=${saved!.loop!.id}&round=2`, null]);
  });

  // Round 2 shows its time and starts at once; its light follows its own 3:00
  it("shows round 2's time and starts without planning", async () => {
    // Drawn
    render(<RecordingScreen promptId="p008" mode="response" retryOf={null} repository={createRepository(new MemoryStore())} services={services()} navigate={vi.fn()} loop={{ id: "L1", round: 2 }} />);
    // Which round and its time
    expect((await screen.findByText(/Told three times · round 2 of 3 · 3:00/)).textContent).toContain("Same content, less time.");
    // No offer inside a loop
    expect(screen.queryByRole("link", { name: "Tell it three times, shorter each time" })).toBeNull();
    // The start
    expect(screen.getByRole("button", { name: /Start round 2/ }).textContent).toContain("3:00 this round");
  });

  // The last round asks the question, then opens its results
  it("asks the question after round 3, then opens the results", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Round 3, 1:55
    const { navigate } = await recordRound(repository, { id: "L1", round: 3 }, 115);
    // The question
    fireEvent.click(await screen.findByRole("button", { name: "About right" }));
    // The results
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(expect.stringMatching(/^\/sessions\?id=/)));
    // Saved as round 3 with its 2:00 target and the answer
    expect((await repository.listSessions())[0]).toMatchObject({ loop: { id: "L1", round: 3, targetSec: 120 }, selfRating: { scale: "pace", answer: "right" } });
  });
});

// The results after round 3
describe("the three rounds compared", () => {
  // Three seeded rounds: the line, the table and, on an earlier round, the way to them
  it("compares the rounds on the last round's page", async () => {
    // A repository with three rounds of a prepared speech
    const repository = createRepository(new MemoryStore());
    // Each round, faster with fewer pause words
    for (const [round, wpm, fillers, seconds] of [[1, 118, 6, 235], [2, 132, 4, 175], [3, 150, 2, 117]] as const) await repository.saveSession(makeSession({ id: `r${round}`, mode: "response", promptId: "p008", createdAt: new Date(2026, 9, 22, 10, round * 5).toISOString(), wordsPerMinute: wpm, fillersPerMinute: fillers, durationSec: seconds, feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r" }, loop: { id: "L1", round, targetSec: [240, 180, 120][round - 1]! } }));
    // The last round's page
    render(<SessionScreen sessionId="r3" repository={repository} now={NOW} />);
    // The line on what changed
    expect((await screen.findByText(/^From round 1 to round 3/)).textContent).toBe("From round 1 to round 3, your pace went from 118 to 150 a minute, and pause words from 6 to 2 a minute.");
    // The table: a column per round, time against target
    const table = screen.getByRole("table");
    // (its time row)
    expect(within(table).getByRole("row", { name: /time \/ target/ }).textContent).toBe("time / target3:55 / 4:002:55 / 3:001:57 / 2:00");
    // The timing follows the round's own 2:00 window
    expect(screen.queryByText(/under the 2:00 minimum/)).toBeNull();
    // An earlier round's page leads to the comparison
    cleanup();
    // Round 1
    render(<SessionScreen sessionId="r1" repository={repository} now={NOW} />);
    // The note and the way
    expect((await screen.findByRole("link", { name: "See all three rounds" })).getAttribute("href")).toBe("/sessions?id=r3");
  });
});
