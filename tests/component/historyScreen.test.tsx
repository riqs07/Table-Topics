// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, within } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
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
    // Confirm the empty line, a real main heading even when empty, and the way back to Settings, where History is reached from (round 4)
    expect([!!(await screen.findByText(/Nothing here yet/)), screen.getByRole("heading", { level: 1 }).textContent, screen.getByRole("link", { name: "Back to Settings" }).getAttribute("href")]).toEqual([true, "History", "/settings"]);
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
    const figure = within(await screen.findByRole("figure", { name: /Pause words a minute/ }));
    // Confirm the end labels
    expect([!!figure.getByText(/^First: \d+\.\d a minute$/), !!figure.getByText(/^Latest: \d+\.\d a minute$/)]).toEqual([true, true]);
  });

  // Progress since the first recording is one sentence
  it("opens with progress since the first recording", async () => {
    // Draw the screen with sample data
    render(<HistoryScreen repository={await sampleRepository()} now={NOW} />);
    // Confirm the sentence starts as expected
    expect(await screen.findByText(/^Since your first recording on 29 September, pause words/)).toBeTruthy();
  });

  // Each first try is listed, with its retry beside it, linking to the session; the list can show speaking or reading only (decision 79)
  it("lists sessions with retries paired and links to each", async () => {
    // Draw the screen with sample data
    render(<HistoryScreen repository={await sampleRepository()} now={NOW} />);
    // The rows in the sessions list
    const links = within(await screen.findByRole("list", { name: "Sessions" })).getAllByRole("link");
    // Confirm one row per first try (8 full sessions and 1 warm-up in the sample)
    expect(links).toHaveLength(9);
    // Confirm the newest row shows the first try and the retry, with the unit
    expect(links[0]!.textContent).toMatch(/Today · tried twice\d\.\d, then \d\.\dpause words a minute/);
    // Confirm it links to that session
    expect(links[0]!.getAttribute("href")).toBe("/sessions?id=sample-7");
    // Reading aloud only: none in the sample
    await userEvent.click(screen.getByRole("button", { name: "Reading aloud" }));
    // Confirm the empty line
    expect(within(screen.getByRole("list", { name: "Sessions" })).getByText("Nothing of this kind yet.")).toBeTruthy();
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
  it("marks Rapid Fire answers and Record Responses in the list", async () => {
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
    // An old closing drill, from before the drill was retired (decision 106)
    await repository.saveSession(makeSession({ id: "bk", createdAt: new Date(2026, 9, 13, 13).toISOString(), mode: "bookend", promptId: "b011" }));
    // Draw the screen
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Confirm all three labels, plus a pause drill
    expect([!!(await screen.findByText(/^Rapid Fire: /)), !!screen.getByText(/^Prepared speech: /), !!screen.getByText("Read aloud: The Gettysburg Address"), !!screen.getByText(/^Pause drill: /), !!(await screen.findByText("Rehearsal: Team update")), !!screen.getByText("Lesson 2: Crisp consonants"), !!screen.getByText("Closing drill: Close a talk asking your team to try a new tool.")]).toEqual([true, true, true, true, true, true, true]);
  });

  // The first recording is labeled as such
  it("labels the first recording", async () => {
    // Draw the screen with sample data
    render(<HistoryScreen repository={await sampleRepository()} now={NOW} />);
    // Confirm the label
    expect(await screen.findByText("Your first recording")).toBeTruthy();
  });

  // With pause words hidden, History shows lengths and no pause-word trend (decision 79)
  it("shows lengths when pause words are hidden", async () => {
    // The sample sessions, with counts switched off
    const repository = await sampleRepository();
    // Switch them off
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), showPauseWords: false });
    // Draw the screen
    render(<HistoryScreen repository={repository} now={NOW} />);
    // The heading
    const heading = await screen.findByRole("heading", { level: 2, name: /sessions so far/ });
    // Confirm the count, no trend, and lengths in the rows
    expect([!!heading, screen.queryByRole("figure"), within(screen.getByRole("list", { name: "Sessions" })).queryAllByText("long").length > 0]).toEqual([true, null, true]);
  });

  // A long history is drawn 50 rows at a time (drawing thousands at once froze the page; decision 99), and the count still covers every session
  it("shows sessions a page at a time with Show more", async () => {
    // 120 first tries, a day apart
    const repository = createRepository(new MemoryStore());
    // (saved)
    for (let index = 0; index < 120; index += 1) await repository.saveSession(makeSession({ id: `s${index}`, mode: "talk", promptId: "t001", createdAt: new Date(2026, 5, 1 + index, 12).toISOString(), isBaseline: index === 0 }));
    // Draw the screen
    render(<HistoryScreen repository={repository} now={NOW} />);
    // The list
    const list = await screen.findByRole("list", { name: "Sessions" });
    // Rows at first
    const first = within(list).getAllByRole("link").length;
    // One more page
    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    // Rows after
    const second = within(list).getAllByRole("link").length;
    // The last page
    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    // Confirm 50, then 100, then all 120 with the button gone, and the line on how many are shown before that
    expect([first, second, within(list).getAllByRole("link").length, screen.queryByRole("button", { name: "Show more" })]).toEqual([50, 100, 120, null]);
  });

  // Choosing a kind starts again at one page
  it("goes back to one page when the kind shown changes", async () => {
    // 80 first tries
    const repository = createRepository(new MemoryStore());
    // (saved)
    for (let index = 0; index < 80; index += 1) await repository.saveSession(makeSession({ id: `s${index}`, mode: "talk", promptId: "t001", createdAt: new Date(2026, 6, 1 + index, 12).toISOString() }));
    // Draw the screen
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Show them all
    await userEvent.click(await screen.findByRole("button", { name: "Show more" }));
    // Choose speaking, then all again
    await userEvent.click(screen.getByRole("button", { name: "Speaking" }));
    // Confirm one page again, with the count of how many are shown
    expect([within(screen.getByRole("list", { name: "Sessions" })).getAllByRole("link").length, !!screen.getByText("Showing 50 of 80")]).toEqual([50, true]);
  });
});

