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
import { drillForDay, passageForDay, promptForDay, tableTopicForDay } from "@/content/prompts";
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
    expect(screen.getByText(/Your first Record Response becomes your starting point/)).toBeTruthy();
    // Confirm the first weekly challenge
    expect(screen.getByText(CHALLENGES[0]!.text.charAt(0).toLowerCase() + CHALLENGES[0]!.text.slice(1))).toBeTruthy();
  });

  // The main action records a response to today's prompt
  it("links the main action to a Record Response on today's prompt", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Find the action
    const action = await screen.findByRole("link", { name: /Record a response/ });
    // Confirm it points at a Record Response with the prompt id
    expect(action.getAttribute("href")).toBe(`/session?mode=response&prompt=${promptForDay(NOW).id}`);
  });

  // The other mode is a Table Topic on a light question, kept hidden until it starts
  it("offers a Table Topic without showing its question", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Find the Table Topic action
    const talk = await screen.findByRole("link", { name: /Table Topic/ });
    // Confirm it starts today's Table Topic, and its question is not on the page
    expect([talk.getAttribute("href"), screen.queryByText(tableTopicForDay(NOW).text)]).toEqual([`/session?mode=talk&prompt=${tableTopicForDay(NOW).id}`, null]);
  });

  // Reading aloud is offered on today's passage
  it("offers reading aloud", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Find the read-aloud action
    const read = await screen.findByRole("link", { name: /Read aloud/ });
    // Confirm it starts today's passage
    expect(read.getAttribute("href")).toBe(`/session?mode=read&prompt=${passageForDay(NOW).id}`);
  });

  // The drills: a pause drill on today's drill passage, and rehearsing your own talk
  it("offers the pause drill and Rehearse my talk", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Confirm both links
    expect([(await screen.findByRole("link", { name: /pause drill/ })).getAttribute("href"), screen.getByRole("link", { name: /rehearse my talk/ }).getAttribute("href")]).toEqual([`/session?mode=pause&prompt=${drillForDay(NOW).id}`, "/rehearse"]);
  });

  // The warm-up and the one-minute session are retired from the home screen
  it("offers only the current modes", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Wait for the page
    await screen.findByRole("link", { name: /Record a response/ });
    // Confirm the old options are gone
    expect([screen.queryByRole("link", { name: /warm up/ }), screen.queryByRole("link", { name: /Speak for a minute/ })]).toEqual([null, null]);
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
    expect(screen.getByRole("link", { name: /Record a response/ }).getAttribute("href")).toBe(`/session?mode=response&prompt=${promptForDay(NOW, 1).id}`);
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
