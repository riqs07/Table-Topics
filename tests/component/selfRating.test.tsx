// @vitest-environment jsdom
// Checks for rating yourself before the results (decision 116): the question after a take, its answers, skip and a failed save; the comparison line on the results; the calibration line on Your progress
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
// Load the screens being checked
import { RecordingScreen } from "@/components/screens/RecordingScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
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
const NOW = new Date(2026, 9, 20, 18);

// Stand-in recording pieces: a steady level, fixed words and a little audio
function services(): RecordingServices {
  // The pieces
  return {
    // Speech is supported
    speechSupported: () => true,
    // A microphone with no tracks
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // A transcriber that hears a sentence when stopped
    createTranscriber: () => ({ start: () => {}, stop: async () => "So my week started with a long walk and a good book." }),
    // A capture with a steady level
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
}

// A clock the check moves by hand
function fakeClock() {
  // The time now
  let time = new Date(2026, 9, 13, 10).getTime();
  // Read and move
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Draw free talk, record 40 seconds and stop, ready for the question
async function recordFreeTalk(repository: Repository) {
  // The clock
  const clock = fakeClock();
  // Where the screen sends the user
  const navigate = vi.fn();
  // Draw it
  render(<RecordingScreen promptId="free" mode="free" retryOf={null} repository={repository} services={services()} clock={clock.now} navigate={navigate} />);
  // Start
  fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
  // Wait for the stop
  const stop = await screen.findByRole("button", { name: /Stop/ });
  // Forty seconds
  clock.advance(40_000);
  // Stop
  fireEvent.click(stop);
  // The question shows
  await screen.findByRole("heading", { name: "How did that feel?" });
  // Hand back what the checks need
  return { navigate };
}

// The question after a take
describe("RecordingScreen, the question before the results", () => {
  // An answer is saved on the take, then the results open
  it("saves a tapped answer on the take, then opens the results", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Record and stop
    const { navigate } = await recordFreeTalk(repository);
    // Not gone on yet
    expect(navigate).not.toHaveBeenCalled();
    // Three answers on the pace scale
    expect(["Rushed", "About right", "Slow"].map((name) => screen.getByRole("button", { name }).tagName)).toEqual(["BUTTON", "BUTTON", "BUTTON"]);
    // Tap one
    fireEvent.click(screen.getByRole("button", { name: "Rushed" }));
    // The results open
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved take
    const [saved] = await repository.listSessions();
    // Its answer, and the page it opened
    expect([saved!.selfRating?.scale, saved!.selfRating?.answer, navigate.mock.calls[0]![0]]).toEqual(["pace", "rushed", `/sessions?id=${saved!.id}`]);
  });

  // Skip goes straight on, saving nothing
  it("goes on without an answer when skipped", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Record and stop
    const { navigate } = await recordFreeTalk(repository);
    // Skip
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    // Gone on
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // Nothing saved for the answer
    expect((await repository.listSessions())[0]!.selfRating).toBeUndefined();
  });

  // A failed save is said, with the way on
  it("says when the answer cannot be saved, and still offers the results", async () => {
    // A repository that cannot save an answer
    const base = createRepository(new MemoryStore());
    // (its answer saving fails)
    const repository: Repository = { ...base, setSelfRating: async () => { throw new Error("The disk is full."); } };
    // Quiet the warning in the test output
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Record and stop
    const { navigate } = await recordFreeTalk(repository);
    // Tap an answer
    fireEvent.click(screen.getByRole("button", { name: "Slow" }));
    // Said plainly
    expect((await screen.findByRole("alert")).textContent).toContain("Your answer could not be saved. Your take is saved.");
    // Not gone on by itself
    expect(navigate).not.toHaveBeenCalled();
    // The way on
    fireEvent.click(screen.getByRole("button", { name: "See your results" }));
    // Gone on
    expect(navigate).toHaveBeenCalledWith(expect.stringMatching(/^\/sessions\?id=/));
    // Put the console back
    warn.mockRestore();
  });

  // A story is asked about how lively it sounded
  it("asks a story flat, OK or lively", async () => {
    // The clock and the way on
    const [clock, navigate] = [fakeClock(), vi.fn()];
    // Draw a story
    render(<RecordingScreen promptId="sp01" mode="story" retryOf={null} repository={createRepository(new MemoryStore())} services={services()} clock={clock.now} navigate={navigate} story={{ shape: "classic", focus: null, length: "short" }} />);
    // Plan it, then start telling
    fireEvent.click(await screen.findByRole("button", { name: /Plan it/ }));
    // Ready
    fireEvent.click(await screen.findByRole("button", { name: /Ready/ }));
    // Wait for the stop
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Fifty seconds
    clock.advance(50_000);
    // Stop
    fireEvent.click(stop);
    // The story's answers
    await screen.findByRole("heading", { name: "How did that feel?" });
    // Flat, OK, lively
    expect(["Flat", "OK", "Lively"].every((name) => screen.queryByRole("button", { name }) !== null)).toBe(true);
  });
});

// The line on the results
describe("SessionScreen, the comparison line", () => {
  // Five earlier Rapid Fire takes near 130 a minute, and a rated one
  async function seeded(rated: Partial<ReturnType<typeof makeSession>>) {
    // The repository
    const repository = createRepository(new MemoryStore());
    // The earlier takes
    for (const [index, wpm] of [128, 130, 132, 129, 131].entries()) await repository.saveSession(makeSession({ id: `e${index}`, mode: "talk", promptId: "t001", createdAt: new Date(2026, 9, 10 + index).toISOString(), wordsPerMinute: wpm, durationSec: 70, feedbackStatus: "done", selfReview: undefined }));
    // The rated take
    await repository.saveSession(makeSession({ id: "now", mode: "talk", promptId: "t002", createdAt: new Date(2026, 9, 20, 17).toISOString(), wordsPerMinute: 150, durationSec: 70, feedbackStatus: "done", ...rated }));
    // Hand it back
    return repository;
  }

  // Rated: the line, in neutral words
  it("compares the call with the measure", async () => {
    // A take called rushed
    render(<SessionScreen sessionId="now" repository={await seeded({ selfRating: { scale: "pace", answer: "rushed", ratedAt: NOW.toISOString() } })} now={NOW} />);
    // The line
    expect((await screen.findByText(/^You said rushed\./)).textContent).toBe("You said rushed. Your pace was 150 a minute, faster than usual.");
  });

  // Not rated: no line
  it("shows no line for a take that was not rated", async () => {
    // A take without a call
    render(<SessionScreen sessionId="now" repository={await seeded({})} now={NOW} />);
    // The page is up
    await screen.findByText(/Recorded/);
    // No line
    expect(document.querySelector("[data-self-rating]")).toBeNull();
  });
});

// The line on Your progress
describe("ProfileScreen, the calibration line", () => {
  // Eight rated takes after five earlier ones
  it("says how often the call matched, once there are eight", async () => {
    // The repository
    const repository = createRepository(new MemoryStore());
    // Five earlier takes, then eight rated ones, each a day apart
    for (let day = 0; day < 13; day += 1) await repository.saveSession(makeSession({ id: `t${day}`, mode: "talk", createdAt: new Date(2026, 9, 1 + day).toISOString(), wordsPerMinute: 130, durationSec: 70, feedbackStatus: "done", ...(day >= 5 ? { selfRating: { scale: "pace" as const, answer: day >= 11 ? ("rushed" as const) : ("right" as const), ratedAt: new Date(2026, 9, 1 + day).toISOString() } } : {}) }));
    // Draw the profile
    render(<ProfileScreen repository={repository} now={NOW} />);
    // The line
    expect((await screen.findByText(/Your sense of your pace/)).textContent).toBe("Your sense of your pace matched the measure in 6 of your last 8 takes.");
  });
});
