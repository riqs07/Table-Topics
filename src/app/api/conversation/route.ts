// POST /api/conversation and GET /api/conversation: real wiring for the conversation handler and the month's minutes (logic and tests live in server/conversationHandler.ts; decisions 83, 84 and 102)

// Load the call limits and the default monthly minutes
import { CONVERSATION_LIMITS, CONVERSATION_MINUTES_PER_MONTH } from "@/config/limits";
// Load the Claude writer
import { createClaudeWriter } from "@/server/conversationWriter";
// Load the settings readers
import { readAccessSecret, readConversationSettings, readCounterStore, readElevenLabsKey, readServerEnv } from "@/server/env";
// Load the handler builders
import { createConversationHandler, createConversationMinutesHandler, type ConversationDeps } from "@/server/conversationHandler";
// Load the counter stores
import { MemoryCounterStore, UpstashCounterStore } from "@/server/rateLimit";
// Load the ElevenLabs voice for conversation lines
import { createPersonaVoice } from "@/server/voice";

// Counters for local development only; production requires the shared store (checked in readServerEnv)
const developmentCounters = new MemoryCounterStore();

// The real settings, writer, voice, and counter store
const deps: ConversationDeps = {
  // Read the passphrase on its own, so it is checked before the other settings
  readAccessSecret: () => readAccessSecret(process.env),
  // Read settings from the server environment
  readEnv: () => readServerEnv(process.env),
  // Use Claude to write lines
  makeWriter: (env) => createClaudeWriter(env.anthropicApiKey),
  // Use ElevenLabs to speak them with the chosen model, when its key is set
  makeVoice: (model) => {
    // The key, if set
    const key = readElevenLabsKey(process.env);
    // The voice, or none
    return key ? createPersonaVoice(key, fetch, model) : null;
  },
  // The month's minutes and the voice model, from the server environment (decision 102)
  conversationSettings: () => readConversationSettings(process.env, { minutesPerMonth: CONVERSATION_MINUTES_PER_MONTH }),
  // Use the shared store when configured, otherwise the development counters
  makeCounterStore: () => {
    // The shared store's settings, if set
    const settings = readCounterStore(process.env);
    // The store, or the local counters
    return settings ? new UpstashCounterStore(settings) : developmentCounters;
  },
  // The configured limits
  limits: CONVERSATION_LIMITS,
  // The real clock
  now: () => new Date(),
  // While developing, log a passphrase mismatch with fingerprints to the terminal
  development: process.env.NODE_ENV !== "production",
  // The server terminal
  log: (line) => console.warn(line),
};

// Handle POST requests: the persona's next line, streamed when asked
export const POST = createConversationHandler(deps);

// Handle GET requests: the month's conversation minutes, for Settings
export const GET = createConversationMinutesHandler(deps);
