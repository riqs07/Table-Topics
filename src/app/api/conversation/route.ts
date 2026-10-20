// POST /api/conversation: real wiring for the conversation handler (logic and tests live in server/conversationHandler.ts; decisions 83 and 84)

// Load the call limits
import { CONVERSATION_LIMITS } from "@/config/limits";
// Load the Claude writer
import { createClaudeWriter } from "@/server/conversationWriter";
// Load the settings readers
import { readAccessSecret, readCounterStore, readElevenLabsKey, readServerEnv } from "@/server/env";
// Load the handler builder
import { createConversationHandler } from "@/server/conversationHandler";
// Load the counter stores
import { MemoryCounterStore, UpstashCounterStore } from "@/server/rateLimit";
// Load the ElevenLabs voice for conversation lines
import { createPersonaVoice } from "@/server/voice";

// Counters for local development only; production requires the shared store (checked in readServerEnv)
const developmentCounters = new MemoryCounterStore();

// Handle POST requests with the real settings, writer, voice, and counter store
export const POST = createConversationHandler({
  // Read the passphrase on its own, so it is checked before the other settings
  readAccessSecret: () => readAccessSecret(process.env),
  // Read settings from the server environment
  readEnv: () => readServerEnv(process.env),
  // Use Claude to write lines
  makeWriter: (env) => createClaudeWriter(env.anthropicApiKey),
  // Use ElevenLabs to speak them, when its key is set
  makeVoice: () => {
    // The key, if set
    const key = readElevenLabsKey(process.env);
    // The voice, or none
    return key ? createPersonaVoice(key) : null;
  },
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
});
