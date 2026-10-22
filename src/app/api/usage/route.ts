// GET /api/usage: this month's counts for Settings' usage section (logic and tests live in server/usageHandler.ts; decision 143)

// Load the default monthly conversation minutes
import { CONVERSATION_MINUTES_PER_MONTH } from "@/config/limits";
// Load the settings reader
import { readConversationSettings } from "@/server/env";
// Load the live routes' wiring (the passphrase, settings, store and clock are the same)
import { liveDeps } from "@/server/liveDeps";
// Load the handler builder
import { createUsageHandler } from "@/server/usageHandler";

// Handle GET requests: the month's usage
export const GET = createUsageHandler({ ...liveDeps, conversationSettings: () => readConversationSettings(process.env, { minutesPerMonth: CONVERSATION_MINUTES_PER_MONTH }) });
