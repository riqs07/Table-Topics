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
import { PASSAGES, PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";

// A fixed "now"
const NOW = new Date(2026, 9, 15, 10);

// Load the whole speeches
import { FULL_SPEECHES } from "@/content/speeches";

// Remove the drawn screen after each check
afterEach(cleanup);

// Group the checks about the Read aloud page (at /skills)
describe("SkillsScreen", () => {
  // Every reading in one place: the next part to read first, then one folded row per group (decision 79); the lessons live in Learn now (decision 107)
  it("puts every reading in one place, folded by group, with no lessons", async () => {
    // Draw the page
    const { container } = render(<SkillsScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Every practice link on the page (folded lists are still in the page)
    const hrefs = (await screen.findAllByRole("link")).map((link) => link.getAttribute("href"));
    // The up-next rows
    const upNext = within(screen.getByRole("region", { name: "Up next" })).getAllByRole("link").map((link) => link.getAttribute("href"));
    // Confirm the page's name, every text is there and no lesson or drill, the groups start folded under the ids other pages link to, and up next is the first whole speech's part 1
    expect([
      screen.getByRole("heading", { level: 1 }).textContent,
      PASSAGES.every((item) => hrefs.includes(`/session?mode=read&prompt=${item.id}`)),
      hrefs.some((href) => href?.includes("mode=lesson")),
      [...PAUSE_DRILLS, ...TRICKY_WORDS].some((item) => hrefs.some((href) => href?.endsWith(`prompt=${item.id}`))),
      ["readings", "short-readings"].every((id) => container.querySelector(`details#${id}:not([open])`) !== null),
      upNext,
    ]).toEqual(["Read aloud", true, false, false, true, [`/session?mode=read&prompt=${FULL_SPEECHES.find((speech) => !speech.commencement)!.id}-1`]]);
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
