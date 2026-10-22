// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
// Load the screens being checked
import { ConversationScreen, type OpenLive, type WriteLine } from "@/components/screens/ConversationScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the live listener types
import type { LiveEvents, LiveTurns } from "@/audio/liveListener";
// Load the request type
import type { LineRequest } from "@/data/conversationClient";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";

// A fixed "now"
const NOW = new Date(2026, 9, 22, 10);
// How far the stand-in clock moves at each level reading, in milliseconds
const TICK = 400;

// Remove drawn screens after each check
afterEach(cleanup);

// A clock the stand-in microphone moves on
function fakeClock(start = NOW.getTime()) {
  // Current time
  let time = start;
  // Read and move it
  return { now: () => new Date(time), advance: (ms: number) => void (time += ms) };
}

// Stand-in services: the browser's own speech recognition hears "browser words" (so words from the live socket can be told apart), and the microphone hears a voice that never stops (so the phone's own detector never ends a turn unless the check lets it fall quiet)
function services(clock: ReturnType<typeof fakeClock>, quietAfterMs: number | null = null): RecordingServices {
  // The pieces
  return {
    // Speech support
    speechSupported: () => true,
    // A stand-in stream
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // Recorded lines: not saved recordings
    speak: async () => null,
    // Written lines: said at once
    speakAudio: async () => undefined,
    // Unlocking
    unlockSpeech: () => undefined,
    // Stopping
    stopSpeaking: () => undefined,
    // The browser's own words
    createTranscriber: () => ({ start: (onText) => onText({ final: "browser words", interim: "" }), stop: async () => "browser words" }),
    // A voice, falling quiet after the given time when asked
    createCapture: () => {
      // When it opened
      const opened = clock.now().getTime();
      // The capture
      return {
        // Each reading moves the clock on
        level: () => {
          // Time moves
          clock.advance(TICK);
          // Since it opened
          const since = clock.now().getTime() - opened;
          // Quiet at first, a voice, then quiet only when asked
          return since <= 3 * TICK ? 0.01 : quietAfterMs !== null && since > 3 * TICK + quietAfterMs ? 0.01 : 0.12;
        },
        // Stopping
        stop: async () => new Blob(["voice"]),
      };
    },
  };
}

// A writer that answers with the given lines in turn, noting each request
function writer(lines: string[], asked: LineRequest[]): WriteLine {
  // Each request
  return async (request) => {
    // Noted
    asked.push({ ...request, turns: [...request.turns] });
    // The next line
    return { text: lines.shift() ?? "Bye!", audio: null, goodbye: false };
  };
}

// A stand-in live listener: each turn hears the next words; notes the modes and closing; the check plays the service through the events
function fakeLive(words: string[]) {
  // What happened
  const state: { events: LiveEvents | null; modes: string[]; closed: number; settled: Array<[string, number]> } = { events: null, modes: [], closed: 0, settled: [] };
  // The listener
  const live: LiveTurns = {
    // One turn's words
    turnTranscriber: () => {
      // This turn's
      const heard = words.shift() ?? "";
      // The transcriber
      return { start: (onText) => onText({ final: heard, interim: "" }), stop: async () => heard };
    },
    // Noted
    setMode: (mode) => void state.modes.push(mode),
    // Closed after 42 seconds
    close: async () => {
      // Counted
      state.closed += 1;
      // Seconds open
      return 42;
    },
  };
  // The opener
  const openLive: OpenLive = async (_id, events) => {
    // Kept for the check
    state.events = events;
    // Granted
    return { live, grantedSeconds: 300 };
  };
  // Both, and a settler that notes
  return { state, openLive, settleLive: (id: string, seconds: number) => void state.settled.push([id, seconds]) };
}

// A repository with live chosen (and headphones when asked)
async function liveRepository(headphones = false): Promise<Repository> {
  // The repository
  const repository = createRepository(new MemoryStore());
  // Live chosen
  await repository.saveSettings({ ...(await repository.getSettings(NOW)), turnEnding: "live", headphones });
  // Ready
  return repository;
}

// Group the checks on live conversations, step A (decision 140)
describe("Live conversation", () => {
  // The service ends the turn: the reply is asked for with the live words (not the browser's), the page says Live, and ending closes and settles
  it("ends your turn when the live service says so and replies", async () => {
    // The clock
    const clock = fakeClock();
    // What was asked
    const asked: LineRequest[] = [];
    // The stand-in live listener
    const { state, openLive, settleLive } = fakeLive(["I went climbing on Saturday"]);
    // Draw it
    render(<ConversationScreen characterId="maya" services={services(clock)} navigate={() => {}} writeLine={writer(["Hi! I'm Maya.", "No way! Where?"], asked)} coachReady={() => true} repository={await liveRepository()} now={NOW} clock={clock.now} listenDelayMs={0} openLive={openLive} settleLive={settleLive} />);
    // The intro says a live service hears you, and where your voice goes
    await screen.findByText(/a live speech service hears when you’ve finished/);
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Your turn, live
    await waitFor(() => expect(document.querySelector("[data-live-turn]")).not.toBeNull());
    // The service says your turn is over
    await act(async () => state.events!.onEndOfTurn());
    // Her reply
    await screen.findByRole("heading", { name: "No way! Where?" });
    // Marked live; asked with the live words; the microphone sent on your turn, silence while she talked
    expect([document.querySelector("[data-live='on']") !== null, asked[1]?.turns.map((turn) => turn.text), state.modes.includes("listen"), state.modes.includes("silence"), state.modes.includes("barge")]).toEqual([true, ["Hi! I'm Maya.", "I went climbing on Saturday"], true, true, false]);
    // End the conversation
    fireEvent.click(await screen.findByRole("button", { name: "End conversation" }));
    // Closed once and settled with its seconds
    await waitFor(() => expect([state.closed, state.settled.map(([, seconds]) => seconds)]).toEqual([1, [42]]));
  });

  // Headphones: talking over the persona sends the microphone while she talks
  it("listens while the persona talks only with headphones", async () => {
    // The clock
    const clock = fakeClock();
    // The stand-in live listener
    const { state, openLive, settleLive } = fakeLive(["hello"]);
    // Draw it with headphones on
    render(<ConversationScreen characterId="maya" services={services(clock)} navigate={() => {}} writeLine={writer(["Hi! I'm Maya."], [])} coachReady={() => true} repository={await liveRepository(true)} now={NOW} clock={clock.now} listenDelayMs={0} openLive={openLive} settleLive={settleLive} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Your turn, live
    await waitFor(() => expect(document.querySelector("[data-live-turn]")).not.toBeNull());
    // Barge mode was used while she talked
    expect(state.modes).toContain("barge");
  });

  // Over budget: one plain line, and turns end on the phone instead
  it("falls back to automatic turns with one line when the minutes are used up", async () => {
    // The clock
    const clock = fakeClock();
    // What was asked
    const asked: LineRequest[] = [];
    // An opener that is refused
    const openLive: OpenLive = async () => ({ refused: "budget" });
    // Draw it: the voice falls quiet after two seconds, so the phone ends the turn
    render(<ConversationScreen characterId="maya" services={services(clock, 2_000)} navigate={() => {}} writeLine={writer(["Hi! I'm Maya.", "Nice."], asked)} coachReady={() => true} repository={await liveRepository()} now={NOW} clock={clock.now} listenDelayMs={0} openLive={openLive} settleLive={() => undefined} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // The line
    await screen.findByText("This month’s live minutes are used up, so turns end automatically.");
    // The phone's countdown, and the reply with the browser's words
    await screen.findByRole("heading", { name: "Nice." }, { timeout: 5_000 });
    // Asked with the browser's words
    expect(asked[1]?.turns.at(-1)?.text).toBe("browser words");
  });

  // Dropped mid-turn: the turn ends with the live words, one line says so, and later turns end on the phone
  it("ends the turn and carries on automatically when the live socket drops", async () => {
    // The clock
    const clock = fakeClock();
    // What was asked
    const asked: LineRequest[] = [];
    // The stand-in live listener
    const { state, openLive, settleLive } = fakeLive(["we drove to the coast"]);
    // Draw it
    render(<ConversationScreen characterId="maya" services={services(clock)} navigate={() => {}} writeLine={writer(["Hi! I'm Maya.", "Lovely."], asked)} coachReady={() => true} repository={await liveRepository()} now={NOW} clock={clock.now} listenDelayMs={0} openLive={openLive} settleLive={settleLive} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Your turn, live
    await waitFor(() => expect(document.querySelector("[data-live-turn]")).not.toBeNull());
    // The socket drops
    await act(async () => state.events!.onDropped("closed"));
    // The line, and her reply to the live words
    await screen.findByText("The live connection dropped, so turns now end automatically.");
    // (the reply)
    await screen.findByRole("heading", { name: "Lovely." });
    // Asked with the words heard live; closed and settled
    expect([asked[1]?.turns.at(-1)?.text, state.closed, state.settled.length]).toEqual(["we drove to the coast", 1, 1]);
  });

  // Without the coach, live cannot start: one line, recorded lines and automatic turns
  it("says live needs the coach when no passphrase is saved", async () => {
    // The clock
    const clock = fakeClock();
    // An opener that must not be called
    const openLive: OpenLive = async () => {
      // Never
      throw new Error("should not open");
    };
    // Draw it without the coach
    render(<ConversationScreen characterId="maya" services={services(clock)} navigate={() => {}} coachReady={() => false} repository={await liveRepository()} now={NOW} clock={clock.now} listenDelayMs={0} openLive={openLive} settleLive={() => undefined} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // The line
    await screen.findByText("Live conversations need the coach set up in Settings, so turns end automatically.");
  });
});

// Group the checks on the Settings choice (decision 140)
describe("Settings: live turns", () => {
  // Live is a third choice, off by default; choosing it shows the headphones switch and where the voice goes, and saves both
  it("offers Live (beta) with a headphones switch", async () => {
    // The repository
    const repository = createRepository(new MemoryStore());
    // Draw Settings
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Automatic is chosen; Live is not
    const live = await screen.findByRole("button", { name: "Live (beta)" });
    // Not pressed by default
    expect([live.getAttribute("aria-pressed"), screen.getByRole("button", { name: "Automatically" }).getAttribute("aria-pressed"), screen.queryByRole("checkbox", { name: /I’m using headphones/ })]).toEqual(["false", "true", null]);
    // Choose Live
    fireEvent.click(live);
    // Where the voice goes, and the switch
    await screen.findByText(/your voice goes to AssemblyAI and is not kept/);
    // Headphones on
    fireEvent.click(screen.getByRole("checkbox", { name: /I’m using headphones/ }));
    // Both saved
    await waitFor(async () => expect([(await repository.getSettings(NOW)).turnEnding, (await repository.getSettings(NOW)).headphones]).toEqual(["live", true]));
  });
});
