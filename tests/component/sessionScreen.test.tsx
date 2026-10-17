// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screen being checked
import { SessionScreen } from "@/components/screens/SessionScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load a sample session builder
import { makeSession, makeTalk } from "../support/fixtures";
// Load the passphrase storage
import { savePassphrase } from "@/data/passphrase";
// Load the daily prompt picker and the pause drills
import { PAUSE_DRILLS, promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the script splitter
import { readingTokens, scriptWords } from "@/core/liveReading";

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
  // A first try shows the feedback and offers a retry
  it("shows feedback for a first try", async () => {
    // A finished first try
    const session = makeSession({ id: "s1", focus: "cut-fillers", fillersPerMinute: 4.2, feedback: FEEDBACK, feedbackStatus: "done", promptId: "p001" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the headline number
    expect(await screen.findByText("4.2 fillers a minute.")).toBeTruthy();
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
  it("shows the numbers together in one row", async () => {
    // A 2:14 session
    const session = makeSession({ id: "s1", fillersPerMinute: 2.4, wordsPerMinute: 128, durationSec: 134, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} />);
    // The row
    const row = within(await screen.findByRole("region", { name: "Your numbers" }));
    // Confirm each number with its label
    expect([!!row.getByText("2.4"), !!row.getByText("fillers a minute"), !!row.getByText("128"), !!row.getByText("2:14")]).toEqual([true, true, true, true]);
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
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("From 4.2 to 1.8 fillers a minute.");
    // Confirm the finish action goes home
    expect(screen.getByRole("link", { name: /Finish/ }).getAttribute("href")).toBe("/");
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
  it("shows the timing of a Table Topic and retries as one", async () => {
    // A Table Topic in the grace period
    const session = makeSession({ id: "t1", mode: "talk", durationSec: 132, promptId: "p001", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="t1" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the masthead names the kind of session
    expect(await screen.findByText("Table Topic")).toBeTruthy();
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
  it("points to Settings when no passphrase is saved", async () => {
    // Make sure no passphrase is saved
    localStorage.clear();
    // A session waiting for feedback
    const session = makeSession({ id: "s1", feedback: null, feedbackStatus: "pending" });
    // Draw the screen
    render(<SessionScreen sessionId="s1" repository={await repositoryWith(session)} now={NOW} fetchFn={vi.fn()} />);
    // Confirm the pointer to Settings
    expect(await screen.findByText(/Add your passphrase in Settings/)).toBeTruthy();
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
    expect([!!(await screen.findByLabelText("Your recording from day 1")), !!(await screen.findByLabelText("Your recording from day 13")), !!screen.getByText("Day 1: 4.2 fillers a minute, 172 words a minute."), !!screen.getByText("Day 13: 1.8 fillers a minute, 148 words a minute."), !!screen.getByRole("button", { name: /Play both/ })]).toEqual([true, true, true, true, true]);
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

  // Sessions with loudness readings say how the pauses went
  it("describes the pauses when loudness was recorded", async () => {
    // Speech, a one-second pause, speech
    const loudness = [...Array<number>(20).fill(0.3), ...Array<number>(10).fill(0.01), ...Array<number>(20).fill(0.3)];
    // A session with those readings
    const session = makeSession({ id: "p", loudness, feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="p" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the pause sentence
    expect(await screen.findByText("1 pause, 1.0 seconds long; speaking 80% of the time.")).toBeTruthy();
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

  // A rehearsal leads to Q&A practice, and a Q&A answer shows its question and leads back
  it("links a rehearsal to Q&A practice, and shows a Q&A answer's question", async () => {
    // A rehearsal and an answer to one of its questions
    const repository = await repositoryWith(makeSession({ id: "r1", mode: "rehearse", promptId: "talk-1", questions: ["Why now?"], feedback: FEEDBACK, feedbackStatus: "done" }), makeSession({ id: "q1", mode: "qa", promptId: "r1", question: "Why now?", durationSec: 50, feedback: FEEDBACK, feedbackStatus: "done" }));
    // Draw the rehearsal
    render(<SessionScreen sessionId="r1" repository={repository} now={NOW} />);
    // Confirm the link to Q&A practice
    expect((await screen.findByRole("link", { name: "Practise Q&A" })).getAttribute("href")).toBe("/qa?from=r1");
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
  describe("listening back first", () => {
    // A new first try with audio and word times
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
    // Play the recording from start to end, a second at a time
    const playThrough = async (seconds: number) => {
      // The audio element
      const audio = (await screen.findByLabelText("Your recording")) as HTMLAudioElement;
      // Report it as playing
      Object.defineProperty(audio, "paused", { configurable: true, value: false });
      // Each second
      for (let second = 0; second < seconds; second++) {
        // The position
        Object.defineProperty(audio, "currentTime", { configurable: true, writable: true, value: second + 0.5 });
        // Tell the page
        fireEvent.timeUpdate(audio);
      }
    };

    // The step comes first: no feedback, and saving waits until you have listened
    it("asks you to listen before showing the feedback", async () => {
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={await withAudio()} now={NOW} />);
      // The step
      await screen.findByRole("heading", { name: "Listen back first." });
      // Confirm no feedback and a waiting save button
      expect([screen.queryByText(FEEDBACK.change), (screen.getByRole("button", { name: /Save my notes/ }) as HTMLButtonElement).disabled]).toEqual([null, true]);
    });

    // Skipping opens the feedback and remembers the skip
    it("opens the feedback when you skip", async () => {
      // The repository
      const repository = await withAudio();
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
      // Skip
      await userEvent.click(await screen.findByRole("button", { name: "Skip this time" }));
      // Confirm the feedback shows and the skip was saved
      expect([!!(await screen.findByText(FEEDBACK.change)), (await repository.getSession("s1"))?.selfReview?.skipped]).toEqual([true, true]);
    });

    // After listening through, your notes and tags are saved and shown with the feedback
    it("saves your notes after you listen, and shows them", async () => {
      // The repository
      const repository = await withAudio();
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
      // Listen to it all
      await playThrough(4);
      // Write what to change
      await userEvent.type(screen.getByLabelText("What would you change?"), "Breathe first");
      // Tap a tag
      await userEvent.click(screen.getByRole("button", { name: "Fillers" }));
      // Save
      await userEvent.click(screen.getByRole("button", { name: /Save my notes/ }));
      // Confirm the notes, the tag and the feedback show, and the notes were saved
      expect([!!(await screen.findByText("Breathe first")), !!screen.getByText("Tagged: fillers."), !!screen.getByText(FEEDBACK.change), (await repository.getSession("s1"))?.selfReview?.tags]).toEqual([true, true, true, ["fillers"]]);
    });

    // Tapping a word plays from just before it
    it("plays from a word when you tap it", async () => {
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={await withAudio()} now={NOW} />);
      // The audio element
      const audio = (await screen.findByLabelText("Your recording")) as HTMLAudioElement;
      // Tap "home", heard at 3 seconds
      await userEvent.click(screen.getByRole("button", { name: "home" }));
      // Confirm it moved to 1.7 seconds
      expect(audio.currentTime).toBe(1.7);
    });

    // With the audio gone, notes can still be written and saved
    it("lets you continue when the recording is not on this device", async () => {
      // A new first try whose audio was pruned
      render(<SessionScreen sessionId="s1" repository={await repositoryWith({ ...fresh(), audioKey: null })} now={NOW} />);
      // Confirm the explanation and an open save button
      expect([!!(await screen.findByText(/not on this device, so there is nothing to play/)), (screen.getByRole("button", { name: /Save my notes/ }) as HTMLButtonElement).disabled]).toEqual([true, false]);
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

    // With sharing on, the coach is asked only after the notes are saved, and gets them
    it("asks the coach after your notes when it may read them", async () => {
      // A saved passphrase
      savePassphrase("a-long-enough-passphrase");
      // A new first try waiting for feedback, with no audio to listen to
      const repository = await repositoryWith({ ...fresh(), audioKey: null, feedback: null, feedbackStatus: "pending" });
      // Sharing is on
      await repository.saveSettings({ ...(await repository.getSettings(NOW)), shareNotes: true });
      // A network that answers with feedback
      const network = vi.fn(async () => Response.json({ feedback: FEEDBACK }, { status: 200 }));
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} fetchFn={network} />);
      // Write a note
      await userEvent.type(await screen.findByLabelText("What would you change?"), "Slow down");
      // Nothing sent yet
      const before = network.mock.calls.length;
      // Save
      await userEvent.click(screen.getByRole("button", { name: /Save my notes/ }));
      // The feedback arrives
      await screen.findByText(FEEDBACK.change);
      // What was sent
      const body = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { notes?: { change: string } };
      // Confirm nothing went before saving, then the note went
      expect([before, body.notes?.change]).toEqual([0, "Slow down"]);
    });

    // Unless kept, the recording is deleted once the notes are saved; the session stays
    it("deletes the recording after your notes unless you keep it", async () => {
      // The repository
      const repository = await withAudio();
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
      // The keep box, off by default
      const box = (await screen.findByLabelText(/Keep this recording/)) as HTMLInputElement;
      // Was it off?
      const before = box.checked;
      // Skip (which saves too)
      await userEvent.click(screen.getByRole("button", { name: "Skip this time" }));
      // Wait for the feedback
      await screen.findByText(FEEDBACK.change);
      // Confirm it was off, the audio is gone, and the session no longer points at it
      expect([before, await repository.getAudio("s1"), (await repository.getSession("s1"))?.audioKey]).toEqual([false, undefined, null]);
    });

    // Ticking the box keeps it
    it("keeps the recording when you choose to", async () => {
      // The repository
      const repository = await withAudio();
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
      // Keep it
      await userEvent.click(await screen.findByLabelText(/Keep this recording/));
      // Skip
      await userEvent.click(screen.getByRole("button", { name: "Skip this time" }));
      // Wait for the feedback
      await screen.findByText(FEEDBACK.change);
      // Confirm the audio and its link are still there
      expect([!!(await repository.getAudio("s1")), (await repository.getSession("s1"))?.audioKey]).toEqual([true, "s1"]);
    });

    // The first recording is always kept, and says so instead of asking
    it("always keeps the first recording", async () => {
      // The repository, holding a first recording
      const repository = await withAudio({ ...fresh(), isBaseline: true });
      // Draw the screen
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} />);
      // Confirm the note, no box
      expect([!!(await screen.findByText(/This is your first recording, so it is kept/)), screen.queryByLabelText(/Keep this recording/)]).toEqual([true, null]);
      // Skip
      await userEvent.click(screen.getByRole("button", { name: "Skip this time" }));
      // Wait for the feedback
      await screen.findByText(FEEDBACK.change);
      // Confirm the audio is still there
      expect(!!(await repository.getAudio("s1"))).toBe(true);
    });

    // Inside today's practice, the next step is open before listening, and moving on saves the step
    it("moves on to the next step of today's practice without listening first", async () => {
      // The repository
      const repository = await withAudio();
      // Where the app goes
      const navigate = vi.fn();
      // Draw step 1 of the plan
      render(<SessionScreen sessionId="s1" repository={repository} now={NOW} planStep={1} navigate={navigate} />);
      // The next-step button, open at once
      const next = (await screen.findByRole("button", { name: /^Next: step 2/ })) as HTMLButtonElement;
      // Whether it was open
      const open = !next.disabled;
      // Move on
      await userEvent.click(next);
      // Wait for the move
      await waitFor(() => expect(navigate).toHaveBeenCalled());
      // Confirm it was open, went to step 2 inside the plan, and noted the step as reviewed (skipped, nothing written)
      expect([open, navigate.mock.calls[0]?.[0], (await repository.getSession("s1"))?.selfReview?.skipped, !!screen.queryByText("Today’s practice · step 1 of 2")]).toEqual([true, `/session?mode=talk&prompt=${tableTopicForDay(NOW).id}&plan=2`, true, true]);
    });

    // The last step finishes the practice, and trying again stays inside the plan
    it("finishes today's practice after the last step, with a retry on offer", async () => {
      // Where the app goes
      const navigate = vi.fn();
      // Draw step 2 of 2
      render(<SessionScreen sessionId="s1" repository={await withAudio()} now={NOW} planStep={2} navigate={navigate} />);
      // Where trying again leads
      const retry = (await screen.findByRole("link", { name: "Try it again" })).getAttribute("href");
      // Finish
      await userEvent.click(await screen.findByRole("button", { name: /^Finish today’s practice/ }));
      // Wait for the move
      await waitFor(() => expect(navigate).toHaveBeenCalled());
      // Confirm back to Today, and the retry keeps the plan step
      expect([navigate.mock.calls[0]?.[0], retry?.endsWith("&retryOf=s1&plan=2")]).toEqual(["/", true]);
    });

    // Older sessions skip the step
    it("does not ask on older sessions", async () => {
      // A session from before the step existed
      render(<SessionScreen sessionId="s1" repository={await repositoryWith(makeSession({ id: "s1", feedback: FEEDBACK, feedbackStatus: "done" }))} now={NOW} />);
      // Confirm the feedback shows at once
      expect(!!(await screen.findByText(FEEDBACK.change))).toBe(true);
    });
  });
});
