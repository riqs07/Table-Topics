// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the handler being checked
import { createConversationHandler, type ConversationDeps } from "@/server/conversationHandler";
// Load the writer and voice types
import type { ConversationWriter } from "@/server/conversationWriter";
import type { PersonaVoice } from "@/server/voice";
// Load the counters and their names
import { MemoryCounterStore } from "@/server/rateLimit";
import { USAGE_KEYS } from "@/server/usageCounters";

// The passphrase the fake server expects
const SECRET = "a long passphrase for testing";
// The fixed "now"
const NOW = new Date(Date.UTC(2026, 9, 22, 10));

// A writer that always writes the same line, whole or streamed in two sentences
const WRITER: ConversationWriter = {
  // Whole
  async write() {
    // The line
    return { status: "ok", line: "Mm. I fix radios.", goodbye: false };
  },
  // Streamed
  async *stream() {
    // The header and the line
    yield { type: "text", text: "goodbye: no\nOh nice, you climb? I tried it once and loved it." };
    // The end
    yield { type: "end", declined: false };
  },
};

// A voice that speaks, or fails
function voice(fails = false): PersonaVoice {
  // The voice
  return {
    // Speak
    async speak() {
      // Failing
      if (fails) throw new Error("ElevenLabs answered 500.");
      // Some bytes
      return new Uint8Array([1]).buffer;
    },
  };
}

// The handler's dependencies with a store to read back
function deps(store: MemoryCounterStore, spoken: PersonaVoice | null, model: "turbo" | "v4" = "turbo"): ConversationDeps {
  // Everything
  return { readAccessSecret: () => SECRET, readEnv: () => ({ anthropicApiKey: "k", accessSecret: SECRET, counterStore: null }), makeWriter: () => WRITER, makeVoice: () => spoken, conversationSettings: () => ({ minutesPerMonth: 150, voiceModel: model }), makeCounterStore: () => store, limits: { perMinute: 100, perDay: 1000, scope: "conversation" }, now: () => NOW, log: () => undefined };
}

// A request
function request(extra: Record<string, unknown> = {}): Request {
  // As the app sends it
  return new Request("http://localhost/api/conversation", { method: "POST", headers: { "content-type": "application/json", "x-voicelab-passphrase": SECRET }, body: JSON.stringify({ personaId: "theo", scenarioId: "meeting", twist: 0, stage: "talk", heard: true, turns: [{ who: "you", text: "what do you do" }], conversationId: "conv-0001", elapsedSec: 10, ...extra }) });
}

// Group the checks on the conversation route's usage counts (decision 143)
describe("conversation route usage counts", () => {
  // A whole line: one line, and its characters under the model that spoke it
  it("counts the line and the characters spoken", async () => {
    // Counters
    const store = new MemoryCounterStore();
    // Asked, on Turbo then on v4
    await createConversationHandler(deps(store, voice()))(request());
    // (v4)
    await createConversationHandler(deps(store, voice(), "v4"))(request({ conversationId: "conv-0002" }));
    // Two lines; 17 characters each way ("Mm. I fix radios.")
    expect([await store.read(USAGE_KEYS.lines("2026-10")), await store.read(USAGE_KEYS.voiceCharacters("turbo", "2026-10")), await store.read(USAGE_KEYS.voiceCharacters("v4", "2026-10"))]).toEqual([2, 17, 17]);
  });

  // No voice, or a failed one: the line is counted, no characters
  it("counts no characters when nothing was spoken", async () => {
    // Counters
    const store = new MemoryCounterStore();
    // No ElevenLabs, then a failing one
    await createConversationHandler(deps(store, null))(request());
    // (failing)
    await createConversationHandler(deps(store, voice(true)))(request({ conversationId: "conv-0002" }));
    // Two lines, no characters
    expect([await store.read(USAGE_KEYS.lines("2026-10")), await store.read(USAGE_KEYS.voiceCharacters("turbo", "2026-10"))]).toEqual([2, 0]);
  });

  // Streamed: each spoken piece is counted, the line once
  it("counts each streamed piece's characters and the line once", async () => {
    // Counters
    const store = new MemoryCounterStore();
    // Asked, streamed, and read to the end
    await (await createConversationHandler(deps(store, voice()))(request({ stream: true }))).text();
    // One line; both sentences' characters
    expect([await store.read(USAGE_KEYS.lines("2026-10")), await store.read(USAGE_KEYS.voiceCharacters("turbo", "2026-10"))]).toEqual([1, "Oh nice, you climb?".length + "I tried it once and loved it.".length]);
  });
});
