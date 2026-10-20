// Asks the conversation route for a persona's next line (decision 84): the words, their audio in the persona's voice (or none, and the phone's own voice says them), and whether it ends the conversation. Any problem hands back nothing

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the stage type
import type { ConversationStage } from "@/core/conversationTurn";
// Load the saved turn type
import type { ConversationTurn } from "@/data/records";

// What asking needs
export interface ConversationClientOptions {
  // The passphrase saved on this device
  passphrase: string;
  // The network (replaced in tests)
  fetchFn?: typeof fetch;
}

// What is asked for: who, where, what is going on, the conversation so far, how far in, and whether the last turn was caught
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
}

// A written line
export interface WrittenLine {
  // The words to show and keep
  text: string;
  // The line spoken in the persona's voice, or null
  audio: Blob | null;
  // Whether it ends the conversation
  goodbye: boolean;
}

// Turn the route's base64 audio back into a sound file
function audioFrom(base64: string): Blob {
  // The bytes
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  // As an MP3
  return new Blob([bytes], { type: "audio/mpeg" });
}

// The next line, or null when there is no passphrase, the route refuses, or it cannot be reached
export async function nextLine(request: LineRequest, { passphrase, fetchFn = fetch }: ConversationClientOptions): Promise<WrittenLine | null> {
  // Without a passphrase the route would refuse
  if (!passphrase) return null;
  // The network can fail
  try {
    // The words of each turn only, never audio
    const response = await fetchFn("/api/conversation", { method: "POST", headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase }, body: JSON.stringify({ ...request, turns: request.turns.map((turn) => ({ who: turn.who, text: turn.text })) }) });
    // Refused or failed
    if (!response.ok) return null;
    // The reply
    const body = (await response.json()) as { text?: unknown; audio?: unknown; goodbye?: unknown };
    // Only words count
    if (typeof body.text !== "string" || !body.text) return null;
    // The line
    return { text: body.text, audio: typeof body.audio === "string" && body.audio ? audioFrom(body.audio) : null, goodbye: body.goodbye === true };
  } catch {
    // Offline or unreadable
    return null;
  }
}
