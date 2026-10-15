// POST /api/questions: three likely audience questions for a transcript (logic in src/server/questionsHandler.ts)

// Load the shared call limits
import { FEEDBACK_LIMITS } from "@/config/limits";
// Load the Claude-backed question writer
import { createClaudeQuestioner } from "@/server/questioner";
// Load the settings reader
import { readServerEnv } from "@/server/env";
// Load the handler
import { createQuestionsHandler } from "@/server/questionsHandler";
// Load the counter stores
import { MemoryCounterStore, UpstashCounterStore } from "@/server/rateLimit";

// While developing without Upstash, count calls in memory
const developmentCounters = new MemoryCounterStore();

// The route
export const POST = createQuestionsHandler({
  // Read the settings from the environment
  readEnv: () => readServerEnv(process.env),
  // Claude writes the questions
  makeQuestioner: (env) => createClaudeQuestioner(env.anthropicApiKey),
  // The shared counter, so feedback and questions share one limit
  makeCounterStore: (env) => (env.counterStore ? new UpstashCounterStore(env.counterStore) : developmentCounters),
  // The same limits as feedback
  limits: FEEDBACK_LIMITS,
  // The real clock
  now: () => new Date(),
  // Developing locally
  development: process.env.NODE_ENV !== "production",
  // Log to the server terminal
  log: (line) => console.warn(line),
});
