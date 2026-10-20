// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the handler being checked
import { createConversationHandler, type ConversationDeps } from "@/server/conversationHandler";
// Load the writer and voice types
import type { ConversationWriter, WriteResult } from "@/server/conversationWriter";
import type { PersonaVoice } from "@/server/voice";
// Load the counters
import { MemoryCounterStore } from "@/server/rateLimit";
// Load the personas
import { findPersona } from "@/content/conversations";

// The passphrase the fake server expects
const SECRET = "a long passphrase for testing";

// A fake writer that notes what it was asked and answers as told
function fakeWriter(result: WriteResult | Error): ConversationWriter & { asked: unknown[][] } {
  // What it was asked
  const asked: unknown[][] = [];
  // The writer
  return { asked, async write(...args) { asked.push(args); if (result instanceof Error) throw result; return result; } };
}

// A fake voice that notes what it said, in which voice, and answers with three bytes (or fails)
function fakeVoice(fails = false): PersonaVoice & { said: string[][] } {
  // What it said
  const said: string[][] = [];
  // The voice
  return { said, async speak(text, voiceId) { said.push([text, voiceId]); if (fails) throw new Error("ElevenLabs answered 401."); return new Uint8Array([1, 2, 3]).buffer; } };
}

// The handler's dependencies, with fakes
function deps(writer: ConversationWriter, voice: PersonaVoice | null, logs: string[] = []): ConversationDeps {
  // Everything the handler needs
  return {
    // The passphrase setting
    readAccessSecret: () => SECRET,
    // Server settings
    readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: SECRET, counterStore: null }),
    // The writer
    makeWriter: () => writer,
    // The voice
    makeVoice: () => voice,
    // Counters
    makeCounterStore: () => new MemoryCounterStore(),
    // Generous limits
    limits: { perMinute: 10, perDay: 100, scope: "conversation" },
    // A fixed clock
    now: () => new Date(Date.UTC(2026, 9, 20, 10)),
    // Logs kept
    log: (line) => void logs.push(line),
  };
}

// A request for the next line
function request(body: unknown, passphrase: string | null = SECRET): Request {
  // With or without the passphrase
  return new Request("http://localhost/api/conversation", { method: "POST", headers: { "content-type": "application/json", ...(passphrase ? { "x-voicelab-passphrase": passphrase } : {}) }, body: JSON.stringify(body) });
}

// A body: Theo opened in the meeting, you asked an open question
const BODY = { personaId: "theo", scenarioId: "meeting", twist: 0, stage: "talk", heard: true, turns: [{ who: "them", text: "Hey. Looks like we're early." }, { who: "you", text: "what do you do outside of work" }] };

// A written line with directions
const LINE: WriteResult = { status: "ok", line: "[softly] Well… I fix up old radios. [grinning]", goodbye: false };

// Group the checks about the conversation route (decision 84)
describe("conversation route", () => {
  // The line is tidied, spoken with its directions in the persona's voice, and sent back without them, with its audio
  it("writes the line and speaks it in the persona's voice", async () => {
    // A writer and a voice
    const [writer, voice] = [fakeWriter(LINE), fakeVoice()];
    // Ask
    const response = await createConversationHandler(deps(writer, voice))(request(BODY));
    // What the writer was given: the persona, the situation, the twist, the turns, the stage and whether it was heard
    const [persona, scenario, twist, turns, stage, heard] = writer.asked[0] as [{ id: string }, { id: string }, number, unknown[], string, boolean];
    // The reply, what was spoken and in which voice, and what the writer was given
    expect([response.status, await response.json(), voice.said, [persona.id, scenario.id, twist, turns.length, stage, heard]]).toEqual([200, { text: "Well… I fix up old radios.", audio: "AQID", goodbye: false }, [["[softly] Well… I fix up old radios.", findPersona("theo")!.voiceId]], ["theo", "meeting", 0, 2, "talk", true]]);
  });

  // Without ElevenLabs, or when it fails, the words come back with no audio, so the phone's own voice says them
  it("sends the words without audio when the voice is missing or fails", async () => {
    // No voice
    const none = await createConversationHandler(deps(fakeWriter(LINE), null))(request(BODY));
    // A failing voice, logged
    const logs: string[] = [];
    // Failing
    const failed = await createConversationHandler(deps(fakeWriter(LINE), fakeVoice(true), logs))(request(BODY));
    // Both without audio, and the failure logged
    expect([(await none.json()).audio, (await failed.json()).audio, logs]).toEqual([null, null, ["Conversation voice failed: ElevenLabs answered 401."]]);
  });

  // A goodbye only when winding down, always when time is up, never earlier
  it("ends the conversation only when it is time", async () => {
    // A writer that says goodbye
    const bye: WriteResult = { status: "ok", line: "See you later!", goodbye: true };
    // A writer that does not
    const stay: WriteResult = { status: "ok", line: "Mm.", goodbye: false };
    // The goodbye flag at each stage
    const flag = async (result: WriteResult, stage: string) => (await (await createConversationHandler(deps(fakeWriter(result), null))(request({ ...BODY, stage }))).json()).goodbye as boolean;
    // Early, winding down, and time up without one
    expect([await flag(bye, "talk"), await flag(bye, "wrap"), await flag(stay, "end")]).toEqual([false, true, true]);
  });

  // A decline, a failure, or nothing left after tidying each say so
  it("reports a decline and a failure", async () => {
    // Declined
    const declined = await createConversationHandler(deps(fakeWriter({ status: "declined" }), null))(request(BODY));
    // Failed
    const failed = await createConversationHandler(deps(fakeWriter(new Error("overloaded")), null))(request(BODY));
    // Only a direction
    const empty = await createConversationHandler(deps(fakeWriter({ status: "ok", line: "[laughs]", goodbye: false }), null))(request(BODY));
    // Each
    expect([declined.status, failed.status, empty.status]).toEqual([422, 502, 502]);
  });

  // The passphrase, the body, the persona, the situation and the twist are checked before anything is written
  it("refuses without the passphrase, a bad body, or an unknown persona, situation or twist", async () => {
    // A writer that must not be asked
    const writer = fakeWriter(LINE);
    // The handler
    const handle = createConversationHandler(deps(writer, null));
    // Each refusal
    const statuses = [(await handle(request(BODY, null))).status, (await handle(request({ ...BODY, turns: "lots" }))).status, (await handle(request({ ...BODY, personaId: "nope" }))).status, (await handle(request({ ...BODY, scenarioId: "nope" }))).status, (await handle(request({ ...BODY, twist: 7 }))).status];
    // Refused, and never asked
    expect([statuses, writer.asked.length]).toEqual([[401, 400, 404, 404, 400], 0]);
  });
});
