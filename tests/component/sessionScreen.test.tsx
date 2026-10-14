// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { SessionScreen } from "@/components/screens/SessionScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample session builder
import { makeSession } from "../support/fixtures";
// Load the passphrase storage
import { savePassphrase } from "@/data/passphrase";
// Load the daily prompt picker
import { promptForDay } from "@/content/prompts";

// A fixed "now"
const NOW = new Date(2026, 9, 13, 18);
// Sample feedback
const FEEDBACK = { keep: "You ended strongly.", change: "Take a breath before you start.", retryCue: "Breathe, then say your first word." };

// Remove the drawn screen after each check
afterEach(cleanup);

// Make a repository holding the given sessions
async function repositoryWith(...sessions: ReturnType<typeof makeSession>[]) {
  // Wrap an empty store
  const repository = createRepository(new MemoryStore());
  // Save each session
  for (const session of sessions) await repository.saveSession(session);
  // Hand it back
  return repository;
}

// Group the checks about the session page
describe("SessionScreen", () => {
  // A first try shows the feedback and offers a retry
  it("shows feedback for a first try", async () => {
    // A finished first try
    const session = makeSession({ id: "s1", focus: "cut-fillers", fillersPerMinute: 4.2, feedback: FEEDBACK, feedbackStatus: "done", promptId: "p001" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the headline number
    expect(await screen.findByText("4.2 fillers a minute.")).toBeTruthy();
    // Confirm each part of the feedback
    for (const text of [FEEDBACK.keep, FEEDBACK.change, FEEDBACK.retryCue]) expect(screen.getByText(text)).toBeTruthy();
    // Confirm the retry action keeps the prompt and links back to this session
    expect(screen.getByRole("link", { name: /Try it again/ }).getAttribute("href")).toBe("/session?prompt=p001&retryOf=s1");
  });

  // The headline number follows the session's weekly focus
  it("shows words a minute as the headline in pace week", async () => {
    // A finished first try in pace week
    const session = makeSession({ id: "s1", focus: "pace", wordsPerMinute: 162, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the headline
    expect(await screen.findByText("162 words a minute.")).toBeTruthy();
  });

  // The transcript can be read, with fillers marked
  it("shows the transcript with fillers marked", async () => {
    // A finished first try with fillers
    const session = makeSession({ id: "s1", transcript: "Um, I think it went well.", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Open the transcript
    await userEvent.click(await screen.findByRole("button", { name: "Read what I said" }));
    // Confirm the filler is marked
    expect(screen.getByText("Um").className).toContain("text-filler");
  });

  // A retry shows the before and after
  it("shows before and after for a retry", async () => {
    // The first try
    const first = makeSession({ id: "s1", focus: "cut-fillers", fillersPerMinute: 4.2, feedback: FEEDBACK, feedbackStatus: "done" });
    // The retry
    const retry = makeSession({ id: "s2", focus: "cut-fillers", retryOf: "s1", fillersPerMinute: 1.8, feedback: FEEDBACK, feedbackStatus: "done", createdAt: "2026-10-12T16:00:00.000Z" });
    // Draw the retry's page
    render(<SessionScreen sessionId="s2" repository={await repositoryWith(first, retry)} now={NOW} />);
    // Confirm the statement
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("From 4.2 to 1.8 fillers a minute.");
    // Confirm the finish action goes home
    expect(screen.getByRole("link", { name: /Finish/ }).getAttribute("href")).toBe("/");
  });

  // A warm-up leads into the full minute rather than a retry
  it("leads from a warm-up into the full minute", async () => {
    // A finished warm-up
    const session = makeSession({ id: "w1", mode: "warmup", promptId: "w001", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="w1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the masthead says it was a warm-up
    expect(await screen.findByText("Warm-up")).toBeTruthy();
    // Confirm the action goes to today's full prompt
    expect(screen.getByRole("link", { name: /Now the full minute/ }).getAttribute("href")).toBe(`/session?prompt=${promptForDay(NOW).id}`);
    // Confirm there is no retry
    expect(screen.queryByRole("link", { name: /Try it again/ })).toBeNull();
    // Confirm the cue introduces the full minute, not a retry
    expect(screen.getByText("Before the full minute")).toBeTruthy();
  });

  // A talk says how the timing went, and its retry is another talk
  it("shows the timing of a three-minute talk and retries as a talk", async () => {
    // A talk that ran 12 seconds over
    const session = makeSession({ id: "t1", mode: "talk", durationSec: 192, promptId: "p001", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="t1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the masthead names the kind of session
    expect(await screen.findByText("Three-minute talk")).toBeTruthy();
    // Confirm the timing line
    expect(screen.getByText("3:12 against a 3:00 goal, 12 seconds over.")).toBeTruthy();
    // Confirm the retry is another talk
    expect(screen.getByRole("link", { name: /Try it again/ }).getAttribute("href")).toBe("/session?mode=talk&prompt=p001&retryOf=t1");
  });

  // Offline, the page says feedback will come later and the session is safe
  it("explains feedback that cannot arrive yet", async () => {
    // Save a passphrase on this device
    savePassphrase("pass");
    // A session waiting for feedback
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "pending" });
    // A network that is offline
    const offline = vi.fn(async () => { throw new TypeError("offline"); });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={offline} />);
    // Confirm the explanation
    expect(await screen.findByText(/Feedback will arrive when you are back online/)).toBeTruthy();
  });

  // A new session asks the coach straight away and shows the feedback when it arrives
  it("asks for feedback for a waiting session and shows it", async () => {
    // Save a passphrase on this device
    savePassphrase("pass");
    // A session waiting for feedback
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "pending" });
    // A network that returns feedback
    const network = vi.fn(async () => Response.json({ feedback: FEEDBACK }));
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={network} />);
    // Confirm the feedback appears
    expect(await screen.findByText(FEEDBACK.retryCue)).toBeTruthy();
  });

  // Without a passphrase, the page says where to add it
  it("points to Settings when no passphrase is saved", async () => {
    // Make sure no passphrase is saved
    localStorage.clear();
    // A session waiting for feedback
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "pending" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={vi.fn()} />);
    // Confirm the pointer to Settings
    expect(await screen.findByText(/Add your passphrase in Settings/)).toBeTruthy();
  });

  // An unknown id is explained plainly
  it("explains a session that is not on this device", async () => {
    // Draw the screen for a missing id
    render(<SessionScreen sessionId="nope" repository={await repositoryWith()} now={NOW} />);
    // Confirm the explanation
    expect(await screen.findByText(/not on this device/)).toBeTruthy();
  });

  // A session with saved audio can be played back
  it("plays back the saved recording", async () => {
    // Stand in for the browser's object URLs
    const create = vi.fn(() => "blob:take");
    // Stand in for releasing them
    const revoke = vi.fn();
    // Install both stand-ins
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    // A session with audio
    const session = makeSession({ id: "s1", audioKey: "s1", feedback: FEEDBACK, feedbackStatus: "done" });
    // Repository holding it and its audio
    const repository = await repositoryWith(session);
    // Save the audio
    await repository.saveAudio("s1", new Blob(["sound"], { type: "audio/webm" }));
    // Draw the screen
    const { unmount } = render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
    // Confirm the player points at the recording
    expect((await screen.findByLabelText("Your recording")).getAttribute("src")).toBe("blob:take");
    // Close the screen
    unmount();
    // Confirm the address was released
    expect(revoke).toHaveBeenCalledWith("blob:take");
  });

  // Pruned audio shows no player
  it("shows no player when the audio is gone", async () => {
    // A session whose audio was pruned
    const session = makeSession({ id: "s1", audioKey: null, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Wait for the page
    await screen.findByText("You ended strongly.");
    // Confirm there is no player
    expect(screen.queryByLabelText("Your recording")).toBeNull();
  });
});
