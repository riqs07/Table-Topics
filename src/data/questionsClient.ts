// Asks our own server for likely audience questions, or saves the user's own (plan step B3)

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the repository type
import type { Repository } from "@/data/repository";

// How a request for questions ended
export type QuestionsOutcome = "done" | "declined" | "invalid" | "needs-passphrase" | "not-set-up" | "retry-later";

// The result: the outcome, the questions on success, and the server's reason on failure
export interface QuestionsReply {
  // How it ended
  outcome: QuestionsOutcome;
  // The questions (empty unless done)
  questions: string[];
  // The server's explanation, if it gave one
  reason: string | null;
}

// What the request needs
export interface QuestionsOptions {
  // The passphrase saved in this browser
  passphrase: string;
  // The network (a fake in tests)
  fetchFn?: typeof fetch;
}

// The most questions a user can type for one session
const MAX_OWN_QUESTIONS = 5;

// Read the server's error and development detail from a failed reply, if any
async function reasonsFrom(response: Response): Promise<{ error: string | null; detail: string | null }> {
  // Try to read the body
  try {
    // The JSON body
    const body = (await response.json()) as { error?: unknown; detail?: unknown };
    // Text fields only
    return { error: typeof body.error === "string" ? body.error : null, detail: typeof body.detail === "string" ? body.detail : null };
  } catch {
    // No readable body
    return { error: null, detail: null };
  }
}

// Ask the server for three questions about a session, saving them on it when they arrive
export async function requestQuestions(repository: Repository, sessionId: string, { passphrase, fetchFn = fetch }: QuestionsOptions): Promise<QuestionsReply> {
  // A reply with no questions
  const failed = (outcome: QuestionsOutcome, reason: string | null = null): QuestionsReply => ({ outcome, questions: [], reason });
  // Nothing is sent without the passphrase
  if (!passphrase) return failed("needs-passphrase");
  // The session the questions are for
  const session = await repository.getSession(sessionId);
  // It must exist
  if (!session) return failed("invalid");
  // The server's reply
  let response: Response;
  // Try the request
  try {
    // Send the transcript, the prompt or talk id, and the kind of session; never a rehearsal's script
    response = await fetchFn("/api/questions", {
      // A POST
      method: "POST",
      // JSON, with the passphrase
      headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase },
      // The body
      body: JSON.stringify({ transcript: session.transcript, promptId: session.promptId, mode: session.mode }),
    });
  } catch {
    // Offline or unreachable
    return failed("retry-later");
  }
  // Success: save and hand back the questions
  if (response.ok) {
    // The questions
    const { questions } = (await response.json()) as { questions: string[] };
    // Save them on the session
    await repository.saveSession({ ...session, questions });
    // Hand them back
    return { outcome: "done", questions, reason: null };
  }
  // The server's reasons
  const { error, detail } = await reasonsFrom(response);
  // A decline or a bad request
  if (response.status === 422 || response.status === 400) return failed(response.status === 422 ? "declined" : "invalid", error);
  // A wrong passphrase
  if (response.status === 401) return failed("needs-passphrase", error);
  // The server is not set up
  if (response.status === 500) return failed("not-set-up", error);
  // Anything else can be tried again (the development detail says why)
  return failed("retry-later", detail);
}

// Save questions the user typed, one per non-blank line, at most five
export async function saveOwnQuestions(repository: Repository, sessionId: string, text: string): Promise<string[]> {
  // Tidy lines, dropping blanks
  const questions = text.split("\n").map((line) => line.trim()).filter((line) => line !== "").slice(0, MAX_OWN_QUESTIONS);
  // The session
  const session = await repository.getSession(sessionId);
  // Save them on it, if it exists
  if (session) await repository.saveSession({ ...session, questions });
  // Hand them back
  return questions;
}
