// POST /api/live (decision 119): starts a live conversation. Checks the passphrase, the body, that the live service is set up, the rate limit and the month's live minutes, in that order, so nothing costs money until the last step; then asks AssemblyAI for a single-use streaming token whose socket may stay open only as long as the minutes reserved for it (at most five minutes), and reserves those minutes. POST /api/live/end hands back the minutes a conversation did not use, once. The keys never leave the server

// Load the schema library, to check the request
import { z } from "zod";
// Load the budget rules
import { LIVE_KEYS, grantFor, liveMonth, minutesUsed, refundFor, type LiveKind } from "@/core/liveBudget";
// Load the live caps
import { LIVE_MINUTES_PER_MONTH, LIVE_B_MINUTES_PER_MONTH, LIVE_SESSION_SECONDS, LIVE_TOKEN_EXPIRES_SECONDS, LIVE_TOKENS_PER_CONVERSATION } from "@/config/limits";
// Load the shared checks
import { checkAccess, countCall, reply, type GuardDeps } from "@/server/guard";
// Load the counter helpers
import { addToCounter, type CounterStore } from "@/server/rateLimit";
// Load the settings type
import type { LiveSettings } from "@/server/env";
// Load the vendor types
import type { AgentGrant, AgentTokens, StreamingTokens } from "@/server/liveVendors";

// What the live routes need beyond the shared checks
export interface LiveDeps extends GuardDeps {
  // Read the live settings (the keys, the agent and the monthly minutes)
  liveSettings(): LiveSettings;
  // Make AssemblyAI's token issuer with the key
  makeStreamingTokens(apiKey: string): StreamingTokens;
  // Make ElevenLabs' call issuer with the key and agent
  makeAgentTokens(apiKey: string, agentId: string): AgentTokens;
}

// The request to start: which kind, and which conversation (a random id made by the app)
const StartSchema = z.object({
  // Step A (AssemblyAI streaming) or step B (the ElevenLabs agent's call)
  kind: z.enum(["a", "b"]),
  // The conversation, for its reservation
  conversationId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
});

// The request to end: which kind, which conversation, and how long it was open
const EndSchema = z.object({
  // Which kind
  kind: z.enum(["a", "b"]),
  // The conversation
  conversationId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
  // Seconds the live connection was open (a little past the cap is allowed, since closing takes a moment)
  seconds: z.number().min(0).max(LIVE_SESSION_SECONDS + 120),
});

// What the phone is told when the counter cannot be reached
const PAUSED = "Live conversations are paused because the usage counter is unavailable.";
// Seconds a conversation's counters last (a little longer than any conversation)
const CONVERSATION_WINDOW = 2 * 3_600;
// Seconds a month's counters last (a little over a month, so they outlive their own month)
const MONTH_WINDOW = 32 * 86_400;

// The words for each kind, for messages
const KIND_NAME: Readonly<Record<LiveKind, string>> = { a: "Live conversations", b: "Phone calls" };

// The month's limit for a kind
function limitOf(settings: LiveSettings, kind: LiveKind): number {
  // Step A's minutes, or the call's
  return kind === "a" ? settings.minutesPerMonth : settings.callMinutesPerMonth;
}

// Read the live settings, or the refusal naming what is wrong (only someone with the passphrase gets here)
function settingsOf(deps: LiveDeps): LiveSettings | Response {
  // Reading can fail on a value that cannot be used
  try {
    // The settings
    return deps.liveSettings();
  } catch (error) {
    // Said by name
    return reply(500, { error: `The server is not set up: ${(error as Error).message}` });
  }
}

// What is missing for a kind, in words naming the settings, or null when it is set up
function missingFor(settings: LiveSettings, kind: LiveKind): string | null {
  // Step A needs the AssemblyAI key
  if (kind === "a") return settings.assemblyAiKey ? null : "ASSEMBLYAI_API_KEY is not set.";
  // Step B needs the ElevenLabs key
  if (!settings.elevenLabsKey) return "ELEVENLABS_API_KEY is not set.";
  // And the agent
  return settings.agentId ? null : "ELEVENLABS_AGENT_ID is not set.";
}

// Read a JSON body against a schema, or the refusal
async function bodyOf<Schema extends z.ZodType>(request: Request, schema: Schema): Promise<{ data: z.infer<Schema> } | { refusal: Response }> {
  // The body
  let body: unknown;
  // Parsing can fail
  try {
    // As JSON
    body = await request.json();
  } catch {
    // Not JSON
    return { refusal: reply(400, { error: "The request was not valid JSON." }) };
  }
  // Checked
  const parsed = schema.safeParse(body);
  // A bad body
  if (!parsed.success) return { refusal: reply(400, { error: "The request was missing a field or had a value out of range." }) };
  // Good
  return { data: parsed.data };
}

// The minutes used this month for a kind
export async function liveMinutesUsed(store: CounterStore, kind: LiveKind, now: Date): Promise<number> {
  // The month
  const month = liveMonth(now);
  // Reserved less handed back
  return minutesUsed(await store.read(LIVE_KEYS.reserved(kind, month)), await store.read(LIVE_KEYS.returned(kind, month)));
}

// Build the start handler
export function createLiveStartHandler(deps: LiveDeps) {
  // Where log lines go
  const log = deps.log ?? console.error;
  // Handle one request
  return async function start(request: Request): Promise<Response> {
    // The passphrase and the other settings first
    const access = await checkAccess(request, deps);
    // Refused there
    if ("refusal" in access) return access.refusal;
    // Then the body
    const body = await bodyOf(request, StartSchema);
    // A bad body
    if ("refusal" in body) return body.refusal;
    // Which kind and conversation
    const { kind, conversationId } = body.data;
    // The live settings
    const settings = settingsOf(deps);
    // Not usable
    if (settings instanceof Response) return settings;
    // What is missing for this kind
    const missing = missingFor(settings, kind);
    // Not set up: the phone falls back and says so
    if (missing) return reply(503, { error: `${KIND_NAME[kind]} aren’t set up on the server: ${missing}`, notSetUp: true });
    // Turned off by a limit of zero
    if (limitOf(settings, kind) === 0) return reply(429, { error: `${KIND_NAME[kind]} are turned off on the server.`, budget: true, minutesLeft: 0 });
    // Then the rate limit
    const limited = await countCall(deps, PAUSED, `Today’s limit on ${KIND_NAME[kind].toLowerCase()} is reached.`);
    // Over it
    if (limited) return limited;
    // The counter store
    let store: CounterStore;
    // What this conversation already reserved, and the month's minutes used
    let reserved: number;
    // (the month's)
    let used: number;
    // Counting can fail
    try {
      // Made
      store = deps.makeCounterStore();
      // Tokens asked for by this conversation
      const asked = await store.increment(LIVE_KEYS.tokens(kind, conversationId), CONVERSATION_WINDOW);
      // Too many for one conversation
      if (asked > LIVE_TOKENS_PER_CONVERSATION) return reply(409, { error: "This conversation has already started.", capped: true });
      // Reserved before (a second token for the same conversation reuses its reservation)
      reserved = await store.read(LIVE_KEYS.conversation(kind, conversationId));
      // The month's minutes used
      used = await liveMinutesUsed(store, kind, deps.now());
    } catch {
      // Refuse rather than run without a count
      return reply(503, { error: PAUSED });
    }
    // The month's limit
    const limit = limitOf(settings, kind);
    // What it may have: its own reservation again, or a new one within the minutes left
    const grant = reserved > 0 ? { seconds: Math.min(LIVE_SESSION_SECONDS, reserved * 60), minutes: 0 } : grantFor(used, limit, LIVE_SESSION_SECONDS);
    // None left: the phone falls back and says so
    if (!grant) return reply(429, { error: `This month’s ${kind === "a" ? "live" : "phone-call"} minutes are used up.`, budget: true, minutesLeft: 0 });
    // The vendor's token
    let issued: { token: string } | AgentGrant;
    // Asking can fail
    try {
      // Step A: a streaming token whose socket closes at the granted time
      if (kind === "a") issued = { token: await deps.makeStreamingTokens(settings.assemblyAiKey!).token({ expiresInSeconds: LIVE_TOKEN_EXPIRES_SECONDS, maxSessionSeconds: Math.max(60, grant.seconds) }) };
      // Step B: the agent's call
      else issued = await deps.makeAgentTokens(settings.elevenLabsKey!, settings.agentId!).start(settings.connection);
    } catch (error) {
      // Logged, never the key or reply
      log(`Live ${kind} token failed: ${(error as Error).message}`);
      // The phone falls back and says so
      return reply(502, { error: "The live service couldn’t be reached." });
    }
    // Reserve the new minutes, for the month and this conversation
    if (grant.minutes > 0) {
      // Counting can fail
      try {
        // The month's
        await addToCounter(store, LIVE_KEYS.reserved(kind, liveMonth(deps.now())), grant.minutes, MONTH_WINDOW);
        // This conversation's
        await addToCounter(store, LIVE_KEYS.conversation(kind, conversationId), grant.minutes, CONVERSATION_WINDOW);
      } catch {
        // Refuse rather than run without a count (the token is never handed out, so it expires unused)
        return reply(503, { error: PAUSED });
      }
    }
    // Minutes left after this reservation
    const minutesLeft = Math.max(0, limit - used - grant.minutes);
    // The token, how long it may run, and the minutes left
    return reply(200, { kind, ...issued, grantedSeconds: grant.seconds, minutesLeft, minutesPerMonth: limit }, { "cache-control": "no-store" });
  };
}

// Build the end handler: hands back the minutes a conversation did not use, once (free: it never counts against the rate limit, and can only hand back what that conversation reserved)
export function createLiveEndHandler(deps: LiveDeps) {
  // Handle one request
  return async function end(request: Request): Promise<Response> {
    // The passphrase and the other settings first
    const access = await checkAccess(request, deps);
    // Refused there
    if ("refusal" in access) return access.refusal;
    // Then the body
    const body = await bodyOf(request, EndSchema);
    // A bad body
    if ("refusal" in body) return body.refusal;
    // Which kind, conversation and length
    const { kind, conversationId, seconds } = body.data;
    // Counting can fail
    try {
      // The store
      const store = deps.makeCounterStore();
      // Settled once only
      const settled = await store.increment(LIVE_KEYS.settled(kind, conversationId), CONVERSATION_WINDOW);
      // Already settled: nothing more
      if (settled > 1) return reply(200, { refunded: 0 });
      // What it reserved
      const reserved = await store.read(LIVE_KEYS.conversation(kind, conversationId));
      // What it did not use
      const refunded = refundFor(reserved, seconds);
      // Handed back for the month
      await addToCounter(store, LIVE_KEYS.returned(kind, liveMonth(deps.now())), refunded, MONTH_WINDOW);
      // Done
      return reply(200, { refunded });
    } catch {
      // Said
      return reply(503, { error: PAUSED });
    }
  };
}

// The default monthly minutes, for the route's settings reader
export const LIVE_DEFAULTS = { minutesPerMonth: LIVE_MINUTES_PER_MONTH, callMinutesPerMonth: LIVE_B_MINUTES_PER_MONTH } as const;
