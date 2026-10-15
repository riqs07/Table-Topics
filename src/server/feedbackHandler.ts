// The feedback route's logic, separate from Next.js so it can be tested with fakes

// Load the schema library to check the request body
import { z } from "zod";
// Load the passphrase check and its header name
import { PASSPHRASE_HEADER, passphraseMatches } from "@/server/accessGate";
// Load the passphrase fingerprint and warnings, for logging a mismatch while developing
import { passphraseFingerprint, passphraseWarnings } from "@/core/passphraseCheck";
// Load the coach type
import type { Coach } from "@/server/coach";
// Load the settings type
import type { ServerEnv } from "@/server/env";
// Load the rate limiter and its types
import { checkRateLimit, type CounterStore, type RateLimits } from "@/server/rateLimit";

// Everything the handler depends on, so tests can swap in fakes
export interface FeedbackDeps {
  // Read and check the server settings
  readEnv(): ServerEnv;
  // Make the coach
  makeCoach(env: ServerEnv): Coach;
  // Make the shared counter store
  makeCounterStore(env: ServerEnv): CounterStore;
  // The call limits
  limits: RateLimits;
  // The current time
  now(): Date;
  // True while developing locally: a passphrase mismatch is logged with both fingerprints
  development?: boolean;
  // Where log lines go (the server terminal)
  log?: (line: string) => void;
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
  mode: z.enum(["standard", "warmup", "talk", "response", "read", "pause", "rehearse", "lesson"]).optional(),
  // The prompt or passage id (the server looks up a passage's text itself rather than trusting text sent with the request)
  promptId: z.string().max(64).optional(),
});

// Build a JSON reply with a status code and optional headers
function reply(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  // Send the body as JSON
  return Response.json(body, { status, headers });
}

// Build the handler for POST /api/feedback
export function createFeedbackHandler(deps: FeedbackDeps) {
  // Handle one request
  return async function handle(request: Request): Promise<Response> {
    // Read the server settings, or explain what is missing
    let env: ServerEnv;
    // Try to read them
    try {
      // Read and check every setting
      env = deps.readEnv();
    } catch (error) {
      // Tell the caller which setting to fix (messages name variables, never values)
      return reply(500, { error: `The server is not set up: ${(error as Error).message}` });
    }

    // Refuse anyone without the passphrase, before anything costs money: read what was sent
    const provided = request.headers.get(PASSPHRASE_HEADER);
    // (compare it with the server's)
    if (!passphraseMatches(provided, env.accessSecret)) {
      // While developing, log both fingerprints and any stray characters in the server's setting, so the mismatch can be found
      if (deps.development && deps.log) {
        // Fingerprint of what the browser sent, or none
        const sent = provided ? await passphraseFingerprint(provided) : "none (no passphrase saved in this browser)";
        // Fingerprint of the server's setting
        const expected = await passphraseFingerprint(env.accessSecret);
        // Anything odd about the server's setting
        const warnings = passphraseWarnings(env.accessSecret);
        // One line, never the passphrase itself
        deps.log(`Passphrase mismatch: this browser sent fingerprint ${sent}; APP_ACCESS_SECRET has fingerprint ${expected}.${warnings.length ? ` APP_ACCESS_SECRET: ${warnings.join(" ")}` : ""}`);
      }
      // Refuse
      return reply(401, { error: "Wrong or missing passphrase." });
    }

    // Read the body as JSON
    let body: unknown;
    // Try to parse it
    try {
      // Parse the JSON body
      body = await request.json();
    } catch {
      // Not JSON
      return reply(400, { error: "The request was not valid JSON." });
    }
    // Check the body's shape and limits
    const parsed = RequestSchema.safeParse(body);
    // Refuse a bad body
    if (!parsed.success) return reply(400, { error: "The request was missing a field or had a value out of range." });

    // Count the call against the limits
    let limit;
    // Try the shared store
    try {
      // Check and count
      limit = await checkRateLimit(deps.makeCounterStore(env), deps.limits, deps.now());
    } catch {
      // If the store is down, refuse rather than run without limits
      return reply(503, { error: "Feedback is paused because the usage counter is unavailable. Your session is saved." });
    }
    // Refuse over the limit and say when to try again
    if (!limit.allowed) return reply(429, { error: limit.reason === "day" ? "Today's feedback limit is reached." : "Too many requests. Wait a moment." }, { "retry-after": String(limit.retryAfterSec) });

    // Ask the coach
    try {
      // Get feedback for the session
      const result = await deps.makeCoach(env).getFeedback(parsed.data);
      // A safety decline gets its own answer
      if (result.status === "declined") return reply(422, { error: "The coach could not review this session." });
      // Send the feedback back
      return reply(200, { feedback: result.feedback });
    } catch (error) {
      // Record the failure in the server log for debugging (no transcript is logged)
      console.error("Coach request failed:", (error as Error).message);
      // The AI failed; the app keeps the session and asks again later
      return reply(502, { error: "Feedback is unavailable right now. Your session is saved and feedback will be retried." });
    }
  };
}
