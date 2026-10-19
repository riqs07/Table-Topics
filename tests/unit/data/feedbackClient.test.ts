// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the feedback client being checked
import { requestFeedback, requestFeedbackDetail, sendPendingFeedback } from "@/data/feedbackClient";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

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
