// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the handler being checked
import { createConversationHandler, createConversationMinutesHandler, monthKey, type ConversationDeps } from "@/server/conversationHandler";
// Load the writer and voice types
import type { ConversationWriter, WriteResult } from "@/server/conversationWriter";
import type { WriterEvent } from "@/server/conversationStream";
import type { PersonaVoice } from "@/server/voice";
// Load the counters
import { MemoryCounterStore, type CounterStore } from "@/server/rateLimit";
// Load the stream's line format
import { decodeEvent, splitLines, type StreamEvent } from "@/core/conversationStream";
// Load the personas
import { findPersona } from "@/content/conversations";
// Load the model ids
import { CONVERSATION_VOICE_MODEL, CONVERSATION_VOICE_MODEL_FAST } from "@/config/models";

// The passphrase the fake server expects
const SECRET = "a long passphrase for testing";
// The fixed "now"
const NOW = new Date(Date.UTC(2026, 9, 20, 10));

// A fake writer that notes what it was asked and answers as told; streamed, it sends the given pieces then ends (or fails, or declines)
function fakeWriter(result: WriteResult | Error, streamed: { pieces?: string[]; ending?: "end" | "throw" | "decline" } = {}): ConversationWriter & { asked: unknown[][] } {
  // What it was asked
  const asked: unknown[][] = [];
  // The writer
  return {
    // Noted
    asked,
    // Whole
    async write(...args) {
      // Noted
      asked.push(args);
      // A failure
      if (result instanceof Error) throw result;
      // The line
      return result;
    },
    // Streamed
    async *stream(...args): AsyncGenerator<WriterEvent> {
      // Noted
      asked.push(args);
      // Each piece
      for (const text of streamed.pieces ?? []) yield { type: "text", text };
      // A failure part-way
      if (streamed.ending === "throw") throw new Error("connection reset");
      // The end
      yield { type: "end", declined: streamed.ending === "decline" };
    },
  };
}

// A fake voice that notes what it said, in which voice and how, and answers with three bytes (or fails: always, or only when streaming)
function fakeVoice(fails: "never" | "always" | "streaming" = "never"): PersonaVoice & { said: unknown[][] } {
  // What it said
  const said: unknown[][] = [];
  // The voice
  return {
    // Noted
    said,
    // Speak
    async speak(text, voiceId, options) {
      // Noted
      said.push([text, voiceId, options?.streaming === true]);
      // Failing
      if (fails === "always" || (fails === "streaming" && options?.streaming)) throw new Error("ElevenLabs answered 401.");
      // Three bytes
      return new Uint8Array([1, 2, 3]).buffer;
    },
  };
}

// The handler's dependencies, with fakes
function deps(writer: ConversationWriter, voice: PersonaVoice | null, extra: Partial<ConversationDeps> & { logs?: string[]; models?: string[] } = {}): ConversationDeps {
  // The shared counters
  const store = new MemoryCounterStore();
  // Everything the handler needs
  return {
    // The passphrase setting
    readAccessSecret: () => SECRET,
    // Server settings
    readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: SECRET, counterStore: null }),
    // The writer
    makeWriter: () => writer,
    // The voice, noting the model asked for
    makeVoice: (model) => {
      // Noted
      extra.models?.push(model);
      // The voice
      return voice;
    },
    // Counters
    makeCounterStore: () => store,
    // Generous limits
    limits: { perMinute: 100, perDay: 1000, scope: "conversation" },
    // A fixed clock
    now: () => NOW,
    // A timing clock that moves 5 ms each read
    timer: (() => {
      // The time
      let time = 0;
      // Read
      return () => (time += 5);
    })(),
    // Logs kept
    log: (line) => void extra.logs?.push(line),
    // Anything else
    ...extra,
  };
}

// A request for the next line
function request(body: unknown, passphrase: string | null = SECRET, method = "POST"): Request {
  // With or without the passphrase
  return new Request("http://localhost/api/conversation", { method, headers: { "content-type": "application/json", ...(passphrase ? { "x-voicelab-passphrase": passphrase } : {}) }, body: method === "POST" ? JSON.stringify(body) : undefined });
}

// A body: Theo opened in the meeting, you asked an open question
const BODY = { personaId: "theo", scenarioId: "meeting", twist: 0, stage: "talk", heard: true, turns: [{ who: "them", text: "Hey. Looks like we're early." }, { who: "you", text: "what do you do outside of work" }], conversationId: "conv-0001", elapsedSec: 20 };

// A written line with directions
const LINE: WriteResult = { status: "ok", line: "[softly] Well… I fix up old radios. [grinning]", goodbye: false };

// Read every event of a streamed reply
async function events(response: Response): Promise<StreamEvent[]> {
  // The whole text
  const text = await response.text();
  // Each line read
  return splitLines(text).lines.map((line) => decodeEvent(line)!);
}

// Group the checks about the conversation route (decisions 84 and 102)
describe("conversation route", () => {
  // The line is tidied, spoken with its directions in the persona's voice, and sent back without them, with its audio and its timings
  it("writes the line and speaks it in the persona's voice", async () => {
    // A writer and a voice
    const [writer, voice] = [fakeWriter(LINE), fakeVoice()];
    // Logs
    const logs: string[] = [];
    // Ask
    const response = await createConversationHandler(deps(writer, voice, { logs }))(request(BODY));
    // What the writer was given: the persona, the situation, the twist, the turns, the stage and whether it was heard
    const [persona, scenario, twist, turns, stage, heard] = writer.asked[0] as [{ id: string }, { id: string }, number, unknown[], string, boolean];
    // The reply, what was spoken and in which voice, what the writer was given, the timings header and the log (durations only)
    expect([response.status, await response.json(), voice.said, [persona.id, scenario.id, twist, turns.length, stage, heard], response.headers.get("server-timing"), logs]).toEqual([200, { text: "Well… I fix up old radios.", audio: "AQID", goodbye: false }, [["[softly] Well… I fix up old radios.", findPersona("theo")!.voiceId, false]], ["theo", "meeting", 0, 2, "talk", true], "writer;dur=5, voice;dur=5, total;dur=25", ["Conversation timing: writer 5 ms, voice 5 ms, total 25 ms"]]);
  });

  // Without ElevenLabs, or when it fails, the words come back with no audio, so the phone's own voice says them
  it("sends the words without audio when the voice is missing or fails", async () => {
    // No voice
    const none = await createConversationHandler(deps(fakeWriter(LINE), null))(request(BODY));
    // A failing voice, logged
    const logs: string[] = [];
    // Failing
    const failed = await createConversationHandler(deps(fakeWriter(LINE), fakeVoice("always"), { logs }))(request(BODY));
    // Both without audio, and the failure logged
    expect([(await none.json()).audio, (await failed.json()).audio, logs[0]]).toEqual([null, null, "Conversation voice failed: ElevenLabs answered 401."]);
  });

  // The faster voice model unless the server chooses the expressive one
  it("uses the voice model the server chose", async () => {
    // The models asked for
    const models: string[] = [];
    // The default
    await createConversationHandler(deps(fakeWriter(LINE), null, { models }))(request(BODY));
    // The expressive one
    await createConversationHandler(deps(fakeWriter(LINE), null, { models, conversationSettings: () => ({ minutesPerMonth: 150, voiceModel: "v4" }) }))(request({ ...BODY, conversationId: "conv-0002" }));
    // Turbo, then v4
    expect(models).toEqual([CONVERSATION_VOICE_MODEL_FAST, CONVERSATION_VOICE_MODEL]);
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
    // Each refusal (a body without a conversation id is refused too)
    const statuses = [(await handle(request(BODY, null))).status, (await handle(request({ ...BODY, turns: "lots" }))).status, (await handle(request({ ...BODY, conversationId: undefined }))).status, (await handle(request({ ...BODY, personaId: "nope" }))).status, (await handle(request({ ...BODY, scenarioId: "nope" }))).status, (await handle(request({ ...BODY, twist: 7 }))).status];
    // Refused, and never asked
    expect([statuses, writer.asked.length]).toEqual([[401, 400, 400, 404, 404, 400], 0]);
  });
});

// Group the checks about the streamed line (decision 102)
describe("conversation route, streamed", () => {
  // Two sentences: the first piece with its audio from the streaming voice, then the rest, then the end; a first-piece timing header
  it("streams the line piece by piece", async () => {
    // A writer streaming two sentences, and a voice
    const [writer, voice] = [fakeWriter(LINE, { pieces: ["goodbye: no\n[softly] Well… I fix up", " old radios.", " Mostly from the fifties."] }), fakeVoice()];
    // Logs
    const logs: string[] = [];
    // Ask for a stream
    const response = await createConversationHandler(deps(writer, voice, { logs }))(request({ ...BODY, stream: true }));
    // The events
    const sent = await events(response);
    // A stream of three events, the voice asked to stream each piece in order, a timing header, and the timings logged
    expect([response.headers.get("content-type"), sent, voice.said.map((said) => [said[0], said[2]]), response.headers.get("server-timing")?.startsWith("writer-first;dur="), logs.at(-1)?.startsWith("Conversation timing (streamed): writer first ")]).toEqual([
      "application/x-ndjson",
      [
        { type: "segment", index: 0, text: "Well… I fix up old radios.", audio: "AQID" },
        { type: "segment", index: 1, text: "Mostly from the fifties.", audio: "AQID" },
        { type: "done", text: "Well… I fix up old radios. Mostly from the fifties.", goodbye: false },
      ],
      [["[softly] Well… I fix up old radios.", true], ["Mostly from the fifties.", true]],
      true,
      true,
    ]);
  });

  // The writer fails part-way: the first sentence stands as the line
  it("keeps the first sentence when the writer fails part-way", async () => {
    // A writer failing after its first sentence
    const writer = fakeWriter(LINE, { pieces: ["goodbye: no\nOh hi there, I'm Theo.", " I fix"], ending: "throw" });
    // Ask for a stream
    const sent = await events(await createConversationHandler(deps(writer, fakeVoice()))(request({ ...BODY, stream: true })));
    // One piece, and the end with it alone
    expect(sent.map((event) => (event.type === "done" ? event.text : event.index))).toEqual([0, "Oh hi there, I'm Theo."]);
  });

  // The streaming voice fails: that piece is spoken once more without streaming (the fallback), and if that fails too it comes without audio
  it("falls back to the plain voice when the streaming voice fails", async () => {
    // A voice that fails only when streaming
    const voice = fakeVoice("streaming");
    // Ask for a stream
    const sent = await events(await createConversationHandler(deps(fakeWriter(LINE, { pieces: ["Oh hi there, I'm Theo."] }), voice))(request({ ...BODY, stream: true })));
    // A voice that always fails
    const silent = await events(await createConversationHandler(deps(fakeWriter(LINE, { pieces: ["Oh hi there, I'm Theo."] }), fakeVoice("always")))(request({ ...BODY, stream: true })));
    // Streamed then plain, with audio; and no audio when both fail
    expect([voice.said.map((said) => said[2]), sent[0], silent[0]]).toEqual([[true, false], { type: "segment", index: 0, text: "Oh hi there, I'm Theo.", audio: "AQID" }, { type: "segment", index: 0, text: "Oh hi there, I'm Theo.", audio: null }]);
  });

  // A decline or a failure before the first sentence answers as the whole-line route does
  it("refuses a decline or an early failure plainly", async () => {
    // Declined
    const declined = await createConversationHandler(deps(fakeWriter(LINE, { ending: "decline" }), null))(request({ ...BODY, stream: true }));
    // Failed at once
    const failed = await createConversationHandler(deps(fakeWriter(LINE, { ending: "throw" }), null))(request({ ...BODY, stream: true }));
    // Each
    expect([declined.status, failed.status]).toEqual([422, 502]);
  });

  // The goodbye header is kept only when winding down
  it("applies the goodbye rule to a streamed line", async () => {
    // A goodbye at each stage
    const flag = async (stage: string) => (await events(await createConversationHandler(deps(fakeWriter(LINE, { pieces: ["goodbye: yes\nSee you later!"] }), null))(request({ ...BODY, stage, stream: true })))).at(-1);
    // Early, then winding down
    expect([await flag("talk"), await flag("wrap")]).toEqual([{ type: "done", text: "See you later!", goodbye: false }, { type: "done", text: "See you later!", goodbye: true }]);
  });
});

// Group the checks about the caps and the month's minutes (decision 102)
describe("conversation route, minutes", () => {
  // Each minute of a conversation counts once against the month; when they are used up the route refuses with the reason
  it("counts each conversation minute once and refuses when the month is used up", async () => {
    // A writer that must stop being asked
    const writer = fakeWriter(LINE);
    // Two minutes a month
    const handle = createConversationHandler(deps(writer, null, { conversationSettings: () => ({ minutesPerMonth: 2, voiceModel: "turbo" }) }));
    // Minute 0 twice, minute 1, then minute 2 (over)
    const statuses = [(await handle(request({ ...BODY, elapsedSec: 5 }))).status, (await handle(request({ ...BODY, elapsedSec: 50 }))).status, (await handle(request({ ...BODY, elapsedSec: 70 }))).status];
    // Over
    const over = await handle(request({ ...BODY, elapsedSec: 130 }));
    // Allowed three times, then refused with the reason, without asking the writer
    expect([statuses, over.status, await over.json(), writer.asked.length]).toEqual([[200, 200, 200], 429, { error: "This month’s conversation minutes are used up.", budget: true }, 3]);
  });

  // Past five minutes, or past forty lines, one conversation is refused
  it("holds one conversation to five minutes", async () => {
    // The handler
    const handle = createConversationHandler(deps(fakeWriter(LINE), null));
    // Past five minutes
    const late = await handle(request({ ...BODY, elapsedSec: 301 }));
    // Forty lines, then one more
    for (let index = 0; index < 40; index += 1) await handle(request({ ...BODY, conversationId: "conv-many", elapsedSec: 10 }));
    // One more
    const many = await handle(request({ ...BODY, conversationId: "conv-many", elapsedSec: 10 }));
    // Both refused with the reason
    expect([late.status, (await late.json()).capped, many.status]).toEqual([409, true, 409]);
  });

  // The counter unreachable: refused, so nothing runs uncounted
  it("refuses when the counter cannot be reached", async () => {
    // A store that fails on reads
    const broken: CounterStore = { increment: async () => 1, read: async () => { throw new Error("down"); } };
    // The handler
    const response = await createConversationHandler(deps(fakeWriter(LINE), null, { makeCounterStore: () => broken }))(request(BODY));
    // Paused
    expect(response.status).toBe(503);
  });

  // A setting that cannot be used is named, for someone with the passphrase
  it("names a conversation setting that cannot be used", async () => {
    // A broken setting
    const response = await createConversationHandler(deps(fakeWriter(LINE), null, { conversationSettings: () => { throw new Error("CONVERSATION_VOICE_MODEL must be turbo or v4."); } }))(request(BODY));
    // Named
    expect([response.status, await response.json()]).toEqual([500, { error: "The server is not set up: CONVERSATION_VOICE_MODEL must be turbo or v4." }]);
  });

  // GET: the month's minutes, with the passphrase only
  it("says how many minutes are left this month", async () => {
    // The dependencies, with 30 minutes used
    const shared = deps(fakeWriter(LINE), null);
    // The store
    const store = shared.makeCounterStore();
    // 30 used
    for (let index = 0; index < 30; index += 1) await store.increment(monthKey(NOW), 60);
    // Asked
    const minutes = createConversationMinutesHandler(shared);
    // With and without the passphrase
    const [ok, refused] = [await minutes(request(null, SECRET, "GET")), await minutes(request(null, null, "GET"))];
    // The numbers, and a refusal
    expect([await ok.json(), refused.status, monthKey(NOW)]).toEqual([{ minutesUsed: 30, minutesPerMonth: 150, minutesLeft: 120 }, 401, "conversation-minutes:2026-10"]);
  });
});
