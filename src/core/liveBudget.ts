// The monthly budget for live conversations (decisions 119 and 121), as pure rules the server follows: minutes are reserved when a live conversation starts (as many as it may run, never more than are left) and the unused ones are handed back when it ends, so a socket left open can never cost more than was reserved

// Which live kind: A is our own loop on AssemblyAI streaming, B is the ElevenLabs agent's phone call
export type LiveKind = "a" | "b";

// The month a count belongs to (UTC), as YYYY-MM
export function liveMonth(now: Date): string {
  // Year and month
  return now.toISOString().slice(0, 7);
}

// The counters behind the budget, by name: what each month reserved and handed back, and what each conversation reserved, settled and asked for
export const LIVE_KEYS = {
  // Minutes reserved this month
  reserved: (kind: LiveKind, month: string) => `live-${kind}-reserved:${month}`,
  // Minutes handed back this month
  returned: (kind: LiveKind, month: string) => `live-${kind}-returned:${month}`,
  // Minutes one conversation reserved
  conversation: (kind: LiveKind, id: string) => `live-${kind}-conversation:${id}`,
  // Whether one conversation was settled (more than 0 once it was)
  settled: (kind: LiveKind, id: string) => `live-${kind}-settled:${id}`,
  // How many tokens one conversation asked for
  tokens: (kind: LiveKind, id: string) => `live-${kind}-tokens:${id}`,
} as const;

// Minutes used this month: reserved less what was handed back, never below zero
export function minutesUsed(reserved: number, returned: number): number {
  // Never negative
  return Math.max(0, reserved - returned);
}

// What a new live conversation may have: its seconds (the cap, or fewer when fewer minutes are left) and the whole minutes to reserve; null when not a whole minute is left
export function grantFor(used: number, limit: number, capSeconds: number): { seconds: number; minutes: number } | null {
  // Whole minutes left
  const left = Math.floor(limit - used);
  // Not a minute left
  if (left < 1) return null;
  // The cap, or the minutes left
  const seconds = Math.min(capSeconds, left * 60);
  // Reserved in whole minutes
  return { seconds, minutes: Math.ceil(seconds / 60) };
}

// Minutes to hand back when a conversation ends: what was reserved less the minutes it ran (each started minute counts), never below zero or above what was reserved
export function refundFor(reservedMinutes: number, usedSeconds: number): number {
  // Minutes it ran, each started one counted
  const ran = Math.ceil(Math.max(0, usedSeconds) / 60);
  // The rest, within what was reserved
  return Math.min(Math.max(0, reservedMinutes), Math.max(0, reservedMinutes - ran));
}
