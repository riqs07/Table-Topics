// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screen being checked
import { TalkScreen } from "@/components/screens/TalkScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load sample record builders
import { makeSession, makeTalk } from "../support/fixtures";

// A fixed "now": Thursday 15 October 2026, mid-morning
const NOW = new Date(2026, 9, 15, 10);

// A talk in three sections
const BODY = "Good evening, everyone.\n\nWe grew from four people to forty.\n\nSo here is my ask. Join us.";

// Remove the drawn screen after each check
afterEach(cleanup);

// A repository holding one talk, plus any sessions
async function repositoryWith(talk = makeTalk({ body: BODY }), sessions: ReturnType<typeof makeSession>[] = []) {
  // An empty repository
  const repository = createRepository(new MemoryStore());
  // Save the talk
  await repository.saveTalk(talk);
  // Save each session
  for (const session of sessions) await repository.saveSession(session);
  // Hand it back
  return repository;
}

// Group the checks about a talk's page
describe("TalkScreen", () => {
  // A dated talk shows the days left, today's step, and links that open the right rehearsal
  it("shows today's step with progress and rehearsal links", async () => {
    // Two days out; the opening was rehearsed once today
    const repository = await repositoryWith(makeTalk({ body: BODY, eventDate: "2026-10-18" }), [makeSession({ id: "s1", mode: "rehearse", promptId: "talk-1", sectionIndex: 0, createdAt: new Date(2026, 9, 15, 9).toISOString() })]);
    // Draw the page
    render(<TalkScreen talkId="talk-1" repository={repository} now={NOW} />);
    // Confirm the headline (three days: opening and close, then keywords, then the full rehearsal)
    expect(await screen.findByText("Your talk is in 3 days. Today: rehearse the opening and the close, twice each.")).toBeTruthy();
    // Today's tasks
    const today = screen.getByRole("list", { name: "Today" });
    // Confirm each task's progress and link
    expect(within(today).getAllByRole("listitem").map((item) => [...Array.from(item.children).map((part) => part.textContent), within(item).getByRole("link").getAttribute("href")])).toEqual([
      ["The opening", "1 of 2", "Rehearse", "/session?mode=rehearse&prompt=talk-1&section=0&ladder=full"],
      ["The close", "0 of 2", "Rehearse", "/session?mode=rehearse&prompt=talk-1&section=2&ladder=full"],
    ]);
  });

  // A talk without a date can be given one, and the plan appears
  it("sets a date and shows the plan", async () => {
    // A talk with no date
    const repository = await repositoryWith();
    // Draw the page
    render(<TalkScreen talkId="talk-1" repository={repository} now={NOW} />);
    // Pick a date a week out
    fireEvent.change(await screen.findByLabelText("Date of the talk"), { target: { value: "2026-10-22" } });
    // Save it
    fireEvent.click(screen.getByRole("button", { name: "Save date" }));
    // Confirm the plan and the saved date
    expect([!!(await screen.findByText(/Your talk is in 7 days/)), (await repository.getTalk("talk-1"))?.eventDate]).toEqual([true, "2026-10-22"]);
  });

  // A date that has passed says so, and practice stays open
  it("says when the date has passed", async () => {
    // A talk dated yesterday
    const repository = await repositoryWith(makeTalk({ body: BODY, eventDate: "2026-10-14" }));
    // Draw the page
    render(<TalkScreen talkId="talk-1" repository={repository} now={NOW} />);
    // Confirm the note and the open practice links
    expect([!!(await screen.findByText(/The date has passed/)), !!screen.getByRole("link", { name: /Rehearse\s*section 2/ })]).toEqual([true, true]);
  });

  // Whole run-throughs are listed with their length against the goal
  it("shows how long each whole run took", async () => {
    // Two whole runs and a section run
    const repository = await repositoryWith(makeTalk({ body: BODY, goalMinutes: 5 }), [
      makeSession({ id: "a", mode: "rehearse", promptId: "talk-1", durationSec: 341, createdAt: new Date(2026, 9, 12, 9).toISOString() }),
      makeSession({ id: "b", mode: "rehearse", promptId: "talk-1", durationSec: 298, createdAt: new Date(2026, 9, 14, 9).toISOString() }),
      makeSession({ id: "c", mode: "rehearse", promptId: "talk-1", sectionIndex: 1, durationSec: 60 }),
    ]);
    // Draw the page
    render(<TalkScreen talkId="talk-1" repository={repository} now={NOW} />);
    // The run-time table
    const runs = await screen.findByRole("table", { name: "Run-throughs" });
    // Confirm two runs, oldest first, with their times and the goal
    expect([within(runs).getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell").at(-1)?.textContent), !!screen.getByText("Goal 5:00")]).toEqual([["5:41", "4:58"], true]);
  });

  // A talk that is not on this device
  it("explains when the talk is missing", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw the page
    render(<TalkScreen talkId="nope" repository={repository} now={NOW} />);
    // Confirm the note and the way back
    await waitFor(() => expect([!!screen.getByText(/not on this device/), screen.getByRole("link", { name: "Back to your talks" }).getAttribute("href")]).toEqual([true, "/rehearse"]));
  });

  // A store that cannot be read is explained, instead of an empty page forever
  it("explains when the talk cannot be loaded", async () => {
    // A repository whose sessions cannot be read
    const repository = { ...createRepository(new MemoryStore()), listSessions: async () => { throw new Error("The database connection is closing."); } };
    // Draw the page
    render(<TalkScreen talkId="t1" repository={repository} now={NOW} />);
    // The reason, and the way back
    expect([(await screen.findByRole("alert")).textContent?.includes("The database connection is closing."), screen.getByRole("link", { name: "Back to your talks" }).getAttribute("href")]).toEqual([true, "/rehearse"]);
  });
});
