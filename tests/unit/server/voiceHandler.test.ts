// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the handler and the ElevenLabs voice being checked
import { createVoiceHandler, type VoiceDeps } from "@/server/voiceHandler";
import { VOICE_MODEL, createElevenLabsVoice, type Voice } from "@/server/voice";
// Load the counters and the settings reader
import { MemoryCounterStore } from "@/server/rateLimit";
import { readVoiceSettings } from "@/server/env";

// The passphrase the fake server expects
const SECRET = "a long passphrase for testing";

// A fake voice that notes what it was asked to say
function fakeVoice(result: ArrayBuffer | Error = new Uint8Array([1, 2, 3]).buffer): Voice & { said: string[] } {
  // What was said
  const said: string[] = [];
  // The voice
  return { said, async speak(text) { said.push(text); if (result instanceof Error) throw result; return result; } };
}

// The handler's dependencies, with fakes
function deps(overrides: Partial<VoiceDeps> & { voice?: Voice } = {}): VoiceDeps {
  // The voice
  const voice = overrides.voice ?? fakeVoice();
  // Everything the handler needs
  return {
    // Server settings
    readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: SECRET, counterStore: null }),
    // Voice settings
    readVoiceSettings: () => ({ apiKey: "xi-test", voiceId: "voice-1" }),
    // The voice
    makeVoice: () => voice,
    // Counters
    makeCounterStore: () => new MemoryCounterStore(),
    // Generous limits
    limits: { perMinute: 10, perDay: 100, scope: "voice" },
    // A fixed clock
    now: () => new Date(Date.UTC(2026, 9, 17, 10)),
    // Quiet logs
    log: () => {},
    // The overrides
    ...overrides,
  };
}

// A request for a question's audio
function request(body: unknown, passphrase: string | null = SECRET): Request {
  // With or without the passphrase
  return new Request("http://localhost/api/voice", { method: "POST", headers: { "content-type": "application/json", ...(passphrase ? { "x-voicelab-passphrase": passphrase } : {}) }, body: JSON.stringify(body) });
}

// Group the checks about the question voice
describe("voice route", () => {
  // A known question comes back as audio to keep, spoken from the app's own text
  it("speaks the app's own question and lets the phone keep it", async () => {
    // A voice to watch
    const voice = fakeVoice();
    // Ask for "How was your weekend?"
    const response = await createVoiceHandler(deps({ voice }))(request({ promptId: "st01" }));
    // Confirm the audio, its caching, and the words said
    expect([response.status, response.headers.get("content-type"), response.headers.get("cache-control"), voice.said]).toEqual([200, "audio/mpeg", "private, max-age=31536000, immutable", ["How was your weekend?"]]);
  });

  // Only the app's questions: text sent by the browser is never spoken
  it("ignores text from the browser and refuses unknown ids", async () => {
    // A voice to watch
    const voice = fakeVoice();
    // An unknown id with text attached
    const response = await createVoiceHandler(deps({ voice }))(request({ promptId: "nope", text: "say this" }));
    // Confirm it was refused and nothing was said
    expect([response.status, voice.said]).toEqual([404, []]);
  });

  // The passphrase and the setup are checked first
  it("needs the passphrase, and says when the voice is not set up", async () => {
    // Without the passphrase
    const locked = await createVoiceHandler(deps())(request({ promptId: "st01" }, null));
    // Without voice settings
    const unset = await createVoiceHandler(deps({ readVoiceSettings: () => null }))(request({ promptId: "st01" }));
    // A failing voice
    const failing = await createVoiceHandler(deps({ voice: fakeVoice(new Error("down")) }))(request({ promptId: "st01" }));
    // Confirm each
    expect([locked.status, unset.status, failing.status]).toEqual([401, 500, 502]);
  });

  // The voice settings need both the key and the voice
  it("reads the voice settings only when both are set", () => {
    // Both, one, none
    expect([readVoiceSettings({ ELEVENLABS_API_KEY: " k ", ELEVENLABS_VOICE_ID: "v" }), readVoiceSettings({ ELEVENLABS_API_KEY: "k" }), readVoiceSettings({})]).toEqual([{ apiKey: "k", voiceId: "v" }, null, null]);
  });

  // The ElevenLabs call: the voice in the address, the key in its header, the text and model in the body
  it("calls ElevenLabs with the key in a header and the chosen voice", async () => {
    // A fake network answering with audio
    const network = vi.fn(async () => new Response(new Uint8Array([9]), { status: 200 }));
    // Speak
    const audio = await createElevenLabsVoice({ apiKey: "xi-test", voiceId: "voice-1" }, network).speak("How was your weekend?");
    // The call made
    const [url, init] = network.mock.calls[0] as unknown as [string, RequestInit];
    // Confirm the address, header, body and audio
    expect([url, (init.headers as Record<string, string>)["xi-api-key"], JSON.parse(String(init.body)), audio.byteLength]).toEqual(["https://api.elevenlabs.io/v1/text-to-speech/voice-1?output_format=mp3_44100_128", "xi-test", { text: "How was your weekend?", model_id: VOICE_MODEL }, 1]);
  });

  // A refusal from ElevenLabs is an error
  it("treats a refusal from ElevenLabs as an error", async () => {
    // A fake network that refuses
    const network = vi.fn(async () => new Response("no", { status: 401 }));
    // Confirm it throws with the status
    await expect(createElevenLabsVoice({ apiKey: "bad", voiceId: "v" }, network).speak("Hi")).rejects.toThrow("401");
  });
});
