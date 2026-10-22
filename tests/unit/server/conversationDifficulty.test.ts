// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the handler being checked
import { createConversationHandler, type ConversationDeps } from "@/server/conversationHandler";
// Load the writer type
import type { ConversationWriter } from "@/server/conversationWriter";
// Load the counters
import { MemoryCounterStore } from "@/server/rateLimit";

// The passphrase the fake server expects
const SECRET = "a long passphrase for testing";

// A writer that notes the difficulty it was given, whole or streamed
function noting(seen: unknown[]): ConversationWriter {
  // The writer
  return {
    // Whole: the seventh argument
    async write(...args) {
      // Noted
      seen.push(args[6]);
      // A line
      return { status: "ok", line: "Mm. Fine.", goodbye: false };
    },
    // Streamed: the eighth (after the signal)
    async *stream(...args) {
      // Noted
      seen.push(args[7]);
      // A line
      yield { type: "text", text: "goodbye: no\nMm. Fine." };
      // The end
      yield { type: "end", declined: false };
    },
  };
}

// The handler's dependencies
function deps(writer: ConversationWriter): ConversationDeps {
  // The counters
  const store = new MemoryCounterStore();
  // Everything
  return { readAccessSecret: () => SECRET, readEnv: () => ({ anthropicApiKey: "k", accessSecret: SECRET, counterStore: null }), makeWriter: () => writer, makeVoice: () => null, makeCounterStore: () => store, limits: { perMinute: 100, perDay: 1000, scope: "conversation" }, now: () => new Date(Date.UTC(2026, 9, 22)), log: () => undefined };
}

// A request with the given extra fields
function request(extra: Record<string, unknown>): Request {
  // The body
  const body = { personaId: "theo", scenarioId: "meeting", twist: 0, stage: "talk", heard: true, turns: [{ who: "you", text: "hi" }], conversationId: "conv-0001", elapsedSec: 10, ...extra };
  // As sent
  return new Request("http://localhost/api/conversation", { method: "POST", headers: { "content-type": "application/json", "x-voicelab-passphrase": SECRET }, body: JSON.stringify(body) });
}

// Group the checks on the difficulty reaching the writer (decision 120)
describe("conversation route difficulty", () => {
  // Whole and streamed lines get the difficulty; left out means none (normal)
  it("hands the difficulty to the writer", async () => {
    // What the writer saw
    const seen: unknown[] = [];
    // The handler
    const handle = createConversationHandler(deps(noting(seen)));
    // Hard whole, easy streamed, none
    const statuses = [(await handle(request({ difficulty: "hard" }))).status, (await (await handle(request({ difficulty: "easy", stream: true, conversationId: "conv-0002" }))).text()).length > 0, (await handle(request({ conversationId: "conv-0003" }))).status];
    // Each passed on
    expect([statuses, seen]).toEqual([[200, true, 200], ["hard", "easy", undefined]]);
  });

  // An unknown level is refused before anything is asked
  it("refuses an unknown difficulty", async () => {
    // What the writer saw
    const seen: unknown[] = [];
    // Asked with a made-up level
    const response = await createConversationHandler(deps(noting(seen)))(request({ difficulty: "brutal" }));
    // Refused, writer untouched
    expect([response.status, seen.length]).toEqual([400, 0]);
  });
});
