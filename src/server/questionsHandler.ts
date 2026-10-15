// The audience-questions route's logic, separate from Next.js so it can be tested with fakes (plan step B3)

// Load the schema library to check the request body
import { z } from "zod";
// Load the list of session kinds
import { SESSION_MODES } from "@/data/records";
// Load the shared checks
import { admit, reply, type GuardDeps } from "@/server/guard";
// Load the settings type
import type { ServerEnv } from "@/server/env";
// Load the question writer's type
import type { Questioner } from "@/server/questioner";

// Everything the handler depends on
export interface QuestionsDeps extends GuardDeps {
  // Make the question writer
  makeQuestioner(env: ServerEnv): Questioner;
}

// The request body the app sends: the transcript only, never a rehearsal's script
const RequestSchema = z.object({
  // What was said; capped so a runaway transcript cannot run up the bill
  transcript: z.string().max(20_000),
  // The prompt or talk id (the server looks up a prompt's text itself)
  promptId: z.string().max(64).optional(),
  // The kind of session
  mode: z.enum(SESSION_MODES).optional(),
});

// Build the handler for POST /api/questions
export function createQuestionsHandler(deps: QuestionsDeps) {
  // Handle one request
  return async function handle(request: Request): Promise<Response> {
    // Settings, passphrase, body and the shared rate limit, in that order
    const admitted = await admit(request, deps, RequestSchema, "Questions are paused because the usage counter is unavailable.");
    // Refused at one of the checks
    if ("refusal" in admitted) return admitted.refusal;
    // Ask for the questions
    try {
      // Write them
      const result = await deps.makeQuestioner(admitted.env).getQuestions(admitted.data);
      // A safety decline
      if (result.status === "declined") return reply(422, { error: "The coach could not write questions for this one." });
      // Send them back
      return reply(200, { questions: result.questions });
    } catch (error) {
      // The failure's message (a status and error type, never the key or the transcript)
      const message = (error as Error).message;
      // Record it in the server log
      (deps.log ?? console.error)(`Questions request failed: ${message}`);
      // Say so, with the reason while developing
      return reply(502, { error: "Questions are unavailable right now. Try again later, or write your own.", ...(deps.development ? { detail: message } : {}) });
    }
  };
}
