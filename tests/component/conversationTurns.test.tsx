// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
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

// A fixed "now"
const NOW = new Date(2026, 9, 21, 10);
// How far the stand-in clock moves at each level reading, in milliseconds (so a turn plays out in about a second of real time)
const TICK = 400;
// Room noise
const ROOM = 0.01;
// A voice
const VOICE = 0.12;

// Remove drawn screens after each check
afterEach(cleanup);

// A clock the stand-in microphone moves on
function fakeClock(start = NOW.getTime()) {
  // Current time
  let time = start;
  // Read and move it
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Stand-in services: each turn hears the next words; the microphone is quiet, then a voice for the given time, then quiet, moving the clock on at each reading; written lines play until stopped when asked to hang
function turnServices(clock: ReturnType<typeof fakeClock>, heard: string[], options: { speechMs?: number; hangOn?: string } = {}) {
  // What happened
  const log: string[] = [];
  // Finishes the line now playing
  let finish: (() => void) | null = null;
  // The pieces
  const services: RecordingServices = {
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
    // A written line: noted, and held until stopped when it is the one to hang on
    speakAudio: async (_audio, text) => {
      // Noted
      log.push(`say:${text}`);
      // Held until stopped
      if (text === options.hangOn) await new Promise<void>((resolve) => { finish = resolve; });
    },
    // Unlocking
    unlockSpeech: () => undefined,
    // Stopping: noted, and the held line finishes
    stopSpeaking: () => {
      // Noted
      log.push("stop");
      // Finished
      finish?.();
      // Once
      finish = null;
    },
    // A listener that hears the next words at once
    createTranscriber: () => {
      // This turn's words
      const words = heard.shift() ?? "";
      // The listener
      return { start: (onText) => onText({ final: words, interim: "" }), stop: async () => words };
    },
    // A microphone that plays out a turn as the clock moves
    createCapture: () => {
      // When it opened
      const opened = clock.now().getTime();
      // The capture
      return {
        // Each reading moves the clock on and reads the level at that time
        level: () => {
          // Time moves
          clock.advance(TICK);
          // Since it opened
          const since = clock.now().getTime() - opened;
          // Quiet, then a voice, then quiet
          return since <= 3 * TICK ? ROOM : since <= 3 * TICK + (options.speechMs ?? 2_400) ? VOICE : ROOM;
        },
        // Stopping
        stop: async () => new Blob(["voice"]),
      };
    },
  };
  // Both
  return { services, log };
}

// A writer that answers with the given lines in turn; a null entry waits until the request is cancelled
function turnWriter(lines: Array<string | null>, asked: Array<LineRequest & { signal?: AbortSignal }>): WriteLine {
  // Each request
  return async (request, options) => {
    // Noted
    asked.push({ ...request, turns: [...request.turns], signal: options?.signal });
    // The next line
    const text = lines.shift();
    // Waits until cancelled
    if (text === null) {
      // Until the signal fires
      await new Promise<void>((resolve) => options?.signal?.addEventListener("abort", () => resolve()));
      // Nothing
      return null;
    }
    // A line
    return { text: text ?? "Bye!", audio: null, goodbye: false };
  };
}

// Group the checks about turns that end by themselves (decision 101)
describe("Conversation turns", () => {
  // Automatic by default: after speech and a pause, the turn ends without a tap and the reply is asked for with the words
  it("ends a turn by itself when you stop talking", async () => {
    // The clock
    const clock = fakeClock();
    // What was asked
    const asked: Array<LineRequest & { signal?: AbortSignal }> = [];
    // The services
    const { services } = turnServices(clock, ["I went climbing on Saturday"]);
    // Draw it
    render(<ConversationScreen characterId="maya" services={services} navigate={() => {}} writeLine={turnWriter(["Hi! I'm Maya.", "No way! Where?"], asked)} coachReady={() => true} repository={createRepository(new MemoryStore())} now={NOW} clock={clock.now} listenDelayMs={0} />);
    // The intro says turns end by themselves
    await screen.findByText(/your turn ends when you stop talking/);
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // The countdown shows while you talk
    await waitFor(() => expect(document.querySelector("[data-turn-cue]")).not.toBeNull());
    // Her reply arrives with no tap on Done
    await screen.findByRole("heading", { name: "No way! Where?" }, { timeout: 5_000 });
    // The reply was asked for with your words
    expect(asked[1]?.turns.map((turn) => turn.text)).toEqual(["Hi! I'm Maya.", "I went climbing on Saturday"]);
  });

  // "I wasn't finished": cancels the reply request, listens again, and joins the words
  it("gives the turn back when you weren't finished", async () => {
    // The clock
    const clock = fakeClock();
    // What was asked
    const asked: Array<LineRequest & { signal?: AbortSignal }> = [];
    // The services: two turns of words
    const { services } = turnServices(clock, ["I went climbing", "and then it rained"]);
    // Draw it: the reply after the first turn waits until cancelled
    render(<ConversationScreen characterId="maya" services={services} navigate={() => {}} writeLine={turnWriter(["Hi! I'm Maya.", null, "Oh no, rain!"], asked)} coachReady={() => true} repository={createRepository(new MemoryStore())} now={NOW} clock={clock.now} listenDelayMs={0} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // The turn ends by itself, and the offer appears
    fireEvent.click(await screen.findByRole("button", { name: "I wasn’t finished" }, { timeout: 5_000 }));
    // Her reply to the joined words
    await screen.findByRole("heading", { name: "Oh no, rain!" }, { timeout: 5_000 });
    // The cancelled request was aborted, and the next one has your words joined, once
    expect([asked[1]?.signal?.aborted, asked[2]?.turns.map((turn) => turn.text)]).toEqual([true, ["Hi! I'm Maya.", "I went climbing and then it rained"]]);
  });

  // Tap while she talks: her line stops and your turn starts
  it("lets you interrupt by tapping", async () => {
    // The clock
    const clock = fakeClock();
    // The services: her opening plays until stopped
    const { services, log } = turnServices(clock, ["hello"], { hangOn: "Hi! I'm Maya." });
    // Draw it, ending turns by tapping so the turn waits
    const repository = createRepository(new MemoryStore());
    // Tap when done
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), turnEnding: "tap" });
    // (drawn)
    render(<ConversationScreen characterId="maya" services={services} navigate={() => {}} writeLine={turnWriter(["Hi! I'm Maya."], [])} coachReady={() => true} repository={repository} now={NOW} clock={clock.now} listenDelayMs={0} />);
    // Tap mode says so
    await screen.findByText(/Answer out loud, then tap Done/);
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Tap her while she talks
    fireEvent.click(await screen.findByRole("button", { name: "Interrupt Maya and start your turn" }));
    // Your turn
    await screen.findByRole("button", { name: "Done" });
    // Her line was stopped, and tap mode shows no countdown, only the line to tap Done (seen, and announced)
    expect([log.includes("stop"), document.querySelector("[data-turn-cue]"), screen.getAllByText("Your turn. Tap Done when you’ve finished.").map((line) => line.getAttribute("role"))]).toEqual([true, null, [null, "status"]]);
  });

  // A key press mid-turn (a keyboard or screen reader user) holds the end until it has been quiet for a while after
  it("holds off ending while someone uses the keyboard", async () => {
    // The clock
    const clock = fakeClock();
    // The services: a long voice, so the key press lands mid-turn
    const { services } = turnServices(clock, ["I went climbing on Saturday"], { speechMs: 2_000 });
    // Draw it
    render(<ConversationScreen characterId="maya" services={services} navigate={() => {}} writeLine={turnWriter(["Hi! I'm Maya.", "No way!"], [])} coachReady={() => true} repository={createRepository(new MemoryStore())} now={NOW} clock={clock.now} listenDelayMs={0} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Speaking
    await waitFor(() => expect(document.querySelector("[data-turn-cue='speaking']")).not.toBeNull(), { timeout: 5_000 });
    // A key press
    fireEvent.keyDown(document.body, { key: "Tab" });
    // Held
    await waitFor(() => expect(document.querySelector("[data-turn-cue='holding']")).not.toBeNull(), { timeout: 5_000 });
    // Then it ends after all
    await screen.findByRole("heading", { name: "No way!" }, { timeout: 8_000 });
  });

  // Settings: "Ending your turn" is saved
  it("saves the choice in Settings", async () => {
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Draw Settings
    render(<SettingsScreen repository={repository} now={NOW} fetchFn={vi.fn()} />);
    // Automatic at first
    const automatic = await screen.findByRole("button", { name: "Automatically" });
    // Choose tapping
    await userEvent.click(screen.getByRole("button", { name: "Tap when done" }));
    // Saved
    await waitFor(async () => expect((await repository.getSettings(NOW)).turnEnding).toBe("tap"));
    // Shown as chosen
    expect([automatic.getAttribute("aria-pressed"), screen.getByRole("button", { name: "Tap when done" }).getAttribute("aria-pressed")]).toEqual(["false", "true"]);
  });
});
