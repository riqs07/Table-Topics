// The weekly summary route's logic, separate from Next.js so it can be tested with fakes (decision 90)

// Load the request shape, shared with the app
import { SummaryInputSchema } from "@/core/weeklySummary";
// Load the summarizer type
import type { Summarizer } from "@/server/summary";
// Load the settings type
import type { ServerEnv } from "@/server/env";
// Load the shared checks
import { admit, reply, type GuardDeps } from "@/server/guard";

// Everything the handler depends on, so tests can swap in fakes
export interface SummaryDeps extends GuardDeps {
  // Make the summarizer
  makeSummarizer(env: ServerEnv): Summarizer;
}

// Build the handler for POST /api/summary
export function createSummaryHandler(deps: SummaryDeps) {
  // Handle one request
  return async function handle(request: Request): Promise<Response> {
    // Settings, passphrase, body and rate limit, in that order
    const admitted = await admit(request, deps, SummaryInputSchema, "The weekly summary is paused because the usage counter is unavailable.");
    // Refused at one of the checks
    if ("refusal" in admitted) return admitted.refusal;
    // The checked settings and body
    const { env, data } = admitted;
    // Ask the weekly coach
    try {
      // Write the summary
      const result = await deps.makeSummarizer(env).summarize(data);
      // A safety decline gets its own answer
      if (result.status === "declined") return reply(422, { error: "The coach could not write this week's summary." });
      // Send the summary back, with the model that wrote it
      return reply(200, { summary: result.summary, model: result.model });
    } catch (error) {
      // The failure's message (a status and error type, never the key or the data)
      const message = (error as Error).message;
      // Record it in the server log
      (deps.log ?? console.error)(`Weekly summary request failed: ${message}`);
      // The app asks again next time the profile opens
      return reply(502, { error: "The weekly summary is unavailable right now.", ...(deps.development ? { detail: message } : {}) });
    }
  };
}
