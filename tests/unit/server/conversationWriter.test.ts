// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load Node's file reader for the recorded responses
import { readFileSync } from "node:fs";
// Load the writer and the persona voice being checked
import { createClaudeWriter } from "@/server/conversationWriter";
import { createPersonaVoice } from "@/server/voice";
// Load the model settings
import { CONVERSATION_MODEL, CONVERSATION_VOICE_MODEL } from "@/config/models";
// Load the personas and situations
import { findPersona, findScenario } from "@/content/conversations";

// Read a recorded API response from the fixtures folder
const recorded = (name: string) => readFileSync(`tests/fixtures/coach/${name}.json`, "utf8");

// A fake network that answers with a recorded response and remembers what was sent
const fakeNetwork = (body: string) => vi.fn(async () => new Response(body, { status: 200, headers: { "content-type": "application/json" } }));

// Theo, early for a meeting
const theo = findPersona("theo")!;
// The meeting
const meeting = findScenario("meeting")!;

// Group the checks about the Claude-backed writer (decision 84)
describe("createClaudeWriter", () => {
  // The fast model, no thinking, the persona in the message, and the line back
  it("asks the fast model without thinking and hands back the line", async () => {
    // A network answering with a line
    const network = fakeNetwork(recorded("write-response"));
    // Ask after Theo opened and you asked about his weekend
    const result = await createClaudeWriter("sk-test", network).write(theo, meeting, 0, [{ who: "them", text: "Hey. Looks like we're early.", seconds: 0 }, { who: "you", text: "what do you do outside of work", seconds: 3 }], "talk", true);
    // What was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { model: string; thinking: { type: string }; output_config: { effort: string; format: { type: string } }; messages: unknown };
    // The model, no thinking, low effort, a JSON shape, the personality, and the line
    expect([sent.model, sent.thinking.type, sent.output_config.effort, sent.output_config.format.type, JSON.stringify(sent.messages).includes("Quiet, gentle and thoughtful"), result]).toEqual([CONVERSATION_MODEL, "disabled", "low", "json_schema", true, { status: "ok", line: "[softly] Oh… um, the radios? Mostly ones from the fifties. [laughs softly] I find them broken at flea markets.", goodbye: false }]);
  });

  // A safety decline is reported, not thrown
  it("reports a decline", async () => {
    // A network answering with a refusal
    const result = await createClaudeWriter("sk-test", fakeNetwork(recorded("refusal-response"))).write(theo, meeting, 0, [], "open", true);
    // Declined
    expect(result).toEqual({ status: "declined" });
  });
});

// Group the checks about speaking a line in the persona's voice
describe("createPersonaVoice", () => {
  // The persona's voice, the expressive model, a small MP3, and the key in its header
  it("asks ElevenLabs for the line in the persona's voice", async () => {
    // A network answering with audio
    const network = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    // Speak
    const audio = await createPersonaVoice("xi-test", network).speak("[softly] Hi.", theo.voiceId);
    // What was sent
    const [url, init] = network.mock.calls[0] as unknown as [string, RequestInit];
    // The voice, the format, the key, the words and model, and the audio back
    expect([url, new Headers(init.headers).get("xi-api-key"), JSON.parse(String(init.body)), new Uint8Array(audio)]).toEqual([`https://api.elevenlabs.io/v1/text-to-speech/${theo.voiceId}?output_format=mp3_44100_64`, "xi-test", { text: "[softly] Hi.", model_id: CONVERSATION_VOICE_MODEL }, new Uint8Array([1, 2, 3])]);
  });

  // A refusal is an error, so the phone's voice can take over
  it("fails on a refusal", async () => {
    // A network refusing
    await expect(createPersonaVoice("xi-test", vi.fn(async () => new Response("", { status: 401 }))).speak("Hi.", theo.voiceId)).rejects.toThrow("ElevenLabs answered 401.");
  });
});
