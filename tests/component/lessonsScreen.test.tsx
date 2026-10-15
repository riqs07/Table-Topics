// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen } from "@testing-library/react";
// Load the screens being checked
import { LessonsScreen } from "@/components/screens/LessonsScreen";
import { LibraryScreen } from "@/components/screens/LibraryScreen";
// Load the content they list
import { LESSONS } from "@/content/lessons";
import { PASSAGES, PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Group the checks about the skill path page
describe("LessonsScreen", () => {
  // Every lesson is open from the start, with a link to practise it
  it("lists every lesson, all open, linked to practise", async () => {
    // Draw the screen
    render(<LessonsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Find the practise links
    const links = await screen.findAllByRole("link", { name: /^Practise / });
    // Confirm one per lesson, each pointing at its lesson
    expect(links.map((link) => link.getAttribute("href"))).toEqual(LESSONS.map((lesson) => `/session?mode=lesson&prompt=${lesson.id}`));
  });

  // Each lesson shows how often it has been practised
  it("shows how often each lesson has been practised", async () => {
    // A repository with two sessions of lesson 2
    const repository = createRepository(new MemoryStore());
    // The first
    await repository.saveSession(makeSession({ id: "a", mode: "lesson", promptId: "l002" }));
    // The second
    await repository.saveSession(makeSession({ id: "b", mode: "lesson", promptId: "l002", createdAt: "2026-10-13T15:00:00.000Z" }));
    // Draw the screen
    render(<LessonsScreen repository={repository} now={NOW} />);
    // Confirm the count
    expect(await screen.findByText("Practised 2 times")).toBeTruthy();
  });
});

// Group the checks about the practice library page
describe("LibraryScreen", () => {
  // Speeches, passages, pause drills and tricky words, each linked to the right kind of session
  it("lists everything to read, linked to the right kind of session", async () => {
    // Draw the screen
    render(<LibraryScreen />);
    // Every link's address
    const hrefs = (await screen.findAllByRole("link")).map((link) => link.getAttribute("href"));
    // Confirm passages and word lists open as readings, drills as pause drills
    expect([PASSAGES.every((passage) => hrefs.includes(`/session?mode=read&prompt=${passage.id}`)), TRICKY_WORDS.every((list) => hrefs.includes(`/session?mode=read&prompt=${list.id}`)), PAUSE_DRILLS.every((drill) => hrefs.includes(`/session?mode=pause&prompt=${drill.id}`))]).toEqual([true, true, true]);
  });
});
