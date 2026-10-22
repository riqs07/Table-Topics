// The usage counters (decision 122): characters the persona's voice spoke, by model, and the lines Claude wrote, each a month, counted by the conversation route after each paid step and read by GET /api/usage. Counting never stops a reply

// Load the month's name
import { liveMonth } from "@/core/liveBudget";
// Load the counter helpers
import { addToCounter, type CounterStore } from "@/server/rateLimit";
// Load the voice model choice
import type { ConversationVoiceChoice } from "@/server/env";

// Seconds a month's counters last (a little over a month)
const MONTH_WINDOW = 32 * 86_400;

// The usage counters, by name and month
export const USAGE_KEYS = {
  // Characters the persona's voice spoke, by model
  voiceCharacters: (model: ConversationVoiceChoice, month: string) => `voice-chars:${model}:${month}`,
  // Lines Claude wrote for the personas
  lines: (month: string) => `conversation-lines-month:${month}`,
} as const;

// Count characters spoken by a voice model this month; a failure is logged and never stops the reply
export async function countVoiceCharacters(store: CounterStore, model: ConversationVoiceChoice, characters: number, now: Date, log: (line: string) => void): Promise<void> {
  // Counting can fail
  try {
    // Added
    await addToCounter(store, USAGE_KEYS.voiceCharacters(model, liveMonth(now)), Math.round(characters), MONTH_WINDOW);
  } catch (error) {
    // Logged
    log(`Usage count failed: ${(error as Error).message}`);
  }
}

// Count one written line this month; a failure is logged and never stops the reply
export async function countLine(store: CounterStore, now: Date, log: (line: string) => void): Promise<void> {
  // Counting can fail
  try {
    // Added
    await store.increment(USAGE_KEYS.lines(liveMonth(now)), MONTH_WINDOW);
  } catch (error) {
    // Logged
    log(`Usage count failed: ${(error as Error).message}`);
  }
}

