// The feedback route's logic, separate from Next.js so it can be tested with fakes

// Load the schema library to check the request body
import { z } from "zod";
// Load the list of session kinds
import { SESSION_MODES } from "@/data/records";
// Load the size limits shared with the app (decision 86)
import { LONGEST_RECORDING_SECONDS, MAX_TURNS, NOTE_MAX_CHARS, REQUEST_TEXT_MAX_CHARS, TRANSCRIPT_MAX_CHARS, TURN_MAX_CHARS, requestTextLength } from "@/core/requestLimits";
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
  // What was said; capped so a runaway transcript cannot run up the bill (enough for a fast 30-minute rehearsal)
  transcript: z.string().max(TRANSCRIPT_MAX_CHARS),
  // Recording length in seconds: more than zero, at most the longest any session runs (a rehearsal's 30 minutes)
  durationSec: z.number().positive().max(LONGEST_RECORDING_SECONDS),
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
  notes: z.object({ worked: z.string().max(NOTE_MAX_CHARS), change: z.string().max(NOTE_MAX_CHARS), tags: z.array(z.string().max(40)).max(12) }).optional(),
  // The speaker stammers, so the coach leaves fluency alone (decision 79)
  stammer: z.boolean().optional(),
  // The voice numbers measured on the device (decision 81), each bounded so nothing else can ride along
  voice: z.object({
    // The pitch range in semitones
    rangeSteps: z.number().int().min(0).max(48).nullable(),
    // The speaker's usual range
    usualRange: z.number().int().min(0).max(48).nullable(),
    // How the phrases ended
    ends: z.object({ fall: z.number().int().min(0).max(1_000), level: z.number().int().min(0).max(1_000), rise: z.number().int().min(0).max(1_000) }).nullable(),
    // Phrases that faded at the end
    faded: z.object({ count: z.number().int().min(0).max(1_000), of: z.number().int().min(0).max(1_000) }).nullable(),
    // The last third's volume
    lastThird: z.enum(["louder", "same", "quieter"]).nullable(),
  }).optional(),
  // For a conversation: the persona, the situation, and every turn's words (a recorded line also by its id), bounded like the conversation route (decisions 83 and 84)
  conversation: z.object({
    // The persona's id
    characterId: z.string().max(16),
    // The situation's id (missing on conversations from before situations)
    scenarioId: z.string().max(16).optional(),
    // The turns
    turns: z.array(z.object({ who: z.enum(["you", "them"]), text: z.string().max(TURN_MAX_CHARS).optional(), lineId: z.string().max(16).optional() })).max(MAX_TURNS),
  }).optional(),
  // All the text together within one cap, so the per-field caps cannot stack into one very costly call
}).refine((body) => requestTextLength(body) <= REQUEST_TEXT_MAX_CHARS);

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
      // Send the feedback back, with the internal rubric the app keeps for the profile (decision 90)
      return reply(200, { feedback: result.feedback, ...(result.rubric ? { rubric: result.rubric } : {}) });
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
