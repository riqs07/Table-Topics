// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the request handler being checked
import { createFeedbackHandler, type FeedbackDeps } from "@/server/feedbackHandler";
// Load the in-memory counter store
import { MemoryCounterStore, type CounterStore } from "@/server/rateLimit";
// Load the coach type
import type { Coach, CoachResult } from "@/server/coach";

// The passphrase used in these checks
const SECRET = "a long passphrase for testing";
// Sample feedback from the fake coach
const FEEDBACK = { keep: "k", change: "c", retryCue: "r" };
// A valid request body
const BODY = { transcript: "um hello there", durationSec: 30, focusId: "cut-fillers", previousChange: null };

// Build a fake coach that answers with a fixed result
function fakeCoach(result: CoachResult | Error): Coach & { calls: number } {
  // Track how many times it was asked
  const coach = { calls: 0, async getFeedback() { coach.calls += 1; if (result instanceof Error) throw result; return result; } };
  // Hand it back
  return coach;
}

// Build the handler's dependencies, with any overrides a check needs
function deps(overrides: Partial<FeedbackDeps> & { coach?: Coach; store?: CounterStore } = {}): FeedbackDeps {
  // The coach to use
  const coach = overrides.coach ?? fakeCoach({ status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } });
  // The counter store to use
  const store = overrides.store ?? new MemoryCounterStore();
  // Put the dependencies together
  return {
    // Settings with every value present
    readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: SECRET, counterStore: null }),
    // Always the fake coach
    makeCoach: () => coach,
    // Always the chosen store
    makeCounterStore: () => store,
    // Generous limits unless a check changes them
    limits: { perMinute: 10, perDay: 100 },
    // A fixed clock
    now: () => new Date(Date.UTC(2026, 9, 12, 10, 0, 30)),
    // Apply the check's changes
    ...overrides,
  };
}

// Build a request to the feedback route
function request(body: unknown, passphrase: string | null = SECRET): Request {
  // Set the content type and, if given, the passphrase
  const headers: Record<string, string> = { "content-type": "application/json", ...(passphrase ? { "x-voicelab-passphrase": passphrase } : {}) };
  // Make a POST request with the body as JSON
  return new Request("http://localhost/api/feedback", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });
}

// Group the checks about the feedback route
describe("feedback handler", () => {
  // The happy path returns feedback
  it("returns feedback for a valid request", async () => {
    // Call the handler
    const response = await createFeedbackHandler(deps())(request(BODY));
    // Confirm success
    expect(response.status).toBe(200);
    // Confirm the feedback is in the body
    expect(await response.json()).toEqual({ feedback: FEEDBACK });
  });

  // A missing setting fails clearly, naming what to fix
  it("explains a missing server setting", async () => {
    // Make the settings reader fail as it would with a missing key
    const response = await createFeedbackHandler(deps({ readEnv: () => { throw new Error("ANTHROPIC_API_KEY is not set."); } }))(request(BODY));
    // Confirm a server error
    expect(response.status).toBe(500);
    // Confirm the message names the variable
    expect((await response.json()).error).toContain("ANTHROPIC_API_KEY is not set.");
  });

  // Without the passphrase nothing happens, and the AI is never called
  it("rejects a missing or wrong passphrase without calling the coach", async () => {
    // Make a coach that counts calls
    const coach = fakeCoach({ status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } });
    // Call with no passphrase
    const missing = await createFeedbackHandler(deps({ coach }))(request(BODY, null));
    // Call with a wrong passphrase
    const wrong = await createFeedbackHandler(deps({ coach }))(request(BODY, "not the passphrase"));
    // Confirm both are refused
    expect([missing.status, wrong.status]).toEqual([401, 401]);
    // Confirm the coach was never called
    expect(coach.calls).toBe(0);
  });

  // Warm-ups are accepted, and an older app that sends no mode still works
  it("accepts a warm-up and a request without a mode", async () => {
    // Call with a warm-up
    const warmup = await createFeedbackHandler(deps())(request({ ...BODY, mode: "warmup" }));
    // Call with a three-minute talk
    const talk = await createFeedbackHandler(deps())(request({ ...BODY, mode: "talk" }));
    // Call without a mode
    const noMode = await createFeedbackHandler(deps())(request(BODY));
    // Confirm all succeed
    expect([warmup.status, talk.status, noMode.status]).toEqual([200, 200, 200]);
  });

  // Bad input is refused before anything costs money
  it.each([
    // Not JSON
    ["not json", "{"],
    // No transcript
    ["missing transcript", { ...BODY, transcript: undefined }],
    // A zero-length recording
    ["zero duration", { ...BODY, durationSec: 0 }],
    // An absurdly long transcript
    ["transcript too long", { ...BODY, transcript: "word ".repeat(5000) }],
  ])("rejects a bad request: %s", async (_name, body) => {
    // Call the handler
    const response = await createFeedbackHandler(deps())(request(body));
    // Confirm a bad-request answer
    expect(response.status).toBe(400);
  });

  // Over the limit, the caller is told when to try again, and the AI is not called
  it("refuses over the rate limit with a Retry-After header", async () => {
    // Make a coach that counts calls
    const coach = fakeCoach({ status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } });
    // Allow only one call per minute
    const handler = createFeedbackHandler(deps({ coach, limits: { perMinute: 1, perDay: 100 } }));
    // First call uses the allowance
    await handler(request(BODY));
    // Second call in the same minute
    const response = await handler(request(BODY));
    // Confirm it is refused
    expect(response.status).toBe(429);
    // Confirm the wait time (30 seconds left in the minute)
    expect(response.headers.get("retry-after")).toBe("30");
    // Confirm the coach was called only once
    expect(coach.calls).toBe(1);
  });

  // If the counter store is down, refuse rather than run without limits
  it("fails closed when the counter store is unavailable", async () => {
    // A store that always fails
    const broken: CounterStore = { increment: vi.fn(async () => { throw new Error("down"); }) };
    // Make a coach that counts calls
    const coach = fakeCoach({ status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } });
    // Call the handler
    const response = await createFeedbackHandler(deps({ coach, store: broken }))(request(BODY));
    // Confirm it is refused as unavailable
    expect(response.status).toBe(503);
    // Confirm the coach was never called
    expect(coach.calls).toBe(0);
  });

  // A safety decline gets its own plain answer
  it("reports a coach decline", async () => {
    // Make a coach that declines
    const response = await createFeedbackHandler(deps({ coach: fakeCoach({ status: "declined" }) }))(request(BODY));
    // Confirm the decline status
    expect(response.status).toBe(422);
  });

  // An AI failure says the session is safe and feedback will come later
  it("reports a coach failure so the app can retry later", async () => {
    // Make a coach that fails
    const response = await createFeedbackHandler(deps({ coach: fakeCoach(new Error("timeout")) }))(request(BODY));
    // Confirm a gateway failure
    expect(response.status).toBe(502);
    // Confirm the message reassures and explains
    expect((await response.json()).error).toMatch(/retried/);
  });
});
