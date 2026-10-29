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
import { checkInSkippedOn, makeSession, makeTalk } from "../support/fixtures";

// A fixed "now": Tuesday 13 October 2026, mid-morning
const NOW = new Date(2026, 9, 13, 10);

// Remove the drawn screen after each check
afterEach(cleanup);

// A new user's first step: half a minute of free talk, inside the plan (decision 78)
const FIRST_STEP = "/session?mode=free&prompt=free&plan=1";

// Make an empty repository
const emptyRepository = () => createRepository(new MemoryStore());
// Make a repository past day one: one session yesterday, so today's plan has the card first and then the warm-up
async function pastDayOne() {
  // Empty to begin with
  const repository = emptyRepository();
  // Yesterday (Monday) morning
  await repository.saveSession(makeSession({ id: "yesterday", createdAt: new Date(2026, 9, 12, 9).toISOString() }));
  // A check-in yesterday, so today keeps the usual plan (decision 100)
  await checkInSkippedOn(repository, new Date(2026, 9, 12, 9), NOW);
  // Hand it back
  return repository;
}

// Group the checks about the Home screen
describe("HomeScreen", () => {
  // Each check starts with a fresh browser, as far as the welcome is concerned
  beforeEach(() => localStorage.clear());

  // Regression: a store that throws left Today on its placeholder forever; now it says why, and Try again loads afresh
  it("explains when saved data cannot be read, and tries again", async () => {
    // A repository that fails once, as a closing browser database does
    const working = emptyRepository();
    // Whether it has failed yet
    let failed = false;
    // The failing copy
    const repository = { ...working, listSessions: async () => {
      // Fail the first time only
      if (!failed) {
        // Failed now
        failed = true;
        // The browser's reason
        throw new Error("The database connection is closing.");
      }
      // Then work
      return working.listSessions();
    } };
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // The explanation
    const alert = await screen.findByRole("alert");
    // The heading, the reason, and the way to practise anyway
    expect([within(alert).getByRole("heading").textContent, !!within(alert).getByText(/The database connection is closing\./), within(alert).getByRole("link", { name: "Go to Practice" }).getAttribute("href")]).toEqual(["Your practice could not be loaded.", true, "/practice"]);
    // Try again
    await userEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    // The welcome loads this time, and the explanation is gone
    expect([!!(await screen.findByRole("link", { name: "Start" })), screen.queryByRole("alert")]).toEqual([true, null]);
  });

  // A returning user with no practice yet: no weekly line about nothing, no empty margin, and a total that matches the steps (round 4)
  it("keeps Today honest before there is any practice", async () => {
    // The welcome was seen, but nothing was ever practised
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // Today's practice
    const plan = await screen.findByRole("region", { name: "Today's practice" });
    // Each step's minutes, as listed
    const stepMinutes = within(plan).getAllByRole("listitem").map((item) => Number(/· (\d+) min/.exec(item.textContent ?? "")?.[1] ?? 0));
    // The total, as shown
    const total = Number(/about (\d+) min/.exec(within(plan).getByText(/^Today · about/).textContent ?? "")?.[1]);
    // Confirm: no weekly focus line, no margin, and the total is the steps added up
    expect([screen.queryByText(/This week:/), document.querySelector("main aside"), total, stepMinutes.reduce((sum, minutes) => sum + minutes, 0)]).toEqual([null, null, total, total]);
  });

  // A brand-new user gets a greeting, one question (what to get better at most, one or two picks) and one Start, straight into today's first step, which is speaking (decisions 78 and 97); the welcome does not come back
  it("welcomes a new user with the focus question and one Start, once", async () => {
    // One repository for both visits
    const repository = emptyRepository();
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Start
    const start = await screen.findByRole("link", { name: "Start" });
    // The choices
    const choices = within(screen.getByRole("group", { name: "What do you want to get better at most?" })).getAllByRole("button");
    // Confirm the hand-drawn greeter (decision 134), the heading, what VoiceLab keeps, what a session gives, the question with six choices, no tabs, and that Start leads into the first step
    expect([document.querySelector("[data-drawing='welcome']")?.getAttribute("alt"), screen.getByRole("heading", { level: 1 }).textContent, !!screen.getByText(/VoiceLab keeps your recordings on this device/), !!screen.getByText("Every take ends with one change to try."), screen.getByRole("heading", { level: 2, name: "What do you want to get better at most?" }).tagName, choices.map((choice) => choice.firstChild?.textContent), screen.queryByRole("navigation", { name: "Main" }), start.getAttribute("href")]).toEqual(["", "Welcome to VoiceLab", true, true, "H2", ["Telling stories", "Small talk and conversations", "Thinking on my feet", "How I sound", "Speaking at work", "A talk coming up"], null, FIRST_STEP]);
    // Pick three: the third replaces the first
    for (const name of [/^Telling stories/, /^How I sound/, /^Speaking at work/]) await userEvent.click(screen.getByRole("button", { name }));
    // Confirm two are picked
    expect(screen.getAllByRole("button", { pressed: true }).map((button) => button.firstChild?.textContent)).toEqual(["How I sound", "Speaking at work"]);
    // Follow Start
    await userEvent.click(start);
    // Confirm today's practice shows behind it, and the picks were saved
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Four short steps.");
    // (saved)
    await waitFor(async () => expect((await repository.getSettings(NOW)).practiceFocus).toEqual(["voice", "work"]));
    // Draw again, as on a later visit
    cleanup();
    // The later visit
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm no welcome and no question card, and the focus named in the margin
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, screen.queryByRole("region", { name: "What do you want to get better at most?" }), !!(await screen.findByText("how I sound and speaking at work"))]).toEqual(["Four short steps.", null, true]);
  });

  // Start with nothing picked still starts speaking, and records the question as answered so Today does not ask again
  it("starts without a pick, and does not ask again", async () => {
    // One repository
    const repository = emptyRepository();
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Start at once
    await userEvent.click(await screen.findByRole("link", { name: "Start" }));
    // Confirm an empty answer was saved
    await waitFor(async () => expect((await repository.getSettings(NOW)).practiceFocus).toEqual([]));
  });

  // Someone who was here before the question is asked once, on a card under the steps: Save keeps the picks, Not now puts it aside, and a failed save says so (decision 97)
  it("asks an existing user once, gently, on Today", async () => {
    // Someone with practice, who never saw the question
    const repository = await pastDayOne();
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // The card
    const card = await screen.findByRole("region", { name: "What do you want to get better at most?" });
    // Confirm the steps come first, and Save waits for a pick
    expect([screen.getByRole("region", { name: "Today's practice" }).compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING, within(card).getByRole("button", { name: "Save" }).hasAttribute("disabled")]).toEqual([Node.DOCUMENT_POSITION_FOLLOWING, true]);
    // Pick stories and save
    await userEvent.click(within(card).getByRole("button", { name: "Telling stories" }));
    // Save
    await userEvent.click(within(card).getByRole("button", { name: "Save" }));
    // Confirm it is saved, the card goes, and today's first pick is now a story
    await waitFor(() => expect(screen.queryByRole("region", { name: "What do you want to get better at most?" })).toBeNull());
    // (saved, and the plan follows)
    expect([(await repository.getSettings(NOW)).practiceFocus, (await loadDailyPlan(repository, NOW)).steps[2]?.label]).toEqual([["stories"], expect.stringMatching(/^(Story|Guided story)$/)]);
    // Another existing user puts it aside
    cleanup();
    // Their repository
    const other = await pastDayOne();
    // Draw it
    render(<HomeScreen repository={other} now={NOW} />);
    // Not now
    await userEvent.click(within(await screen.findByRole("region", { name: "What do you want to get better at most?" })).getByRole("button", { name: "Not now" }));
    // Confirm it is answered with nothing, and gone
    await waitFor(async () => expect((await other.getSettings(NOW)).practiceFocus).toEqual([]));
    // (gone)
    await waitFor(() => expect(screen.queryByRole("region", { name: "What do you want to get better at most?" })).toBeNull());
  });

  // A save that fails says why and keeps the card to try again (T1)
  it("says so when the focus cannot be saved", async () => {
    // Someone with practice
    const repository = await pastDayOne();
    // The store refuses settings writes from now on
    const saveSettings = repository.saveSettings.bind(repository);
    // Refuse only the focus answer
    repository.saveSettings = async (settings) => (settings.practiceFocus ? Promise.reject(new Error("The disk is full.")) : saveSettings(settings));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // The card
    const card = await screen.findByRole("region", { name: "What do you want to get better at most?" });
    // Pick and save
    await userEvent.click(within(card).getByRole("button", { name: "How I sound" }));
    // Save
    await userEvent.click(within(card).getByRole("button", { name: "Save" }));
    // Confirm the reason, and that Save can be pressed again
    expect([(await within(card).findByRole("alert")).textContent, within(card).getByRole("button", { name: "Save" }).hasAttribute("disabled")]).toEqual(["That could not be saved. The browser said: “The disk is full.” Try again.", false]);
  });

  // Once the day is done, the main band follows the focus (decision 97)
  it("suggests the focus's next thing once the day is done", async () => {
    // Someone with practice and a stories focus
    const repository = await pastDayOne();
    // The focus
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), practiceFocus: ["stories"] });
    // Today's plan
    const plan = await loadDailyPlan(repository, NOW);
    // Do every step today: read the card, and record each session step
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), learn: { [plan.steps[0]!.promptId]: firstRead(NOW) } });
    // Each other step: a round of quick scenarios, a warm-up routine, or a session
    for (const step of plan.steps.slice(1)) {
      // Quick scenarios: three answered today
      if (step.kind === "scenarios") for (const scenario of SCENARIOS.slice(0, 3)) await saveScenarioAnswer(repository, scenario.id, "best", NOW);
      // A warm-up routine, finished today
      else if (step.kind === "warmup") await repository.saveSettings({ ...(await repository.getSettings(NOW)), warmupDays: ["2026-10-13"] });
      // A session
      else await repository.saveSession(makeSession({ id: `done-${step.promptId}`, mode: step.mode!, promptId: step.promptId, createdAt: new Date(2026, 9, 13, 9).toISOString() }));
    }
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm the band
    expect((await screen.findByRole("link", { name: /^Tell another story/ })).getAttribute("href")).toMatch(/^\/stories\/tell\?prompt=sp\d\d$/);
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

  // A new user's practice: free talk, a Learn card, then two picks, with one button to start (decision 78)
  it("plans four steps for a new user: free talk, a card, then two picks", async () => {
    // The welcome was already skipped
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The plan as loaded
    const plan = await loadDailyPlan(emptyRepository(), NOW);
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // The steps
    const steps = within(await screen.findByRole("list", { name: "Steps" })).getAllByRole("link");
    // Confirm the four steps, the card's address, no empty bar or "0 of 4" yet, and that the first step starts free talk inside the plan (no band below; decision 138)
    expect([steps.map((step) => step.getAttribute("aria-label")), steps[1]?.getAttribute("href"), screen.queryByText(/^0 of/), steps[0]?.getAttribute("href")]).toEqual([["Step 1: Free talk", "Step 2: Learn", `Step 3: ${plan.steps[2]?.label}`, `Step 4: ${plan.steps[3]?.label}`], `/learn/card?id=${LEARN_CARDS[0]!.id}&plan=2`, null, FIRST_STEP]);
  });

  // Each step's mark is its blob scene where its kind has one, in place of the number: the next one moving, the others still; a Learn card has the light bulb (decisions 137 and 139)
  it("shows each step's scene, the next one moving", async () => {
    // The welcome was already skipped
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // Draw the screen
    render(<HomeScreen repository={emptyRepository()} now={NOW} />);
    // The steps
    const steps = within(await screen.findByRole("list", { name: "Steps" })).getAllByRole("link");
    // The first two steps' scene and how much it moves
    const scenes = steps.slice(0, 3).map((step) => [step.querySelector("[data-step-scene]")?.getAttribute("data-step-scene") ?? null, step.querySelector("[data-scene]")?.getAttribute("data-motion") ?? null]);
    // The marks' visible text: none on a scene, the number on a step without one
    const numbers = steps.slice(0, 3).map((step) => step.querySelector("[data-step-scene]") ? null : step.querySelector("span")?.textContent);
    // Confirm free talk's scene moving in place of its number, then the Learn card's bulb and the Rapid Fire pick still, with no numbers showing
    expect([scenes, numbers]).toEqual([[["free-talk", "loop"], ["learn", "still"], ["rapid-fire", "still"]], [null, null, null]]);
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
    // A repository where all of today's steps were done, past day one
    const repository = await pastDayOne();
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
    // Confirm the headline, the summary, each step's line, no filler counts, the moment playing, and the blob celebrating in it (decision 134)
    expect([screen.getByRole("heading", { level: 1 }).textContent, !!screen.getByText("You spoke for 2 minutes 40 today. Second day this week."), !!within(steps).getByText("Look up more"), !!within(steps).getByText("You spoke for 1 minute 30."), screen.queryByText(/pause words a minute/), steps.querySelectorAll(".motion-safe\\:animate-pop").length, document.querySelector("[data-done-face] [data-blob-mood]")?.getAttribute("data-blob-mood")]).toEqual(["Done for today.", true, true, true, null, 4, "celebrating"]);
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
    // A repository where today's warm-up was read, past day one
    const repository = await pastDayOne();
    // The warm-up, this morning
    await repository.saveSession(makeSession({ id: "w", mode: "read", promptId: "lincoln-second-inaugural-1", createdAt: new Date(2026, 9, 13, 8).toISOString() }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // The warm-up's mark is its scene: reading aloud, still and faded now it is done, with the tick said as "Done" (decision 137)
    const warmScene = (await screen.findByRole("link", { name: "Step 2: Warm up" })).querySelector("[data-step-scene]");
    // Confirm it
    expect([warmScene?.getAttribute("data-step-scene"), warmScene?.querySelector("[data-scene]")?.getAttribute("data-motion"), !!warmScene?.querySelector(".opacity-55"), warmScene?.textContent]).toEqual(["read-aloud", "still", true, "Done"]);
    // Confirm the heading, the done mark, no band, step 1 marked as the current step instead (decision 138), and no suggestions yet
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, !!within(screen.getByRole("link", { name: "Step 2: Warm up" })).getByText("Done"), screen.queryByRole("link", { name: /^Continue/ }), screen.getByRole("link", { current: "step" }).getAttribute("aria-label"), screen.queryByRole("region", { name: "Keep going" })]).toEqual(["Pick up where you left off.", true, null, "Step 1: Learn", null]);
  });

  // A step put off with "Can't speak now?" is marked, not done, and the next open step is offered; once only put-off steps are left, the rest can wait (decision 77)
  it("passes over a step put off for today", async () => {
    // A repository with the warm-up put off today, past day one
    const repository = await pastDayOne();
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
    // Confirm the mark, and that no band offers to start (removed by decision 138)
    expect([!!within(row).getByText("Skipped for today"), screen.queryByRole("link", { name: /^Start today’s practice/ })]).toEqual([true, null]);
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

  // The Connect lesson the user is on, straight into it, and Quick play, a kind of practice at random (decision 135)
  it("shows the lesson you are on and a Quick play", async () => {
    // Past day one, with the first small-talk lesson answered two days ago
    const repository = await pastDayOne();
    // The answer
    await repository.saveSession(makeSession({ id: "lesson-1", mode: "smalltalk", promptId: "stl1", createdAt: new Date(2026, 9, 11, 9).toISOString() }));
    // Draw the screen, with a random source that lands on Rapid Fire
    render(<HomeScreen repository={repository} now={NOW} random={() => 0.1} />);
    // The section beside the steps
    const also = await screen.findByRole("region", { name: "Also today" });
    // Its two rows
    const [lesson, quick] = within(also).getAllByRole("link");
    // Confirm the lesson (its unit, number and title, and where it goes) and Quick play (a Rapid Fire question, without saying which)
    expect([lesson!.textContent, lesson!.getAttribute("href"), quick!.textContent, /^\/session\?mode=talk&prompt=t\d+$/.test(quick!.getAttribute("href") ?? "")]).toEqual(["One momentYour lesson · Answering 2/6", "/session?mode=smalltalk&prompt=stl2", "Quick playA random kind of practice", true]);
  });

  // When the lesson is already one of today's steps, it is not linked twice; Quick play stays, with its default random source
  it("leaves the lesson out when it is one of today's steps", async () => {
    // Friday 16 October, whose plan has the first small-talk lesson as its last step
    const friday = new Date(2026, 9, 16, 10);
    // A session the day before, and a check-in then, so the usual plan
    const repository = emptyRepository();
    // The session
    await repository.saveSession(makeSession({ id: "thursday", createdAt: new Date(2026, 9, 15, 9).toISOString() }));
    // The check-in
    await checkInSkippedOn(repository, new Date(2026, 9, 15, 9), friday);
    // Draw the screen, leaving the random source to its default
    render(<HomeScreen repository={repository} now={friday} />);
    // The section beside the steps
    const also = await screen.findByRole("region", { name: "Also today" });
    // Confirm the lesson is a step, and the section holds only Quick play
    expect([!!within(screen.getByRole("list", { name: "Steps" })).getByRole("link", { name: /Small-talk lesson 1/ }), within(also).getAllByRole("link").map((link) => link.textContent)]).toEqual([true, ["Quick playA random kind of practice"]]);
  });

  // A returning user sees days in the last week, and the run only from a week of practice (decision 78)
  it("leads with days in the last week, adding the run from day 7", async () => {
    // Make a repository with sessions on the last three days
    const repository = emptyRepository();
    // Save three sessions on consecutive days ending today
    for (const [index, day] of [11, 12, 13].entries()) await repository.saveSession(makeSession({ id: `s${index}`, createdAt: new Date(2026, 9, day, 9).toISOString(), isBaseline: index === 0 }));
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // The line, and that no run is mentioned yet
    const early = [!!(await screen.findByText("3 of the last 7 days.")), screen.queryByText(/and counting/)];
    // Six more days before them, with two rest days in between (a run of nine practice days)
    for (const day of [1, 2, 3, 5, 6, 8]) await repository.saveSession(makeSession({ id: `e${day}`, createdAt: new Date(2026, 9, day, 9).toISOString() }));
    // Draw again
    cleanup();
    // The later drawing
    render(<HomeScreen repository={repository} now={NOW} />);
    // Confirm both
    expect([early, !!(await screen.findByText("9 practice days and counting."))]).toEqual([[true, null], true]);
  });

  // The run can be hidden in Settings, and then Today shows neither the line nor the squares (decision 78)
  it("hides the run when asked", async () => {
    // A repository with practice yesterday and the run hidden
    const repository = await pastDayOne();
    // Hide it
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), hideStreak: true });
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Wait for the plan
    await screen.findByRole("list", { name: "Steps" });
    // Confirm no line and no squares
    expect([screen.queryByText(/of the last 7 days/), screen.queryByRole("list", { name: "The last seven days" })]).toEqual([null, null]);
  });

  // The practice time when chosen (decision 78); "Your week" is no longer on Today, even with three sessions (it moved to Settings, decision 140)
  it("shows your practice time and leaves your week to Settings", async () => {
    // A repository with three sessions over two weeks and a practice time
    const repository = emptyRepository();
    // Two weeks ago, last week and yesterday
    for (const [index, day] of [29, 6, 12].entries()) await repository.saveSession(makeSession({ id: `w${index}`, mode: "talk", fillersPerMinute: 4 - index, createdAt: new Date(2026, day > 20 ? 8 : 9, day, 9).toISOString() }));
    // The practice time
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), anchor: "after my morning coffee" });
    // Draw the screen
    render(<HomeScreen repository={repository} now={NOW} />);
    // Wait for the practice time
    const time = await screen.findByText("after my morning coffee");
    // Confirm the time and no "Your week" card
    expect([!!time, screen.queryByRole("region", { name: "Your week" })]).toEqual([true, null]);
  });

  // When a week has passed, the next focus is shown and saved
  it("moves to the next weekly focus after seven days", async () => {
    // Make a repository whose focus began eight days ago, with some practice so the focus line shows
    const repository = await pastDayOne();
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

  // With thinking on your feet as the focus, the course's next part is a step of its own; a part finished days ago brings its prompt back under the steps (decision 131)
  it("adds the course's next part as a step, and brings a prompt back", async () => {
    // A user past day one
    const repository = await pastDayOne();
    // The focus, and the first part finished four days ago with a take
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), practiceFocus: ["spot"], courses: { "sf-beat-1": { doneAt: new Date(2026, 9, 9, 10).toISOString(), takeId: "old" } } });
    // Draw Today
    render(<HomeScreen repository={repository} now={NOW} />);
    // The course step
    const step = await screen.findByRole("link", { name: /Course: Stop freezing/ });
    // The comeback
    const back = document.querySelector("[data-revisit]");
    // Confirm the step's address and title, and the comeback's question and address
    expect([step.getAttribute("href")?.startsWith("/courses/part?id=sf-beat-2"), step.textContent?.includes("Start within two seconds"), back?.textContent?.includes("Cats or dogs?"), back?.getAttribute("href")]).toEqual([true, true, true, "/session?mode=talk&prompt=t003&course=sf-beat-1&revisit=1"]);
  });
});
