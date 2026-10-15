// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, within } from "@testing-library/react";
// Load the screen being checked
import { PracticeScreen } from "@/components/screens/PracticeScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the day's pickers
import { promptForDay, tableTopicForDay } from "@/content/prompts";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

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
    // Confirm the Table Topic and prepared answer start on today's prompts, and openings lead to their page
    expect([
      within(await section("Table Topic")).getByRole("link", { name: /Start/ }).getAttribute("href"),
      within(await section("Prepared answer")).getByRole("link", { name: /Start/ }).getAttribute("href"),
      within(await section("Openings and closings")).getByRole("link", { name: /Choose/ }).getAttribute("href"),
      !!within(await section("Table Topic")).getByText(/A light question appears/),
    ]).toEqual([`/session?mode=talk&prompt=${tableTopicForDay(NOW).id}`, `/session?mode=response&prompt=${promptForDay(NOW).id}`, "/bookends", true]);
  });

  // Q&A needs something to ask about
  it("explains Q&A until there is a rehearsal or prepared answer, then links to it", async () => {
    // Draw with nothing recorded
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the explanation
    expect(await screen.findByText(/after a rehearsal or a prepared answer/)).toBeTruthy();
    // Clear the page
    cleanup();
    // A repository with a prepared answer
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveSession(makeSession({ id: "r1", mode: "response" }));
    // Draw again
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Confirm the link
    expect((await screen.findByRole("link", { name: /Practise Q&A/ })).getAttribute("href")).toBe("/qa?from=r1");
  });
});
