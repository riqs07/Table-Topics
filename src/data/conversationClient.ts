// Asks the conversation route which lines a character says next (decision 83); any problem hands back nothing, and the set script carries on

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the saved turn type
import type { ConversationTurn } from "@/data/records";

// What asking needs
export interface ConversationClientOptions {
  // The passphrase saved on this device
  passphrase: string;
  // The network (replaced in tests)
  fetchFn?: typeof fetch;
}

// The next lines' ids, or null when the coach is not set up, refuses, or cannot be reached
export async function nextLines(characterId: string, turns: ReadonlyArray<ConversationTurn>, wrapUp: boolean, { passphrase, fetchFn = fetch }: ConversationClientOptions): Promise<string[] | null> {
  // Without a passphrase the route would refuse
  if (!passphrase) return null;
  // The network can fail
  try {
    // Your words and their line ids only (the route looks their words up itself)
    const response = await fetchFn("/api/conversation", { method: "POST", headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase }, body: JSON.stringify({ characterId, wrapUp, turns: turns.map((turn) => (turn.who === "you" ? { who: "you", text: turn.text } : { who: "them", lineId: turn.lineId })) }) });
    // Refused or failed
    if (!response.ok) return null;
    // The ids
    const body = (await response.json()) as { lineIds?: unknown };
    // Only a list of text counts
    return Array.isArray(body.lineIds) && body.lineIds.every((id) => typeof id === "string") ? (body.lineIds as string[]) : null;
  } catch {
    // Offline or unreadable
    return null;
  }
}
