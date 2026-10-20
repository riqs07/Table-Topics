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
import { PAUSE_DRILLS, TRICKY_WORDS, promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the lessons
import { LESSONS } from "@/content/lessons";
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
    // Wait until the lessons row leads straight into the next lesson (decision 67)
    await waitFor(async () => expect((await rows("Build a skill"))[1]?.[1]).toBe(`/session?mode=lesson&prompt=${LESSONS[0]?.id}`));
    // Confirm the groups and where each row leads ("See all" first in Build a skill)
    expect([await rows("Everyday conversation"), await rows("Your voice"), await rows("Build a skill"), (await rows("Speak on the spot")).slice(0, 3)]).toEqual([
      [["Talk with someone", "/conversations"], ["Answering", "/small-talk/unit?id=answering"], ["Asking", "/small-talk/unit?id=asking"], ["Listening", "/small-talk/unit?id=listening"], ["Responding to news", "/small-talk/unit?id=news"], ["One moment a day", "/session?mode=moment&prompt=moment"]],
      [[undefined, "/voice"], ["Warm-up", "/voice/warmup"], ["Clear sounds", "/voice/drill?id=c01"], ["Tricky words", `/session?mode=read&prompt=${TRICKY_WORDS[0]?.id}`], ["Volume", "/voice/drill?id=v01"], ["Pitch and stress", "/voice/drill?id=p01"], ["Tone", "/voice/drill?id=t01"], ["Pausing", `/session?mode=pause&prompt=${PAUSE_DRILLS[0]?.id}`], ["Shadowing", "/voice/shadow?id=s01"]],
      [[undefined, "/skills"], ["Lessons", `/session?mode=lesson&prompt=${LESSONS[0]?.id}`], ["Read aloud", "/skills#readings"]],
      [["Rapid Fire", `/session?mode=talk&prompt=${tableTopicForDay(NOW, 1).id}`], ["Prepared speech", `/session?mode=response&prompt=${promptForDay(NOW, 1).id}`], ["Openings and closings", "/bookends"]],
    ]);
  });

  // Q&A practice is removed (decision 61): no row, even after a prepared speech
  it("does not offer Q&A practice", async () => {
    // A repository with a prepared speech
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveSession(makeSession({ id: "r1", mode: "response" }));
    // Draw the page
    render(<PracticeScreen repository={repository} now={NOW} />);
    // Wait for the page to draw
    await screen.findByRole("link", { name: /^Rapid Fire/ });
    // Confirm there is no Q&A row
    expect(screen.queryByText(/Q&A/)).toBeNull();
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
