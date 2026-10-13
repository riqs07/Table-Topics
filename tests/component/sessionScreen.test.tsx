// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
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
    const session = makeSession({ id: "s1", fillersPerMinute: 4.2, feedback: FEEDBACK, feedbackStatus: "done", promptId: "p001" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the headline number
    expect(await screen.findByText("4.2 fillers a minute.")).toBeTruthy();
    // Confirm each part of the feedback
    for (const text of [FEEDBACK.keep, FEEDBACK.change, FEEDBACK.retryCue]) expect(screen.getByText(text)).toBeTruthy();
    // Confirm the retry action keeps the prompt and links back to this session
    expect(screen.getByRole("link", { name: /Try it again/ }).getAttribute("href")).toBe("/session?prompt=p001&retryOf=s1");
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
    const first = makeSession({ id: "s1", fillersPerMinute: 4.2, feedback: FEEDBACK, feedbackStatus: "done" });
    // The retry
    const retry = makeSession({ id: "s2", retryOf: "s1", fillersPerMinute: 1.8, feedback: FEEDBACK, feedbackStatus: "done", createdAt: "2026-10-12T16:00:00.000Z" });
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
  });

  // Feedback that has not arrived yet is explained
  it("explains feedback that is still on its way", async () => {
    // A session waiting for feedback
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "pending" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the explanation
    expect(await screen.findByText(/Feedback is on its way/)).toBeTruthy();
  });

  // An unknown id is explained plainly
  it("explains a session that is not on this device", async () => {
    // Draw the screen for a missing id
    render(<SessionScreen sessionId="nope" repository={await repositoryWith()} now={NOW} />);
    // Confirm the explanation
    expect(await screen.findByText(/not on this device/)).toBeTruthy();
  });
});
