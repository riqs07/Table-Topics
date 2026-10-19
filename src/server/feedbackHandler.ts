// The feedback route's logic, separate from Next.js so it can be tested with fakes

// Load the schema library to check the request body
import { z } from "zod";
// Load the list of session kinds
import { SESSION_MODES } from "@/data/records";
// Load the coach type
import type { Coach } from "@/server/coach";
// Load the settings type
import type { ServerEnv } from "@/server/env";
// Load the shared checks
import { admit, reply, type GuardDeps } from "@/server/guard";

// Everything the handler depends on, so tests can swap in fakes
export interface FeedbackDeps extends GuardDeps {
  // Make the coach
  makeCoach(env: ServerEnv): Coach;
}

// The request body the app sends
const RequestSchema = z.object({
  // What was said; capped so a runaway transcript cannot run up the bill
  transcript: z.string().max(20_000),
  // Recording length in seconds: more than zero, at most 15 minutes
  durationSec: z.number().positive().max(900),
  // Id of the weekly focus
  focusId: z.string().max(64),
  // The previous fix on a retry, or null
  previousChange: z.string().max(1_000).nullable(),
  // The kind of session (older app versions send none)
  mode: z.enum(SESSION_MODES).optional(),
  // The prompt or passage id (the server looks up a passage's text itself rather than trusting text sent with the request)
  promptId: z.string().max(64).optional(),
  // For a Q&A answer: the question it answered (written by the coach or typed by the user)
  question: z.string().max(300).optional(),
  // For a short speech: the topic, points and length the speaker planned (decision 73)
  outline: z.object({ topic: z.string().max(140), points: z.array(z.string().max(140)).max(4), goalMinutes: z.number().int().min(1).max(10) }).optional(),
  // The user's own notes after listening back, only when they let the coach read them
  notes: z.object({ worked: z.string().max(500), change: z.string().max(500), tags: z.array(z.string().max(40)).max(12) }).optional(),
  // The speaker stammers, so the coach leaves fluency alone (decision 79)
  stammer: z.boolean().optional(),
});

// Build the handler for POST /api/feedback
export function createFeedbackHandler(deps: FeedbackDeps) {
  // Handle one request
  return async function handle(request: Request): Promise<Response> {
    // Settings, passphrase, body and rate limit, in that order
    const admitted = await admit(request, deps, RequestSchema, "Feedback is paused because the usage counter is unavailable. Your session is saved.");
    // Refused at one of the checks
    if ("refusal" in admitted) return admitted.refusal;
    // The checked settings and body
    const { env, data } = admitted;

    // Ask the coach
    try {
      // Get feedback for the session
      const result = await deps.makeCoach(env).getFeedback(data);
      // A safety decline gets its own answer
      if (result.status === "declined") return reply(422, { error: "The coach could not review this session." });
      // Send the feedback back
      return reply(200, { feedback: result.feedback });
    } catch (error) {
      // The failure's message (from the API: a status and error type, never the key or the transcript)
      const message = (error as Error).message;
      // Record the failure in the server log for debugging
      (deps.log ?? console.error)(`Coach request failed: ${message}`);
      // The AI failed; the app keeps the session and asks again later (while developing, the reason goes back so the page can show it)
      return reply(502, { error: "Feedback is unavailable right now. Your session is saved and feedback will be retried.", ...(deps.development ? { detail: message } : {}) });
    }
  };
}
