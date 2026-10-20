// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the feedback client being checked
import { requestFeedback, requestFeedbackDetail, sendPendingFeedback } from "@/data/feedbackClient";
// Load a sample session builder
import { makeSession, voiceReadings } from "../../support/fixtures";
// Load the real feedback route's logic and an in-memory counter store, to check what the app sends is what the server takes
import { createFeedbackHandler } from "@/server/feedbackHandler";
import { MemoryCounterStore } from "@/server/rateLimit";

// Sample feedback the route returns
const FEEDBACK = { keep: "k", change: "c", retryCue: "r" };

// Make a fake network that answers with a status and body
function answer(status: number, body: unknown = {}) {
  // Every call gets the same reply
  return vi.fn(async () => Response.json(body, { status }));
}

// Make a repository holding the given sessions
async function repositoryWith(...sessions: ReturnType<typeof makeSession>[]) {
  // Wrap an empty store
  const repository = createRepository(new MemoryStore());
  // Save each session
  for (const session of sessions) await repository.saveSession(session);
  // Hand it back
  return repository;
}

// Group the checks about asking for one session's feedback
describe("requestFeedback", () => {
  // A Q&A answer sends its question with it
  it("sends the question with a Q&A answer", async () => {
    // A Q&A answer
    const repository = await repositoryWith(makeSession({ id: "q1", mode: "qa", promptId: "r1", question: "What does it cost?" }));
    // A network that answers
    const network = answer(200, { feedback: FEEDBACK });
    // Ask for feedback
    await requestFeedback(repository, "q1", { passphrase: "pass", fetchFn: network });
    // Confirm the question was in the body
    expect(JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)).question).toBe("What does it cost?");
  });

  // A conversation sends its situation and every turn's words (a recorded line also by its id), and no voice numbers (decisions 83 and 84)
  it("sends a conversation's situation and turns", async () => {
    // A conversation with Theo
    const repository = await repositoryWith(makeSession({ id: "c1", mode: "conversation", promptId: "theo", conversation: { scenarioId: "class", twist: 0, turns: [{ who: "them", text: "Well… I fix up old radios.", lineId: "theo-14", seconds: 3 }, { who: "you", text: "what kind of radios", seconds: 2 }, { who: "them", text: "Oh, the fifties ones mostly.", seconds: 0 }] }, ...voiceReadings("rising") }));
    // A network that answers
    const network = answer(200, { feedback: FEEDBACK });
    // Ask for feedback
    await requestFeedback(repository, "c1", { passphrase: "pass", fetchFn: network });
    // What was sent
    const body = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { conversation?: unknown; voice?: unknown };
    // The turns, and no voice numbers
    expect([body.conversation, body.voice]).toEqual([{ characterId: "theo", scenarioId: "class", turns: [{ who: "them", text: "Well… I fix up old radios.", lineId: "theo-14" }, { who: "you", text: "what kind of radios" }, { who: "them", text: "Oh, the fifties ones mostly." }] }, undefined]);
  });

  // Regression (decision 86): the longest sessions the app can make (a 30-minute rehearsal, a long note, a fast minute's turn, a conversation left running) are taken by the real route, not refused for good
  it("sends the longest sessions within what the server takes", async () => {
    // A 30-minute rehearsal of about 6,000 words, with a note longer than the box allows (saved before it had a limit)
    const rehearsal = makeSession({ id: "r1", mode: "rehearse", durationSec: 1800, transcript: Array(6000).fill("words").join(" "), selfReview: { worked: "", change: "x ".repeat(400), tags: [], skipped: false, savedAt: "2026-10-16T10:00:00.000Z" } });
    // A conversation of 20 minutes on the clock, with one very fast turn of yours
    const conversation = makeSession({ id: "c1", mode: "conversation", promptId: "theo", durationSec: 1200, conversation: { scenarioId: "class", twist: 0, turns: [{ who: "them", text: "Hey.", seconds: 1 }, { who: "you", text: "word ".repeat(300), seconds: 60 }] } });
    // Both saved
    const repository = await repositoryWith(rehearsal, conversation);
    // Sharing notes is on
    await repository.saveSettings({ ...(await repository.getSettings(new Date())), shareNotes: true });
    // The real route, with a coach that always answers
    const handle = createFeedbackHandler({ readAccessSecret: () => "a long passphrase for testing", readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: "a long passphrase for testing", counterStore: null }), makeCoach: () => ({ getFeedback: async () => ({ status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } }) }), makeCounterStore: () => new MemoryCounterStore(), limits: { perMinute: 10, perDay: 100 }, now: () => new Date() });
    // The network passes each request to it
    const network = async (_url: RequestInfo | URL, init?: RequestInit) => handle(new Request("http://localhost/api/feedback", init));
    // Ask for both
    const outcomes = [await requestFeedback(repository, "r1", { passphrase: "a long passphrase for testing", fetchFn: network }), await requestFeedback(repository, "c1", { passphrase: "a long passphrase for testing", fetchFn: network })];
    // Both reviewed
    expect(outcomes).toEqual(["done", "done"]);
  });

  // A conversation whose words come twice (transcript and turns) is cut to the route's total, not refused for good (decision 87)
  it("cuts the transcript so the whole request fits the route's total", async () => {
    // A long conversation: 40,000 characters of transcript and 20 full turns of 1,000
    const conversation = makeSession({ id: "c2", mode: "conversation", promptId: "theo", durationSec: 1200, transcript: "word ".repeat(8_000), conversation: { scenarioId: "class", twist: 0, turns: Array.from({ length: 20 }, () => ({ who: "you" as const, text: "y".repeat(1_000), seconds: 60 })) } });
    // Saved
    const repository = await repositoryWith(conversation);
    // The real route, with a coach that always answers
    const handle = createFeedbackHandler({ readAccessSecret: () => "a long passphrase for testing", readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: "a long passphrase for testing", counterStore: null }), makeCoach: () => ({ getFeedback: async () => ({ status: "ok", feedback: FEEDBACK, usage: { inputTokens: 1, outputTokens: 1 } }) }), makeCounterStore: () => new MemoryCounterStore(), limits: { perMinute: 10, perDay: 100 }, now: () => new Date() });
    // The network passes each request to it
    const network = async (_url: RequestInfo | URL, init?: RequestInit) => handle(new Request("http://localhost/api/feedback", init));
    // Confirm it was reviewed
    expect(await requestFeedback(repository, "c2", { passphrase: "a long passphrase for testing", fetchFn: network })).toBe("done");
  });

  // When the server says which setting is wrong, that reason is passed on (it names the setting, never its value)
  it("passes on the server's reason when it is not set up", async () => {
    // A repository with one session
    const repository = await repositoryWith(makeSession({ id: "s1" }));
    // The server refuses because the passphrase setting is too short
    const network = answer(500, { error: "The server is not set up: APP_ACCESS_SECRET must be at least 16 characters long." });
    // Confirm the outcome and the reason
    expect(await requestFeedbackDetail(repository, "s1", { passphrase: "a-long-enough-passphrase", fetchFn: network })).toEqual({ outcome: "not-set-up", reason: "The server is not set up: APP_ACCESS_SECRET must be at least 16 characters long." });
  });

  // Success saves the feedback on the session
  it("saves feedback when the route answers", async () => {
    // A pending session
    const repository = await repositoryWith(makeSession({ id: "s1" }));
    // Ask with a network that succeeds
    const outcome = await requestFeedback(repository, "s1", { passphrase: "pass", fetchFn: answer(200, { feedback: FEEDBACK }) });
    // Confirm the outcome
    expect(outcome).toBe("done");
    // Confirm the session now has its feedback
    expect(await repository.getSession("s1")).toMatchObject({ feedback: FEEDBACK, feedbackStatus: "done" });
  });

  // With sharing on, feedback waits for the notes, then sends them
  it("waits for notes the coach may read, then sends them", async () => {
    // A session waiting for notes
    const repository = await repositoryWith(makeSession({ id: "s1", selfReview: null }));
    // Sharing is on
    await repository.saveSettings({ ...(await repository.getSettings(new Date())), shareNotes: true });
    // The network
    const network = answer(200, { feedback: FEEDBACK });
    // Ask before the notes exist
    const before = await requestFeedback(repository, "s1", { passphrase: "pass", fetchFn: network });
    // Save notes
    await repository.saveSession({ ...(await repository.getSession("s1"))!, selfReview: { worked: "", change: "Slow down", tags: ["too-fast"], skipped: false, savedAt: "2026-10-16T10:00:00.000Z" } });
    // Ask again
    await requestFeedback(repository, "s1", { passphrase: "pass", fetchFn: network });
    // What was sent
    const body = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { notes?: unknown };
    // Confirm it waited without calling, then sent the notes
    expect([before, network.mock.calls.length, body.notes]).toEqual(["awaiting-notes", 1, { worked: "", change: "Slow down", tags: ["too-fast"] }]);
  });

  // With sharing off (the default), notes are never sent
  it("does not send notes unless sharing is on", async () => {
    // A session with notes
    const repository = await repositoryWith(makeSession({ id: "s1", selfReview: { worked: "w", change: "c", tags: [], skipped: false, savedAt: "2026-10-16T10:00:00.000Z" } }));
    // The network
    const network = answer(200, { feedback: FEEDBACK });
    // Ask
    await requestFeedback(repository, "s1", { passphrase: "pass", fetchFn: network });
    // What was sent
    const body = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { notes?: unknown };
    // Confirm no notes
    expect(body.notes).toBeUndefined();
  });

  // "I stammer" goes with the request, so the coach leaves fluency alone (decision 79)
  it("tells the coach when the speaker stammers", async () => {
    // A session, with the setting on
    const repository = await repositoryWith(makeSession({ id: "s1" }));
    // Switch it on
    await repository.saveSettings({ ...(await repository.getSettings(new Date())), stammer: true });
    // The network
    const network = answer(200, { feedback: FEEDBACK });
    // Ask
    await requestFeedback(repository, "s1", { passphrase: "pass", fetchFn: network });
    // What was sent
    const body = JSON.parse(String((network.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { stammer?: unknown };
    // Confirm the flag
    expect(body.stammer).toBe(true);
  });

  // The voice numbers measured on the device go with the request (decision 81)
  it("sends the voice numbers when pitch was recorded", async () => {
    // A session with rising phrase ends, and one without pitch
    const repository = await repositoryWith(makeSession({ id: "s1", ...voiceReadings("rising"), durationSec: 13 }), makeSession({ id: "s2" }));
    // The network
    const network = answer(200, { feedback: FEEDBACK });
    // Ask for both
    await requestFeedback(repository, "s1", { passphrase: "pass", fetchFn: network });
    // The second
    await requestFeedback(repository, "s2", { passphrase: "pass", fetchFn: network });
    // What was sent each time
    const [first, second] = network.mock.calls.map((call) => JSON.parse(String((call as unknown as [string, RequestInit])[1].body)) as { voice?: { rangeSteps: number | null; ends: unknown } });
    // The endings went with the first; nothing with the second
    expect([first?.voice?.ends, second?.voice]).toEqual([{ fall: 0, level: 0, rise: 5 }, undefined]);
  });

  // Notes saved while the coach is thinking are kept when the feedback arrives
  it("keeps notes saved while the request was under way", async () => {
    // A session waiting for feedback
    const repository = await repositoryWith(makeSession({ id: "s1", selfReview: null }));
    // A network that lets the user save notes before answering
    const network = vi.fn(async () => {
      // The user saves notes meanwhile
      const latest = await repository.getSession("s1");
      // Save them
      await repository.saveSession({ ...latest!, selfReview: { worked: "w", change: "c", tags: [], skipped: false, savedAt: "2026-10-16T10:00:00.000Z" } });
      // Then the coach answers
      return Response.json({ feedback: FEEDBACK }, { status: 200 });
    });
    // Ask
    await requestFeedback(repository, "s1", { passphrase: "pass", fetchFn: network });
    // Confirm both the feedback and the notes are there
    const saved = await repository.getSession("s1");
    // Both
    expect([saved?.feedback, saved?.selfReview?.worked]).toEqual([FEEDBACK, "w"]);
  });

  // The request carries the passphrase and the session details
  it("sends the passphrase and the session, with the previous fix on a retry", async () => {
    // A first try with feedback, and its pending retry
    const repository = await repositoryWith(makeSession({ id: "s1", feedback: FEEDBACK, feedbackStatus: "done" }), makeSession({ id: "s2", retryOf: "s1", transcript: "hello", durationSec: 40, focus: "pace" }));
    // A network that remembers the request
    const network = answer(200, { feedback: FEEDBACK });
    // Ask for the retry's feedback
    await requestFeedback(repository, "s2", { passphrase: "pass", fetchFn: network });
    // Read what was sent
    const [url, init] = network.mock.calls[0] as unknown as [string, RequestInit];
    // Confirm the address
    expect(url).toBe("/api/feedback");
    // Confirm the passphrase header
    expect(new Headers(init.headers).get("x-voicelab-passphrase")).toBe("pass");
    // Confirm the body, including last time's fix
    expect(JSON.parse(String(init.body))).toEqual({ transcript: "hello", durationSec: 40, focusId: "pace", previousChange: "c", mode: "standard", promptId: "prompt-1" });
  });

  // Without a passphrase nothing is sent
  it("asks for the passphrase before sending anything", async () => {
    // A pending session
    const repository = await repositoryWith(makeSession({ id: "s1" }));
    // A network that should not be called
    const network = answer(200);
    // Ask without a passphrase
    expect(await requestFeedback(repository, "s1", { passphrase: "", fetchFn: network })).toBe("needs-passphrase");
    // Confirm nothing was sent
    expect(network).not.toHaveBeenCalled();
  });

  // Each kind of failure leads to the right next step, and the session stays safe
  it.each([
    // Wrong passphrase: ask again, keep pending
    [401, "needs-passphrase", "pending"],
    // Server not set up: say so, keep pending
    [500, "not-set-up", "pending"],
    // Declined by the coach: stop trying
    [422, "declined", "failed"],
    // Rate limited: try later
    [429, "retry-later", "pending"],
    // Coach failed: try later
    [502, "retry-later", "pending"],
    // Counter store down: try later
    [503, "retry-later", "pending"],
  ] as const)("handles status %i as %s", async (status, outcome, savedStatus) => {
    // A pending session
    const repository = await repositoryWith(makeSession({ id: "s1" }));
    // Ask with a network that fails this way
    expect(await requestFeedback(repository, "s1", { passphrase: "pass", fetchFn: answer(status, { error: "x" }) })).toBe(outcome);
    // Confirm the session's saved status
    expect((await repository.getSession("s1"))?.feedbackStatus).toBe(savedStatus);
  });

  // Being offline is not an error; the session waits
  it("treats a network failure as try-later", async () => {
    // A pending session
    const repository = await repositoryWith(makeSession({ id: "s1" }));
    // A network that throws, as fetch does offline
    const offline = vi.fn(async () => { throw new TypeError("Failed to fetch"); });
    // Confirm the outcome
    expect(await requestFeedback(repository, "s1", { passphrase: "pass", fetchFn: offline })).toBe("retry-later");
  });
});

// Group the checks about sending every waiting session
describe("sendPendingFeedback", () => {
  // Waiting sessions are sent oldest first, and done ones are skipped
  it("sends pending sessions oldest first", async () => {
    // One done and two pending sessions
    const repository = await repositoryWith(
      makeSession({ id: "done", feedback: FEEDBACK, feedbackStatus: "done", createdAt: "2026-10-10T10:00:00.000Z" }),
      makeSession({ id: "newer", createdAt: "2026-10-12T10:00:00.000Z" }),
      makeSession({ id: "older", createdAt: "2026-10-11T10:00:00.000Z" }),
    );
    // A network that succeeds
    const network = answer(200, { feedback: FEEDBACK });
    // Send everything waiting
    const result = await sendPendingFeedback(repository, { passphrase: "pass", fetchFn: network });
    // Confirm two were sent
    expect(result).toEqual({ sent: 2, stoppedBy: null, reason: null });
    // Confirm none are left waiting
    expect((await repository.listSessions()).every((session) => session.feedbackStatus === "done")).toBe(true);
  });

  // When something blocks every request, it stops after the first rather than hammering the server
  it("stops at the first blocking outcome", async () => {
    // Two pending sessions
    const repository = await repositoryWith(makeSession({ id: "a", createdAt: "2026-10-11T10:00:00.000Z" }), makeSession({ id: "b", createdAt: "2026-10-12T10:00:00.000Z" }));
    // A network that is rate limited
    const network = answer(429);
    // Send everything waiting
    const result = await sendPendingFeedback(repository, { passphrase: "pass", fetchFn: network });
    // Confirm it stopped after one try
    expect(result).toEqual({ sent: 0, stoppedBy: "retry-later", reason: null });
    // Confirm only one request was made
    expect(network).toHaveBeenCalledTimes(1);
  });

// Group the checks about passing on the reason for a temporary failure
describe("temporary failures", () => {
  // The detail sent while developing is passed on, from one request and from sending all waiting sessions
  it("passes on the coach failure's detail", async () => {
    // A repository with one waiting session
    const repository = await repositoryWith(makeSession({ id: "s1" }));
    // A server whose coach call failed
    const network = answer(502, { error: "Feedback is unavailable right now.", detail: "401 authentication_error: invalid x-api-key" });
    // Confirm both report the detail
    expect([(await requestFeedbackDetail(repository, "s1", { passphrase: "a-long-enough-passphrase", fetchFn: network })).reason, (await sendPendingFeedback(repository, { passphrase: "a-long-enough-passphrase", fetchFn: network })).reason]).toEqual(["401 authentication_error: invalid x-api-key", "401 authentication_error: invalid x-api-key"]);
  });
});
});
