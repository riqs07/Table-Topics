// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the request handler being checked
import { createQuestionsHandler, type QuestionsDeps } from "@/server/questionsHandler";
// Load the in-memory counter store
import { MemoryCounterStore } from "@/server/rateLimit";
// Load the question writer's types
import type { Questioner, QuestionsResult } from "@/server/questioner";

// The passphrase used in these checks
const SECRET = "a long passphrase for testing";
// Three sample questions
const QUESTIONS = ["A?", "B?", "C?"];
// A valid request body
const BODY = { transcript: "We should switch to the new tool.", promptId: "talk-1", mode: "rehearse" };

// A fake question writer that answers with a fixed result and counts calls
function fakeQuestioner(result: QuestionsResult | Error): Questioner & { calls: number } {
  // The fake
  const questioner = { calls: 0, async getQuestions() { questioner.calls += 1; if (result instanceof Error) throw result; return result; } };
  // Hand it back
  return questioner;
}

// The handler's dependencies, with any overrides
function deps(overrides: Partial<QuestionsDeps> & { questioner?: Questioner } = {}): QuestionsDeps {
  // The writer to use
  const questioner = overrides.questioner ?? fakeQuestioner({ status: "ok", questions: QUESTIONS });
  // Put them together
  return {
    // Settings with every value present
    readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: SECRET, counterStore: null }),
    // The writer
    makeQuestioner: () => questioner,
    // A fresh counter
    makeCounterStore: () => new MemoryCounterStore(),
    // Generous limits
    limits: { perMinute: 10, perDay: 100 },
    // A fixed clock
    now: () => new Date(Date.UTC(2026, 9, 15, 10)),
    // The check's changes
    ...overrides,
  };
}

// A request to the questions route
function request(body: unknown, passphrase: string | null = SECRET): Request {
  // Content type and, if given, the passphrase
  const headers: Record<string, string> = { "content-type": "application/json", ...(passphrase ? { "x-voicelab-passphrase": passphrase } : {}) };
  // A POST with the body as JSON
  return new Request("http://localhost/api/questions", { method: "POST", headers, body: JSON.stringify(body) });
}

// Group the checks about the questions route
describe("questions handler", () => {
  // The happy path returns three questions
  it("returns three questions for a valid request", async () => {
    // Call it
    const response = await createQuestionsHandler(deps())(request(BODY));
    // Confirm success and the questions
    expect([response.status, await response.json()]).toEqual([200, { questions: QUESTIONS }]);
  });

  // No passphrase, no call to the model
  it("rejects a missing passphrase without calling the model", async () => {
    // A writer that counts calls
    const questioner = fakeQuestioner({ status: "ok", questions: QUESTIONS });
    // Call without the passphrase
    const response = await createQuestionsHandler(deps({ questioner }))(request(BODY, null));
    // Confirm the refusal and no call
    expect([response.status, questioner.calls]).toEqual([401, 0]);
  });

  // A body without a transcript is refused
  it("refuses a request without a transcript", async () => {
    // Call with a bad body
    const response = await createQuestionsHandler(deps())(request({ promptId: "x" }));
    // Confirm the refusal
    expect(response.status).toBe(400);
  });

  // The shared limit applies
  it("stops when the daily limit is reached", async () => {
    // Call with a limit of zero a day
    const response = await createQuestionsHandler(deps({ limits: { perMinute: 10, perDay: 0 } }))(request(BODY));
    // Confirm the limit
    expect(response.status).toBe(429);
  });

  // A decline and a failure each say so
  it("reports a decline and a failure plainly", async () => {
    // A declined request
    const declined = await createQuestionsHandler(deps({ questioner: fakeQuestioner({ status: "declined" }) }))(request(BODY));
    // A failed request
    const failed = await createQuestionsHandler(deps({ questioner: fakeQuestioner(new Error("network down")), log: () => {} }))(request(BODY));
    // Confirm both
    expect([declined.status, failed.status, (await failed.json()).error]).toEqual([422, 502, "Questions are unavailable right now. Try again later, or write your own."]);
  });
});
