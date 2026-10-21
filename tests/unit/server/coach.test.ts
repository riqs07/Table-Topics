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

  // A conversation with a character goes to the conversation coach with the character's own words, and comes back with a turn and a better version (decision 83)
  it("sends a conversation to the conversation coach with the character's words", async () => {
    // Make a fake network that remembers the request
    const network = fakeNetwork(recorded("conversation-response"));
    // Theo opened, you asked about radios, Theo answered, you changed the subject
    const conversation = { characterId: "theo", turns: [{ who: "them" as const, lineId: "theo-14" }, { who: "you" as const, text: "oh what kind of radios" }, { who: "them" as const, lineId: "theo-15" }, { who: "you" as const, text: "do you like your job" }] };
    // Ask for feedback
    const result = await createClaudeCoach("sk-test", network).getFeedback({ ...INPUT, mode: "conversation", promptId: "theo", transcript: "oh what kind of radios do you like your job", durationSec: 40, conversation });
    // Read the request body that was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    // Confirm the instructions, Theo's words looked up on the server, and the trimmed better version
    expect([JSON.stringify(sent.system).includes("two or three minutes"), JSON.stringify(sent.messages).includes("Theo: Mostly ones from the fifties."), result.status === "ok" ? result.feedback.conversation : null]).toEqual([true, true, { yours: "do you like your job", better: "What do you look for at the flea markets?" }]);
  });

  // A failed call is not retried inside the call, since each retry is billed again; the app asks again later (decision 87)
  it("does not retry a failed call", async () => {
    // A network that always answers with a temporary server error
    const network = vi.fn(async () => new Response(JSON.stringify({ type: "error", error: { type: "api_error", message: "overloaded" } }), { status: 500, headers: { "content-type": "application/json" } }));
    // Ask for feedback and expect the failure
    await expect(createClaudeCoach("sk-test", network).getFeedback(INPUT)).rejects.toThrow();
    // Confirm only one call went out
    expect(network).toHaveBeenCalledTimes(1);
  });

  // A safety decline is reported as such, not as a crash
  it("reports a decline when the model refuses", async () => {
    // Make a coach whose network returns a refusal
    const coach = createClaudeCoach("sk-test", fakeNetwork(recorded("refusal-response")));
    // Confirm the result is a decline
    expect(await coach.getFeedback(INPUT)).toEqual({ status: "declined" });
  });

  // The internal rubric comes back with the feedback, checked, and the visible feedback is unchanged (decision 90)
  it("returns the internal rubric alongside unchanged feedback", async () => {
    // Make a fake network that remembers the request
    const network = fakeNetwork(recorded("feedback-response"));
    // Ask for feedback
    const result = await createClaudeCoach("sk-test", network).getFeedback(INPUT);
    // Read the request body that was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    // Confirm the schema asks for a rubric, the prompt explains it, the feedback has only its three parts, and the rubric carries the model
    expect([Object.keys(sent.output_config.format.schema.properties).includes("rubric"), JSON.stringify(sent.system).includes("Also fill in rubric"), result.status === "ok" ? Object.keys(result.feedback) : null, result.status === "ok" ? [result.rubric?.pointFirst.score, result.rubric?.wordSwaps[0]?.stronger, result.rubric?.model] : null]).toEqual([true, true, ["keep", "change", "retryCue"], [2, "the highlight", COACH_MODEL]]);
  });

  // A told story goes to the story coach and comes back with its beats, one line made better, and the story scores (decision 92)
  it("sends a story to the story coach and keeps its beats and story scores", async () => {
    // Make a fake network that remembers the request
    const network = fakeNetwork(recorded("story-response"));
    // Ask for feedback on a story from the bank, with its set-up
    const result = await createClaudeCoach("sk-test", network).getFeedback({ ...INPUT, mode: "story", promptId: "sp04", story: { shape: "but-therefore", focus: "dialogue", length: "short" } });
    // Read the request body that was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    // The checked feedback
    const feedback = result.status === "ok" ? result.feedback : null;
    // Confirm the story instructions, the prompt and set-up, the schema's story scores, the known beats only (in story order, empty quotes and made-up ids dropped), the better line, and the scores kept in range
    expect([JSON.stringify(sent.system).includes("VoiceLab's storytelling coach"), JSON.stringify(sent.messages).includes("Running late") || JSON.stringify(sent.messages).includes("running late for something"), JSON.stringify(sent.messages).includes("never \\\"and then\\\""), Object.keys(sent.output_config.format.schema.properties).includes("storyRubric"), feedback?.story?.beats.map((item) => item.beat), feedback?.story?.better.startsWith("Then the guard"), result.status === "ok" ? [result.rubric?.story?.point.score, result.rubric?.story?.point.quote, result.rubric?.story?.hook.score] : null]).toEqual([true, true, true, true, ["setting", "turn", "meaning"], true, [3, "since then I always carry a charger", 3]]);
  });
});
