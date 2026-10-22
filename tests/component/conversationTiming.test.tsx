// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
// Load the screen and the timeline being checked
import { ConversationScreen, type WriteLine } from "@/components/screens/ConversationScreen";
import { ConversationTimeline } from "@/components/script/ConversationTimeline";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the request type
import type { LineRequest } from "@/data/conversationClient";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the turn type
import type { ConversationTurn } from "@/data/records";

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

// Stand-in services: each turn hears "I went climbing", a voice that never stops (so only Done or a cut-in ends a turn), and each written line takes a second on the clock
function services(clock: ReturnType<typeof fakeClock>): RecordingServices {
  // The pieces
  return {
    // Speech support
    speechSupported: () => true,
    // A stand-in stream
    openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
    // Recorded lines
    speak: async () => null,
    // Written lines take a second
    speakAudio: async () => void clock.advance(1_000),
    // Unlocking
    unlockSpeech: () => undefined,
    // Stopping
    stopSpeaking: () => undefined,
    // The words
    createTranscriber: () => ({ start: (onText) => onText({ final: "I went climbing", interim: "" }), stop: async () => "I went climbing" }),
    // Quiet for three readings, then a voice
    createCapture: () => {
      // When it opened
      const opened = clock.now().getTime();
      // The capture
      return {
        // Each reading moves the clock on
        level: () => {
          // Time moves
          clock.advance(TICK);
          // Quiet at first, then a voice
          return clock.now().getTime() - opened <= 3 * TICK ? 0.01 : 0.12;
        },
        // Stopping
        stop: async () => new Blob(["voice"]),
      };
    },
  };
}

// A writer answering in turn, noting each request
function writer(lines: string[], asked: LineRequest[]): WriteLine {
  // Each request
  return async (request) => {
    // Noted
    asked.push({ ...request, turns: [...request.turns] });
    // The next line
    return { text: lines.shift() ?? "Bye!", audio: null, goodbye: false };
  };
}

// Group the checks on difficulty and turn times in a conversation (decision 141)
describe("Conversation difficulty and times", () => {
  // Hard is chosen before starting, remembered, sent with each line, and saved; the turns are saved with their times
  it("sends and saves the chosen difficulty, and saves each turn's times", async () => {
    // The clock
    const clock = fakeClock();
    // What was asked
    const asked: LineRequest[] = [];
    // The repository, tapping Done
    const repository = createRepository(new MemoryStore());
    // Tap when done, so the check decides when the turn ends
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), turnEnding: "tap" });
    // Where it went once saved
    const went: string[] = [];
    // Draw it
    render(<ConversationScreen characterId="theo" services={services(clock)} navigate={(path) => void went.push(path)} writeLine={writer(["Hey.", "Mm."], asked)} coachReady={() => true} repository={repository} now={NOW} clock={clock.now} listenDelayMs={0} />);
    // The picker: Normal by default
    expect((await screen.findByRole("button", { name: "Normal" })).getAttribute("aria-pressed")).toBe("true");
    // Hard
    fireEvent.click(screen.getByRole("button", { name: "Hard" }));
    // What it means
    await screen.findByText("Short answers, and they may cut in.");
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Done, once the voice has gone on a while
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    // His reply
    await screen.findByRole("heading", { name: "Mm." });
    // End the conversation
    fireEvent.click(await screen.findByRole("button", { name: "End conversation" }));
    // Saved
    await waitFor(() => expect(went.length).toBe(1));
    // The saved conversation
    const saved = (await repository.listSessions())[0]!;
    // Each line asked for hard; remembered; saved hard and tapped; every turn timed, in order
    const turns = saved.conversation!.turns;
    expect([asked.map((request) => request.difficulty), (await repository.getSettings(NOW)).conversationDifficulty, saved.conversation?.difficulty, saved.conversation?.turnMode, turns.every((turn) => typeof turn.at === "number" && typeof turn.end === "number" && turn.end >= turn.at), turns.every((turn, index) => index === 0 || turn.at! >= turns[index - 1]!.at!)]).toEqual([["hard", "hard"], "hard", "hard", "tap", true, true]);
  });

  // On hard, the persona cuts in on a long turn: your turn ends without Done and is saved as cut short
  it("cuts in on a long turn on hard", async () => {
    // The clock
    const clock = fakeClock();
    // What was asked
    const asked: LineRequest[] = [];
    // The repository: hard, tapping Done
    const repository = createRepository(new MemoryStore());
    // Chosen
    await repository.saveSettings({ ...(await repository.getSettings(NOW)), turnEnding: "tap", conversationDifficulty: "hard" });
    // Where it went
    const went: string[] = [];
    // Draw it, cutting in after a moment
    render(<ConversationScreen characterId="theo" services={services(clock)} navigate={(path) => void went.push(path)} writeLine={writer(["Hey.", "Sorry, quick one: where?"], asked)} coachReady={() => true} repository={repository} now={NOW} clock={clock.now} listenDelayMs={0} cutInSeconds={0.3} />);
    // Start (hard was remembered)
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // His cut-in arrives with no Done
    await screen.findByRole("heading", { name: "Sorry, quick one: where?" }, { timeout: 5_000 });
    // End
    fireEvent.click(await screen.findByRole("button", { name: "End conversation" }));
    // Saved
    await waitFor(() => expect(went.length).toBe(1));
    // Your first turn marked as cut short
    expect((await repository.listSessions())[0]!.conversation!.turns.find((turn) => turn.who === "you")?.cut).toBe(true);
  });

  // Without the coach (recorded lines) there is no picker: the script cannot change
  it("offers no difficulty without the coach", async () => {
    // Draw it without the coach
    render(<ConversationScreen characterId="theo" services={services(fakeClock())} navigate={() => {}} coachReady={() => false} repository={createRepository(new MemoryStore())} now={NOW} listenDelayMs={0} />);
    // Ready
    await screen.findByRole("button", { name: "Start" });
    // No picker
    expect(screen.queryByRole("button", { name: "Hard" })).toBeNull();
  });
});

// Group the checks on the timeline's timing (decision 141; chart 13)
describe("ConversationTimeline timing", () => {
  // Timed turns with an overlap and two cut-ins
  const TURNS: ConversationTurn[] = [
    // Her line, cut short by you talking over her
    { who: "them", text: "So the thing about the move is", seconds: 3, at: 0, end: 3, cut: true },
    // You, starting before she finished
    { who: "you", text: "wait which move", seconds: 3, at: 2.4, end: 5.4 },
    // Her reply
    { who: "them", text: "To Lisbon!", seconds: 1, at: 6, end: 7 },
    // You, cut short by her
    { who: "you", text: "oh I love Lisbon I went there in", seconds: 4, at: 7.5, end: 11.5, cut: true },
    // Her cutting in
    { who: "them", text: "Me too!", seconds: 1, at: 11.5, end: 12.5 },
    // A listening sound, then a reply
    { who: "you", text: "mm-hm", seconds: 0.5, at: 13, end: 13.5 },
    // (reply)
    { who: "you", text: "what did you like", seconds: 2, at: 14, end: 16 },
  ];

  // Live: overlaps and cut-ins drawn, the sure findings shown, nothing behind See more
  it("draws overlaps and cut-ins, and shows the sure findings", () => {
    // Drawn live
    render(<ConversationTimeline turns={TURNS} name="Maya" live />);
    // One overlap, one cut by you and one by her; the key names them
    expect([document.querySelectorAll("[data-overlap]").length, document.querySelectorAll("[data-cut='you']").length, document.querySelectorAll("[data-cut='them']").length, screen.getByText("You cut in") !== null, screen.getByText("Maya cut in") !== null, screen.getByText("You cut in on Maya once.") !== null]).toEqual([1, 1, 1, true, true, true]);
  });

  // Not live: the rough findings wait behind See more
  it("keeps rough findings behind See more when not live", () => {
    // Drawn from tapped turns
    render(<ConversationTimeline turns={TURNS} name="Maya" />);
    // Closed: the reply gap is not shown
    expect(screen.queryByText(/You usually replied/)).toBeNull();
    // Opened
    fireEvent.click(screen.getByRole("button", { name: "See more" }));
    // Now shown, with how rough it is
    expect([screen.getByText(/You usually replied/) !== null, screen.getByText(/so they are rough/) !== null, screen.getByRole("button", { name: "See less" }).getAttribute("aria-expanded")]).toEqual([true, true, "true"]);
  });

  // Older turns without times: no timing at all
  it("shows no timing for turns without times", () => {
    // Older turns
    render(<ConversationTimeline turns={[{ who: "them", text: "Hi", seconds: 2 }, { who: "you", text: "hello", seconds: 2 }]} name="Maya" />);
    // Nothing timed
    expect([document.querySelectorAll("[data-overlap], [data-cut]").length, screen.queryByRole("button", { name: "See more" })]).toEqual([0, null]);
  });
});
