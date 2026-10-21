// Asks the conversation route for a persona's next line (decisions 84 and 102): the words, their audio in the persona's voice (or none, and the phone's own voice says them), and whether it ends the conversation. Streamed when a piece listener is given: each piece arrives with its audio as soon as it is ready, so playing can start before the whole line is written. If the stream breaks before any piece, the line is asked for once more without streaming; after a piece, what arrived stands. A refusal for the month's minutes or the conversation's cap says so; any other problem hands back nothing

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the stage type
import type { ConversationStage } from "@/core/conversationTurn";
// Load the stream's line format
import { STREAM_CONTENT_TYPE, decodeEvent, splitLines } from "@/core/conversationStream";
// Load the saved turn type
import type { ConversationTurn } from "@/data/records";
// Load the size limits the route checks (decision 86)
import { MAX_TURNS, TURN_MAX_CHARS, withinDuration, withinLimit } from "@/core/requestLimits";

// What asking needs
export interface ConversationClientOptions {
  // The passphrase saved on this device
  passphrase: string;
  // The network (replaced in tests)
  fetchFn?: typeof fetch;
  // Cancels the request ("I wasn't finished"; decision 101)
  signal?: AbortSignal;
  // Called with each piece of a streamed line as it arrives; without it, the line comes whole (decision 102)
  onSegment?: (segment: LineSegment) => void;
}

// What is asked for: who, where, what is going on, the conversation so far, how far in, whether the last turn was caught, and which conversation
export interface LineRequest {
  // The persona
  personaId: string;
  // The situation
  scenarioId: string;
  // What is going on for them this time
  twist: number;
  // The conversation so far
  turns: ReadonlyArray<ConversationTurn>;
  // Starting, under way, winding down, or over
  stage: ConversationStage;
  // False when the person's last turn was not caught
  heard: boolean;
  // Which conversation (a random id), for its five-minute cap and the month's minutes (decision 102)
  conversationId: string;
  // Seconds since the conversation started
  elapsedSec: number;
}

// A written line
export interface WrittenLine {
  // The words to show and keep
  text: string;
  // The line spoken in the persona's voice, or null
  audio: Blob | null;
  // Whether it ends the conversation
  goodbye: boolean;
  // True when it came in pieces, already handed to onSegment (so there is nothing more to play)
  streamed?: boolean;
}

// One piece of a streamed line
export interface LineSegment {
  // Its place in the line
  index: number;
  // Its words
  text: string;
  // Its audio, or null
  audio: Blob | null;
}

// The route said no for a reason the page explains: the month's minutes are used up, or the conversation reached its five-minute cap
export interface LineRefusal {
  // Which
  refused: "budget" | "cap";
}

// What asking hands back: a line, a refusal with its reason, or nothing (no passphrase, refused for another reason, or unreachable)
export type LineResult = WrittenLine | LineRefusal | null;

// Whether a result is a refusal with a reason
export function isRefusal(result: LineResult): result is LineRefusal {
  // A refusal has its reason
  return result !== null && "refused" in result;
}

// Turn the route's base64 audio back into a sound file
function audioFrom(base64: string): Blob {
  // The bytes
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  // As an MP3
  return new Blob([bytes], { type: "audio/mpeg" });
}

// The refusal a failed reply means, or null
async function refusalOf(response: Response): Promise<LineRefusal | null> {
  // Its body can be unreadable
  try {
    // The body
    const body = (await response.json()) as { budget?: unknown; capped?: unknown };
    // The month's minutes
    if (response.status === 429 && body.budget === true) return { refused: "budget" };
    // The conversation's cap
    if (response.status === 409 && body.capped === true) return { refused: "cap" };
  } catch {
    // Nothing to read
  }
  // Another refusal
  return null;
}

// Read a whole (not streamed) reply
async function wholeLine(response: Response): Promise<WrittenLine | null> {
  // The reply
  const body = (await response.json()) as { text?: unknown; audio?: unknown; goodbye?: unknown };
  // Only words count
  if (typeof body.text !== "string" || !body.text) return null;
  // The line
  return { text: body.text, audio: typeof body.audio === "string" && body.audio ? audioFrom(body.audio) : null, goodbye: body.goodbye === true };
}

// Read a streamed reply, handing each piece on as it arrives; hands back the line, or what arrived when it broke after a piece, or "broken" when it broke before any
async function streamedLine(response: Response, onSegment: (segment: LineSegment) => void, signal?: AbortSignal): Promise<WrittenLine | "broken"> {
  // The words of each piece so far
  const words: string[] = [];
  // The reader
  const reader = response.body?.getReader();
  // No body
  if (!reader) return "broken";
  // Bytes to text
  const decoder = new TextDecoder();
  // A line still arriving
  let pending = "";
  // Reading can fail part-way
  try {
    // Each chunk
    for (;;) {
      // The next
      const { value, done } = await reader.read();
      // Finished without an end
      if (done) break;
      // The lines in it
      const { lines, rest } = splitLines(pending + decoder.decode(value, { stream: true }));
      // Kept for next time
      pending = rest;
      // Each event
      for (const line of lines) {
        // Read
        const event = decodeEvent(line);
        // A piece: handed on at once
        if (event?.type === "segment") {
          // Its words kept
          words.push(event.text);
          // Handed on
          onSegment({ index: event.index, text: event.text, audio: event.audio ? audioFrom(event.audio) : null });
        }
        // The end: the whole line
        if (event?.type === "done") return { text: event.text, audio: null, goodbye: event.goodbye, streamed: true };
      }
    }
  } catch {
    // Cancelled on purpose: nothing
    if (signal?.aborted) return "broken";
  }
  // Broke before the end: what arrived stands, or nothing did
  return words.length > 0 ? { text: words.join(" "), audio: null, goodbye: false, streamed: true } : "broken";
}

// The next line, a refusal with its reason, or null when there is no passphrase, the route refuses for another reason, or it cannot be reached
export async function nextLine(request: LineRequest, { passphrase, fetchFn = fetch, signal, onSegment }: ConversationClientOptions): Promise<LineResult> {
  // Without a passphrase the route would refuse
  if (!passphrase) return null;
  // The words of each turn only, never audio, each within the route's limits (the latest turns, each cut to size; the full words stay saved on the device)
  const body = { ...request, elapsedSec: withinDuration(request.elapsedSec), turns: request.turns.slice(-MAX_TURNS).map((turn) => ({ who: turn.who, text: withinLimit(turn.text, TURN_MAX_CHARS) })) };
  // Ask once, streamed or whole
  const ask = (stream: boolean) => fetchFn("/api/conversation", { method: "POST", headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase }, body: JSON.stringify({ ...body, stream }), signal });
  // The network can fail
  try {
    // Asked, streamed when someone is listening for pieces
    const response = await ask(onSegment !== undefined);
    // Refused or failed: a reason, or nothing
    if (!response.ok) return await refusalOf(response);
    // Not a stream (no listener, or an older server): the whole line
    if (!onSegment || !(response.headers.get("content-type") ?? "").includes(STREAM_CONTENT_TYPE)) return await wholeLine(response);
    // The stream
    const line = await streamedLine(response, onSegment, signal);
    // Arrived (whole, or as far as it got)
    if (line !== "broken") return line;
    // Cancelled on purpose: nothing
    if (signal?.aborted) return null;
    // Broke before any piece: once more, whole (decision 102's fallback)
    const again = await ask(false);
    // The whole line, or a reason, or nothing
    return again.ok ? await wholeLine(again) : await refusalOf(again);
  } catch {
    // Offline, cancelled or unreadable
    return null;
  }
}

// The month's conversation minutes, for Settings (decision 102)
export interface ConversationMinutes {
  // Used this month
  minutesUsed: number;
  // Allowed a month
  minutesPerMonth: number;
  // Left this month
  minutesLeft: number;
}

// Ask how many conversation minutes are left this month; null without a passphrase or when the server cannot say
export async function conversationMinutes(passphrase: string, fetchFn: typeof fetch = fetch): Promise<ConversationMinutes | null> {
  // Without a passphrase the route would refuse
  if (!passphrase) return null;
  // The network can fail
  try {
    // Asked
    const response = await fetchFn("/api/conversation", { method: "GET", headers: { [PASSPHRASE_HEADER]: passphrase } });
    // Refused or failed
    if (!response.ok) return null;
    // The numbers
    const body = (await response.json()) as Record<string, unknown>;
    // All three must be numbers
    if (typeof body.minutesUsed !== "number" || typeof body.minutesPerMonth !== "number" || typeof body.minutesLeft !== "number") return null;
    // Read
    return { minutesUsed: body.minutesUsed, minutesPerMonth: body.minutesPerMonth, minutesLeft: body.minutesLeft };
  } catch {
    // Offline or unreadable
    return null;
  }
}
