// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { ProfileScreen } from "@/components/screens/ProfileScreen";
// Load the results screen, for the word swap and the link to every measure
import { SessionScreen } from "@/components/screens/SessionScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the passphrase storage
import { savePassphrase } from "@/data/passphrase";
// Load the analysis builder
import { buildAnalysis, withRubric } from "@/core/analysis/analysis";
// Load the sample sessions
import { sampleSessions } from "@/data/sampleData";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 21, 18);

// Remove the drawn screen and the saved passphrase after each check
afterEach(() => {
  // The screen
  cleanup();
  // The passphrase
  localStorage.clear();
});

// A repository filled with the sample sessions (not yet analysed)
async function sampleRepository() {
  // Wrap an empty store
  const repository = createRepository(new MemoryStore());
  // Save every sample session
  for (const session of sampleSessions(NOW)) await repository.saveSession(session);
  // Hand it back
  return repository;
}

// Group the checks about the profile page
describe("ProfileScreen", () => {
  // A new user sees a plain empty state with the way to Practice
  it("shows an empty state with no takes", async () => {
    // Draw it with nothing saved
    render(<ProfileScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the heading and the empty line
    expect([(await screen.findByText(/No takes measured yet/)).textContent?.includes("Practice"), screen.getByRole("heading", { level: 1 }).textContent]).toEqual([true, "Your speaking profile"]);
  });

  // Older takes are measured on opening, then the headline measures and every measure show
  it("measures earlier takes and shows the profile", async () => {
    // The sample takes
    const repository = await sampleRepository();
    // Draw it
    render(<ProfileScreen repository={repository} now={NOW} />);
    // The language group appears (the samples have no loudness, so no pause measures)
    const language = await screen.findByRole("region", { name: "Language" });
    // Confirm a headline measure, that every take was analysed, and the folded table lists internal measures too
    expect([within(language).getByText("Speaking rate") !== null, (await repository.listAnalyses()).length > 0, screen.getByText(/^All measures/).closest("details")!.querySelectorAll("tbody tr").length > 10]).toEqual([true, true, true]);
  });

  // With the passphrase set and no summary yet, the weekly summary is asked for and shown with its date
  it("asks for the weekly summary when due and shows it", async () => {
    // The sample takes
    const repository = await sampleRepository();
    // The passphrase
    savePassphrase("a long passphrase for testing");
    // The route answers
    const fetchFn = vi.fn(async () => Response.json({ summary: { headline: "Longer runs this week.", improved: ["Words per run up."], pattern: "Faster openings.", focus: "Breathe before your first line.", suggestedDrill: "Rapid Fire" }, model: "weekly-model" }));
    // Draw it
    render(<ProfileScreen repository={repository} now={NOW} fetchFn={fetchFn} />);
    // The summary card
    const card = await screen.findByRole("region", { name: "This week's coach summary" });
    // Confirm the headline, the date, and that it was saved
    expect([within(card).getByText("Longer runs this week.") !== null, within(card).getByText(/Weekly coach summary · Today/) !== null, (await repository.listSummaries()).length]).toEqual([true, true, 1]);
  });

  // A failed summary request is said quietly, and the profile still shows
  it("says quietly when the weekly summary fails", async () => {
    // The sample takes
    const repository = await sampleRepository();
    // The passphrase
    savePassphrase("a long passphrase for testing");
    // The route refuses
    const fetchFn = vi.fn(async () => Response.json({ error: "Too many requests. Wait a moment." }, { status: 429 }));
    // Draw it
    render(<ProfileScreen repository={repository} now={NOW} fetchFn={fetchFn} />);
    // Confirm the quiet note and the profile
    expect([(await screen.findByText("Too many requests. Wait a moment.")) !== null, screen.getByRole("region", { name: "Language" }) !== null]).toEqual([true, true]);
  });

  // Rule T1: a store that cannot be read is explained
  it("explains when the profile cannot be loaded", async () => {
    // A repository whose analyses cannot be read
    const repository = { ...createRepository(new MemoryStore()), listAnalyses: async () => { throw new Error("The database connection is closing."); } };
    // Draw it
    render(<ProfileScreen repository={repository} now={NOW} />);
    // Confirm the reason
    expect((await screen.findByRole("alert")).textContent).toContain("The database connection is closing.");
  });

  // Choosing another family shows its measures
  it("switches between families of practice", async () => {
    // A Rapid Fire take and a reading
    const repository = createRepository(new MemoryStore());
    // Saved
    await repository.saveSession(makeSession({ id: "t", mode: "talk", transcript: "so the point is this", durationSec: 30 }));
    // (reading)
    await repository.saveSession(makeSession({ id: "r", mode: "read", promptId: "r001", transcript: "four score and seven years ago", durationSec: 30 }));
    // Draw it
    render(<ProfileScreen repository={repository} now={NOW} />);
    // Choose reading aloud
    await userEvent.click(await screen.findByRole("button", { name: "Reading aloud" }));
    // Confirm it is chosen
    expect(screen.getByRole("button", { name: "Reading aloud" }).getAttribute("aria-pressed")).toBe("true");
  });

  // One take's full table, with the way back to it
  it("shows one take's every measure", async () => {
    // A take
    const repository = createRepository(new MemoryStore());
    // Saved
    await repository.saveSession(makeSession({ id: "t", mode: "talk", transcript: "so the point is this and that", durationSec: 30 }));
    // Draw its table
    render(<ProfileScreen repository={repository} now={NOW} sessionId="t" />);
    // The speaking rate row
    const row = (await screen.findAllByRole("row")).find((item) => item.getAttribute("data-metric") === "lang.wpm");
    // Confirm its value and the way back
    expect([row?.textContent?.includes("14 words/min"), screen.getByRole("link", { name: "Back to the take" }).getAttribute("href")]).toEqual([true, "/sessions?id=t"]);
  });

  // A take that is not on this device says so
  it("says when a take is not on this device", async () => {
    // Draw a missing take
    render(<ProfileScreen repository={createRepository(new MemoryStore())} now={NOW} sessionId="missing" />);
    // Confirm the line
    expect(await screen.findByText(/This take is not on this device/)).not.toBeNull();
  });
});

// Group the checks about the results page's additions (decision 90)
describe("results page measures", () => {
  // One word swap under the feedback, and the link to every measure
  it("shows one word swap and links to every measure", async () => {
    // A take with feedback and a rubric with a swap
    const session = makeSession({ id: "s1", mode: "talk", promptId: "t001", feedback: { keep: "You ended strongly.", change: "c", retryCue: "r" }, feedbackStatus: "done" });
    // The repository
    const repository = createRepository(new MemoryStore());
    // Saved
    await repository.saveSession(session);
    // Its analysis with the rubric
    await repository.saveAnalysis(withRubric(buildAnalysis(session, NOW), { pointFirst: { score: 2, quote: "" }, answersQuestion: null, structure: { score: 1, quote: "" }, ending: { score: 1, quote: "" }, concreteExample: { score: 1, quote: "" }, wordChoice: { score: 1, quote: "" }, devices: [], unnecessaryHedges: 0, wordSwaps: [{ said: "good", stronger: "gripping", why: "more vivid" }], model: "m", at: NOW.toISOString() }));
    // Draw the results
    render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
    // Confirm the swap and the link
    await waitFor(() => expect(screen.getByText("“good” → “gripping” (more vivid)")).not.toBeNull());
    // (link)
    expect(screen.getByRole("link", { name: "See all measures for this take" }).getAttribute("href")).toBe("/profile?session=s1");
  });
});
