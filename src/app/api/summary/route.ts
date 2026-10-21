// POST /api/summary: real wiring for the weekly summary handler (logic and tests live in server/summaryHandler.ts; decision 90)

// Load the call limits
import { SUMMARY_LIMITS } from "@/config/limits";
// Load the Claude summarizer
import { createClaudeSummarizer } from "@/server/summary";
// Load the settings reader
import { readAccessSecret, readCounterStore, readServerEnv } from "@/server/env";
// Load the handler builder
import { createSummaryHandler } from "@/server/summaryHandler";
// Load the counter stores
import { MemoryCounterStore, UpstashCounterStore } from "@/server/rateLimit";

// Counters for local development only; production requires the shared store (checked in readServerEnv)
const developmentCounters = new MemoryCounterStore();

// Handle POST requests with the real settings, summarizer, and counter store
export const POST = createSummaryHandler({
  // Read the passphrase on its own, so it is checked before the other settings
  readAccessSecret: () => readAccessSecret(process.env),
  // Read settings from the server environment
  readEnv: () => readServerEnv(process.env),
  // Use Claude for the summary
  makeSummarizer: (env) => createClaudeSummarizer(env.anthropicApiKey),
  // Use the shared store when configured, otherwise the development counters
  makeCounterStore: () => {
    // The shared store's settings, if set
    const settings = readCounterStore(process.env);
    // The store, or the local counters
    return settings ? new UpstashCounterStore(settings) : developmentCounters;
  },
  // The configured limits
  limits: SUMMARY_LIMITS,
  // The real clock
  now: () => new Date(),
  // While developing, log a passphrase mismatch with fingerprints to the terminal
  development: process.env.NODE_ENV !== "production",
  // The server terminal
  log: (line) => console.warn(line),
});
