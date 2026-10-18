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
  // Every kind of practice is a row in a group, leading to its own screen
  it("lists every kind of practice in groups, each leading to its own screen", async () => {
    // Draw the page
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // A group's rows as [name, address]
    const rows = async (name: string) => within((await screen.findByRole("heading", { name })).closest("section") as HTMLElement).getAllByRole("link").map((link) => [link.querySelector(".font-display")?.textContent, link.getAttribute("href")]);
    // Confirm the groups and where each row leads
    expect([await rows("Everyday conversation"), await rows("Build a skill"), (await rows("Speak on the spot")).slice(0, 3)]).toEqual([
      [["Answering", "/small-talk#answering"], ["Asking", "/small-talk#asking"], ["Listening", "/small-talk#listening"], ["One moment a day", "/session?mode=moment&prompt=moment"]],
      [["Lessons", "/skills#lessons"], ["Read aloud", "/skills#readings"], ["Pause drills", "/skills#pause-drills"], ["Tricky words", "/skills#tricky-words"]],
      [["Table Topic", `/session?mode=talk&prompt=${tableTopicForDay(NOW, 1).id}`], ["Prepared speech", `/session?mode=response&prompt=${promptForDay(NOW, 1).id}`], ["Openings and closings", "/bookends"]],
    ]);
  });

  // Q&A needs something to ask about
  it("explains Q&A until there is a rehearsal or prepared speech, then links to it", async () => {
    // Draw with nothing recorded
    render(<PracticeScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the explanation, on a row that is not a link
    expect((await screen.findByText(/Opens after a prepared speech/)).closest("a")).toBeNull();
    // Clear the page
    cleanup();
    // A repository with a prepared speech
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveSession(makeSession({ id: "r1", mode: "response" }));
    // Draw again
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Confirm the link
    expect((await screen.findByRole("link", { name: /Q&A practice/ })).getAttribute("href")).toBe("/qa?from=r1");
  });

  // Your talks are hidden for now: no section and no way in from here
  it("does not list your talks", async () => {
    // A repository with a saved talk
    const repository = createRepository(new MemoryStore());
    // The talk
    await repository.saveTalk(makeTalk({ id: "pitch", title: "Pitch", eventDate: "2026-10-17" }));
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Wait for the page
    await screen.findByRole("heading", { name: "Speak on the spot" });
    // Confirm no talks section and no link to rehearse
    expect([screen.queryByRole("region", { name: "Your talks" }), screen.queryByText("Pitch"), screen.queryAllByRole("link").some((link) => link.getAttribute("href") === "/rehearse")]).toEqual([null, null, false]);
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
