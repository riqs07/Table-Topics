// The checks every paid route runs before calling the model: settings, passphrase, body, and the shared rate limit

// Load the schema library's type for request bodies
import type { z } from "zod";
// Load the passphrase check and its header name
import { PASSPHRASE_HEADER, passphraseMatches } from "@/server/accessGate";
// Load the passphrase fingerprint and warnings, for logging a mismatch while developing
import { passphraseFingerprint, passphraseWarnings } from "@/core/passphraseCheck";
// Load the settings type
import type { ServerEnv } from "@/server/env";
// Load the rate limiter and its types
import { checkRateLimit, type CounterStore, type RateLimits } from "@/server/rateLimit";

// What the checks need, so tests can swap in fakes
export interface GuardDeps {
  // Read and check the server settings
  readEnv(): ServerEnv;
  // Make the shared counter store
  makeCounterStore(env: ServerEnv): CounterStore;
  // The call limits (shared by every paid route)
  limits: RateLimits;
  // The current time
  now(): Date;
  // True while developing locally: a passphrase mismatch is logged with both fingerprints
  development?: boolean;
  // Where log lines go (the server terminal)
  log?: (line: string) => void;
}

// Build a JSON reply with a status code and optional headers
export function reply(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  // Send the body as JSON
  return Response.json(body, { status, headers });
}

// Run every check in order, so nothing costs money until the last step; hand back the settings and the checked body, or the refusal to send
export async function admit<Schema extends z.ZodType>(request: Request, deps: GuardDeps, schema: Schema, pausedMessage: string): Promise<{ env: ServerEnv; data: z.infer<Schema> } | { refusal: Response }> {
  // Read the server settings, or explain what is missing
  let env: ServerEnv;
  // Try to read them
  try {
    // Read and check every setting
    env = deps.readEnv();
  } catch (error) {
    // Tell the caller which setting to fix (messages name variables, never values)
    return { refusal: reply(500, { error: `The server is not set up: ${(error as Error).message}` }) };
  }

  // Refuse anyone without the passphrase: read what was sent
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
    return { refusal: reply(401, { error: "Wrong or missing passphrase." }) };
  }

  // Read the body as JSON
  let body: unknown;
  // Try to parse it
  try {
    // Parse the JSON body
    body = await request.json();
  } catch {
    // Not JSON
    return { refusal: reply(400, { error: "The request was not valid JSON." }) };
  }
  // Check the body's shape and limits
  const parsed = schema.safeParse(body);
  // Refuse a bad body
  if (!parsed.success) return { refusal: reply(400, { error: "The request was missing a field or had a value out of range." }) };

  // Count the call against the limits
  let limit;
  // Try the shared store
  try {
    // Check and count
    limit = await checkRateLimit(deps.makeCounterStore(env), deps.limits, deps.now());
  } catch {
    // If the store is down, refuse rather than run without limits
    return { refusal: reply(503, { error: pausedMessage }) };
  }
  // Refuse over the limit and say when to try again
  if (!limit.allowed) return { refusal: reply(429, { error: limit.reason === "day" ? "Today's feedback limit is reached." : "Too many requests. Wait a moment." }, { "retry-after": String(limit.retryAfterSec) }) };

  // Everything passed
  return { env, data: parsed.data };
}
