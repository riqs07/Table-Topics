// Asks the server for this month's usage (decision 143): the counts behind Settings' "Usage and costs (estimated)", or null when it could not say

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the counts' shape
import type { UsageCounts } from "@/core/usageCosts";

// Minutes of one kind: used, the month's limit, what is left, and whether the server is set up for it
export interface MinutesUsage {
  // Used
  used: number;
  // The limit
  limit: number;
  // Left
  left: number;
  // Set up on the server
  setUp: boolean;
}

// What the server says
export interface Usage {
  // The month counted, YYYY-MM
  month: string;
  // Live turns
  live: MinutesUsage;
  // Phone calls
  call: MinutesUsage;
  // Characters spoken, by voice model
  voiceCharacters: { turbo: number; v4: number };
  // Lines Claude wrote
  lines: number;
}

// Whether a value is minutes usage
function isMinutes(value: unknown): value is MinutesUsage {
  // The shape
  const minutes = value as Partial<MinutesUsage> | null;
  // Numbers and a yes or no
  return !!minutes && typeof minutes.used === "number" && typeof minutes.limit === "number" && typeof minutes.left === "number" && typeof minutes.setUp === "boolean";
}

// Whether a reply is usage
function isUsage(value: unknown): value is Usage {
  // The shape
  const usage = value as Partial<Usage> | null;
  // Every part
  return !!usage && typeof usage.month === "string" && isMinutes(usage.live) && isMinutes(usage.call) && typeof usage.voiceCharacters?.turbo === "number" && typeof usage.voiceCharacters.v4 === "number" && typeof usage.lines === "number";
}

// Ask for this month's usage; null without a passphrase, on a refusal or a failure
export async function monthUsage(passphrase: string, fetchFn: typeof fetch = fetch): Promise<Usage | null> {
  // Nothing to ask without a passphrase
  if (!passphrase) return null;
  // Asking can fail
  try {
    // Asked
    const response = await fetchFn("/api/usage", { headers: { [PASSPHRASE_HEADER]: passphrase } });
    // Refused
    if (!response.ok) return null;
    // The reply
    const body: unknown = await response.json();
    // Usable, or nothing
    return isUsage(body) ? body : null;
  } catch {
    // Offline or unreadable
    return null;
  }
}

// The counts the estimate needs
export function usageCounts(usage: Usage): UsageCounts {
  // From the reply
  return { liveMinutes: usage.live.used, callMinutes: usage.call.used, turboCharacters: usage.voiceCharacters.turbo, v4Characters: usage.voiceCharacters.v4, lines: usage.lines };
}
