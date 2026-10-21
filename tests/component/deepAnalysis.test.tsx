// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the tool for acting like a user
import userEvent from "@testing-library/user-event";
// Load the screens being checked
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { SessionScreen } from "@/components/screens/SessionScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { RecordingScreen } from "@/components/screens/RecordingScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the passphrase storage
import { savePassphrase } from "@/data/passphrase";
// Load the analysis builders and the notes
import { buildAnalysis, withDeepStatus, withServerAnalysis } from "@/core/analysis/analysis";
import { DEEP_NOTES, deepStatus } from "@/core/analysis/deep";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the sample records
import { makeSession } from "../support/fixtures";
import { makeTranscript, makeVoice } from "../support/serverAnalysis";

// A fixed "now"
const NOW = new Date(2026, 9, 21, 18);
// The passphrase
const PASS = "a long passphrase for testing";

// Remove the drawn screen and the saved passphrase after each check
afterEach(() => {
  // The screen
  cleanup();
  // The passphrase
  localStorage.clear();
});

// A network that answers the status check with a body, noting each call
function statusAnswer(body: unknown, status = 200) {
  // Every call gets the same reply
  return vi.fn<typeof fetch>(async () => Response.json(body, { status }));
}

// A repository with the setting on or off
async function settingsRepository(on: boolean): Promise<Repository> {
  // Empty
  const repository = createRepository(new MemoryStore());
  // The setting
  await repository.saveSettings({ ...(await repository.getSettings(NOW)), deepAnalysis: on });
  // Ready
  return repository;
}

// Group the checks about the deeper-analysis setting (decision 91)
describe("Settings: Send my recordings for deeper analysis", () => {
  // Off by default, with what it would send said plainly; turning it on saves it and checks the server
  it("is off by default, and turning it on saves it and shows the server is ready", async () => {
    // The passphrase is saved
    savePassphrase(PASS);
    // A server with both parts set up
    const fetchFn = statusAnswer({ transcription: true, voice: true, problems: [] });
    // An empty repository
    const repository = createRepository(new MemoryStore());
    // Drawn
    render(<SettingsScreen repository={repository} now={NOW} fetchFn={fetchFn} />);
    // The switch
    const toggle = await screen.findByRole("checkbox", { name: /Send my recordings for deeper analysis/ });
    // Calls to anything but the conversation minutes (which Settings also asks for, decision 102)
    const deepCalls = () => fetchFn.mock.calls.filter((call) => !String(call[0]).includes("/api/conversation"));
    // Off, with what leaves the phone explained, and nothing asked yet
    const before = [toggle instanceof HTMLInputElement && toggle.checked, !!screen.getByText(/sent once to a transcription service \(AssemblyAI\) and to VoiceLab’s own voice-analysis server/), !!screen.getByText(/Neither keeps your recording or transcript/), deepCalls().length];
    // Switch it on
    await userEvent.click(toggle);
    // The server's state
    const ready = await screen.findByText("Ready: transcription and voice analysis are set up on the server.");
    // Saved, asked with the passphrase
    expect([before, !!ready, (await repository.getSettings(NOW)).deepAnalysis, new Headers((deepCalls()[0]![1] as RequestInit).headers).get("x-voicelab-passphrase")]).toEqual([[false, true, true, 0], true, true, PASS]);
  });

  // Not set up: says so, with what is wrong by name
  it("says when the server is not set up, naming what is wrong", async () => {
    // The passphrase is saved
    savePassphrase(PASS);
    // Drawn with the setting on and a server with nothing set up
    render(<SettingsScreen repository={await settingsRepository(true)} now={NOW} fetchFn={statusAnswer({ transcription: false, voice: false, problems: ["VOICE_WORKER_URL is set but VOICE_WORKER_SECRET is not."] })} />);
    // The state and the problem
    expect([!!(await screen.findByText(/Deeper analysis isn’t set up on the server yet/)), !!screen.getByText("VOICE_WORKER_URL is set but VOICE_WORKER_SECRET is not.")]).toEqual([true, true]);
  });

  // No passphrase: nothing is asked, and the way forward is given
  it("asks for the passphrase first", async () => {
    // A network that must not be used
    const fetchFn = statusAnswer({});
    // Drawn with the setting on and no passphrase
    render(<SettingsScreen repository={await settingsRepository(true)} now={NOW} fetchFn={fetchFn} />);
    // The way forward, nothing sent
    expect([!!(await screen.findByText(/Needs the passphrase from “Set up the coach” above/)), fetchFn.mock.calls.length]).toEqual([true, 0]);
  });

  // Offline: says it could not check (rule T1: never stuck on "Checking…")
  it("says when the server could not be reached", async () => {
    // The passphrase is saved
    savePassphrase(PASS);
    // Drawn with a failing network
    render(<SettingsScreen repository={await settingsRepository(true)} now={NOW} fetchFn={vi.fn(async () => { throw new TypeError("Failed to fetch"); })} />);
    // Said
    expect(await screen.findByText(/Couldn’t reach the server to check/)).toBeTruthy();
  });
});

// A repository holding a take and its analysis, changed by a function
async function takeRepository(change: (analysis: ReturnType<typeof buildAnalysis>) => ReturnType<typeof buildAnalysis>) {
  // Empty
  const repository = createRepository(new MemoryStore());
  // A Rapid Fire take with feedback
  const session = makeSession({ id: "s1", mode: "talk", createdAt: "2026-10-21T21:00:00.000Z", feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r" }, selfReview: { worked: "", change: "", tags: [], skipped: true, savedAt: "2026-10-21T21:01:00.000Z" } });
  // Saved
  await repository.saveSession(session);
  // Its analysis, changed
  await repository.saveAnalysis(change(buildAnalysis(session, NOW)));
  // Ready
  return repository;
}

// Group the checks about the quiet note on a take
describe("Take page: the deeper-analysis note", () => {
  // A failure is said quietly, with the phone's measures kept
  it("shows a quiet note when the deeper analysis failed", async () => {
    // A take whose deeper analysis failed
    render(<SessionScreen sessionId="s1" repository={await takeRepository((analysis) => withDeepStatus(analysis, deepStatus("failed", NOW.toISOString())))} now={NOW} />);
    // The note
    expect(await screen.findByText(DEEP_NOTES.failed)).toBeTruthy();
  });

  // Under way: says so; done: says nothing
  it("says when it is under way, and nothing when it is done", async () => {
    // Under way, started just now by the real clock (the page judges "under way" against the later of its date and the real time, so a start fixed at NOW read as stale once the real day passed NOW plus ten minutes)
    render(<SessionScreen sessionId="s1" repository={await takeRepository((analysis) => withDeepStatus(analysis, deepStatus("running", new Date(Math.max(NOW.getTime(), Date.now())).toISOString())))} now={NOW} />);
    // Said
    const running = !!(await screen.findByText(DEEP_NOTES.running));
    // Cleared
    cleanup();
    // Done
    render(<SessionScreen sessionId="s1" repository={await takeRepository((analysis) => withServerAnalysis(analysis, { transcript: makeTranscript("Hi there all."), voice: makeVoice() }, deepStatus("done", NOW.toISOString())))} now={NOW} />);
    // The page is drawn
    await screen.findByRole("link", { name: "See all measures for this take" });
    // No note
    expect([running, document.querySelector("[data-deep-note]")]).toEqual([true, null]);
  });
});

// Group the checks about the profile showing the server's voice measures
describe("Profile: measures from deeper analysis", () => {
  // The voice group lists the server's voice measures with plain names and what each means; the per-take table marks them
  it("shows the server's voice measures in the voice group, with plain names", async () => {
    // A take analysed on the server
    const repository = await takeRepository((analysis) => withServerAnalysis(analysis, { transcript: makeTranscript("The dog | ran home."), voice: makeVoice() }, deepStatus("done", NOW.toISOString())));
    // The profile
    render(<ProfileScreen repository={repository} now={NOW} />);
    // The voice group
    const voice = await screen.findByRole("region", { name: "Voice" });
    // The deeper list inside it
    const deeper = within(voice).getByRole("list", { name: "From deeper analysis" });
    // Its measures, with a plain name, value and meaning
    expect([within(deeper).getByText("Pitch steadiness (jitter)").textContent, deeper.querySelector("[data-metric='pro.hnr_db']")?.textContent?.includes("14 dB"), !!within(deeper).getByText(/How much of the voice is clear tone/), deeper.querySelector("[data-metric='pro.arousal']")]).toEqual(["Pitch steadiness (jitter)", true, true, null]);
    // The per-take table
    cleanup();
    // Drawn
    render(<ProfileScreen sessionId="s1" repository={repository} now={NOW} />);
    // The jitter row is marked as from deeper analysis
    expect((await screen.findByText(/Pitch steadiness \(jitter\)/)).closest("tr")?.textContent).toContain("deeper analysis");
  });
});

// Group the checks about sending a take as it is saved (rule T7: the screen's own wiring, with only the network replaced)
describe("Recording: a saved take is sent when the setting is on", () => {
  // Fake recording services: a microphone, a transcriber with fixed words, and fixed audio
  function services(): RecordingServices {
    // The fakes
    return {
      // Speech works
      speechSupported: () => true,
      // A stand-in stream
      openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [new EventTarget()] }) as unknown as MediaStream,
      // A transcriber with fixed words
      createTranscriber: () => ({ start: () => {}, stop: async () => "the best part of my week was the dog" }),
      // A capture with fixed audio
      createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"], { type: "audio/webm" }) }),
    };
  }

  // On: one upload with the take's length, and the result kept
  it("uploads the audio once after saving and keeps the result", async () => {
    // The passphrase is saved
    savePassphrase(PASS);
    // The setting on
    const repository = await settingsRepository(true);
    // A clock the check moves
    let time = new Date(2026, 9, 21, 10).getTime();
    // The route, stood in
    const fetchFn = vi.fn<typeof fetch>(async () => Response.json({ transcript: makeTranscript("The best part | of my week."), voice: makeVoice(), failures: {} }));
    // Where it goes next
    const navigate = vi.fn();
    // Drawn
    render(<RecordingScreen promptId="p001" mode="standard" retryOf={null} repository={repository} services={services()} clock={() => new Date(time)} navigate={navigate} fetchFn={fetchFn} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // The stop action
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Forty seconds
    time += 40_000;
    // Stop
    fireEvent.click(stop);
    // Saved and opened
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved take
    const [saved] = await repository.listSessions();
    // The result kept
    await waitFor(async () => expect((await repository.getAnalysis(saved!.id))?.deep?.status).toBe("done"));
    // One upload to the route, with the length
    expect([fetchFn.mock.calls.length, fetchFn.mock.calls[0]![0], new Headers((fetchFn.mock.calls[0]![1] as RequestInit).headers).get("x-voicelab-duration"), (await repository.getAnalysis(saved!.id))?.metrics["pro.jitter_local"]?.value]).toEqual([1, "/api/analyse", "40", 1.2]);
  });

  // Off (the default): nothing is sent
  it("sends nothing when the setting is off", async () => {
    // The passphrase is saved
    savePassphrase(PASS);
    // A default repository (setting off)
    const repository = createRepository(new MemoryStore());
    // A clock the check moves
    let time = new Date(2026, 9, 21, 10).getTime();
    // A network that must not be used
    const fetchFn = vi.fn(async () => Response.json({}));
    // Where it goes next
    const navigate = vi.fn();
    // Drawn
    render(<RecordingScreen promptId="p001" mode="standard" retryOf={null} repository={repository} services={services()} clock={() => new Date(time)} navigate={navigate} fetchFn={fetchFn} />);
    // Start
    fireEvent.click(await screen.findByRole("button", { name: /Start speaking/ }));
    // The stop action
    const stop = await screen.findByRole("button", { name: /Stop/ });
    // Forty seconds
    time += 40_000;
    // Stop
    fireEvent.click(stop);
    // Saved and opened
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // A moment for anything stray
    await new Promise((resolve) => setTimeout(resolve, 20));
    // Nothing sent
    expect(fetchFn.mock.calls.length).toBe(0);
  });
});
