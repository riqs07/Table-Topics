// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { HomeScreen } from "@/components/screens/HomeScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the Learn cards and the reading rule
import { LEARN_CARDS } from "@/content/learn";
import { firstRead } from "@/core/learn";
// Load the scenarios and the way answers are saved
import { SCENARIOS } from "@/content/scenarios";
import { saveScenarioAnswer } from "@/data/scenarioProgress";
// Load the plan loader, to know today's picks
import { loadDailyPlan } from "@/data/dailyPlan";
// Load a sample session builder
import { makeSession, makeTalk } from "../support/fixtures";

// A fixed "now": Tuesday 13 October 2026, mid-morning
const NOW = new Date(2026, 9, 13, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// A new user's first step: the first Learn card, inside the plan
const FIRST_STEP = `/learn/card?id=${LEARN_CARDS[0]!.id}&plan=1`;

// Make an empty repository
const emptyRepository = () => createRepository(new MemoryStore());

// Group the checks about the Home screen
describe("HomeScreen", () => {
  // Each check starts with a fresh browser, as far as the welcome is concerned
  beforeEach(() => localStorage.clear());

  // A brand-new user gets a greeting and one Start, straight into today's first step (decision 67), and the welcome does not come back
  it("welcomes a new user with one Start, once", async () => {
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Start
    const skip = await screen.findByRole("link", { name: "Start" });
    // Confirm the heading, the privacy line, and that Start leads into the first step
    expect([screen.getByRole("heading", { level: 1 }).textContent, !!screen.getByText(/stay on this device/), skip.getAttribute("href")]).toEqual(["Welcome to VoiceLab", true, FIRST_STEP]);
    // Follow it
    await userEvent.click(skip);
    // Confirm today's practice shows behind it
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Four short steps.");
    // Draw again, as on a later visit
    cleanup();
    // The later visit
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Confirm no welcome
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("Four short steps.");
  });

  // Someone who already has sessions never sees the welcome
  it("does not welcome someone who has practised before", async () => {
    // A repository with one session
    const repository = emptyRepository();
    // The session
    await repository.saveSession(makeSession({ id: "s1", createdAt: new Date(2026, 9, 12, 9).toISOString() }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm the next step, not the welcome
    expect((await screen.findByRole("heading", { level: 1 })).textContent).not.toBe("Welcome to VoiceLab");
  });

  // A new user's practice: a Learn card, the warm-up reading, then two picks, with one button to start
  it("plans four steps for a new user: a card, the warm-up, then two picks", async () => {
    // The welcome was already skipped
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The plan as loaded
    const plan = await loadDailyPlan(emptyRepository(), NOW);
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // The steps
    const steps = within(await screen.findByRole("list", { name: "Steps" })).getAllByRole("link");
    // Confirm the four steps, the warm-up's address, and that the main action starts the card inside the plan
    expect([steps.map((step) => step.getAttribute("aria-label")), steps[1]?.getAttribute("href"), screen.getByRole("link", { name: /^Start today’s practice/ }).getAttribute("href")]).toEqual([["Step 1: Learn", "Step 2: Warm up", `Step 3: ${plan.steps[2]?.label}`, `Step 4: ${plan.steps[3]?.label}`], "/session?mode=read&prompt=lincoln-second-inaugural-1&plan=2", FIRST_STEP]);
  });

  // A talk with a date takes the first pick, and a past date does not count
  it("puts the next talk with a date in the first pick", async () => {
    // A repository with a talk a week away and one whose date has passed
    const repository = emptyRepository();
    // A week away
    await repository.saveTalk(makeTalk({ id: "soon", title: "Pitch", eventDate: "2026-10-20" }));
    // Already given
    await repository.saveTalk(makeTalk({ id: "past", title: "Old toast", eventDate: "2026-10-01" }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // The third step
    const step = within(await screen.findByRole("list", { name: "Steps" })).getAllByRole("link").at(2);
    // Confirm it rehearses the talk, with today's step for it
    expect([step?.getAttribute("href"), step?.textContent?.includes("Your talk is in 7 days."), screen.queryByText(/Old toast/)]).toEqual(["/session?mode=rehearse&prompt=soon&plan=3", true, null]);
  });

  // A finished day leads with the time spoken and the user's own notes, never a filler count, the ticks grow in only the first time, and there is more to do
  it("sums up a finished day kindly, with the moment once and more to do", async () => {
    // A repository where all of a new user's steps were done today
    const repository = emptyRepository();
    // The plan as it stands this morning
    const plan = await loadDailyPlan(repository, NOW);
    // The first Learn card, read today
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), learn: { [LEARN_CARDS[0]!.id]: firstRead(NOW) } });
    // The warm-up, with a note
    await repository.saveSession(makeSession({ id: "w", mode: "read", promptId: "lincoln-second-inaugural-1", durationSec: 70, fillersPerMinute: 5, createdAt: new Date(2026, 9, 13, 8).toISOString(), selfReview: { worked: "", change: "Look up more", tags: [], skipped: false, savedAt: NOW.toISOString() } }));
    // The two picks, without notes (a round of quick scenarios is three answers, not a recording; decision 72)
    for (const [index, step] of plan.steps.slice(2).entries()) {
      // Quick scenarios: three answered today
      if (step.kind === "scenarios") for (const scenario of SCENARIOS.slice(0, 3)) await saveScenarioAnswer(repository, scenario.id, "best", NOW);
      // A session
      else await repository.saveSession(makeSession({ id: `p${index}`, mode: step.mode!, promptId: step.promptId, durationSec: index === 0 ? 90 : 30, fillersPerMinute: 6, createdAt: new Date(2026, 9, 13, 9, index).toISOString(), selfReview: null }));
    }
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // The steps
    const steps = await screen.findByRole("list", { name: "Steps" });
    // Confirm the headline, the summary, each step's line, no filler counts, and the moment playing
    expect([screen.getByRole("heading", { level: 1 }).textContent, !!screen.getByText("You spoke for 2 minutes 40 today. First day this week."), !!within(steps).getByText("Look up more"), !!within(steps).getByText("You spoke for 1 minute 30."), screen.queryByText(/fillers a minute/), steps.querySelectorAll(".motion-safe\\:animate-pop").length]).toEqual(["Done for today.", true, true, true, null, 4]);
    // The suggestions to keep going
    const more = within(screen.getByRole("region", { name: "Keep going" })).getAllByRole("link");
    // Confirm three or four, none of them today's steps, the last another card
    expect([more.length >= 3, more.some((link) => plan.steps.some((step) => link.getAttribute("href") === step.href)), more.at(-1)?.getAttribute("href")]).toEqual([true, false, `/learn/card?id=${LEARN_CARDS[1]!.id}`]);
    // Draw again, as on a later visit the same day
    cleanup();
    // The later visit
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm no moment this time
    expect((await screen.findByRole("list", { name: "Steps" })).querySelectorAll(".motion-safe\\:animate-pop").length).toBe(0);
  });

  // A step done today is ticked, and the main action carries on from the first step not done
  it("carries on from the next step", async () => {
    // A repository where today's warm-up was read
    const repository = emptyRepository();
    // The warm-up, this morning
    await repository.saveSession(makeSession({ id: "w", mode: "read", promptId: "lincoln-second-inaugural-1", createdAt: new Date(2026, 9, 13, 8).toISOString() }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm the heading, the done mark, the action back to the card, and no suggestions yet
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, !!within(screen.getByRole("link", { name: "Step 2: Warm up" })).getByText("Done"), !!screen.getByRole("link", { name: /^Continue: step 1/ }), screen.queryByRole("region", { name: "Keep going" })]).toEqual(["Pick up where you left off.", true, true, null]);
  });

  // A step put off with "Can't speak now?" is marked, not done, and the next open step is offered; once only put-off steps are left, the rest can wait (decision 77)
  it("passes over a step put off for today", async () => {
    // A repository with the warm-up put off today
    const repository = emptyRepository();
    // The settings
    const settings = await repository.getSettings(NOW);
    // Put the warm-up off
    await repository.saveSettings({ ...settings, skipped: { day: "2026-10-13", steps: ["session:read:lincoln-second-inaugural-1"] } });
    // Mark the welcome as seen
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // The warm-up's row
    const row = await screen.findByRole("link", { name: "Step 2: Warm up" });
    // Confirm the mark, the count and the action, which still starts at the card
    expect([!!within(row).getByText("Skipped for today"), !!screen.getByText("0 of 4"), !!screen.getByRole("link", { name: /^Start today’s practice/ })]).toEqual([true, true, true]);
  });

  // Today shows only today's steps; everything else is in Practice
  it("keeps to today's steps and leaves other practice to Practice", async () => {
    // The welcome was already skipped
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Wait for the steps
    await screen.findByRole("list", { name: "Steps" });
    // Confirm there is no list of other ways to practise
    expect(screen.queryByRole("heading", { name: "Or practise on your own" })).toBeNull();
  });

  // A returning user sees the streak as a sentence
  it("writes the streak as a sentence", async () => {
    // Make a repository with sessions on the last three days
    const repository = emptyRepository();
    // Save three sessions on consecutive days ending today
    for (const [index, day] of [11, 12, 13].entries()) await repository.saveSession(makeSession({ id: `s${index}`, createdAt: new Date(2026, 9, day, 9).toISOString(), isBaseline: index === 0 }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm the streak sentence
    expect(await screen.findByText(/Third day running\./)).toBeTruthy();
  });

  // When a week has passed, the next focus is shown and saved
  it("moves to the next weekly focus after seven days", async () => {
    // Make a repository whose focus began eight days ago
    const repository = emptyRepository();
    // Save settings with the first focus started eight days ago
    await repository.saveSettings({ focusIndex: 0, focusStartedOn: new Date(2026, 9, 5).toISOString(), audioRetention: 30 });
    // The welcome was already answered
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm the second focus is shown
    expect((await screen.findAllByText(/clear structure/i)).length).toBeGreaterThan(0);
    // Confirm the advance was saved
    await waitFor(async () => expect((await repository.getSettings(NOW)).focusIndex).toBe(1));
  });

  // Practice this week shows as a strip of seven days, with today marked
  it("shows the last seven days as a strip", async () => {
    // A repository with a session yesterday
    const repository = emptyRepository();
    // Yesterday afternoon
    await repository.saveSession(makeSession({ id: "y", createdAt: new Date(2026, 9, 12, 15).toISOString() }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // The strip
    const strip = within(await screen.findByRole("list", { name: "The last seven days" }));
    // Confirm seven days, yesterday practised, today not yet
    expect([strip.getAllByRole("listitem").length, !!strip.getByLabelText("Monday: practised"), !!strip.getByLabelText("Tuesday, today: not yet")]).toEqual([7, true, true]);
  });

  // With plenty of practice and no copy saved, Today asks for one; "Not now" puts it aside and remembers (decision 64)
  it("reminds to save a copy, and can put the reminder aside", async () => {
    // The welcome was already skipped
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // A repository with ten sessions over ten days
    const repository = createRepository(new MemoryStore());
    // Save them
    for (let day = 1; day <= 10; day += 1) await repository.saveSession(makeSession({ id: `s${day}`, createdAt: new Date(2026, 8, day, 9).toISOString() }));
    // Draw Today
    render(<HomeScreen repository={repository} now={NOW} />);
    // The reminder
    const note = await screen.findByRole("region", { name: "Keep your practice safe" });
    // Where its link goes
    const link = within(note).getByRole("link", { name: "Save a copy" }).getAttribute("href");
    // Put it aside
    await userEvent.click(within(note).getByRole("button", { name: "Not now" }));
    // Confirm the link, that it is gone, and that the day was remembered
    expect([link, screen.queryByRole("region", { name: "Keep your practice safe" }), localStorage.getItem("voicelab-safety-dismissed")]).toEqual(["/settings#your-data", null, "2026-10-13"]);
  });
});
