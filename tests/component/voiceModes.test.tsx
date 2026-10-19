// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { WarmupScreen } from "@/components/screens/WarmupScreen";
import { VoiceScreen } from "@/components/screens/VoiceScreen";
import { ShadowScreen } from "@/components/screens/ShadowScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the voice content and lists
import { SHADOW_PASSAGES, VOICE_DRILLS } from "@/content/voice";
import { PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";
// Load the routine picker
import { warmupRoutine } from "@/core/voicePicks";
// Load the day key
import { dayKey } from "@/core/dates";
// Load a sample session builder
import { makeSession } from "../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 19, 10);

// Remove drawn screens after each check
afterEach(cleanup);

// Group the checks about the warm-up
describe("WarmupScreen", () => {
  // Three moves, one after another, then the day is marked warmed up; the reading it was opened for comes next
  it("runs three moves, marks the day, and leads on to the reading", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw it, opened from the reading step, with one-second moves
    render(<WarmupScreen repository={repository} now={NOW} then="/session?mode=read&prompt=r001&plan=2" moveSeconds={1} />);
    // The routine, listed
    expect(within(await screen.findByRole("list", { name: "Moves" })).getAllByRole("listitem").map((item) => item.textContent?.includes(warmupRoutine(NOW)[0]!.name))).toEqual([true, false, false]);
    // Start, and skip through the moves
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Each move, skipped by tapping the shape
    for (let move = 0; move < 3; move += 1) fireEvent.click(await screen.findByRole("button", { name: /^Next move/ }));
    // Done, and the reading comes next
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, screen.getByRole("link", { name: /Start reading/ }).getAttribute("href")]).toEqual(["Warmed up.", "/session?mode=read&prompt=r001&plan=2"]);
    // The day is marked
    await waitFor(async () => expect((await repository.getSettings(NOW)).warmupDays).toEqual([dayKey(NOW)]));
  });

  // Only a recording page may follow, so the address cannot send anyone elsewhere
  it("ignores a following page that is not a recording", async () => {
    // Draw it with an outside address, one-second moves
    render(<WarmupScreen repository={createRepository(new MemoryStore())} now={NOW} then="https://example.com" moveSeconds={1} />);
    // Start and skip through
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Each move
    for (let move = 0; move < 3; move += 1) fireEvent.click(await screen.findByRole("button", { name: /^Next move/ }));
    // Back to Your voice instead
    expect((await screen.findByRole("link", { name: /Back to Your voice/ })).getAttribute("href")).toBe("/voice");
  });
});

// Group the checks about the Your voice page
describe("VoiceScreen", () => {
  // The warm-up, every drill by mode, pause drills, tricky words and shadowing, with how often each was done
  it("lists every voice drill, with how often each was done", async () => {
    // A repository with one volume drill done twice
    const repository = createRepository(new MemoryStore());
    // Twice
    for (const id of ["a", "b"]) await repository.saveSession(makeSession({ id, mode: "voice", promptId: "v01" }));
    // Draw the page
    render(<VoiceScreen repository={repository} now={NOW} />);
    // Every link on the page
    const hrefs = (await screen.findAllByRole("link")).map((link) => link.getAttribute("href"));
    // Confirm each kind is there, and the count shows
    expect([
      hrefs.includes("/voice/warmup"),
      VOICE_DRILLS.every((drill) => hrefs.includes(`/voice/drill?id=${drill.id}`)),
      PAUSE_DRILLS.every((drill) => hrefs.includes(`/session?mode=pause&prompt=${drill.id}`)),
      TRICKY_WORDS.every((list) => hrefs.includes(`/session?mode=read&prompt=${list.id}`)),
      SHADOW_PASSAGES.every((passage) => hrefs.includes(`/voice/shadow?id=${passage.id}`)),
      !!(await screen.findByText(/done twice/)),
    ]).toEqual([true, true, true, true, true, true]);
  });
});

// A clock the check moves by hand
function fakeClock(start = NOW.getTime()) {
  // Current time
  let time = start;
  // Read and move it
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Group the checks about shadowing
describe("ShadowScreen", () => {
  // Listen, say it back, compare: the model's length is timed, yours compared with it, and the session saved at the end
  it("compares each take with the model and saves the session", async () => {
    // The clock
    const clock = fakeClock();
    // The words each take's listener hears in turn: the first phrase complete, the rest empty
    const heard = ["And so, my fellow Americans"];
    // What the model voice was asked to say
    const said: string[] = [];
    // Fake services: the model takes two seconds; a steady level
    const services: RecordingServices = {
      // Speech support on
      speechSupported: () => true,
      // A stand-in stream
      openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
      // The model voice, two seconds a phrase
      speak: async (text, id) => {
        // Note it
        said.push(`${id}: ${text}`);
        // Time passes
        clock.advance(2000);
      },
      // A listener handing back the next words
      createTranscriber: () => ({ start: () => {}, stop: async () => heard.shift() ?? "" }),
      // A steady level
      createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
    };
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw the first passage
    render(<ShadowScreen passageId="s01" services={services} repository={repository} now={NOW} clock={clock.now} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Listen to the first phrase
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "Listen" })));
    // Say it back
    fireEvent.click(await screen.findByRole("button", { name: /Say it back/ }));
    // Wait for the stop shape, let a few readings in, and take as long as the model
    const stop = await screen.findByRole("button", { name: "Stop" });
    // A few readings
    await act(() => new Promise((resolve) => setTimeout(resolve, 250)));
    // The same length as the model
    clock.advance(2100);
    // Stop
    await act(async () => void fireEvent.click(stop));
    // The comparison
    expect([said, (await screen.findByText(/model’s pace/)).textContent]).toEqual([["s01-1: And so, my fellow Americans:"], "About the model’s pace (2.1 s against 2.0 s). Every word caught."]);
    // On through the other phrases without recording, by finishing early (the whole passage can be left out)
    fireEvent.click(screen.getByRole("button", { name: "Next phrase" }));
    // The second phrase is shown
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe(SHADOW_PASSAGES[0]!.phrases[1]!.text);
  });

  // An unknown passage says so
  it("says when a passage cannot be found", async () => {
    // Fake services that are never used
    const services = { speechSupported: () => true, openMicrophone: async () => ({}) as MediaStream, createTranscriber: () => ({ start: () => {}, stop: async () => "" }), createCapture: () => ({ level: () => 0, stop: async () => new Blob() }) } satisfies RecordingServices;
    // Draw a passage that does not exist
    render(<ShadowScreen passageId="nope" services={services} repository={createRepository(new MemoryStore())} now={NOW} />);
    // Said
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("That passage could not be found.");
  });
});

// Group the checks about saved voice sessions
describe("saved voice sessions", () => {
  // Opened from History: the headline and a line per take, and a way to do it again
  it("shows a saved voice drill's lines", async () => {
    // A repository with a saved volume drill
    const repository = createRepository(new MemoryStore());
    // The session
    await repository.saveSession(makeSession({ id: "voice-1", mode: "voice", promptId: "v01", feedbackStatus: "done", voice: { kind: "volume", headline: "Three clear levels.", takes: [{ label: "Friend beside you", line: "Your starting level." }] } }));
    // Draw it
    render(<SessionScreen sessionId="voice-1" repository={repository} now={NOW} />);
    // The headline, the line and the way back in
    expect([(await screen.findByRole("heading", { level: 1 })).textContent, !!screen.getByText("Your starting level."), screen.getByRole("link", { name: /Do it again/ }).getAttribute("href")]).toEqual(["Three clear levels.", true, "/voice/drill?id=v01"]);
  });

  // History names voice sessions by their mode and drill
  it("names voice sessions in History", async () => {
    // A repository with a shadowing session
    const repository = createRepository(new MemoryStore());
    // The session
    await repository.saveSession(makeSession({ id: "voice-2", mode: "voice", promptId: "s01", feedbackStatus: "done", voice: { kind: "shadow", headline: "1 of 1 at the model’s pace.", takes: [] } }));
    // Draw History
    render(<HistoryScreen repository={repository} now={NOW} />);
    // Named
    expect(await screen.findByText("Shadowing: Ask not")).toBeTruthy();
  });
});
