// @vitest-environment jsdom
// Checks for the 4/3/2 loop's screens (decision 118): the offer before a prepared speech and on a story's set-up, a round moving on to the next without the question, the last round asking it, and the three rounds compared on the last round's results
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { RecordingScreen } from "@/components/screens/RecordingScreen";
import { TellStoryScreen } from "@/components/screens/TellStoryScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { FourThreeTwoScreen } from "@/components/screens/FourThreeTwoScreen";
// Load the day's pickers and the suggested template
import { promptForDay } from "@/content/prompts";
import { storyPromptForDay, suggestedTemplate } from "@/content/stories";
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

// The drill's own page (decision 126): the 4/3/2 loop left the recording page and the story set-up
describe("the 4/3/2 page", () => {
  // Not offered before a prepared speech or on a story's set-up any more
  it("is no longer offered on the recording page or the story set-up", async () => {
    // A prepared speech before starting
    const { unmount } = render(<RecordingScreen promptId="p008" mode="response" retryOf={null} repository={createRepository(new MemoryStore())} services={services()} navigate={vi.fn()} />);
    // Drawn, with no offer
    await screen.findByRole("button", { name: /Start thinking/ });
    // (none)
    expect(screen.queryByRole("link", { name: "Tell it three times, shorter each time" })).toBeNull();
    // Closed
    unmount();
    // A story's set-up, with no switch
    render(<TellStoryScreen storyId="sp01" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Drawn
    await screen.findByRole("button", { name: /Lesson learned/ });
    // (none)
    expect(screen.queryByRole("checkbox", { name: /Tell it three times/ })).toBeNull();
  });

  // Today's prepared speech and story, then the user's own stories with the set-up they were last told with
  it("starts round 1 on today's speech, today's story, or one of your stories", async () => {
    // A repository with one told story, a client win
    const repository = createRepository(new MemoryStore());
    // The telling
    await repository.saveSession(makeSession({ id: "told", mode: "story", promptId: "sp06", story: { template: "client-win", focus: null, length: "short" } }));
    // Drawn
    render(<FourThreeTwoScreen repository={repository} now={NOW} />);
    // The day's two
    const today = within(await screen.findByRole("list", { name: "Today's 4/3/2" })).getAllByRole("link").map((link) => link.getAttribute("href"));
    // The user's story
    const yours = within(await screen.findByRole("list", { name: "Your stories" })).getByRole("link");
    // Each starts round 1 of a new loop: the speech, today's story with its suggested template, and the told story with its own set-up as a retelling
    expect([today, yours.getAttribute("href")]).toEqual([[`/session?mode=response&prompt=${promptForDay(NOW, 1).id}&loop=new&round=1`, `/session?mode=story&prompt=${storyPromptForDay(NOW).id}&template=${suggestedTemplate(storyPromptForDay(NOW).id)}&length=full&loop=new&round=1`], "/session?mode=story&prompt=sp06&template=client-win&length=short&retryOf=told&loop=new&round=1"]);
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
