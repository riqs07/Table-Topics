// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, render, screen } from "@testing-library/react";
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
// Load the daily prompt picker
import { promptForDay } from "@/content/prompts";

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
    expect(await screen.findByText("Prepared answer")).toBeTruthy();
    // Confirm the timing line
    expect(screen.getByText("3:12 against a 3:00 goal, 12 seconds over.")).toBeTruthy();
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
  it("shows how much of the passage was read", async () => {
    // A reading of the start of the Gettysburg Address that skipped "seven"
    const session = makeSession({ id: "r", mode: "read", promptId: "r001", transcript: "four score and years ago", feedback: FEEDBACK, feedbackStatus: "done" });
    // Draw the screen
    render(<SessionScreen sessionId="r" repository={await repositoryWith(session)} now={NOW} />);
    // Confirm the title and that the headline gives a percentage
    expect([!!(await screen.findByText("Read aloud")), /^You read \d+% of the words\.$/.test(screen.getByTestId("reading-headline").textContent ?? "")]).toEqual([true, true]);
    // Confirm "seven" is marked as not heard
    expect(screen.getByText("seven").getAttribute("data-read")).toBe("false");
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
    expect([!!(await screen.findByText("Rehearsal")), /^You covered \d+% of your script\.$/.test((await screen.findByTestId("reading-headline")).textContent ?? "")]).toEqual([true, true]);
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
});
