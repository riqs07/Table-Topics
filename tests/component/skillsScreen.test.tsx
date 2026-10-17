// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, within } from "@testing-library/react";
// Load the screen being checked
import { SkillsScreen } from "@/components/screens/SkillsScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample session builder
import { makeSession } from "../support/fixtures";
// Load the content
import { LESSONS } from "@/content/lessons";
import { PASSAGES, PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// Group the checks about the Skills page
describe("SkillsScreen", () => {
  // Lessons, readings, pause drills and tricky words in one place, with a jump list at the top
  it("puts lessons and every reading in one place", async () => {
    // Draw the page
    render(<SkillsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Every practice link on the page
    const hrefs = (await screen.findAllByRole("link")).map((link) => link.getAttribute("href"));
    // Confirm every lesson and text is there, and the jump links
    expect([
      LESSONS.every((lesson) => hrefs.includes(`/session?mode=lesson&prompt=${lesson.id}`)),
      [...PASSAGES, ...TRICKY_WORDS].every((item) => hrefs.includes(`/session?mode=read&prompt=${item.id}`)),
      PAUSE_DRILLS.every((item) => hrefs.includes(`/session?mode=pause&prompt=${item.id}`)),
      ["#lessons", "#readings", "#pause-drills", "#tricky-words"].every((anchor) => hrefs.includes(anchor)),
    ]).toEqual([true, true, true, true]);
  });

  // The lessons read as a path: practised ones done, the first one not done marked next
  it("marks lessons done and the next one to try", async () => {
    // A repository where lesson one has been practised
    const repository = createRepository(new MemoryStore());
    // Lesson one, once
    await repository.saveSession(makeSession({ id: "l", mode: "lesson", promptId: LESSONS[0]!.id }));
    // Draw the screen
    render(<SkillsScreen repository={repository} now={NOW} />);
    // The first two lesson rows
    const first = within(await screen.findByRole("link", { name: `Practise ${LESSONS[0]!.title}` }));
    // (and the second)
    const second = within(screen.getByRole("link", { name: `Practise ${LESSONS[1]!.title}` }));
    // Confirm the marks
    expect([!!(await first.findByText("Done")), !!second.getByText("Next")]).toEqual([true, true]);
  });

  // The famous speeches are cards in a named list, each showing who gave it
  it("shows the short readings as a named list of cards", async () => {
    // Draw the screen
    render(<SkillsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // The list
    const list = within(await screen.findByRole("list", { name: "Short readings" }));
    // Every speech, each with its speaker in the card
    const speeches = PASSAGES.filter((passage) => passage.kind === "speech");
    // Confirm one card per speech, and the first names its speaker
    expect([list.getAllByRole("listitem").length, list.getAllByRole("link")[0]?.textContent?.includes(speeches[0]?.source ?? "?")]).toEqual([speeches.length, true]);
  });

  // The full speeches and commencement speeches are listed, each opening its own page, with progress
  it("lists whole speeches and commencement speeches, with progress", async () => {
    // A repository where the first part of Kennedy's inaugural has been read
    const repository = createRepository(new MemoryStore());
    // Part 1, once
    await repository.saveSession(makeSession({ id: "a", mode: "read", promptId: "jfk-inaugural-1" }));
    // Draw the screen
    render(<SkillsScreen repository={repository} now={NOW} />);
    // The two lists
    const whole = within(await screen.findByRole("list", { name: "Whole speeches, a part at a time" }));
    // (and the commencement speeches)
    const commencement = within(screen.getByRole("list", { name: "Commencement speeches" }));
    // Kennedy's inaugural card
    const inaugural = whole.getByRole("link", { name: /Inaugural Address.*John F\. Kennedy/ });
    // Confirm the link, the progress, and a commencement address
    expect([inaugural.getAttribute("href"), inaugural.textContent?.includes("1 read"), !!commencement.getByRole("link", { name: /A Strategy of Peace/ })]).toEqual(["/speech?id=jfk-inaugural", true, true]);
  });
});
