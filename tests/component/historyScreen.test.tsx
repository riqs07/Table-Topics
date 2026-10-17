// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, within } from "@testing-library/react";
// Load the screen being checked
import { HistoryScreen } from "@/components/screens/HistoryScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the sample sessions
import { sampleSessions } from "@/data/sampleData";
// Load a sample session builder
import { makeSession, makeTalk } from "../support/fixtures";

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

  // The empty state offers one thing to do
  it("offers a first recording when there is nothing yet", async () => {
    // Draw the screen with no data
    render(<HistoryScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the one action leads to Today
    expect((await screen.findByRole("link", { name: "Record your first session" })).getAttribute("href")).toBe("/");
  });

  // The trend is labelled, so it reads without guessing
  it("labels the trend with what it measures and where it started and ended", async () => {
    // Draw the screen with sample data
    render(<HistoryScreen repository={await sampleRepository()} now={NOW} />);
    // The chart's caption
    const figure = within(await screen.findByRole("figure", { name: /Fillers a minute/ }));
    // Confirm the end labels
    expect([!!figure.getByText(/^First: \d+\.\d$/), !!figure.getByText(/^Latest: \d+\.\d$/)]).toEqual([true, true]);
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
    // Find the list items (not the menu's "Today", which is only that word)
    const links = await screen.findAllByRole("link", { name: /^(Today|Yesterday|Sat|Sun|Mon|Tue|Wed|Thu|Fri|\d+ (Sep|Oct))(?!$)/ });
    // Confirm one row per first try (8 full sessions and 1 warm-up in the sample)
    expect(links).toHaveLength(9);
    // Confirm the newest row shows the first try and the retry
    expect(links[0]!.textContent).toMatch(/Today.*\d\.\d, then \d\.\d/);
    // Confirm it links to that session
    expect(links[0]!.getAttribute("href")).toBe("/sessions?id=sample-7");
  });

  // Warm-ups are listed and marked, and do not change the progress sentence
  it("marks warm-ups in the list", async () => {
    // Make a repository with the sample sessions plus a warm-up today
    const repository = await sampleRepository();
    // Save a warm-up
    await repository.saveSession(makeSession({ id: "warm", createdAt: new Date(2026, 9, 13, 7).toISOString(), mode: "warmup", promptId: "w001", fillersPerMinute: 0 }));
    // Draw the screen
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Confirm both warm-ups (the sample's and this one) are marked
    expect(await screen.findAllByText(/^Warm-up: /)).toHaveLength(2);
  });

  // Both modes are marked in the list
  it("marks Table Topics and Record Responses in the list", async () => {
    // Make a repository with the sample sessions
    const repository = await sampleRepository();
    // Save one of each
    await repository.saveSession(makeSession({ id: "tt", createdAt: new Date(2026, 9, 13, 7).toISOString(), mode: "talk", promptId: "t001" }));
    // A Record Response
    await repository.saveSession(makeSession({ id: "rr", createdAt: new Date(2026, 9, 13, 8).toISOString(), mode: "response", promptId: "p002" }));
    // A read-aloud session
    await repository.saveSession(makeSession({ id: "ra", createdAt: new Date(2026, 9, 13, 9).toISOString(), mode: "read", promptId: "r001" }));
    // A pause drill
    await repository.saveSession(makeSession({ id: "pd", createdAt: new Date(2026, 9, 13, 10).toISOString(), mode: "pause", promptId: "d001" }));
    // A saved talk and a rehearsal of it
    await repository.saveTalk(makeTalk());
    // The rehearsal
    await repository.saveSession(makeSession({ id: "rh", createdAt: new Date(2026, 9, 13, 11).toISOString(), mode: "rehearse", promptId: "talk-1" }));
    // A lesson
    await repository.saveSession(makeSession({ id: "ls", createdAt: new Date(2026, 9, 13, 12).toISOString(), mode: "lesson", promptId: "l002" }));
    // Draw the screen
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Confirm all three labels, plus a pause drill
    expect([!!(await screen.findByText(/^Table Topic: /)), !!screen.getByText(/^Prepared speech: /), !!screen.getByText("Read aloud: The Gettysburg Address"), !!screen.getByText(/^Pause drill: /), !!(await screen.findByText("Rehearsal: Team update")), !!screen.getByText("Lesson 2: Crisp consonants")]).toEqual([true, true, true, true, true, true]);
  });

  // The first recording is labeled as such
  it("labels the first recording", async () => {
    // Draw the screen with sample data
    render(<HistoryScreen repository={await sampleRepository()} now={NOW} />);
    // Confirm the label
    expect(await screen.findByText("Your first recording")).toBeTruthy();
  });
});
