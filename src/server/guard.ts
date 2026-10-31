// The checks every paid route runs before calling the model: the passphrase (with a cap on wrong guesses), the other settings, the body, and the shared rate limit

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
// Load how many wrong passphrases one caller may send in an hour
import { PASSPHRASE_FAILURES_PER_HOUR } from "@/config/limits";

// What the checks need, so tests can swap in fakes
export interface GuardDeps {
  // Read only the passphrase setting, or null when it is not set (checked before the other settings, so strangers learn nothing about them)
  readAccessSecret(): string | null;
  // Read and check the server settings
  readEnv(): ServerEnv;
  // Make the shared counter store (rate limits and failed passphrases)
  makeCounterStore(): CounterStore;
  // The call limits (shared by every paid route)
  limits: RateLimits;
  // The current time
  now(): Date;
  // True while developing locally: a passphrase mismatch is logged with both fingerprints, and setup problems are explained to anyone
  development?: boolean;
  // Where log lines go (the server terminal)
  log?: (line: string) => void;
}

// Seconds in an hour, the window for counting wrong passphrases
const HOUR = 3_600;
// The most bytes a JSON body may declare: the largest valid request is a few tens of thousands of characters of text (REQUEST_TEXT_MAX_CHARS), so anything far over that is refused before it is parsed
export const BODY_MAX_BYTES = 512_000;

// Build a JSON reply with a status code and optional headers
export function reply(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  // Send the body as JSON
  return Response.json(body, { status, headers });
}

// The caller's network address, for counting wrong passphrases: the first address the hosting platform forwarded, or "unknown"
export function clientAddress(request: Request): string {
  // The first address in the forwarded chain (the hosting platform sets it to the real caller)
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  // Otherwise the address a proxy reported, or unknown; kept short so a made-up header cannot make a huge key
  return (forwarded || request.headers.get("x-real-ip")?.trim() || "unknown").slice(0, 64);
}

// The refusal when a setting is missing or wrong: the details only for someone who has the passphrase, or while developing (they name settings, never values)
function notSetUp(error: unknown, detailed: boolean): Response {
  // Say which setting to fix, or only that something is wrong
  return reply(500, { error: detailed ? `The server is not set up: ${(error as Error).message}` : "The server is not set up." });
}

// Check the passphrase (counting wrong ones) and then every setting; hand back the settings, or the refusal to send. Free: it never counts against the call limits (decision 91 uses it alone for the deeper-analysis status check)
export async function checkAccess(request: Request, deps: GuardDeps): Promise<{ env: ServerEnv } | { refusal: Response }> {
  // The passphrase the server expects, read on its own
  const secret = deps.readAccessSecret();
  // Without it nobody can get in: say so, with details only while developing
  if (secret === null) {
    // Read every setting, to explain what is missing
    try {
      // Read and check every setting
      deps.readEnv();
    } catch (error) {
      // Refuse, explaining only while developing
      return { refusal: notSetUp(error, deps.development === true) };
    }
    // The settings reader found nothing wrong, yet there is no passphrase: refuse plainly
    return { refusal: notSetUp(new Error("APP_ACCESS_SECRET is not set."), deps.development === true) };
  }

  // What the caller sent
  const provided = request.headers.get(PASSPHRASE_HEADER);
  // The current time in whole seconds
  const seconds = Math.floor(deps.now().getTime() / 1000);
  // Which hour this falls in
  const hour = Math.floor(seconds / HOUR);
  // The counter of this caller's wrong passphrases in this hour
  const failuresKey = `passphrase-failures:${clientAddress(request)}:${hour}`;
  // The counter store, or none when it cannot be reached (the passphrase check then runs uncounted, so the owner is never locked out by an outage)
  let store: CounterStore | null;
  // Making the store can fail
  try {
    // Make it
    store = deps.makeCounterStore();
  } catch {
    // Run without counting
    store = null;
  }
  // How many wrong passphrases this caller has sent this hour
  let failures = 0;
  // Read it before comparing, so a caller over the limit cannot keep guessing
  if (store) {
    // Reading can fail
    try {
      // Read the count
      failures = await store.read(failuresKey);
    } catch {
      // Run without counting
      store = null;
    }
  }
  // Too many wrong passphrases from this caller: wait until the next hour
  if (failures >= PASSPHRASE_FAILURES_PER_HOUR) return { refusal: reply(429, { error: "Too many wrong passphrases. Try again later." }, { "retry-after": String((hour + 1) * HOUR - seconds) }) };

  // Refuse anyone without the passphrase (compare what was sent with the server's)
  if (!passphraseMatches(provided, secret)) {
    // Count the wrong passphrase for this caller
    if (store) {
      // Counting can fail; the refusal stands either way
      try {
        // Add one, expiring at the end of the hour's window
        await store.increment(failuresKey, HOUR);
      } catch {
        // Nothing more to do
      }
    }
    // While developing, log both fingerprints and any stray characters in the server's setting, so the mismatch can be found
    if (deps.development && deps.log) {
      // Fingerprint of what the browser sent, or none
      const sent = provided ? await passphraseFingerprint(provided) : "none (no passphrase saved in this browser)";
      // Fingerprint of the server's setting
      const expected = await passphraseFingerprint(secret);
      // Anything odd about the server's setting
      const warnings = passphraseWarnings(secret);
      // One line, never the passphrase itself
      deps.log(`Passphrase mismatch: this browser sent fingerprint ${sent}; APP_ACCESS_SECRET has fingerprint ${expected}.${warnings.length ? ` APP_ACCESS_SECRET: ${warnings.join(" ")}` : ""}`);
    }
    // Refuse
    return { refusal: reply(401, { error: "Wrong or missing passphrase." }) };
  }

  // The caller has the passphrase: read every setting, or explain which one to fix
  let env: ServerEnv;
  // Try to read them
  try {
    // Read and check every setting
    env = deps.readEnv();
  } catch (error) {
    // Tell the owner which setting to fix (messages name variables, never values)
    return { refusal: notSetUp(error, true) };
  }
  // Everything passed
  return { env };
}

// Count one call against the route's limits; hand back the refusal to send when it is over them or the counter cannot be reached, otherwise null
export async function countCall(deps: GuardDeps, pausedMessage: string, dayMessage = "Today's feedback limit is reached."): Promise<Response | null> {
  // The outcome
  let limit;
  // Try the shared store
  try {
    // Check and count
    limit = await checkRateLimit(deps.makeCounterStore(), deps.limits, deps.now());
  } catch {
    // If the store is down, refuse rather than run without limits
    return reply(503, { error: pausedMessage });
  }
  // Refuse over the limit and say when to try again
  if (!limit.allowed) return reply(429, { error: limit.reason === "day" ? dayMessage : "Too many requests. Wait a moment." }, { "retry-after": String(limit.retryAfterSec) });
  // Allowed
  return null;
}

// Run every check in order, so nothing costs money until the last step; hand back the settings and the checked body, or the refusal to send
export async function admit<Schema extends z.ZodType>(request: Request, deps: GuardDeps, schema: Schema, pausedMessage: string): Promise<{ env: ServerEnv; data: z.infer<Schema> } | { refusal: Response }> {
  // The passphrase and the settings first
  const access = await checkAccess(request, deps);
  // Refused there
  if ("refusal" in access) return access;
  // The checked settings
  const { env } = access;

  // A body declared far larger than any valid request is refused before it is read
  const declared = Number(request.headers.get("content-length") ?? 0);
  // Refuse it
  if (Number.isFinite(declared) && declared > BODY_MAX_BYTES) return { refusal: reply(413, { error: "The request was too large." }) };
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
  const over = await countCall(deps, pausedMessage);
  // Refused there
  if (over) return { refusal: over };

  // Everything passed
  return { env, data: parsed.data };
}
