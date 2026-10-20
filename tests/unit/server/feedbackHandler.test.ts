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
    // The passphrase setting
    readAccessSecret: () => SECRET,
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

// Build a request to the feedback route, from a given network address
function request(body: unknown, passphrase: string | null = SECRET, address = "203.0.113.5"): Request {
  // Set the content type, the caller's address as the hosting platform forwards it, and, if given, the passphrase
  const headers: Record<string, string> = { "content-type": "application/json", "x-forwarded-for": `${address}, 10.0.0.1`, ...(passphrase ? { "x-voicelab-passphrase": passphrase } : {}) };
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

  // Shared notes pass the checks and reach the coach; oversized notes are refused
  it("accepts the speaker's notes, within limits", async () => {
    // A coach that remembers what it was given
    const seen: unknown[] = [];
    // The coach
    const coach: Coach = { async getFeedback(input) { seen.push(input); return { status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } }; } };
    // The handler
    const handle = createFeedbackHandler(deps({ coach }));
    // Notes of a normal size
    const ok = await handle(request({ ...BODY, notes: { worked: "w", change: "c", tags: ["fillers"] } }));
    // Notes far too long
    const tooLong = await handle(request({ ...BODY, notes: { worked: "x".repeat(501), change: "", tags: [] } }));
    // Confirm the first reached the coach with its notes, and the second was refused
    expect([ok.status, (seen[0] as { notes?: unknown }).notes, tooLong.status]).toEqual([200, { worked: "w", change: "c", tags: ["fillers"] }, 400]);
  });

  // A 30-minute rehearsal, the longest session the app makes, is taken (decision 86)
  it("accepts the longest rehearsal the app can record", async () => {
    // Thirty minutes of a fast talker
    const response = await createFeedbackHandler(deps())(request({ ...BODY, mode: "rehearse", durationSec: 1800, transcript: Array(6000).fill("words").join(" ") }));
    // Taken
    expect(response.status).toBe(200);
  });

  // The stammer flag reaches the coach (decision 79)
  it("passes on that the speaker stammers", async () => {
    // A coach that remembers what it was given
    const seen: unknown[] = [];
    // The coach
    const coach: Coach = { async getFeedback(input) { seen.push(input); return { status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } }; } };
    // The handler
    const handle = createFeedbackHandler(deps({ coach }));
    // A request with the flag
    const response = await handle(request({ ...BODY, stammer: true }));
    // Confirm it arrived
    expect([response.status, (seen[0] as { stammer?: unknown }).stammer]).toEqual([200, true]);
  });

  // The voice numbers reach the coach, and anything out of bounds is refused (decision 81)
  it("passes on the voice numbers and refuses odd ones", async () => {
    // A coach that remembers what it was given
    const seen: unknown[] = [];
    // The coach
    const coach: Coach = { async getFeedback(input) { seen.push(input); return { status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } }; } };
    // The handler
    const handle = createFeedbackHandler(deps({ coach }));
    // Sensible numbers
    const voice = { rangeSteps: 4, usualRange: null, ends: { fall: 3, level: 1, rise: 0 }, faded: null, lastThird: null };
    // A request with them, and one with a range far too wide
    const [ok, odd] = [await handle(request({ ...BODY, voice })), await handle(request({ ...BODY, voice: { ...voice, rangeSteps: 400 } }))];
    // The first arrived; the second was refused
    expect([ok.status, (seen[0] as { voice?: unknown }).voice, odd.status]).toEqual([200, voice, 400]);
  });

  // A conversation's turns reach the coach, and too many turns are refused (decision 83)
  it("passes on a conversation and refuses an oversized one", async () => {
    // A coach that remembers what it was given
    const seen: unknown[] = [];
    // The coach
    const coach: Coach = { async getFeedback(input) { seen.push(input); return { status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } }; } };
    // The handler
    const handle = createFeedbackHandler(deps({ coach }));
    // A short conversation with Theo
    const conversation = { characterId: "theo", turns: [{ who: "them", lineId: "theo-14" }, { who: "you", text: "what kind of radios" }] };
    // It, and one with far too many turns
    const [ok, odd] = [await handle(request({ ...BODY, mode: "conversation", promptId: "theo", conversation })), await handle(request({ ...BODY, mode: "conversation", promptId: "theo", conversation: { ...conversation, turns: Array.from({ length: 61 }, () => ({ who: "you", text: "hi" })) } }))];
    // The first arrived; the second was refused
    expect([ok.status, (seen[0] as { conversation?: unknown }).conversation, odd.status]).toEqual([200, conversation, 400]);
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

  // Someone without the passphrase learns nothing about the setup; the owner still gets the reason (decision 87)
  it("explains setup problems only to someone with the passphrase", async () => {
    // Settings that fail as they would with a missing key
    const broken = deps({ readEnv: () => { throw new Error("ANTHROPIC_API_KEY is not set."); } });
    // A stranger with a wrong passphrase is refused as any stranger is, without the reason
    const stranger = await createFeedbackHandler(broken)(request(BODY, "not the passphrase"));
    // Confirm the plain refusal
    expect([stranger.status, JSON.stringify(await stranger.json()).includes("ANTHROPIC")]).toEqual([401, false]);
  });

  // With no passphrase set at all, nobody can get in; only a developer's own machine says which setting is missing
  it("gives a plain answer when the passphrase setting is missing, with details only while developing", async () => {
    // No passphrase setting, and the settings reader says why
    const missing = { readAccessSecret: () => null, readEnv: () => { throw new Error("APP_ACCESS_SECRET is not set. Add it to .env.local."); } };
    // In production
    const live = await createFeedbackHandler({ ...deps(missing), development: false })(request(BODY, null));
    // While developing
    const developing = await createFeedbackHandler({ ...deps(missing), development: true })(request(BODY, null));
    // Confirm only the developer sees the variable named
    expect([live.status, await live.json(), developing.status, (await developing.json()).error]).toEqual([500, { error: "The server is not set up." }, 500, "The server is not set up: APP_ACCESS_SECRET is not set. Add it to .env.local."]);
  });

  // Wrong passphrases are counted by address; past the hour's limit even the right one is refused from there, so guessing stops (decision 87)
  it("stops a caller after too many wrong passphrases in an hour", async () => {
    // A coach that counts calls
    const coach = fakeCoach({ status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } });
    // One shared store
    const store = new MemoryCounterStore();
    // The handler
    const handle = createFeedbackHandler(deps({ coach, store }));
    // Twenty wrong guesses from one address
    const guesses = [];
    // Send them one by one
    for (let index = 0; index < 20; index += 1) guesses.push((await handle(request(BODY, `guess number ${index}`))).status);
    // The next try from that address, even with the right passphrase
    const locked = await handle(request(BODY));
    // The right passphrase from another address
    const other = await handle(request(BODY, SECRET, "198.51.100.7"));
    // Confirm twenty refusals, then a wait until the next hour (the clock reads 10:00:30), while the other address is served
    expect([new Set(guesses), locked.status, locked.headers.get("retry-after"), other.status, coach.calls]).toEqual([new Set([401]), 429, "3570", 200, 1]);
  });

  // If the counter store is down, the passphrase is still checked (the owner is not locked out by an outage) and the paid call is still refused
  it("checks the passphrase without counting when the store is down", async () => {
    // A store that always fails
    const broken: CounterStore = { increment: vi.fn(async () => { throw new Error("down"); }), read: vi.fn(async () => { throw new Error("down"); }) };
    // A wrong passphrase, and the right one
    const [wrong, right] = [await createFeedbackHandler(deps({ store: broken }))(request(BODY, "not the passphrase")), await createFeedbackHandler(deps({ store: broken }))(request(BODY))];
    // Confirm the stranger is told the passphrase is wrong, and the owner that the call is paused, as before
    expect([wrong.status, right.status]).toEqual([401, 503]);
  });

  // The fields' own caps cannot stack: the request's text in all is capped too (decision 87)
  it("refuses a request whose text in all is over the total cap", async () => {
    // Close to the transcript's own cap
    const transcript = "word ".repeat(7_900);
    // Ten turns of the most a turn may be
    const conversation = { characterId: "theo", turns: Array.from({ length: 10 }, () => ({ who: "you", text: "x".repeat(1_000) })) };
    // Each field within its own cap, but 49,500 characters in all
    const over = await createFeedbackHandler(deps())(request({ ...BODY, mode: "conversation", promptId: "theo", transcript, conversation }));
    // The same with two turns, 41,500 in all
    const under = await createFeedbackHandler(deps())(request({ ...BODY, mode: "conversation", promptId: "theo", transcript, conversation: { ...conversation, turns: conversation.turns.slice(0, 2) } }));
    // Confirm the first is refused and the second taken
    expect([over.status, under.status]).toEqual([400, 200]);
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

  // While developing, a failed coach call sends back the reason so the page can show it; in production it does not
  it("sends the coach failure's reason back only while developing", async () => {
    // A coach that fails the way the API does with a bad key
    const coach = fakeCoach(new Error("401 authentication_error: invalid x-api-key"));
    // In development
    const developing = await (await createFeedbackHandler({ ...deps({ coach }), development: true, log: () => {} })(request(BODY))).json();
    // In production
    const live = await (await createFeedbackHandler({ ...deps({ coach }), development: false, log: () => {} })(request(BODY))).json();
    // Confirm the detail only while developing
    expect([developing.detail, live.detail]).toEqual(["401 authentication_error: invalid x-api-key", undefined]);
  });

  // While developing, a mismatch is logged with both fingerprints so the cause can be seen without showing the passphrase
  it("logs both fingerprints on a mismatch while developing", async () => {
    // Collect log lines
    const lines: string[] = [];
    // Call with a wrong passphrase, in development, with a logger
    await createFeedbackHandler({ ...deps(), development: true, log: (line) => lines.push(line) })(request(BODY, "not the passphrase"));
    // Confirm one line naming both fingerprints and never the passphrase itself
    expect([lines.length, /this browser sent fingerprint [0-9a-f]{6}.*APP_ACCESS_SECRET has fingerprint [0-9a-f]{6}/.test(lines[0] ?? ""), (lines[0] ?? "").includes(SECRET)]).toEqual([1, true, false]);
  });

  // Warm-ups are accepted, and an older app that sends no mode still works
  it("accepts a warm-up and a request without a mode", async () => {
    // Call with a warm-up
    const warmup = await createFeedbackHandler(deps())(request({ ...BODY, mode: "warmup" }));
    // Call with a three-minute talk
    const talk = await createFeedbackHandler(deps())(request({ ...BODY, mode: "talk" }));
    // Call with a Record Response
    const response = await createFeedbackHandler(deps())(request({ ...BODY, mode: "response" }));
    // Call with a read-aloud session and its passage id
    const read = await createFeedbackHandler(deps())(request({ ...BODY, mode: "read", promptId: "r001" }));
    // Call with a pause drill
    const drill = await createFeedbackHandler(deps())(request({ ...BODY, mode: "pause", promptId: "d001" }));
    // Call with a rehearsal
    const rehearsal = await createFeedbackHandler(deps())(request({ ...BODY, mode: "rehearse", promptId: "talk-1" }));
    // Call with a lesson
    const lesson = await createFeedbackHandler(deps())(request({ ...BODY, mode: "lesson", promptId: "l002" }));
    // Call with a Q&A answer and its question
    const qa = await createFeedbackHandler(deps())(request({ ...BODY, mode: "qa", promptId: "r1", question: "What does it cost?" }));
    // Confirm it is accepted
    expect(qa.status).toBe(200);
    // Call with an openings and closings drill
    const bookend = await createFeedbackHandler(deps())(request({ ...BODY, mode: "bookend", promptId: "b001" }));
    // Confirm reading, the drill, the rehearsal, the lesson and the bookend drill succeed too
    expect([read.status, drill.status, rehearsal.status, lesson.status, bookend.status]).toEqual([200, 200, 200, 200, 200]);
    // Call without a mode
    const noMode = await createFeedbackHandler(deps())(request(BODY));
    // Confirm all succeed
    expect([warmup.status, talk.status, response.status, noMode.status]).toEqual([200, 200, 200, 200]);
  });

  // Bad input is refused before anything costs money
  it.each([
    // Not JSON
    ["not json", "{"],
    // No transcript
    ["missing transcript", { ...BODY, transcript: undefined }],
    // A zero-length recording
    ["zero duration", { ...BODY, durationSec: 0 }],
    // An absurdly long transcript (past what a fast 30-minute rehearsal needs)
    ["transcript too long", { ...BODY, transcript: "word ".repeat(9000) }],
    // Longer than any session can run
    ["duration too long", { ...BODY, durationSec: 1801 }],
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
    const broken: CounterStore = { increment: vi.fn(async () => { throw new Error("down"); }), read: vi.fn(async () => { throw new Error("down"); }) };
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
