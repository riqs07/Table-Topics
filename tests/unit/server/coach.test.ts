// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load Node's file reader for the recorded responses
import { readFileSync } from "node:fs";
// Load the Claude-backed coach being checked
import { createClaudeCoach } from "@/server/coach";
// Load the model names
import { COACH_MODEL } from "@/config/models";

// Read a recorded API response from the fixtures folder
const recorded = (name: string) => readFileSync(`tests/fixtures/coach/${name}.json`, "utf8");

// Make a fake network that answers every call with a recorded response, and remembers what was sent
function fakeNetwork(body: string) {
  // Answer with the recorded body as JSON
  return vi.fn(async () => new Response(body, { status: 200, headers: { "content-type": "application/json" } }));
}

// A typical session
const INPUT = { transcript: "Um, so I think, uh, the best part of my week was the dog.", durationSec: 30, focusId: "cut-fillers", previousChange: null };

// Group the checks about the Claude-backed coach
describe("createClaudeCoach", () => {
  // A normal reply becomes three-part feedback
  it("returns three-part feedback from a recorded response", async () => {
    // Make a coach on a fake network
    const coach = createClaudeCoach("sk-test", fakeNetwork(recorded("feedback-response")));
    // Ask for feedback
    const result = await coach.getFeedback(INPUT);
    // Confirm it succeeded
    expect(result.status).toBe("ok");
    // Confirm the retry cue came through
    if (result.status === "ok") expect(result.feedback.retryCue).toBe("Take one breath, then say your first word.");
  });

  // The request uses the configured model, the coach instructions, and the JSON feedback shape
  it("sends the configured model, instructions, and feedback schema", async () => {
    // Make a fake network that remembers the request
    const network = fakeNetwork(recorded("feedback-response"));
    // Ask for feedback
    await createClaudeCoach("sk-test", network).getFeedback(INPUT);
    // Read the request body that was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    // Confirm the model
    expect(sent.model).toBe(COACH_MODEL);
    // Confirm the coach instructions were sent as the system prompt
    expect(JSON.stringify(sent.system)).toContain("VoiceLab's public-speaking coach");
    // Confirm the response must follow the JSON schema
    expect(sent.output_config.format.type).toBe("json_schema");
    // Confirm the transcript was in the user message
    expect(JSON.stringify(sent.messages)).toContain("<transcript>");
    // Confirm there is room for the model's thinking plus the reply (thinking is always on for this model; a small cap cut replies off)
    expect(sent.max_tokens).toBeGreaterThanOrEqual(16000);
  });

  // A small-talk answer goes to the small-talk coach and comes back with its beats
  it("sends a small-talk answer to the small-talk coach and keeps its beats", async () => {
    // Make a fake network that remembers the request
    const network = fakeNetwork(recorded("smalltalk-response"));
    // Ask for feedback on an answer to "How was your weekend?"
    const result = await createClaudeCoach("sk-test", network).getFeedback({ ...INPUT, mode: "smalltalk", promptId: "st01", transcript: "I built an app it coaches me on public speaking on my phone did you do anything" });
    // Read the request body that was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    // Confirm the small-talk instructions, the question, and the beats coming back
    expect([JSON.stringify(sent.system).includes("VoiceLab's small-talk coach"), JSON.stringify(sent.messages).includes("Question: How was your weekend?"), result.status === "ok" ? result.feedback.smallTalk?.hooks : null]).toEqual([true, true, ["it coaches me on public speaking", "on my phone"]]);
  });

  // A follow-up question goes to the conversation coach, and only its own unit's beats are kept
  it("sends a follow-up question to the conversation coach and keeps its unit's beats", async () => {
    // Make a fake network that remembers the request
    const network = fakeNetwork(recorded("connection-response"));
    // Ask for feedback on a follow-up to "I just got back from a week in Lisbon."
    const result = await createClaudeCoach("sk-test", network).getFeedback({ ...INPUT, mode: "smalltalk", promptId: "sa01", transcript: "Lisbon what was the best thing you ate there" });
    // Read the request body that was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    // Confirm the conversation instructions, what they said, and the beats (a listening beat dropped) and the better version
    expect([JSON.stringify(sent.system).includes("VoiceLab's conversation coach"), JSON.stringify(sent.messages).includes("I just got back from a week in Lisbon."), result.status === "ok" ? result.feedback.connection?.found.map((item) => item.beat) : null, result.status === "ok" ? result.feedback.connection?.better : null]).toEqual([true, true, ["open", "their-detail"], "Lisbon! What was the best thing you ate there?"]);
  });

  // A safety decline is reported as such, not as a crash
  it("reports a decline when the model refuses", async () => {
    // Make a coach whose network returns a refusal
    const coach = createClaudeCoach("sk-test", fakeNetwork(recorded("refusal-response")));
    // Confirm the result is a decline
    expect(await coach.getFeedback(INPUT)).toEqual({ status: "declined" });
  });
});
