// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { HomeScreen } from "@/components/screens/HomeScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the day's pickers
import { bookendForDay, promptForDay } from "@/content/prompts";
// Load a sample session builder
import { makeSession, makeTalk } from "../support/fixtures";

// A fixed "now": Tuesday 13 October 2026, mid-morning
const NOW = new Date(2026, 9, 13, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Make an empty repository
const emptyRepository = () => createRepository(new MemoryStore());

// Group the checks about the Home screen
describe("HomeScreen", () => {
  // A new user is pointed at a first prepared answer, with the reason
  it("starts a new user with a prepared answer, and says why", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Confirm the task is the main heading, the reason, and where the main action leads
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, !!screen.getByText(/becomes your starting point/), screen.getByRole("link", { name: /^Start/ }).getAttribute("href")]).toEqual([promptForDay(NOW).text, true, `/session?mode=response&prompt=${promptForDay(NOW).id}`]);
  });

  // A talk with a date comes first, and a past date does not count
  it("puts the next talk with a date first", async () => {
    // A repository with a talk a week away and one whose date has passed
    const repository = emptyRepository();
    // A week away
    await repository.saveTalk(makeTalk({ id: "soon", title: "Pitch", eventDate: "2026-10-20" }));
    // Already given
    await repository.saveTalk(makeTalk({ id: "past", title: "Old toast", eventDate: "2026-10-01" }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm today's step is the heading and the main action opens the talk's plan
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, screen.getByRole("link", { name: /^Open today’s plan/ }).getAttribute("href"), screen.queryByText(/Old toast/)]).toEqual(["Your talk is in 7 days. Today: rehearse each section once, with the text.", "/talk?id=soon", null]);
  });

  // After the first session, the week's focus picks the mode
  it("recommends the mode that trains this week's focus", async () => {
    // A repository with one earlier session, in the first focus week (strong opening)
    const repository = emptyRepository();
    // The session
    await repository.saveSession(makeSession({ id: "s1", createdAt: new Date(2026, 9, 12, 9).toISOString() }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm the opening drill is recommended
    expect([(await screen.findByText("Opening drill · 45 seconds")) !== null, screen.getByRole("link", { name: /^Start/ }).getAttribute("href")]).toEqual([true, `/session?mode=bookend&prompt=${bookendForDay(NOW, "opening").id}`]);
  });

  // The three jobs are always one tap away, each with a line on what it covers
  it("offers the three jobs", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // The jobs list
    const jobs = await screen.findByRole("list", { name: "Or choose" });
    // Confirm each link
    expect(within(jobs).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/rehearse", "/practice", "/skills"]);
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
    expect((await screen.findAllByText(/clear structure/i)).length).toBeGreaterThan(0);
    // Confirm the advance was saved
    await waitFor(async () => expect((await repository.getSettings(NOW)).focusIndex).toBe(1));
  });
});
