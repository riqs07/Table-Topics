// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository } from "@/data/repository";
// Load the client being checked
import { requestQuestions, saveOwnQuestions } from "@/data/questionsClient";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A fake network that answers with a status and body
function answer(status: number, body: unknown = {}) {
  // Answer as JSON
  return vi.fn(async () => Response.json(body, { status }));
}

// A repository holding one rehearsal
async function withRehearsal() {
  // An empty repository
  const repository = createRepository(new MemoryStore());
  // Save the rehearsal
  await repository.saveSession(makeSession({ id: "r1", mode: "rehearse", promptId: "talk-1", transcript: "We should switch tools." }));
  // Hand it back
  return repository;
}

// Group the checks about asking for audience questions
describe("requestQuestions", () => {
  // Success saves the questions on the session, and only the transcript is sent
  it("saves the questions and sends only the transcript, prompt and kind", async () => {
    // A rehearsal
    const repository = await withRehearsal();
    // A network that answers
    const network = answer(200, { questions: ["A?", "B?", "C?"] });
    // Ask
    const result = await requestQuestions(repository, "r1", { passphrase: "a-long-enough-passphrase", fetchFn: network });
    // What was sent
    const [url, init] = network.mock.calls[0] as unknown as [string, RequestInit];
    // Confirm the outcome, the saved questions, and the request
    expect([result, (await repository.getSession("r1"))?.questions, url, JSON.parse(String(init.body))]).toEqual([{ outcome: "done", questions: ["A?", "B?", "C?"], reason: null }, ["A?", "B?", "C?"], "/api/questions", { transcript: "We should switch tools.", promptId: "talk-1", mode: "rehearse" }]);
  });

  // No passphrase: nothing is sent
  it("asks for the passphrase without calling the server", async () => {
    // A network that counts calls
    const network = answer(200);
    // Ask without a passphrase
    const result = await requestQuestions(await withRehearsal(), "r1", { passphrase: "", fetchFn: network });
    // Confirm the outcome and no call
    expect([result.outcome, network.mock.calls.length]).toEqual(["needs-passphrase", 0]);
  });

  // Each failure has its own outcome, with the server's reason
  it("names each failure with the server's reason", async () => {
    // A rehearsal
    const repository = await withRehearsal();
    // The outcomes for a decline, a wrong passphrase, a server error, and a lost connection
    const outcomes = [
      await requestQuestions(repository, "r1", { passphrase: "p", fetchFn: answer(422, { error: "Declined." }) }),
      await requestQuestions(repository, "r1", { passphrase: "p", fetchFn: answer(401, { error: "Wrong or missing passphrase." }) }),
      await requestQuestions(repository, "r1", { passphrase: "p", fetchFn: answer(502, { error: "Unavailable.", detail: "overloaded" }) }),
      await requestQuestions(repository, "r1", { passphrase: "p", fetchFn: vi.fn(async () => { throw new TypeError("offline"); }) }),
    ];
    // Confirm each
    expect(outcomes).toEqual([
      { outcome: "declined", questions: [], reason: "Declined." },
      { outcome: "needs-passphrase", questions: [], reason: "Wrong or missing passphrase." },
      { outcome: "retry-later", questions: [], reason: "overloaded" },
      { outcome: "retry-later", questions: [], reason: null },
    ]);
  });
});

// Group the checks about typing your own questions
describe("saveOwnQuestions", () => {
  // One question per line, blank lines dropped, at most five
  it("saves one question per non-blank line, up to five", async () => {
    // A rehearsal
    const repository = await withRehearsal();
    // Save typed questions
    const saved = await saveOwnQuestions(repository, "r1", "  Why now?\n\nWhat does it cost?\nA\nB\nC\nD");
    // Confirm the list
    expect([saved, (await repository.getSession("r1"))?.questions]).toEqual([["Why now?", "What does it cost?", "A", "B", "C"], ["Why now?", "What does it cost?", "A", "B", "C"]]);
  });
});
