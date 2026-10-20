// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load Node's file reader for the recorded responses
import { readFileSync } from "node:fs";
// Load the partner being checked
import { createClaudePartner } from "@/server/conversationPartner";
// Load the model settings
import { CONVERSATION_MODEL } from "@/config/models";
// Load the characters
import { findCharacter } from "@/content/conversations";

// Read a recorded API response from the fixtures folder
const recorded = (name: string) => readFileSync(`tests/fixtures/coach/${name}.json`, "utf8");

// A fake network that answers with a recorded response and remembers what was sent
const fakeNetwork = (body: string) => vi.fn(async () => new Response(body, { status: 200, headers: { "content-type": "application/json" } }));

// Theo, a quiet person in a waiting room
const theo = findCharacter("theo")!;

// Group the checks about the Claude-backed partner (decision 83)
describe("createClaudePartner", () => {
  // The fast model, no thinking, the bank in the message, and both ids back
  it("asks the fast model without thinking and hands back the ids", async () => {
    // A network answering with a pick
    const network = fakeNetwork(recorded("pick-response"));
    // Ask after Theo opened and you answered
    const result = await createClaudePartner("sk-test", network).pick(theo, [{ who: "them", text: "Oh, hi.", lineId: "theo-01", seconds: 2 }, { who: "you", text: "yes I am what brings you here", seconds: 3 }], false);
    // What was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { model: string; thinking: { type: string }; output_config: { effort: string; format: { type: string } }; messages: unknown };
    // The model, no thinking, low effort, a JSON shape, the bank, and the ids
    expect([sent.model, sent.thinking.type, sent.output_config.effort, sent.output_config.format.type, JSON.stringify(sent.messages).includes("theo-20 (share)"), result]).toEqual([CONVERSATION_MODEL, "disabled", "low", "json_schema", true, { status: "ok", lineIds: ["theo-20", "theo-15"] }]);
  });

  // A safety decline is reported, not thrown
  it("reports a decline", async () => {
    // A network answering with a refusal
    const result = await createClaudePartner("sk-test", fakeNetwork(recorded("refusal-response"))).pick(theo, [], false);
    // Declined
    expect(result).toEqual({ status: "declined" });
  });
});
