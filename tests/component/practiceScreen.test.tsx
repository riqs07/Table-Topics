// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screen being checked
import { PracticeScreen } from "@/components/screens/PracticeScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the day's pickers
import { promptForDay, tableTopicForDay } from "@/content/prompts";
// Load a sample session builder
import { makeSession, makeTalk } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Group the checks about the Practice page
describe("PracticeScreen", () => {
  // Every on-the-spot mode is listed with what it is, how long, and where to start
  it("lists every on-the-spot mode with a description and a start", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Each mode's section, by its heading
    const section = async (name: string) => (await screen.findByRole("heading", { name })).closest("section") as HTMLElement;
    // Confirm the Table Topic and prepared speech start on today's prompts, and openings lead to their page
    expect([
      within(await section("Table Topic")).getByRole("link", { name: /Start/ }).getAttribute("href"),
      within(await section("Prepared speech")).getByRole("link", { name: /Start/ }).getAttribute("href"),
      within(await section("Openings and closings")).getByRole("link", { name: /Choose/ }).getAttribute("href"),
      !!within(await section("Table Topic")).getByText(/A light question appears/),
    ]).toEqual([`/session?mode=talk&prompt=${tableTopicForDay(NOW).id}`, `/session?mode=response&prompt=${promptForDay(NOW).id}`, "/bookends", true]);
  });

  // Q&A needs something to ask about
  it("explains Q&A until there is a rehearsal or prepared speech, then links to it", async () => {
    // Draw with nothing recorded
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the explanation
    expect(await screen.findByText(/after a rehearsal or a prepared speech/)).toBeTruthy();
    // Clear the page
    cleanup();
    // A repository with a prepared speech
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveSession(makeSession({ id: "r1", mode: "response" }));
    // Draw again
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Confirm the link
    expect((await screen.findByRole("link", { name: /Practise Q&A/ })).getAttribute("href")).toBe("/qa?from=r1");
  });

  // "Or choose another" swaps the prepared-answer task, and the start link follows
  it("swaps to another prepared-answer task", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Ask for another
    fireEvent.click(await screen.findByRole("button", { name: /choose another/ }));
    // Confirm the task and the link follow
    expect([!!screen.getByText(`“${promptForDay(NOW, 1).text}”`), screen.getByRole("link", { name: "Start a prepared speech" }).getAttribute("href")]).toEqual([true, `/session?mode=response&prompt=${promptForDay(NOW, 1).id}`]);
  });

  // Each mode is its own card, named by its heading, so the page reads as four choices
  it("shows each mode as a card named by its heading", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Wait for the page
    await screen.findByRole("heading", { name: "Table Topic" });
    // Confirm your talks first, then the four cards, in order
    expect(screen.getAllByRole("region").map((card) => card.getAttribute("aria-labelledby"))).toEqual(["your-talks", "table-topic", "prepared", "openings", "qa"]);
  });

  // Your talks come first: each saved talk with its date, and a way to add one (what used to be the Talks tab)
  it("lists your talks first, with a way to add one", async () => {
    // A repository with a talk in two days
    const repository = createRepository(new MemoryStore());
    // The talk
    await repository.saveTalk(makeTalk({ id: "pitch", title: "Pitch", eventDate: "2026-10-17" }));
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // The rows
    const rows = within(await screen.findByRole("region", { name: "Your talks" })).findAllByRole("link");
    // Confirm the talk, its date, and the way to add one
    expect((await rows).map((row) => [row.textContent, row.getAttribute("href")])).toEqual([["Pitchin 2 days", "/talk?id=pitch"], ["Add a talk, or rehearse one", "/rehearse"]]);
  });

  // This week's challenge off the page lives here, and ticking it saves it as done
  it("marks the weekly challenge done", async () => {
    // A repository
    const repository = createRepository(new MemoryStore());
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Tick the challenge
    fireEvent.click(await screen.findByRole("checkbox"));
    // Confirm it is saved with a completion time, and shows as ticked
    await waitFor(async () => expect([(await repository.listChallenges())[0]?.completedAt, (screen.getByRole("checkbox") as HTMLInputElement).checked]).toEqual([NOW.toISOString(), true]));
  });
});
