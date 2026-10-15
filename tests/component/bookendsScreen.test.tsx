// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen } from "@testing-library/react";
// Load the screen being checked
import { BookendsScreen } from "@/components/screens/BookendsScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the day's openings and closings
import { bookendForDay } from "@/content/prompts";
// Load a sample talk builder
import { makeTalk } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Group the checks about the openings and closings page
describe("BookendsScreen", () => {
  // Today's opening and close, and the opening and close of each saved talk
  it("links to today's opening and close, and to each talk's first and last sections", async () => {
    // A repository with a talk in three sections
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveTalk(makeTalk({ body: "Hello.\n\nMiddle.\n\nThank you." }));
    // Draw the page
    render(<BookendsScreen repository={repository} now={NOW} />);
    // Confirm the four links
    expect([
      (await screen.findByRole("link", { name: bookendForDay(NOW, "opening").text })).getAttribute("href"),
      screen.getByRole("link", { name: bookendForDay(NOW, "close").text }).getAttribute("href"),
      (await screen.findByRole("link", { name: "Opening of “Team update”" })).getAttribute("href"),
      screen.getByRole("link", { name: "Close of “Team update”" }).getAttribute("href"),
    ]).toEqual([`/session?mode=bookend&prompt=${bookendForDay(NOW, "opening").id}`, `/session?mode=bookend&prompt=${bookendForDay(NOW, "close").id}`, "/session?mode=rehearse&prompt=talk-1&section=0&ladder=full", "/session?mode=rehearse&prompt=talk-1&section=2&ladder=full"]);
  });
});
