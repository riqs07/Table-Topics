// @vitest-environment jsdom
// Checks for rating yourself (decision 116): no question after a take any more (decision 129), and for takes rated before then, the comparison line on the results and the calibration line on Your progress
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
import { createRepository } from "@/data/repository";
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

// The results open straight after a take, with no question first (decision 129)
describe("RecordingScreen, no question before the results", () => {
  // Free talk and a story, the kinds that used to be asked
  it("opens the results straight after a take", async () => {
    // The pages each take opened, and whether a question showed
    const seen: Array<[boolean, string]> = [];
    // Each kind in turn
    for (const mode of ["free", "story"] as const) {
      // An empty repository, a clock and the way on
      const [repository, clock, navigate] = [createRepository(new MemoryStore()), fakeClock(), vi.fn()];
      // Draw it
      render(<RecordingScreen promptId={mode === "free" ? "free" : "sp01"} mode={mode} retryOf={null} repository={repository} services={services()} clock={clock.now} navigate={navigate} />);
      // A story is planned first
      if (mode === "story") fireEvent.click(await screen.findByRole("button", { name: /Plan it/ }));
      // Start
      fireEvent.click(await screen.findByRole("button", { name: mode === "story" ? /Ready/ : /Start speaking/ }));
      // Wait for the stop
      const stop = await screen.findByRole("button", { name: /Stop/ });
      // Forty seconds
      clock.advance(40_000);
      // Stop
      fireEvent.click(stop);
      // The results open
      await waitFor(() => expect(navigate).toHaveBeenCalled());
      // The saved take
      const [saved] = await repository.listSessions();
      // Note whether the question showed, and the page
      seen.push([screen.queryByRole("heading", { name: "How did that feel?" }) !== null, navigate.mock.calls[0]![0] === `/sessions?id=${saved!.id}` ? "results" : String(navigate.mock.calls[0]![0])]);
      // Clear the screen
      cleanup();
    }
    // Confirm no question and straight to the results, both times
    expect(seen).toEqual([[false, "results"], [false, "results"]]);
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
