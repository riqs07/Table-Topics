// Asks our server to start and settle a live conversation (decisions 119 and 121): a short-lived vendor token and the seconds granted, or why not (the month's minutes used up, not set up on the server, offline, or the service unreachable), so the conversation can fall back and say why in one line

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the live kind
import type { LiveKind } from "@/core/liveBudget";
// Load the longest a live conversation may run, which bounds what is reported
import { LIVE_SESSION_SECONDS } from "@/config/limits";

// A granted live conversation: step A's streaming token, or step B's call
export type LiveGrant =
  // Step A: AssemblyAI's single-use token
  | { kind: "a"; token: string; grantedSeconds: number; minutesLeft: number }
  // Step B over WebRTC: the agent's conversation token
  | { kind: "b"; connection: "webrtc"; conversationToken: string; grantedSeconds: number; minutesLeft: number }
  // Step B over a WebSocket: the agent's signed address
  | { kind: "b"; connection: "websocket"; signedUrl: string; grantedSeconds: number; minutesLeft: number };

// Why a live conversation could not start, each said in one plain line
export type LiveRefusal = "budget" | "not-set-up" | "offline" | "no-coach" | "unavailable";

// What starting hands back
export type LiveStart = { grant: LiveGrant } | { refused: LiveRefusal };

// The one plain line for each reason, as the conversation says it (the fallback named: live step A falls back to ending turns automatically)
export function liveRefusalLine(why: LiveRefusal | "dropped", kind: LiveKind, fallback: string): string {
  // What it is called
  const name = kind === "a" ? "live" : "phone-call";
  // The reason, then what happens instead
  switch (why) {
    // Out of minutes
    case "budget": return `This month’s ${name} minutes are used up, so ${fallback}.`;
    // Not set up
    case "not-set-up": return `${kind === "a" ? "Live conversations aren’t" : "Phone calls aren’t"} set up on the server, so ${fallback}.`;
    // Offline
    case "offline": return `You’re offline, so ${fallback}.`;
    // No passphrase saved
    case "no-coach": return `${kind === "a" ? "Live conversations need" : "Phone calls need"} the coach set up in Settings, so ${fallback}.`;
    // Dropped part-way
    case "dropped": return `The ${name} connection dropped, so ${fallback}.`;
    // Anything else
    default: return `The ${name} connection didn’t work, so ${fallback}.`;
  }
}

// Whether a reply is a usable grant
function isGrant(value: unknown, kind: LiveKind): value is LiveGrant {
  // The shape
  const reply = value as Partial<Record<string, unknown>> | null;
  // Has the seconds
  if (!reply || typeof reply.grantedSeconds !== "number" || typeof reply.minutesLeft !== "number") return false;
  // Step A has a token
  if (kind === "a") return typeof reply.token === "string" && reply.token !== "";
  // Step B has a token or an address
  return (reply.connection === "webrtc" && typeof reply.conversationToken === "string") || (reply.connection === "websocket" && typeof reply.signedUrl === "string");
}

// Ask for a live conversation's token
export async function startLive(kind: LiveKind, conversationId: string, { passphrase, fetchFn = fetch, online = () => (typeof navigator === "undefined" ? true : navigator.onLine) }: { passphrase: string; fetchFn?: typeof fetch; online?: () => boolean }): Promise<LiveStart> {
  // No passphrase: the coach is not set up
  if (!passphrase) return { refused: "no-coach" };
  // Offline: no point asking
  if (!online()) return { refused: "offline" };
  // Asking can fail
  try {
    // Asked
    const response = await fetchFn("/api/live", { method: "POST", headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase }, body: JSON.stringify({ kind, conversationId }) });
    // The reply
    const body: unknown = await response.json().catch(() => null);
    // Out of minutes
    if (response.status === 429 && (body as { budget?: unknown } | null)?.budget === true) return { refused: "budget" };
    // Not set up
    if (response.status === 503 && (body as { notSetUp?: unknown } | null)?.notSetUp === true) return { refused: "not-set-up" };
    // Granted
    if (response.ok && isGrant(body, kind)) return { grant: body };
    // Anything else
    return { refused: "unavailable" };
  } catch {
    // The network failed
    return { refused: online() ? "unavailable" : "offline" };
  }
}

// Hand back a live conversation's unused minutes; kept alive so it still goes when the page is closing, and never fails out loud
export async function endLive(kind: LiveKind, conversationId: string, seconds: number, { passphrase, fetchFn = fetch }: { passphrase: string; fetchFn?: typeof fetch }): Promise<void> {
  // Nothing to settle without a passphrase
  if (!passphrase) return;
  // Sending can fail
  try {
    // Sent
    await fetchFn("/api/live/end", { method: "POST", keepalive: true, headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase }, body: JSON.stringify({ kind, conversationId, seconds: Math.min(LIVE_SESSION_SECONDS + 120, Math.max(0, Math.round(seconds))) }) });
  } catch {
    // The minutes stay reserved; nothing else to do
  }
}
