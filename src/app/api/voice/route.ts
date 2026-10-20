// The question voice route: speaks the app's own small-talk questions with ElevenLabs

// Load the voice limits
import { VOICE_LIMITS } from "@/config/limits";
// Load the settings readers
import { readAccessSecret, readCounterStore, readServerEnv, readVoiceSettings } from "@/server/env";
// Load the ElevenLabs voice
import { createElevenLabsVoice } from "@/server/voice";
// Load the handler
import { createVoiceHandler } from "@/server/voiceHandler";
// Load the rate-limit counters
import { MemoryCounterStore, UpstashCounterStore } from "@/server/rateLimit";

// Counters for local development, when there is no shared store
const developmentCounters = new MemoryCounterStore();

// Handle POST requests
export const POST = createVoiceHandler({
  // Read the passphrase on its own, so it is checked before the other settings
  readAccessSecret: () => readAccessSecret(process.env),
  // The shared server settings (the passphrase and the counter store)
  readEnv: () => readServerEnv(process.env),
  // The voice settings
  readVoiceSettings: () => readVoiceSettings(process.env),
  // The ElevenLabs voice
  makeVoice: (settings) => createElevenLabsVoice(settings),
  // The shared counter store, or local counters in development
  makeCounterStore: () => {
    // The shared store's settings, if set
    const settings = readCounterStore(process.env);
    // The store, or the local counters
    return settings ? new UpstashCounterStore(settings) : developmentCounters;
  },
  // The voice's own limits
  limits: VOICE_LIMITS,
  // The clock
  now: () => new Date(),
  // Extra detail while developing
  development: process.env.NODE_ENV !== "production",
  // Where to note problems
  log: (line) => console.warn(line),
});
