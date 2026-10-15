// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load Node's file reader for the recorded responses
import { readFileSync } from "node:fs";
// Load the Claude-backed question writer being checked
import { createClaudeQuestioner } from "@/server/questioner";
// Load the model name
import { COACH_MODEL } from "@/config/models";

// Read a recorded API response
const recorded = (path: string) => readFileSync(`tests/fixtures/${path}.json`, "utf8");

// A fake network that answers every call with a recorded response, and remembers what was sent
function fakeNetwork(body: string) {
  // Answer with the body as JSON
  return vi.fn(async () => new Response(body, { status: 200, headers: { "content-type": "application/json" } }));
}

// A typical request
const INPUT = { transcript: "We should switch to the new tool.", promptId: "talk-1", mode: "rehearse" as const };

// Group the checks about the Claude-backed question writer
describe("createClaudeQuestioner", () => {
  // A normal reply becomes three tidy questions
  it("returns three questions from a recorded response", async () => {
    // Ask on a fake network
    const result = await createClaudeQuestioner("sk-test", fakeNetwork(recorded("questions/questions-response"))).getQuestions(INPUT);
    // Confirm the questions, trimmed
    expect(result).toEqual({ status: "ok", questions: ["How much will the new tool cost us?", "What happens to the work we already have in the old system?", "Who will train the team?"] });
  });

  // The request uses the coach's model, its own instructions, and the JSON shape
  it("sends the configured model, instructions and schema", async () => {
    // A network that remembers the request
    const network = fakeNetwork(recorded("questions/questions-response"));
    // Ask
    await createClaudeQuestioner("sk-test", network).getQuestions(INPUT);
    // The request body
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    // Confirm model, instructions, schema and transcript
    expect([sent.model, JSON.stringify(sent.system).includes("audience"), sent.output_config.format.type, JSON.stringify(sent.messages).includes("<transcript>")]).toEqual([COACH_MODEL, true, "json_schema", true]);
  });

  // A safety decline is reported as such
  it("reports a decline when the model refuses", async () => {
    // Ask on a network that refuses
    const result = await createClaudeQuestioner("sk-test", fakeNetwork(recorded("coach/refusal-response"))).getQuestions(INPUT);
    // Confirm the decline
    expect(result).toEqual({ status: "declined" });
  });
});
