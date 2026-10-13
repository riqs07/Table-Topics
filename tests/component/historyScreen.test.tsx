// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen } from "@testing-library/react";
// Load the screen being checked
import { HistoryScreen } from "@/components/screens/HistoryScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the sample sessions
import { sampleSessions } from "@/data/sampleData";

// A fixed "now"
const NOW = new Date(2026, 9, 13, 18);

// Remove the drawn screen after each check
afterEach(cleanup);

// Make a repository filled with the sample sessions
async function sampleRepository() {
  // Wrap an empty store
  const repository = createRepository(new MemoryStore());
  // Save every sample session
  for (const session of sampleSessions(NOW)) await repository.saveSession(session);
  // Hand it back
  return repository;
}

// Group the checks about the History screen
describe("HistoryScreen", () => {
  // With no sessions there is a plain empty state
  it("shows an empty state for a new user", async () => {
    // Draw the screen with no data
    render(<HistoryScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the empty line
    expect(await screen.findByText(/Nothing here yet/)).toBeTruthy();
  });

  // Progress since the first recording is one sentence
  it("opens with progress since the first recording", async () => {
    // Draw the screen with sample data
    render(<HistoryScreen repository={await sampleRepository()} now={NOW} />);
    // Confirm the sentence starts as expected
    expect(await screen.findByText(/^Since your first recording on 29 September, fillers/)).toBeTruthy();
  });

  // Each first try is listed, with its retry beside it, linking to the session
  it("lists sessions with retries paired and links to each", async () => {
    // Draw the screen with sample data
    render(<HistoryScreen repository={await sampleRepository()} now={NOW} />);
    // Find the list items
    const links = await screen.findAllByRole("link", { name: /Today|Yesterday|Sat|Sun|Mon|Tue|Wed|Thu|Fri|Sep|Oct/ });
    // Confirm one row per first try (8 days in the sample)
    expect(links).toHaveLength(8);
    // Confirm the newest row shows the first try and the retry
    expect(links[0]!.textContent).toMatch(/Today.*\d\.\d, then \d\.\d/);
    // Confirm it links to that session
    expect(links[0]!.getAttribute("href")).toBe("/sessions?id=sample-7");
  });

  // The first recording is labeled as such
  it("labels the first recording", async () => {
    // Draw the screen with sample data
    render(<HistoryScreen repository={await sampleRepository()} now={NOW} />);
    // Confirm the label
    expect(await screen.findByText("Your first recording")).toBeTruthy();
  });
});
