// The real wiring for the live routes (decisions 119 and 121): settings, vendors and the counter store. Kept apart from the route files so both routes share it

// Load the live limits
import { LIVE_LIMITS } from "@/config/limits";
// Load the settings readers
import { readAccessSecret, readCounterStore, readLiveSettings, readServerEnv } from "@/server/env";
// Load the handler's dependency type and defaults
import { LIVE_DEFAULTS, type LiveDeps } from "@/server/liveHandler";
// Load the vendors
import { createAssemblyAiStreamingTokens, createElevenLabsAgentTokens } from "@/server/liveVendors";
// Load the counter stores
import { MemoryCounterStore, UpstashCounterStore } from "@/server/rateLimit";

// Counters for local development only; production requires the shared store (checked in readServerEnv)
const developmentCounters = new MemoryCounterStore();

// The real settings, vendors and counter store
export const liveDeps: LiveDeps = {
  // Read the passphrase on its own, so it is checked before the other settings
  readAccessSecret: () => readAccessSecret(process.env),
  // Read settings from the server environment
  readEnv: () => readServerEnv(process.env),
  // The live settings, with the default monthly minutes
  liveSettings: () => readLiveSettings(process.env, LIVE_DEFAULTS),
  // AssemblyAI's streaming tokens
  makeStreamingTokens: (key) => createAssemblyAiStreamingTokens(key),
  // ElevenLabs' agent calls
  makeAgentTokens: (key, agentId) => createElevenLabsAgentTokens(key, agentId),
  // Use the shared store when configured, otherwise the development counters
  makeCounterStore: () => {
    // The shared store's settings, if set
    const settings = readCounterStore(process.env);
    // The store, or the local counters
    return settings ? new UpstashCounterStore(settings) : developmentCounters;
  },
  // The live limits
  limits: LIVE_LIMITS,
  // The real clock
  now: () => new Date(),
  // While developing, log a passphrase mismatch with fingerprints to the terminal
  development: process.env.NODE_ENV !== "production",
  // The server terminal
  log: (line) => console.warn(line),
};
