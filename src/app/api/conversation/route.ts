// POST /api/conversation: real wiring for the conversation handler (logic and tests live in server/conversationHandler.ts; decision 83)

// Load the call limits
import { CONVERSATION_LIMITS } from "@/config/limits";
// Load the Claude partner
import { createClaudePartner } from "@/server/conversationPartner";
// Load the settings reader
import { readServerEnv } from "@/server/env";
// Load the handler builder
import { createConversationHandler } from "@/server/conversationHandler";
// Load the counter stores
import { MemoryCounterStore, UpstashCounterStore } from "@/server/rateLimit";

// Counters for local development only; production requires the shared store (checked in readServerEnv)
const developmentCounters = new MemoryCounterStore();

// Handle POST requests with the real settings, partner, and counter store
export const POST = createConversationHandler({
  // Read settings from the server environment
  readEnv: () => readServerEnv(process.env),
  // Use Claude to choose lines
  makePartner: (env) => createClaudePartner(env.anthropicApiKey),
  // Use the shared store when configured, otherwise the development counters
  makeCounterStore: (env) => (env.counterStore ? new UpstashCounterStore(env.counterStore) : developmentCounters),
  // The configured limits
  limits: CONVERSATION_LIMITS,
  // The real clock
  now: () => new Date(),
  // While developing, log a passphrase mismatch with fingerprints to the terminal
  development: process.env.NODE_ENV !== "production",
  // The server terminal
  log: (line) => console.warn(line),
});
