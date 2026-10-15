// POST /api/feedback: real wiring for the feedback handler (logic and tests live in server/feedbackHandler.ts)

// Load the call limits
import { FEEDBACK_LIMITS } from "@/config/limits";
// Load the Claude coach
import { createClaudeCoach } from "@/server/coach";
// Load the settings reader
import { readServerEnv } from "@/server/env";
// Load the handler builder
import { createFeedbackHandler } from "@/server/feedbackHandler";
// Load the counter stores
import { MemoryCounterStore, UpstashCounterStore } from "@/server/rateLimit";

// Counters for local development only; production requires the shared store (checked in readServerEnv)
const developmentCounters = new MemoryCounterStore();

// Handle POST requests with the real settings, coach, and counter store
export const POST = createFeedbackHandler({
  // Read settings from the server environment
  readEnv: () => readServerEnv(process.env),
  // Use Claude for feedback
  makeCoach: (env) => createClaudeCoach(env.anthropicApiKey),
  // Use the shared store when configured, otherwise the development counters
  makeCounterStore: (env) => (env.counterStore ? new UpstashCounterStore(env.counterStore) : developmentCounters),
  // The configured limits
  limits: FEEDBACK_LIMITS,
  // The real clock
  now: () => new Date(),
  // While developing, log a passphrase mismatch with fingerprints to the terminal
  development: process.env.NODE_ENV !== "production",
  // The server terminal
  log: (line) => console.warn(line),
});
