// GET /api/usage (decision 122): this month's counts for Settings' usage section, read from the server's own counters: live and phone-call minutes used, with their limits and what is left; characters the persona's voice spoke, by model; and the lines Claude wrote. Free: the passphrase is checked, nothing is counted (the counting is in usageCounters.ts)

// Load the live budget's rules and counter names
import { liveMonth } from "@/core/liveBudget";
// Load the shared checks
import { checkAccess, reply, type GuardDeps } from "@/server/guard";
// Load the live minutes reader
import { liveMinutesUsed } from "@/server/liveHandler";
// Load the settings types
import type { ConversationSettings, LiveSettings } from "@/server/env";
// Load the usage counters' names
import { USAGE_KEYS } from "@/server/usageCounters";
// Load the conversation minutes counter name
import { monthKey } from "@/server/conversationHandler";

// What the usage route needs beyond the shared checks
export interface UsageDeps extends GuardDeps {
  // The live settings (the monthly minutes)
  liveSettings(): LiveSettings;
  // The conversation settings (the month's conversation minutes)
  conversationSettings(): ConversationSettings;
}

// Build the handler
export function createUsageHandler(deps: UsageDeps) {
  // Handle one request
  return async function usage(request: Request): Promise<Response> {
    // The passphrase and the settings
    const access = await checkAccess(request, deps);
    // Refused
    if ("refusal" in access) return access.refusal;
    // The limits
    let live: LiveSettings;
    // (conversations)
    let conversation: ConversationSettings;
    // Reading can fail on a value that cannot be used
    try {
      // Read
      live = deps.liveSettings();
      // (conversations)
      conversation = deps.conversationSettings();
    } catch (error) {
      // Said by name
      return reply(500, { error: `The server is not set up: ${(error as Error).message}` });
    }
    // The month
    const now = deps.now();
    // (as YYYY-MM)
    const month = liveMonth(now);
    // Reading can fail
    try {
      // The store
      const store = deps.makeCounterStore();
      // Every count, at once
      const [liveUsed, callUsed, turbo, v4, lines, conversationUsed] = await Promise.all([liveMinutesUsed(store, "a", now), liveMinutesUsed(store, "b", now), store.read(USAGE_KEYS.voiceCharacters("turbo", month)), store.read(USAGE_KEYS.voiceCharacters("v4", month)), store.read(USAGE_KEYS.lines(month)), store.read(monthKey(now))]);
      // Used, limit and left for each kind of minutes; the characters and lines
      return reply(200, {
        // The month counted
        month,
        // Live turns
        live: { used: liveUsed, limit: live.minutesPerMonth, left: Math.max(0, live.minutesPerMonth - liveUsed), setUp: live.assemblyAiKey !== null },
        // Phone calls
        call: { used: callUsed, limit: live.callMinutesPerMonth, left: Math.max(0, live.callMinutesPerMonth - callUsed), setUp: live.elevenLabsKey !== null && live.agentId !== null },
        // The voice, by model
        voiceCharacters: { turbo, v4 },
        // Claude's lines
        lines,
        // Conversation minutes (decision 102)
        conversationMinutes: { used: conversationUsed, limit: conversation.minutesPerMonth },
      }, { "cache-control": "no-store" });
    } catch {
      // Said
      return reply(503, { error: "Usage can't be read because the usage counter is unavailable." });
    }
  };
}
