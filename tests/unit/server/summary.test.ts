// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load Node's file reader for the recorded responses
import { readFileSync } from "node:fs";
// Load the weekly coach being checked
import { createClaudeSummarizer, type Summarizer, type SummaryResult } from "@/server/summary";
// Load the route's logic being checked
import { createSummaryHandler, type SummaryDeps } from "@/server/summaryHandler";
// Load the in-memory counter store
import { MemoryCounterStore } from "@/server/rateLimit";
// Load the model settings
import { WEEKLY_SUMMARY_EFFORT, WEEKLY_SUMMARY_MODEL } from "@/config/models";
// Load the input type
import type { SummaryInput } from "@/core/weeklySummary";

// Read a recorded API response from the fixtures folder
const recorded = (name: string) => readFileSync(`tests/fixtures/coach/${name}.json`, "utf8");

// A fake network that answers every call with a recorded response
function fakeNetwork(body: string) {
  // Answer with the recorded body as JSON
  return vi.fn(async () => new Response(body, { status: 200, headers: { "content-type": "application/json" } }));
}

// A week's table as the app sends it
const INPUT: SummaryInput = {
  // The week
  weekEnding: "2026-10-21", takesThisWeek: 5,
  // One family with two rows
  families: [{ id: "spot", name: "Speaking on the spot", takes: 20, takesThisWeek: 5, rows: [{ id: "flu.mlr_words", name: "Words per run", unit: "words", usual: 4.5, recent: 6.1, trend: "up", verdict: "better", flag: "higher", shown: true, evidence: "strong" }, { id: "pro.f0_range_st", name: "Pitch range", unit: "semitones", usual: 5, recent: 7, trend: "up", verdict: "better", flag: null, shown: true, evidence: "strong" }] }],
  // A pattern, quotes, swaps and words
  patterns: ["In 12 of 15 takes you spoke faster in the first 30 seconds."], quotes: ["the best part of my week was the dog"], wordSwaps: [{ said: "good", stronger: "gripping" }], favouriteWords: ["journey"], previousFocus: null,
};

// The passphrase used in these checks
const SECRET = "a long passphrase for testing";

// The handler's dependencies, with a fake summarizer
function deps(result: SummaryResult | Error, overrides: Partial<SummaryDeps> = {}): SummaryDeps & { calls: () => number } {
  // How many times it was asked
  let calls = 0;
  // The fake
  const summarizer: Summarizer = { async summarize() { calls += 1; if (result instanceof Error) throw result; return result; } };
  // The dependencies
  return { readAccessSecret: () => SECRET, readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: SECRET, counterStore: null }), makeSummarizer: () => summarizer, makeCounterStore: () => new MemoryCounterStore(), limits: { perMinute: 2, perDay: 3, scope: "summary" }, now: () => new Date(Date.UTC(2026, 9, 21, 10)), log: () => {}, calls: () => calls, ...overrides };
}

// A request to the route
function request(body: unknown, passphrase: string | null = SECRET): Request {
  // JSON, with the passphrase when given
  return new Request("http://localhost/api/summary", { method: "POST", headers: { "content-type": "application/json", ...(passphrase ? { "x-voicelab-passphrase": passphrase } : {}) }, body: JSON.stringify(body) });
}

// A good summary from the fake
const OK: SummaryResult = { status: "ok", summary: { headline: "h", improved: ["i"], pattern: "p", focus: "f", suggestedDrill: null }, model: WEEKLY_SUMMARY_MODEL, usage: { inputTokens: 1, outputTokens: 1 } };

// Group the checks about the Claude-backed weekly coach
describe("createClaudeSummarizer", () => {
  // A recorded reply becomes a checked summary, from the configured model with the JSON schema
  it("returns a summary from a recorded response, using the weekly model", async () => {
    // A fake network
    const network = fakeNetwork(recorded("summary-response"));
    // Ask
    const result = await createClaudeSummarizer("sk-test", network).summarize(INPUT);
    // What was sent
    const sent = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    // Confirm the model, effort, schema, the table in the message, and the focus coming back
    expect([sent.model, sent.output_config.effort, sent.output_config.format.type, JSON.stringify(sent.messages).includes("Words per run | words | 4.5 | 6.1"), result.status === "ok" ? result.summary.suggestedDrill : null]).toEqual([WEEKLY_SUMMARY_MODEL, WEEKLY_SUMMARY_EFFORT, "json_schema", true, "Rapid Fire"]);
  });

  // No retries inside a call
  it("does not retry a failed call", async () => {
    // A network that always fails
    const network = vi.fn(async () => new Response(JSON.stringify({ type: "error", error: { type: "api_error", message: "overloaded" } }), { status: 500, headers: { "content-type": "application/json" } }));
    // Expect the failure
    await expect(createClaudeSummarizer("sk-test", network).summarize(INPUT)).rejects.toThrow();
    // Only one call
    expect(network).toHaveBeenCalledTimes(1);
  });

  // A refusal is a decline
  it("reports a decline when the model refuses", async () => {
    // A refusal
    expect(await createClaudeSummarizer("sk-test", fakeNetwork(recorded("refusal-response"))).summarize(INPUT)).toEqual({ status: "declined" });
  });
});

// Group the checks about the route
describe("summary handler", () => {
  // The happy path
  it("returns the summary and the model", async () => {
    // The route
    const response = await createSummaryHandler(deps(OK))(request(INPUT));
    // Confirm the status and body
    expect([response.status, await response.json()]).toEqual([200, { summary: OK.status === "ok" ? OK.summary : null, model: WEEKLY_SUMMARY_MODEL }]);
  });

  // No passphrase, no call
  it("refuses without the passphrase and never calls the model", async () => {
    // The dependencies
    const dependencies = deps(OK);
    // Without a passphrase
    const response = await createSummaryHandler(dependencies)(request(INPUT, null));
    // Refused, no call
    expect([response.status, dependencies.calls()]).toEqual([401, 0]);
  });

  // Whole transcripts cannot ride along: a quote over the cap is refused
  it("refuses a table carrying long text", async () => {
    // A quote far over the cap
    const response = await createSummaryHandler(deps(OK))(request({ ...INPUT, quotes: ["word ".repeat(200)] }));
    // Refused as invalid
    expect(response.status).toBe(400);
  });

  // The day's cap is three
  it("stops at the daily cap", async () => {
    // One shared counter store
    const store = new MemoryCounterStore();
    // The route with it
    const handle = createSummaryHandler(deps(OK, { makeCounterStore: () => store, limits: { perMinute: 10, perDay: 3, scope: "summary" } }));
    // Four calls
    const statuses = [];
    // In turn
    for (let index = 0; index < 4; index++) statuses.push((await handle(request(INPUT))).status);
    // The fourth is refused
    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  // A failure is a 502, a decline a 422
  it("reports a failure and a decline", async () => {
    // A failure
    const failed = await createSummaryHandler(deps(new Error("boom")))(request(INPUT));
    // A decline
    const declined = await createSummaryHandler(deps({ status: "declined" }))(request(INPUT));
    // Confirm both
    expect([failed.status, declined.status]).toEqual([502, 422]);
  });
});
