// POST and GET /api/analyse: real wiring for the deeper-analysis handler (logic and tests live in server/analyseHandler.ts; decision 91)

// Load the call limits
import { ANALYSE_LIMITS } from "@/config/limits";
// Load the settings readers
import { readAccessSecret, readAnalysisSettings, readCounterStore, readServerEnv } from "@/server/env";
// Load the handler builder
import { createAnalyseHandler } from "@/server/analyseHandler";
// Load the AssemblyAI client
import { createAssemblyAiTranscriber } from "@/server/transcriber";
// Load the voice worker client
import { createHttpVoiceWorker } from "@/server/voiceWorker";
// Load the counter stores
import { MemoryCounterStore, UpstashCounterStore } from "@/server/rateLimit";

// Transcription and voice analysis can take a few minutes for a long take (Vercel allows up to five)
export const maxDuration = 300;

// Counters for local development only; production requires the shared store (checked in readServerEnv)
const developmentCounters = new MemoryCounterStore();

// The handlers with the real settings, services, and counter store
const handlers = createAnalyseHandler({
  // Read the passphrase on its own, so it is checked before the other settings
  readAccessSecret: () => readAccessSecret(process.env),
  // Read settings from the server environment
  readEnv: () => readServerEnv(process.env),
  // Read which deeper-analysis services are set up
  readAnalysisSettings: () => readAnalysisSettings(process.env),
  // AssemblyAI for the transcript
  makeTranscriber: (apiKey) => createAssemblyAiTranscriber(apiKey),
  // Our own worker for the voice
  makeVoiceWorker: (worker) => createHttpVoiceWorker(worker.url, worker.secret),
  // Use the shared store when configured, otherwise the development counters
  makeCounterStore: () => {
    // The shared store's settings, if set
    const settings = readCounterStore(process.env);
    // The store, or the local counters
    return settings ? new UpstashCounterStore(settings) : developmentCounters;
  },
  // The configured limits
  limits: ANALYSE_LIMITS,
  // The real clock
  now: () => new Date(),
  // While developing, log a passphrase mismatch with fingerprints to the terminal
  development: process.env.NODE_ENV !== "production",
  // The server terminal
  log: (line) => console.warn(line),
});

// Analyse one take
export const POST = handlers.POST;

// Say which parts are set up
export const GET = handlers.GET;
