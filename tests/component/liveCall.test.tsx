// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
// Load the screens being checked
import { ConversationScreen, type OpenCall, type OpenLive, type WriteLine } from "@/components/screens/ConversationScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the call types
import type { CallHandlers, StartCall } from "@/audio/liveCall";
// Load the overrides type
import type { CallOverrides } from "@/core/liveCall";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";

// A fixed "now"
const NOW = new Date(2026, 9, 22, 10);

// Remove drawn screens after each check
afterEach(cleanup);

// Stand-in services (a call needs none of them; the fallback uses them)
const SERVICES: RecordingServices = {
  // Speech support
  speechSupported: () => true,
  // A stand-in stream
  openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
  // Lines
  speak: async () => null,
  // (written)
  speakAudio: async () => undefined,
  // Unlocking
  unlockSpeech: () => undefined,
  // Stopping
  stopSpeaking: () => undefined,
  // Words
  createTranscriber: () => ({ start: (onText) => onText({ final: "hello", interim: "" }), stop: async () => "hello" }),
  // A steady voice
  createCapture: () => ({ level: () => 0.1, stop: async () => new Blob(["v"]) }),
};

// A granted call over WebRTC
const openCall: OpenCall = async () => ({ grant: { kind: "b", connection: "webrtc", conversationToken: "tok", grantedSeconds: 300, minutesLeft: 55 } });

// A stand-in call: notes the overrides it was started with and hands the check its handlers; the first start can fail
function fakeCall(failFirst = false) {
  // What happened
  const state: { handlers: CallHandlers | null; overrides: CallOverrides["overrides"][]; ended: number; settled: number[] } = { handlers: null, overrides: [], ended: 0, settled: [] };
  // The starter
  const startCall: StartCall = async (_grant, overrides, handlers) => {
    // Noted
    state.overrides.push(overrides);
    // The first fails, when asked (the agent refusing the voice)
    if (failFirst && state.overrides.length === 1) throw new Error("voice not allowed");
    // Kept for the check
    state.handlers = handlers;
    // Connected
    handlers.onConnected();
    // Hanging up
    return { end: async () => void (state.ended += 1) };
  };
  // Both, with a settler that notes
  return { state, startCall, settleCall: (_id: string, seconds: number) => void state.settled.push(seconds) };
}

// A repository with a phone call chosen and the given difficulty
async function callRepository(): Promise<Repository> {
  // The repository
  const repository = createRepository(new MemoryStore());
  // Call chosen, hard
  await repository.saveSettings({ ...(await repository.getSettings(NOW)), turnEnding: "call", conversationDifficulty: "hard" });
  // Ready
  return repository;
}

// Group the checks on phone calls (decision 121)
describe("Phone call", () => {
  // The call starts with the persona's overrides, the lines show as they come, End call saves the transcript with its times as a call
  it("runs a call and saves its transcript with times", async () => {
    // The stand-in call
    const { state, startCall, settleCall } = fakeCall();
    // The repository
    const repository = await callRepository();
    // Where it went
    const went: string[] = [];
    // Draw it
    render(<ConversationScreen characterId="maya" services={SERVICES} navigate={(path) => void went.push(path)} coachReady={() => true} repository={repository} now={NOW} openCall={openCall} startCall={startCall} settleCall={settleCall} listenDelayMs={0} />);
    // The intro says it is a call and where the voice goes
    await screen.findByText(/During the call your voice goes to ElevenLabs and is not kept/);
    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // On the call
    await screen.findByText(/Phone call$/);
    // The agent speaks, you answer
    const at = Date.now();
    // The events
    await act(async () => {
      // Speaking
      state.handlers!.onEvent({ type: "mode", at, mode: "speaking" });
      // Her line
      state.handlers!.onEvent({ type: "agent", at: at + 100, text: "Oh hi! I don't think we've properly met." });
      // Listening
      state.handlers!.onEvent({ type: "mode", at: at + 2_000, mode: "listening" });
      // Your line
      state.handlers!.onEvent({ type: "user", at: at + 4_000, text: "hi I'm Sam from research" });
    });
    // Your line shows
    await screen.findByRole("heading", { name: "hi I'm Sam from research" });
    // Hang up
    fireEvent.click(screen.getByRole("button", { name: "End call" }));
    // Saved
    await waitFor(() => expect(went.length).toBe(1));
    // The saved conversation
    const saved = (await repository.listSessions())[0]!;
    // Overrides: Maya's stand-in voice, the party's first line, the hard rule; hung up and settled; saved as a call, hard, both turns timed
    expect([state.overrides[0]?.tts?.voiceId, state.overrides[0]?.agent.firstMessage, state.overrides[0]?.agent.prompt.prompt.includes("Difficulty: Make this conversation harder"), state.ended, state.settled.length, saved.conversation?.turnMode, saved.conversation?.difficulty, saved.conversation?.turns.map((turn) => [turn.who, turn.text, typeof turn.at, typeof turn.end]), saved.feedbackStatus]).toEqual(["Mac2FKpSgaGIsaNRXt8A", "Oh hi! I don’t think we’ve properly met. I’m Maya, I just joined the team.", true, 1, 1, "call", "hard", [["them", "Oh hi! I don't think we've properly met.", "number", "number"], ["you", "hi I'm Sam from research", "number", "number"]], "pending"]);
  });

  // The agent refusing the persona's voice: tried once more with the agent's own voice
  it("starts again with the agent's own voice when the first start fails", async () => {
    // The stand-in call, failing first
    const { state, startCall, settleCall } = fakeCall(true);
    // Draw it
    render(<ConversationScreen characterId="maya" services={SERVICES} navigate={() => {}} coachReady={() => true} repository={await callRepository()} now={NOW} openCall={openCall} startCall={startCall} settleCall={settleCall} listenDelayMs={0} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // On the call
    await screen.findByRole("button", { name: "End call" });
    // The first asked for Maya's voice, the second for none
    expect([state.overrides.length, state.overrides[0]?.tts?.voiceId, "tts" in state.overrides[1]!]).toEqual([2, "Mac2FKpSgaGIsaNRXt8A", false]);
  });

  // Over the call minutes: one line, and live turns instead (here live is refused too, so turns end automatically)
  it("falls back to live turns with one line when the call minutes are used up", async () => {
    // Refused for budget
    const refused: OpenCall = async () => ({ refused: "budget" });
    // Live refused too
    const noLive: OpenLive = async () => ({ refused: "not-set-up" });
    // The opening line
    const writeLine: WriteLine = async () => ({ text: "Hi! I'm Maya.", audio: null, goodbye: false });
    // Draw it
    render(<ConversationScreen characterId="maya" services={SERVICES} navigate={() => {}} writeLine={writeLine} coachReady={() => true} repository={await callRepository()} now={NOW} openCall={refused} startCall={fakeCall().startCall} openLive={noLive} settleLive={() => undefined} listenDelayMs={0} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // Both lines
    await screen.findByText("This month’s phone-call minutes are used up, so this conversation uses live turns.");
    // (live's)
    await screen.findByText("Live conversations aren’t set up on the server, so turns end automatically.");
    // The usual conversation goes on
    await screen.findByRole("heading", { name: "Hi! I'm Maya." });
  });

  // The agent hanging up by itself saves the call
  it("saves when the agent ends the call", async () => {
    // The stand-in call
    const { state, startCall, settleCall } = fakeCall();
    // The repository
    const repository = await callRepository();
    // Where it went
    const went: string[] = [];
    // Draw it
    render(<ConversationScreen characterId="theo" services={SERVICES} navigate={(path) => void went.push(path)} coachReady={() => true} repository={repository} now={NOW} openCall={openCall} startCall={startCall} settleCall={settleCall} listenDelayMs={0} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    // On the call
    await screen.findByRole("button", { name: "End call" });
    // A line each, then the agent hangs up
    await act(async () => {
      // His line
      state.handlers!.onEvent({ type: "agent", at: Date.now(), text: "Hey." });
      // Yours
      state.handlers!.onEvent({ type: "user", at: Date.now() + 1_000, text: "hi Theo" });
      // Ended by the agent
      state.handlers!.onEnded(false);
    });
    // Saved
    await waitFor(() => expect(went.length).toBe(1));
  });
});

// Group the checks on the Settings choice
describe("Settings: phone call", () => {
  // A fourth choice; choosing it says where the voice goes
  it("offers Phone call (beta)", async () => {
    // The repository
    const repository = createRepository(new MemoryStore());
    // Draw Settings
    render(<SettingsScreen repository={repository} now={NOW} />);
    // Choose it
    fireEvent.click(await screen.findByRole("button", { name: "Phone call (beta)" }));
    // Said
    await screen.findByText(/During the call your voice goes to ElevenLabs and is not kept/);
    // Saved
    await waitFor(async () => expect((await repository.getSettings(NOW)).turnEnding).toBe("call"));
  });
});
