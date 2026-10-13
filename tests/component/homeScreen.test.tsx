// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, waitFor } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { HomeScreen } from "@/components/screens/HomeScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the prompt and challenge pickers
import { promptForDay, warmupPromptForDay } from "@/content/prompts";
import { CHALLENGES } from "@/content/challenges";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now": Tuesday 13 October 2026, mid-morning
const NOW = new Date(2026, 9, 13, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Make an empty repository
const emptyRepository = () => createRepository(new MemoryStore());

// Group the checks about the Home screen
describe("HomeScreen", () => {
  // A new user sees today's prompt, a welcome line, and the first challenge
  it("shows today's prompt and a first-time line for a new user", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Confirm today's prompt is the main heading
    expect(await screen.findByRole("heading", { level: 1 })).toHaveProperty("textContent", promptForDay(NOW).text);
    // Confirm the first-time line
    expect(screen.getByText(/Your first recording becomes your starting point/)).toBeTruthy();
    // Confirm the first weekly challenge
    expect(screen.getByText(CHALLENGES[0]!.text.charAt(0).toLowerCase() + CHALLENGES[0]!.text.slice(1))).toBeTruthy();
  });

  // The action takes the user to record with today's prompt
  it("links the action to recording with today's prompt", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Find the action
    const action = await screen.findByRole("link", { name: /Speak for a minute/ });
    // Confirm it points at the session page with the prompt id
    expect(action.getAttribute("href")).toBe(`/session?prompt=${promptForDay(NOW).id}`);
  });

  // A quieter option starts a 30-second warm-up on today's warm-up prompt
  it("offers a 30-second warm-up", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Find the warm-up link
    const warmup = await screen.findByRole("link", { name: /warm up for 30 seconds/ });
    // Confirm it starts a warm-up with today's warm-up prompt
    expect(warmup.getAttribute("href")).toBe(`/session?mode=warmup&prompt=${warmupPromptForDay(NOW).id}`);
  });

  // A returning user sees the streak as a sentence
  it("writes the streak as a sentence", async () => {
    // Make a repository with sessions on the last three days
    const repository = emptyRepository();
    // Save three sessions on consecutive days ending today
    for (const [index, day] of [11, 12, 13].entries()) await repository.saveSession(makeSession({ id: `s${index}`, createdAt: new Date(2026, 9, day, 9).toISOString(), isBaseline: index === 0 }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm the streak sentence
    expect(await screen.findByText(/Third day running\./)).toBeTruthy();
  });

  // "Or choose another" swaps the prompt and the link follows
  it("swaps to another prompt", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Ask for another prompt
    await userEvent.click(await screen.findByRole("button", { name: /choose another/ }));
    // Confirm the heading changed to the next prompt
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(promptForDay(NOW, 1).text);
    // Confirm the link follows
    expect(screen.getByRole("link", { name: /Speak for a minute/ }).getAttribute("href")).toBe(`/session?prompt=${promptForDay(NOW, 1).id}`);
  });

  // Ticking the challenge saves it as done
  it("marks the weekly challenge done", async () => {
    // Make a repository
    const repository = emptyRepository();
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Tick the challenge
    await userEvent.click(await screen.findByRole("checkbox"));
    // Confirm it is saved with a completion time
    await waitFor(async () => expect((await repository.listChallenges())[0]?.completedAt).toBe(NOW.toISOString()));
    // Confirm the box shows as ticked
    expect(screen.getByRole("checkbox")).toHaveProperty("checked", true);
  });

  // When a week has passed, the next focus is shown and saved
  it("moves to the next weekly focus after seven days", async () => {
    // Make a repository whose focus began eight days ago
    const repository = emptyRepository();
    // Save settings with the first focus started eight days ago
    await repository.saveSettings({ focusIndex: 0, focusStartedOn: new Date(2026, 9, 5).toISOString(), audioRetention: 30 });
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm the second focus is shown
    expect(await screen.findByText(/cut filler words/i)).toBeTruthy();
    // Confirm the advance was saved
    await waitFor(async () => expect((await repository.getSettings(NOW)).focusIndex).toBe(1));
  });
});
