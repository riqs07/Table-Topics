// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { SessionScreen } from "@/components/screens/SessionScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the plan loader, for where the next step leads
import { loadDailyPlan } from "@/data/dailyPlan";
// Load a sample session builder
import { makeSession, makeTalk, voiceReadings } from "../support/fixtures";
// Load the passphrase storage
import { savePassphrase } from "@/data/passphrase";
// Load the daily prompt picker and the pause drills
import { PAUSE_DRILLS, TABLE_TOPICS, promptForDay } from "@/content/prompts";
// Load the script splitter
import { readingTokens, scriptWords } from "@/core/liveReading";
// Load the pitch range, for the retry comparison
import { rangeOf } from "@/core/voiceFeedback";

// A fixed "now"
const NOW = new Date(2026, 9, 13, 18);
// Sample feedback
const FEEDBACK = { keep: "You ended strongly.", change: "Take a breath before you start.", retryCue: "Breathe, then say your first word." };

// Remove the drawn screen after each check
afterEach(cleanup);

// Make a repository holding the given sessions
async function repositoryWith(...sessions: ReturnType<typeof makeSession>[]) {
  // Wrap an empty store
  const repository = createRepository(new MemoryStore());
  // Save each session
  for (const session of sessions) await repository.saveSession(session);
  // Hand it back
  return repository;
}

// Group the checks about the session page
describe("SessionScreen", () => {
  // A store that cannot be read is explained, instead of an empty page forever
  it("explains when the session cannot be loaded", async () => {
    // A repository whose sessions cannot be read
    const repository = { ...createRepository(new MemoryStore()), getSession: async () => { throw new Error("The database connection is closing."); } };
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
    // The reason, and the way back
    expect([(await screen.findByRole("alert")).textContent?.includes("The database connection is closing."), screen.getByRole("link", { name: "Back to history" }).getAttribute("href")]).toEqual([true, "/history"]);
  });

  // A first try shows the feedback and offers a retry
  it("shows feedback for a first try", async () => {
    // A finished first try
    const session = makeSession({ id: "s1", focus: "cut-fillers", fillersPerMinute: 4.2, feedback: FEEDBACK, feedbackStatus: "done", promptId: "p001" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the headline number
    expect(await screen.findByText("4.2 pause words a minute.")).toBeTruthy();
    // Confirm each part of the feedback
    for (const text of [FEEDBACK.keep, FEEDBACK.change, FEEDBACK.retryCue]) expect(screen.getByText(text)).toBeTruthy();
    // Confirm the retry action keeps the prompt and links back to this session
    expect(screen.getByRole("link", { name: /Try it again/ }).getAttribute("href")).toBe("/session?prompt=p001&retryOf=s1");
  });

  // The headline number follows the session's weekly focus
  it("shows words a minute as the headline in pace week", async () => {
    // A finished first try in pace week
    const session = makeSession({ id: "s1", focus: "pace", wordsPerMinute: 162, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the headline
    expect(await screen.findByText("162 words a minute.")).toBeTruthy();
  });

  // The transcript can be read, with fillers marked
  it("shows the transcript with fillers marked", async () => {
    // A finished first try with fillers
    const session = makeSession({ id: "s1", transcript: "Um, I think it went well.", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Open the transcript
    await userEvent.click(await screen.findByRole("button", { name: "Read what I said" }));
    // Confirm the filler is marked
    expect(screen.getByText("Um").className).toContain("text-filler");
  });

  // Filler marks are a soft highlight, not an underline that reads as a link
  it("marks fillers without underlining them", async () => {
    // A finished first try with fillers
    const session = makeSession({ id: "s1", transcript: "Um, I think it went well.", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Open the transcript
    await userEvent.click(await screen.findByRole("button", { name: "Read what I said" }));
    // The mark's classes
    const marked = screen.getByText("Um").className;
    // Confirm a highlight and no underline
    expect([marked.includes("bg-filler"), marked.includes("underline")]).toEqual([true, false]);
  });

  // The page leads with what to do next: the one change and the cue come before what to keep
  it("puts the one change and the cue before what to keep", async () => {
    // A finished first try
    const session = makeSession({ id: "s1", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Where each part sits in the page's text
    const text = (await screen.findByText(FEEDBACK.keep)).ownerDocument.body.textContent ?? "";
    // Confirm the order: change, cue, keep
    expect([text.indexOf(FEEDBACK.change) < text.indexOf(FEEDBACK.retryCue), text.indexOf(FEEDBACK.retryCue) < text.indexOf(FEEDBACK.keep)]).toEqual([true, true]);
  });

  // The numbers sit together in one compact row
  it("shows the numbers together in one row, each once", async () => {
    // A 2:14 session in filler week
    const session = makeSession({ id: "s1", fillersPerMinute: 2.4, wordsPerMinute: 128, durationSec: 134, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // The row
    const row = within(await screen.findByRole("region", { name: "Your numbers" }));
    // Confirm speed and length in the row, and the fillers only in the headline (decision 77)
    expect([!!row.getByText("128"), !!row.getByText("2:14"), row.queryByText("pause words a minute"), screen.getByRole("heading", { level: 1 }).textContent]).toEqual([true, true, null, "2.4 pause words a minute."]);
  });

  // A short Table Topic: the topic it answered, a count rather than a rate, and the length only beside the ring (decision 77)
  it("shows a short take's topic, counts and each number once", async () => {
    // An 11-second Table Topic with two fillers
    const session = makeSession({ id: "s1", mode: "talk", promptId: TABLE_TOPICS[0]!.id, fillersPerMinute: (2 * 60) / 11, wordsPerMinute: 120, durationSec: 11, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // The headline
    const headline = await screen.findByRole("heading", { level: 1 });
    // The row
    const row = within(screen.getByRole("region", { name: "Your numbers" }));
    // Confirm the topic, the count, and a row with the speed but neither fillers nor length
    expect([!!screen.getByText(TABLE_TOPICS[0]!.text), headline.textContent, !!row.getByText("120"), row.queryByText("0:11"), row.queryByText(/fillers/)]).toEqual([true, "2 pause words in 11 seconds.", true, null, null]);
  });

  // "Show where" opens what was said, and a marked filler plays its moment (decision 77)
  it("shows where the fillers were and plays one", async () => {
    // Stand in for the browser's object URLs
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:take"), revokeObjectURL: vi.fn() });
    // Stand in for playing (jsdom cannot play sound)
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    // A take with audio and word times: "So" at 1.0 s, "um" at 4.0 s
    const session = makeSession({ id: "s1", audioKey: "s1", transcript: "So um I went home", spokenTimes: [1, 4, 4.5, 5, 5.5], fillersPerMinute: 1, durationSec: 60, feedback: FEEDBACK, feedbackStatus: "done" });
    // Repository holding it and its audio
    const repository = await repositoryWith(session);
    // Save the audio
    await repository.saveAudio("s1", new Blob(["sound"], { type: "audio/webm" }));
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
    // The transcript starts closed on a phone
    const block = await screen.findByRole("region", { name: "What you said", hidden: true });
    // Closed at first
    const closed = block.className.includes("hidden");
    // Ask where the fillers were (the headline gives the fillers, so the link sits under it)
    await userEvent.click(await screen.findByRole("button", { name: "Show where" }));
    // Wait for the player, then tap the filler
    await screen.findByRole("button", { name: /Play your recording/ });
    // Tap it
    await userEvent.click(screen.getByRole("button", { name: "Play “um” at 0:04" }));
    // The audio element
    const audio = document.querySelector("audio")!;
    // Confirm it opened, and played from a second before
    expect([closed, block.className.includes("hidden"), play.mock.calls.length, audio.currentTime]).toEqual([true, false, 1, 3]);
    // Put playing back
    play.mockRestore();
  });

  // A short speech's points come straight after the one change, before the numbers (decision 77)
  it("puts a short speech's points under the one change", async () => {
    // A short speech
    const session = makeSession({ id: "s1", mode: "outline", promptId: "outline", outline: { topic: "Why walk", points: ["Health", "Calm"], goalMinutes: 2 }, transcript: "Walking is good for health", durationSec: 90, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // The points
    const points = await screen.findByRole("region", { name: "Your points" });
    // Confirm the topic shows, and the points come before the numbers
    expect([!!screen.getByText("Why walk"), !!(points.compareDocumentPosition(screen.getByRole("region", { name: "Your numbers" })) & Node.DOCUMENT_POSITION_FOLLOWING)]).toEqual([true, true]);
  });

  // "I stammer": no pause-word headline, tile or marks, and a quiet line on rough counts; and the kinder listen-back line (decision 79)
  it("leaves pause words out for a speaker who stammers", async () => {
    // A session in filler week with pause words in it
    const session = makeSession({ id: "s1", focus: "cut-fillers", transcript: "Um so I went home", fillersPerMinute: 4, wordsPerMinute: 130, durationSec: 60, feedback: FEEDBACK, feedbackStatus: "done" });
    // A repository holding it, with the setting on
    const repository = await repositoryWith(session);
    // Switch it on
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), stammer: true });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
    // Wait for the line under the numbers
    await screen.findByText("Counts are rough: speech services can mishear accents.");
    // Confirm no pause-word headline, tile, or marked words
    expect([screen.queryByText(/pause words a minute/), screen.queryByRole("button", { name: /show where/i }), document.querySelector("mark")]).toEqual([null, null, null]);
  });

  // The listen-back line is kind, above the player (decision 79)
  it("listens back kindly", async () => {
    // Stand in for the browser's object URLs
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:take"), revokeObjectURL: vi.fn() });
    // A session with audio
    const session = makeSession({ id: "s1", audioKey: "s1", feedback: FEEDBACK, feedbackStatus: "done" });
    // Repository holding it and its audio
    const repository = await repositoryWith(session);
    // Save the audio
    await repository.saveAudio("s1", new Blob(["sound"], { type: "audio/webm" }));
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
    // Confirm the line
    expect(await screen.findByText("Most people dislike hearing their own voice. Listen the way a friendly coach would.")).toBeTruthy();
  });

  // The recording plays from one large button that becomes Pause
  it("plays the recording from its own button", async () => {
    // Stand in for the browser's object URLs
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:take"), revokeObjectURL: vi.fn() });
    // Stand in for playing (jsdom cannot play sound)
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    // A session with audio
    const session = makeSession({ id: "s1", audioKey: "s1", durationSec: 75, feedback: FEEDBACK, feedbackStatus: "done" });
    // Repository holding it and its audio
    const repository = await repositoryWith(session);
    // Save the audio
    await repository.saveAudio("s1", new Blob(["sound"], { type: "audio/webm" }));
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
    // Press play
    await userEvent.click(await screen.findByRole("button", { name: "Play your recording" }));
    // Confirm it played, the button now pauses, and the length shows
    expect([play.mock.calls.length, !!screen.getByRole("button", { name: "Pause your recording" }), !!screen.getByText("0:00 / 1:15")]).toEqual([1, true, true]);
    // Put playing back
    play.mockRestore();
  });

  // A retry shows the before and after
  it("shows before and after for a retry", async () => {
    // The first try
    const first = makeSession({ id: "s1", focus: "cut-fillers", fillersPerMinute: 4.2, feedback: FEEDBACK, feedbackStatus: "done" });
    // The retry
    const retry = makeSession({ id: "s2", focus: "cut-fillers", retryOf: "s1", fillersPerMinute: 1.8, feedback: FEEDBACK, feedbackStatus: "done", createdAt: "2026-10-12T16:00:00.000Z" });
    // Draw the retry's page
    render(<SessionScreen sessionId="s2" repository={await repositoryWith(first, retry)} now={NOW} />);
    // Confirm the statement
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("From 4.2 to 1.8 pause words a minute.");
    // The fillers row of the table
    const fillers = within(screen.getByRole("table", { name: "First and second try" })).getByRole("row", { name: /pause words a minute/ });
    // Confirm both numbers, and that "Done" leads back to where the session started (decision 67)
    expect([within(fillers).getAllByRole("cell").map((cell) => cell.textContent), screen.getByRole("link", { name: /^Done/ }).getAttribute("href")]).toEqual([["4.2", "1.8"], "/practice"]);
  });

  // A retry shows the pitch range on both tries, when both were measured (decision 81)
  it("compares the pitch range on a retry", async () => {
    // A flat-ending first try and a lively retry
    const first = makeSession({ id: "s1", ...voiceReadings("rising"), feedback: FEEDBACK, feedbackStatus: "done" });
    // The retry
    const retry = makeSession({ id: "s2", retryOf: "s1", ...voiceReadings("lively"), feedback: FEEDBACK, feedbackStatus: "done", createdAt: "2026-10-12T16:00:00.000Z" });
    // Draw the retry's page
    render(<SessionScreen sessionId="s2" repository={await repositoryWith(first, retry)} now={NOW} />);
    // The pitch row
    const row = within(await screen.findByRole("table", { name: "First and second try" })).getByRole("row", { name: /pitch range/ });
    // From the first try's range to the retry's
    expect(within(row).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([String(rangeOf(first)), String(rangeOf(retry))]);
  });

  // Even when the week's focus has no number, a retry shows both tries' numbers (decision 67)
  it("shows both tries' numbers when the focus has none", async () => {
    // A first try and retry in a strong-opening week
    const first = makeSession({ id: "s1", focus: "strong-opening", durationSec: 13, feedback: FEEDBACK, feedbackStatus: "done" });
    // The retry, longer
    const retry = makeSession({ id: "s2", focus: "strong-opening", retryOf: "s1", durationSec: 64, feedback: FEEDBACK, feedbackStatus: "done", createdAt: "2026-10-12T16:00:00.000Z" });
    // Draw the retry's page
    render(<SessionScreen sessionId="s2" repository={await repositoryWith(first, retry)} now={NOW} />);
    // The length row
    const length = within(await screen.findByRole("table", { name: "First and second try" })).getByRole("row", { name: /long/ });
    // Confirm the lengths and the cue the first try gave
    expect([within(length).getAllByRole("cell").map((cell) => cell.textContent), !!screen.getByText(`You were working on: ${FEEDBACK.retryCue}`)]).toEqual([["0:13", "1:04"], true]);
  });

  // An old warm-up leads into a Record Response rather than a retry
  it("leads from a warm-up into a Record Response", async () => {
    // A finished warm-up
    const session = makeSession({ id: "w1", mode: "warmup", promptId: "w001", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="w1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the masthead says it was a warm-up
    expect(await screen.findByText("Warm-up")).toBeTruthy();
    // Confirm the action goes to a Record Response on today's prompt
    expect(screen.getByRole("link", { name: /Now record a response/ }).getAttribute("href")).toBe(`/session?mode=response&prompt=${promptForDay(NOW).id}`);
    // Confirm there is no retry
    expect(screen.queryByRole("link", { name: /Try it again/ })).toBeNull();
    // Confirm the cue introduces the response, not a retry
    expect(screen.getByText("Before your response")).toBeTruthy();
  });

  // A Record Response says how the timing went, and its retry is another Record Response
  it("shows the timing of a Record Response and retries as one", async () => {
    // A response that ran 12 seconds over
    const session = makeSession({ id: "r1", mode: "response", durationSec: 192, promptId: "p001", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="r1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the masthead names the kind of session
    expect(await screen.findByText("Prepared speech")).toBeTruthy();
    // Confirm the timing line
    expect(screen.getByText("3:12, inside the 2:00 to 4:00 window.")).toBeTruthy();
    // Confirm the retry is another Record Response
    expect(screen.getByRole("link", { name: /Try it again/ }).getAttribute("href")).toBe("/session?mode=response&prompt=p001&retryOf=r1");
  });

  // A Table Topic says whether it would qualify, and its retry is another Table Topic
  it("shows the timing of a Rapid Fire answer and retries as one", async () => {
    // A Table Topic in the grace period
    const session = makeSession({ id: "t1", mode: "talk", durationSec: 132, promptId: "p001", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="t1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the masthead names the kind of session
    expect(await screen.findByText("Rapid Fire")).toBeTruthy();
    // Confirm the timing line
    expect(screen.getByText("2:12, past 2:00 but inside the 30-second grace.")).toBeTruthy();
    // Confirm the retry is another talk
    expect(screen.getByRole("link", { name: /Try it again/ }).getAttribute("href")).toBe("/session?mode=talk&prompt=p001&retryOf=t1");
  });

  // Offline, the page says feedback will come later and the session is safe
  it("explains feedback that cannot arrive yet", async () => {
    // Save a passphrase on this device
    savePassphrase("pass");
    // A session waiting for feedback
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "pending" });
    // A network that is offline
    const offline = vi.fn(async () => { throw new TypeError("offline"); });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={offline} />);
    // Confirm the explanation
    expect(await screen.findByText(/Feedback will arrive when you are back online/)).toBeTruthy();
  });

  // A server that is not set up says exactly which setting is wrong
  it("shows the server's reason when feedback is paused", async () => {
    // Save a passphrase on this device
    savePassphrase("a-long-enough-passphrase");
    // A session waiting for feedback
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "pending" });
    // A server whose passphrase setting is too short
    const network = vi.fn(async () => Response.json({ error: "The server is not set up: APP_ACCESS_SECRET must be at least 16 characters long." }, { status: 500 }));
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={network} />);
    // Confirm the reason is shown
    expect(await screen.findByText(/APP_ACCESS_SECRET must be at least 16 characters long/)).toBeTruthy();
  });

  // While developing, a failed coach call shows its reason on the page
  it("shows why the coach could not be reached", async () => {
    // Save a passphrase on this device
    savePassphrase("a-long-enough-passphrase");
    // A session waiting for feedback
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "pending" });
    // A server whose coach call failed
    const network = vi.fn(async () => Response.json({ error: "Feedback is unavailable right now.", detail: "401 authentication_error: invalid x-api-key" }, { status: 502 }));
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={network} />);
    // Confirm the reason is shown
    expect(await screen.findByText(/401 authentication_error: invalid x-api-key/)).toBeTruthy();
  });

  // A session the coach could not review says so, instead of promising feedback forever
  it("says when the coach could not review a session", async () => {
    // A session whose feedback request was refused earlier
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "failed" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the plain explanation and no false promise
    expect([!!(await screen.findByText("The coach could not review this session.")), screen.queryByText(/Feedback is on its way/)]).toEqual([true, null]);
  });

  // A new session asks the coach straight away and shows the feedback when it arrives
  it("asks for feedback for a waiting session and shows it", async () => {
    // Save a passphrase on this device
    savePassphrase("pass");
    // A session waiting for feedback
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "pending" });
    // A network that returns feedback
    const network = vi.fn(async () => Response.json({ feedback: FEEDBACK }));
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={network} />);
    // Confirm the feedback appears
    expect(await screen.findByText(FEEDBACK.retryCue)).toBeTruthy();
  });

  // Without a passphrase, the page says where to add it
  it("picks one change from the numbers when no passphrase is saved, without mentioning it", async () => {
    // Make sure no passphrase is saved
    localStorage.clear();
    // A fast session waiting for feedback
    const session = makeSession({ id: "s1", mode: "talk", durationSec: 80, fillersPerMinute: 1, wordsPerMinute: 190, feedback: null, feedbackStatus: "pending" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={vi.fn()} />);
    // Confirm the change from the numbers, labelled, with its cue
    expect([!!(await screen.findByText(/^Slow down a little: 190 words a minute/)), !!screen.getByText("From your numbers"), !!screen.getByText("Take a breath at every full stop.")]).toEqual([true, true, true]);
    // Confirm the passphrase is never mentioned
    await waitFor(() => expect(document.body.textContent).not.toMatch(/passphrase/i));
  });

  // A short first Rapid Fire take says its timing once, without the contest line, and the baseline caption reads as two lines (round 4)
  it("says a short take's timing once", async () => {
    // Make sure no passphrase is saved
    localStorage.clear();
    // A 17-second take, waiting for feedback
    const session = makeSession({ id: "s1", mode: "talk", durationSec: 17, fillersPerMinute: 1, wordsPerMinute: 120, feedback: null, feedbackStatus: "pending" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={vi.fn()} />);
    // Wait for the change
    await screen.findByText(/^Keep going a little longer/);
    // Confirm the window's opening time is said once, and neither the ring's sentence nor the contest line appears
    expect([(document.body.textContent?.match(/1:00/g) ?? []).length, screen.queryByText(/under the 1:00 minimum/), screen.queryByText(/would not qualify/)]).toEqual([1, null, null]);
  });

  // An unknown id is explained plainly
  it("explains a session that is not on this device", async () => {
    // Draw the screen for a missing id
    render(<SessionScreen sessionId="nope" repository={await repositoryWith()} now={NOW} />);
    // Confirm the explanation
    expect(await screen.findByText(/not on this device/)).toBeTruthy();
  });

  // A session with saved audio can be played back
  it("plays back the saved recording", async () => {
    // Stand in for the browser's object URLs
    const create = vi.fn(() => "blob:take");
    // Stand in for releasing them
    const revoke = vi.fn();
    // Install both stand-ins
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    // A session with audio
    const session = makeSession({ id: "s1", audioKey: "s1", feedback: FEEDBACK, feedbackStatus: "done" });
    // Repository holding it and its audio
    const repository = await repositoryWith(session);
    // Save the audio
    await repository.saveAudio("s1", new Blob(["sound"], { type: "audio/webm" }));
    // Draw the screen
    const { unmount } = render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
    // Confirm the player points at the recording
    expect((await screen.findByLabelText("Your recording")).getAttribute("src")).toBe("blob:take");
    // Close the screen
    unmount();
    // Confirm the address was released
    expect(revoke).toHaveBeenCalledWith("blob:take");
  });

  // Pruned audio shows no player
  it("shows no player when the audio is gone", async () => {
    // A session whose audio was pruned
    const session = makeSession({ id: "s1", audioKey: null, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Wait for the page
    await screen.findByText("You ended strongly.");
    // Confirm there is no player
    expect(screen.queryByLabelText("Your recording")).toBeNull();
  });

  // Then and now: an earlier day's recording of the same prompt plays beside this one, with both sets of numbers
  it("plays an earlier recording of the same prompt beside this one", async () => {
    // Stand in for the browser's object URLs
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:take"), revokeObjectURL: vi.fn() });
    // Day 1 on prompt p001
    const first = makeSession({ id: "a", promptId: "p001", createdAt: new Date(2026, 9, 1, 12).toISOString(), audioKey: "a", fillersPerMinute: 4.2, wordsPerMinute: 172, feedback: FEEDBACK, feedbackStatus: "done" });
    // Day 13 on the same prompt
    const now = makeSession({ id: "b", promptId: "p001", createdAt: new Date(2026, 9, 13, 12).toISOString(), audioKey: "b", fillersPerMinute: 1.8, wordsPerMinute: 148, feedback: FEEDBACK, feedbackStatus: "done" });
    // Repository with both and their audio
    const repository = await repositoryWith(first, now);
    // Save the first audio
    await repository.saveAudio("a", new Blob(["then"]));
    // Save the second audio
    await repository.saveAudio("b", new Blob(["now"]));
    // Draw the later session
    render(<SessionScreen sessionId="b" repository={repository} now={NOW} />);
    // Confirm both players and both lines of numbers
    expect([!!(await screen.findByLabelText("Your recording from day 1")), !!(await screen.findByLabelText("Your recording from day 13")), !!screen.getByText("Day 1: 4.2 pause words a minute, 172 words a minute."), !!screen.getByText("Day 13: 1.8 pause words a minute, 148 words a minute."), !!screen.getByRole("button", { name: /Play both/ })]).toEqual([true, true, true, true, true]);
  });

  // A read-aloud session shows how much of the text was read, with skipped words marked on the passage
  it("shows how far a reading stopped early got, without counting the rest as missed", async () => {
    // A reading of the start of the Gettysburg Address that skipped "seven"
    const session = makeSession({ id: "r", mode: "read", promptId: "r001", transcript: "four score and years ago", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="r" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the title, the headline, and the misses counted only in the stretch read
    expect([!!(await screen.findByText("Read aloud")), screen.getByTestId("reading-headline").textContent, !!screen.getByText(/^1 not heard in that stretch/)]).toEqual([true, "You read the first 6 words.", true]);
    // Confirm "seven" is marked as not heard, and the words after the stop only as not reached
    expect([screen.getByText("seven").getAttribute("data-read"), screen.getByText("fathers").getAttribute("data-read")]).toEqual(["false", "not-reached"]);
  });

  // Sessions with loudness readings count the pauses in the numbers row (no longer a sentence, decision 63)
  it("counts the pauses when loudness was recorded", async () => {
    // Speech, a one-second pause, speech
    const loudness = [...Array<number>(20).fill(0.3), ...Array<number>(10).fill(0.01), ...Array<number>(20).fill(0.3)];
    // A session with those readings
    const session = makeSession({ id: "p", loudness, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="p" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the count, and no sentence
    expect([(await screen.findByText(/^pauses?$/)).previousElementSibling?.textContent, screen.queryByText(/of the time/)]).toEqual(["1", null]);
  });

  // A pause drill compares the pauses taken with the marks in the passage
  it("compares the pauses taken with the marks in a pause drill", async () => {
    // Speech, a one-second pause, speech
    const loudness = [...Array<number>(20).fill(0.3), ...Array<number>(10).fill(0.01), ...Array<number>(20).fill(0.3)];
    // A pause drill on the first drill passage
    const session = makeSession({ id: "d", mode: "pause", promptId: "d001", loudness, transcript: "words", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="d" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the title and the headline
    expect([!!(await screen.findByText("Pause drill")), /^You paused once; the passage has \d+ pause marks\.$/.test(screen.getByTestId("reading-headline").textContent ?? "")]).toEqual([true, true]);
  });

  // A rehearsal says how much of the script was covered
  it("shows how much of the script a rehearsal covered", async () => {
    // A repository with the talk
    const repository = createRepository(new MemoryStore());
    // Save it
    await repository.saveTalk(makeTalk());
    // A rehearsal that said only the first sentence
    await repository.saveSession(makeSession({ id: "h", mode: "rehearse", promptId: "talk-1", transcript: "good morning everyone", feedback: FEEDBACK, feedbackStatus: "done" }));
    // Draw the screen
    render(<SessionScreen sessionId="h" repository={repository} now={NOW} />);
    // Confirm the title and the headline
    expect([!!(await screen.findByText("Rehearsal")), (await screen.findByTestId("reading-headline")).textContent]).toEqual([true, "You covered the first 3 words of your script."]);
  });

  // A lesson shows its own check and a reminder of the tip
  it("shows a lesson's check and a reminder of its tip", async () => {
    // A crisp-consonants session that read the first few words
    const session = makeSession({ id: "l", mode: "lesson", promptId: "l002", transcript: "clear speech starts with the ends of words", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="l" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the title, the check, and the tip reminder
    expect([!!(await screen.findByText("Lesson 2: Crisp consonants")), /^You read \d+% of the words clearly\.$/.test(screen.getByTestId("reading-headline").textContent ?? ""), !!screen.getByText(/^Remember: /), screen.getAllByText(/You read \d+% of the words/).length]).toEqual([true, true, true, 1]);
  });

  // An openings drill shows its own two findings and a retry of the same drill
  it("shows an opening drill's findings and retries the same drill", async () => {
    // An opening that started with fillers
    const session = makeSession({ id: "b", mode: "bookend", promptId: "b001", transcript: "Um, so, today I want to talk about tools.", durationSec: 38, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="b" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the title, the opening-words finding, the timing, and the retry link
    expect([!!(await screen.findByText("Opening drill")), !!screen.getByText("You opened with “Um, so”. Start on your first real word instead."), !!screen.getByText("0:38 against a 0:45 goal, 7 seconds to spare."), screen.getByRole("link", { name: /Try it again/ }).getAttribute("href")]).toEqual([true, true, true, "/session?mode=bookend&prompt=b001&retryOf=b"]);
  });

  // Q&A practice is removed (decision 61): a rehearsal no longer leads to it, but an old Q&A answer still shows its question
  it("does not offer Q&A after a rehearsal, and still shows an old Q&A answer's question", async () => {
    // A rehearsal and an answer to one of its questions
    const repository = await repositoryWith(makeSession({ id: "r1", mode: "rehearse", promptId: "talk-1", questions: ["Why now?"], feedback: FEEDBACK, feedbackStatus: "done" }), makeSession({ id: "q1", mode: "qa", promptId: "r1", question: "Why now?", durationSec: 50, feedback: FEEDBACK, feedbackStatus: "done" }));
    // Draw the rehearsal
    render(<SessionScreen sessionId="r1" repository={repository} now={NOW} />);
    // Wait for the page, then confirm there is no way into Q&A
    expect([!!(await screen.findByRole("link", { name: /Try it again/ })), screen.queryByRole("link", { name: "Practise Q&A" })]).toEqual([true, null]);
    // Clear the page
    cleanup();
    // Draw the answer
    render(<SessionScreen sessionId="q1" repository={repository} now={NOW} />);
    // Confirm the title, the question, the timing, and the retry of the same question
    expect([!!(await screen.findByText("Q&A answer")), !!screen.getByText("Why now?"), !!screen.getByText("0:50 against a 1:00 goal, 10 seconds to spare."), screen.getByRole("link", { name: /Try it again/ }).getAttribute("href")]).toEqual([true, true, true, "/session?mode=qa&prompt=r1&question=0&retryOf=q1"]);
  });

  // With word times saved, the page says how the pace changed from start to finish
  it("says how the pace changed across the take", async () => {
    // 40 words in the first 20 seconds, 50 in the middle, 60 in the last
    const spokenTimes = [...Array.from({ length: 40 }, (_, index) => index * 0.5), ...Array.from({ length: 50 }, (_, index) => 20 + index * 0.4), ...Array.from({ length: 60 }, (_, index) => 40 + index / 3)];
    // A session with those times
    const session = makeSession({ id: "s1", durationSec: 60, spokenTimes, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the sentence
    expect(await screen.findByText("You sped up: 120 words a minute at the start, 180 by the end.")).toBeTruthy();
  });

  // A pause drill with word times says which marks had a pause
  it("says which pause marks had a pause", async () => {
    // A drill's words, each 0.3 seconds apart with no pauses at all
    const words = scriptWords(readingTokens(PAUSE_DRILLS[0]!.body));
    // A pause drill session with those times
    const session = makeSession({ id: "s1", mode: "pause", promptId: PAUSE_DRILLS[0]!.id, scriptTimes: words.map((_, index) => index * 0.3), feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm none of the marks had a pause
    expect(await screen.findByText(/^You paused at 0 of the \d+ marks\. No pause after /)).toBeTruthy();
  });

  // "Your voice": the pitch line and plain lines on the range, the endings and the volume (decision 81)
  it("shows how the voice sounded", async () => {
    // A take whose phrases end rising, with the coach's note
    const session = makeSession({ id: "s1", ...voiceReadings("rising"), durationSec: 13, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // The section
    const section = await screen.findByRole("region", { name: "Your voice" });
    // The pitch line and the lines, things to work on first (each named for screen readers, since the dot alone carries it)
    expect([!!within(section).getByRole("img", { name: /Your pitch across the take/ }), within(section).getAllByRole("listitem").map((item) => item.textContent)[0]]).toEqual([true, "To work on: 5 of 5 phrases ended rising, which can sound unsure. Land your statements low."]);
  });

  // Without the coach's note, a voice change becomes the one change, and the section does not repeat it
  it("does not repeat the one change in the voice section", async () => {
    // The same take, without feedback
    const session = makeSession({ id: "s1", ...voiceReadings("rising"), durationSec: 13, wordsPerMinute: 140, fillersPerMinute: 0, feedback: null, feedbackStatus: "failed" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // The section
    const section = await screen.findByRole("region", { name: "Your voice" });
    // The endings are the one change, and are not said again below
    expect([!!screen.getAllByText("5 of 5 phrases ended rising, which can sound unsure. Land your statements low.").length, within(section).queryByText(/ended rising/)]).toEqual([true, null]);
  });

  // An older recording without pitch shows no voice section
  it("leaves the voice section out without pitch readings", async () => {
    // A recording from before pitch was saved
    const session = makeSession({ id: "s1", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Wait for the page
    await screen.findByText("Take a breath before you start.");
    // No section
    expect(screen.queryByRole("region", { name: "Your voice" })).toBeNull();
  });

  // A pause drill with word times shows how long each pause was, against the one-to-two-second target (decision 80)
  it("shows how long each pause was", async () => {
    // A drill's words, 0.3 seconds apart, with a 1.5-second gap at every mark
    const tokens = readingTokens(PAUSE_DRILLS[0]!.body);
    // The words
    const words = scriptWords(tokens);
    // The word numbers that come straight after a mark
    const afterMark = new Set<number>();
    // Walk the script, noting the first word after each mark
    let waiting = false;
    // Each piece
    for (const token of tokens) {
      // A mark: the next word follows it
      if (token.kind === "pause") waiting = true;
      // A word after a mark
      else if (token.word !== null && waiting) {
        // Note it
        afterMark.add(token.word);
        // Done with this mark
        waiting = false;
      }
    }
    // The times, with the gaps added
    let time = 0;
    // Each word's time
    const times = words.map((_, index) => (time += afterMark.has(index) ? 1.5 : 0.3));
    // A pause drill session with those times
    const session = makeSession({ id: "s1", mode: "pause", promptId: PAUSE_DRILLS[0]!.id, scriptTimes: times, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Every mark in the target, one bar each
    expect([(await screen.findByText(/pauses were one to two seconds/)).textContent, within(screen.getByRole("list", { name: "Pause at each mark" })).getAllByRole("listitem").every((item) => item.textContent?.endsWith("1.5 s"))]).toEqual([`${afterMark.size} of ${afterMark.size} pauses were one to two seconds.`, true]);
  });

  // After a part of a full speech, the next part is offered, and the last part leads back to the speech
  it("offers the next part of a speech", async () => {
    // Part 1 and the last part of Lincoln's second inaugural, read
    const first = makeSession({ id: "a", mode: "read", promptId: "lincoln-second-inaugural-1", feedback: FEEDBACK, feedbackStatus: "done" });
    // The last part
    const last = makeSession({ id: "b", mode: "read", promptId: "lincoln-second-inaugural-7", feedback: FEEDBACK, feedbackStatus: "done" });
    // A repository with both
    const repository = await repositoryWith(first, last);
    // Draw the first
    const { unmount } = render(<SessionScreen sessionId="a" repository={repository} now={NOW} />);
    // Where "Read part 2" leads
    const next = (await screen.findByRole("link", { name: "Read part 2" })).getAttribute("href");
    // Close it
    unmount();
    // Draw the last
    render(<SessionScreen sessionId="b" repository={repository} now={NOW} />);
    // Confirm both
    expect([next, (await screen.findByRole("link", { name: "That was the last part" })).getAttribute("href")]).toEqual(["/session?mode=read&prompt=lincoln-second-inaugural-2", "/speech?id=lincoln-second-inaugural"]);
  });

  // A new first try asks you to listen back before the feedback opens
  describe("one results screen (decision 67)", () => {
    // A new first try with audio
    const fresh = () => makeSession({ id: "s1", audioKey: "s1", durationSec: 4, transcript: "Um I went home", spokenTimes: [1, 1.5, 2, 3], selfReview: null, feedback: FEEDBACK, feedbackStatus: "done" });
    // A repository holding it and its audio
    const withAudio = async (session = fresh()) => {
      // Stand in for the browser's object URLs
      Object.assign(URL, { createObjectURL: vi.fn(() => "blob:take"), revokeObjectURL: vi.fn() });
      // The repository
      const repository = await repositoryWith(session);
      // Its audio
      await repository.saveAudio("s1", new Blob(["sound"], { type: "audio/webm" }));
      // Hand it back
      return repository;
    };

    // The feedback and the player show at once: no listening step and nothing to fill in first
    it("shows the feedback and the player straight away", async () => {
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={await withAudio()} now={NOW} />);
      // Confirm the change, the player, the closed notes fold, and no listening step
      expect([!!(await screen.findByText(FEEDBACK.change)), !!(await screen.findByLabelText("Your recording")), (screen.getByText("Add your notes").closest("details") as HTMLDetailsElement).open, screen.queryByRole("heading", { name: "Listen back first." })]).toEqual([true, true, false, null]);
    });

    // Notes are optional: tags and a line, saved and shown with the feedback, and the recording kept
    it("saves notes from the fold and shows them", async () => {
      // The repository
      const repository = await withAudio();
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
      // Open the fold
      await userEvent.click(await screen.findByText("Add your notes"));
      // Tap a tag
      await userEvent.click(screen.getByRole("button", { name: "Pause words" }));
      // The box takes no more than the coach does (decision 86)
      expect(screen.getByLabelText("Anything else? (optional)").getAttribute("maxlength")).toBe("500");
      // Write a line
      await userEvent.type(screen.getByLabelText("Anything else? (optional)"), "Breathe first");
      // Save
      await userEvent.click(screen.getByRole("button", { name: "Save my notes" }));
      // Confirm the notes show, the fold is gone, the tags were saved, and the recording is still there
      expect([!!(await screen.findByText("Breathe first")), !!screen.getByText("Tagged: pause words."), screen.queryByText("Add your notes"), (await repository.getSession("s1"))?.selfReview?.tags, !!(await repository.getAudio("s1"))]).toEqual([true, true, null, ["fillers"], true]);
    });

    // Your tags are checked against the numbers
    it("shows where your notes matched the numbers", async () => {
      // A reviewed session tagged "too fast" at 182 words a minute
      const session = makeSession({ id: "s1", wordsPerMinute: 182, fillersPerMinute: 0, selfReview: { worked: "", change: "Slow down", tags: ["too-fast"], skipped: false, savedAt: "2026-10-16T10:00:00.000Z" }, feedback: FEEDBACK, feedbackStatus: "done" });
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
      // Confirm the comparison
      expect(within(await screen.findByRole("list", { name: "Your notes against the numbers" })).getByText(/^You said too fast, and it was: 182 words a minute/)).toBeTruthy();
    });

    // With sharing on, the coach waits for notes: the fold opens, and the note goes with the request
    it("asks the coach after your notes when it may read them", async () => {
      // A saved passphrase
      savePassphrase("a-long-enough-passphrase");
      // A new first try waiting for feedback, with no audio
      const repository = await repositoryWith({ ...fresh(), audioKey: null, feedback: null, feedbackStatus: "pending" });
      // Sharing is on
      await repository.saveSettings({ ...(await repository.getSettings(NOW)), shareNotes: true });
      // A network that answers with feedback
      const network = vi.fn(async () => Response.json({ feedback: FEEDBACK }, { status: 200 }));
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} fetchFn={network} />);
      // Write a line in the fold, which opens by itself
      await userEvent.type(await screen.findByLabelText("Anything else? (optional)"), "Slow down");
      // Nothing sent yet
      const before = network.mock.calls.length;
      // Save
      await userEvent.click(screen.getByRole("button", { name: "Save my notes" }));
      // The feedback arrives
      await screen.findByText(FEEDBACK.change);
      // What was sent
      const body = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { notes?: { change: string } };
      // Confirm nothing went before saving, then the note went
      expect([before, body.notes?.change]).toEqual([0, "Slow down"]);
    });

    // When the coach waits for notes, it can be asked without any
    it("lets you get feedback without notes", async () => {
      // A saved passphrase
      savePassphrase("a-long-enough-passphrase");
      // A new first try waiting for feedback
      const repository = await repositoryWith({ ...fresh(), audioKey: null, feedback: null, feedbackStatus: "pending" });
      // Sharing is on
      await repository.saveSettings({ ...(await repository.getSettings(NOW)), shareNotes: true });
      // A network that answers with feedback
      const network = vi.fn(async () => Response.json({ feedback: FEEDBACK }, { status: 200 }));
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} fetchFn={network} />);
      // Go on without notes
      await userEvent.click(await screen.findByRole("button", { name: "Get feedback without notes" }));
      // Confirm the feedback arrives and the skip was noted
      expect([!!(await screen.findByText(FEEDBACK.change)), (await repository.getSession("s1"))?.selfReview?.skipped]).toEqual([true, true]);
    });

    // Inside today's practice, the feedback shows and the main action is the next step
    it("shows the feedback inside today's practice, with the next step as the main action", async () => {
      // The repository
      const repository = await withAudio();
      // Today's plan, for where step 3 is
      const plan = await loadDailyPlan(repository, NOW);
      // Draw step 2 of the plan
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} planStep={2} />);
      // The next step
      const next = await screen.findByRole("link", { name: /^Next: step 3/ });
      // Confirm the feedback is on screen and the next step stays inside the plan
      expect([!!screen.getByText(FEEDBACK.change), next.getAttribute("href")]).toEqual([true, `${plan.steps[2]?.href}&plan=3`]);
    });

    // The last step finishes the practice, and trying again stays inside the plan
    it("finishes today's practice after the last step, with a retry on offer", async () => {
      // Draw step 4 of 4
      render(<SessionScreen sessionId="s1" repository={await withAudio()} now={NOW} planStep={4} />);
      // Where trying again and finishing lead
      const retry = (await screen.findByRole("link", { name: "Try it again" })).getAttribute("href");
      // Confirm back to Today, and the retry keeps the plan step
      expect([(await screen.findByRole("link", { name: /^Finish today’s practice/ })).getAttribute("href"), retry?.endsWith("&retryOf=s1&plan=4")]).toEqual(["/", true]);
    });

    // Outside today's practice, the way out goes back to where the session started
    it("leads back to where the session started", async () => {
      // Draw a Table Topic outside the plan
      render(<SessionScreen sessionId="s1" repository={await repositoryWith(makeSession({ id: "s1", mode: "talk", promptId: "t001", feedback: FEEDBACK, feedbackStatus: "done" }))} now={NOW} />);
      // Confirm the row back to Practice
      expect((await screen.findByRole("link", { name: "Back to Practice" })).getAttribute("href")).toBe("/practice");
    });

    // Older sessions have no notes fold
    it("does not offer notes on older sessions", async () => {
      // A session from before notes existed
      render(<SessionScreen sessionId="s1" repository={await repositoryWith(makeSession({ id: "s1", feedback: FEEDBACK, feedbackStatus: "done" }))} now={NOW} />);
      // Confirm the feedback and no fold
      expect([!!(await screen.findByText(FEEDBACK.change)), screen.queryByText("Add your notes")]).toEqual([true, null]);
    });
  });

  // A short speech (decision 73): which planned points were heard, the time against its length, and a retry that keeps the plan
  it("shows which planned points were heard in a short speech", async () => {
    // A short speech that covered one of two points
    const session = makeSession({ id: "o1", mode: "outline", promptId: "outline", durationSec: 75, transcript: "Running clears my head every single morning.", feedback: FEEDBACK, feedbackStatus: "done", outline: { topic: "Why I run", points: ["It clears my head", "I met new friends"], goalMinutes: 1 } });
    // Draw the screen
    render(<SessionScreen sessionId="o1" repository={await repositoryWith(session)} now={NOW} />);
    // The points card
    const card = await screen.findByRole("region", { name: "Your points" });
    // Confirm the count, each point's state, the timing against one minute, and the retry address
    expect([!!within(card).getByText(/1 of 2 heard/), within(card).getAllByRole("listitem").map((item) => item.textContent), !!screen.getByText(/1:00/), screen.getByRole("link", { name: /Try it again/ }).getAttribute("href")]).toEqual([true, ["It clears my headHeard", "2I met new friendsNot heard"], true, "/session?mode=outline&prompt=outline&retryOf=o1"]);
  });
});
