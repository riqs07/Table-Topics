// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
// Load the screens being checked
import { ConversationScreen, type WriteLine } from "@/components/screens/ConversationScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the request type
import type { LineRequest } from "@/data/conversationClient";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the passphrase storage
import { savePassphrase } from "@/data/passphrase";

// A fixed "now"
const NOW = new Date(2026, 9, 21, 10);

// Remove drawn screens after each check
afterEach(cleanup);

// A clock the check moves by hand
function fakeClock(start = NOW.getTime()) {
  // Current time
  let time = start;
  // Read and move it
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Stand-in services: every line noted, each written piece taking 300 ms on the clock; the listener hears the next words
function services(clock: ReturnType<typeof fakeClock>, heard: string[], log: string[]): RecordingServices {
  // The pieces
  return {
    // Speech support
    speechSupported: () => true,
    // A stand-in stream
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // A recorded line: noted
    speak: async (_text, id) => {
      // Noted
      log.push(`speak:${id}`);
      // Not a saved recording
      return null;
    },
    // A written line or piece: noted, with whether it had audio, and time passes
    speakAudio: async (audio, text) => {
      // Noted
      log.push(`say:${text}${audio ? " (voice)" : ""}`);
      // Time passes
      clock.advance(300);
    },
    // Unlocking
    unlockSpeech: () => undefined,
    // Stopping
    stopSpeaking: () => undefined,
    // A listener handing back the next words
    createTranscriber: () => ({ start: () => {}, stop: async () => heard.shift() ?? "" }),
    // A steady level
    createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
  };
}

// A writer that streams each line in two pieces (the first with audio), noting each request; a string "budget" or "cap" refuses with that reason
function streamingWriter(lines: string[], asked: LineRequest[], log: string[]): WriteLine {
  // Each request
  return async (request, options) => {
    // Noted
    asked.push({ ...request, turns: [...request.turns] });
    // The next line
    const text = lines.shift() ?? "Bye!";
    // A refusal
    if (text === "budget" || text === "cap") return { refused: text };
    // Its two pieces
    const [first, ...rest] = text.split(/(?<=[.!?]) /);
    // The first piece
    options?.onSegment?.({ index: 0, text: first!, audio: new Blob(["mp3"]) });
    // Noted, so playing can be seen to start before the line is finished
    log.push("(first piece sent)");
    // A moment later, the rest
    await new Promise((resolve) => setTimeout(resolve, 10));
    // The rest
    if (rest.length > 0) options?.onSegment?.({ index: 1, text: rest.join(" "), audio: null });
    // Noted
    log.push("(line finished)");
    // The whole line, already played
    return { text, audio: null, goodbye: request.stage === "end", streamed: true };
  };
}

// Group the checks about streamed lines and the month's minutes (decision 102)
describe("Conversation, streamed", () => {
  // Pieces play in order, the first before the line has finished arriving; the line is kept once, whole; the request carries the conversation's id and time
  it("plays a streamed line piece by piece, in order", async () => {
    // The clock
    const clock = fakeClock();
    // What happened
    const log: string[] = [];
    // What was asked
    const asked: LineRequest[] = [];
    // A repository
    const repository = createRepository(new MemoryStore());
    // Where it went
    const navigate = vi.fn();
    // Draw it, tapping Done (tap mode)
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), turnEnding: "tap" });
    // (drawn)
    render(<ConversationScreen characterId="maya" services={services(clock, ["I went climbing"], log)} navigate={navigate} writeLine={streamingWriter(["Oh hi! I'm Maya, from design.", "No way! Where do you climb?"], asked, log)} coachReady={() => true} repository={repository} now={NOW} clock={clock.now} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Your turn: Done
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Her whole reply shown
    await screen.findByRole("heading", { name: "No way! Where do you climb?" });
    // End
    fireEvent.click(await screen.findByRole("button", { name: "End conversation" }));
    // Saved
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved conversation
    const [session] = await repository.listSessions();
    // The first piece played (in her voice) before the line finished arriving, then the rest; the listening sound first; each line kept once; the id and time sent
    expect([log, session?.conversation?.turns.map((turn) => turn.text), asked.every((request) => /^[0-9a-f-]{36}$/.test(request.conversationId)), asked[1]!.elapsedSec >= 0]).toEqual([
      ["(first piece sent)", "say:Oh hi! (voice)", "(line finished)", "say:I'm Maya, from design.", "speak:maya-04", "(first piece sent)", "say:No way! (voice)", "(line finished)", "say:Where do you climb?"],
      ["Oh hi! I'm Maya, from design.", "I went climbing", "No way! Where do you climb?"],
      true,
      true,
    ]);
  });

  // While developing, the time from the end of your turn to their first sound is shown
  it("shows the reply time while developing", async () => {
    // The clock
    const clock = fakeClock();
    // A repository in tap mode
    const repository = createRepository(new MemoryStore());
    // Tap mode
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), turnEnding: "tap" });
    // Draw it
    render(<ConversationScreen characterId="maya" services={services(clock, ["I went climbing"], [])} navigate={() => {}} writeLine={streamingWriter(["Oh hi! I'm Maya.", "No way! Where?"], [], [])} coachReady={() => true} repository={repository} now={NOW} clock={clock.now} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Done
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // The readout
    expect((await screen.findByText(/Reply sound .* s after your turn ended \(development only\)/)).getAttribute("data-latency")).not.toBeNull();
  });

  // The month's minutes used up at the start: recorded lines instead, and why
  it("uses recorded lines when the month's minutes are used up", async () => {
    // The clock
    const clock = fakeClock();
    // Draw it
    render(<ConversationScreen characterId="maya" services={services(clock, [], [])} navigate={() => {}} writeLine={streamingWriter(["budget"], [], [])} coachReady={() => true} repository={createRepository(new MemoryStore())} now={NOW} clock={clock.now} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Why, and her own situation with recorded lines
    expect([!!(await screen.findByText("This month’s conversation minutes are used up, so Maya will use recorded lines until next month.")), !!screen.getByText("At the office party"), screen.queryByRole("button", { name: "Another situation" })]).toEqual([true, true, null]);
  });

  // Refused part-way (the cap): a recorded goodbye, then saved
  it("says a recorded goodbye and saves when refused part-way", async () => {
    // The clock
    const clock = fakeClock();
    // What happened
    const log: string[] = [];
    // Where it went
    const navigate = vi.fn();
    // A repository in tap mode
    const repository = createRepository(new MemoryStore());
    // Tap mode
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), turnEnding: "tap" });
    // Draw it
    render(<ConversationScreen characterId="maya" services={services(clock, ["I went climbing"], log)} navigate={navigate} writeLine={streamingWriter(["Oh hi! I'm Maya.", "cap"], [], [])} coachReady={() => true} repository={repository} now={NOW} clock={clock.now} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Done
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // Saved
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // A recorded goodbye was the last thing said
    expect(log.at(-1)).toMatch(/^speak:maya-/);
  });
});

// Group the checks about the minutes left in Settings (decision 102)
describe("Settings, conversation minutes", () => {
  // With a passphrase saved: the minutes left; when the server cannot say, that is said
  it("shows the minutes left this month", async () => {
    // A passphrase saved
    savePassphrase("a long passphrase for testing");
    // The server answers with the minutes
    const network = vi.fn(async () => Response.json({ minutesUsed: 30, minutesPerMonth: 150, minutesLeft: 120 }));
    // Draw Settings
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} fetchFn={network} />);
    // The minutes
    await screen.findByText(/^120 of 150 conversation minutes left this month\./);
    // Gone
    cleanup();
    // Draw again with a server that cannot say
    render(<SettingsScreen repository={createRepository(new MemoryStore())} now={NOW} fetchFn={vi.fn(async () => new Response("{}", { status: 503 }))} />);
    // Said
    await screen.findByText(/Couldn’t check this month’s conversation minutes/);
    // Forget the passphrase
    savePassphrase("");
  });
});
