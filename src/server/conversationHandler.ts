// POST /api/conversation (decision 84): checks the passphrase, the body and the limits, has Claude write the persona's next line for the situation and the conversation so far, then has ElevenLabs speak it in the persona's voice, both in this one step, so the browser never sends words to be spoken

// Load the schema library, to check the request
import { z } from "zod";
// Load the personas and situations
import { findPersona, findScenario } from "@/content/conversations";
// Load the line tidier
import { cleanLine } from "@/core/conversationTurn";
// Load the shared checks
import { admit, reply, type GuardDeps } from "@/server/guard";
// Load the settings type
import type { ServerEnv } from "@/server/env";
// Load the writer type
import type { ConversationWriter } from "@/server/conversationWriter";
// Load the voice type
import type { PersonaVoice } from "@/server/voice";
// Load the saved turn type
import type { ConversationTurn } from "@/data/records";

// What the route needs beyond the shared checks
export interface ConversationDeps extends GuardDeps {
  // Make the writer
  makeWriter(env: ServerEnv): ConversationWriter;
  // Make the voice, or null when ElevenLabs is not set up (the phone's own voice then says the line)
  makeVoice(): PersonaVoice | null;
}

// One turn as the browser sends it
const TurnSchema = z.object({
  // Who spoke
  who: z.enum(["you", "them"]),
  // What was said
  text: z.string().max(1_000),
});

// The request: who, where, what is going on, the conversation so far, how far in, and whether the last turn was caught
const RequestSchema = z.object({
  // The persona
  personaId: z.string().max(16),
  // The situation
  scenarioId: z.string().max(16),
  // What is going on for them this time
  twist: z.number().int().min(0).max(9),
  // The conversation so far
  turns: z.array(TurnSchema).max(60),
  // Starting, under way, winding down, or over
  stage: z.enum(["open", "talk", "wrap", "end"]),
  // False when the person's last turn was not caught
  heard: z.boolean(),
});

// Build the handler
export function createConversationHandler(deps: ConversationDeps) {
  // Handle one request
  return async function handle(request: Request): Promise<Response> {
    // Settings, passphrase, body and rate limit, in that order
    const admitted = await admit(request, deps, RequestSchema, "Conversations are paused because the usage counter is unavailable.");
    // Refused at one of the checks
    if ("refusal" in admitted) return admitted.refusal;
    // The settings and the checked body
    const { env, data } = admitted;
    // The persona and the situation
    const persona = findPersona(data.personaId);
    // The situation
    const scenario = findScenario(data.scenarioId);
    // Unknown
    if (!persona || !scenario) return reply(404, { error: "There is no such person or situation." });
    // A twist the situation does not have
    if (data.twist >= scenario.twists.length) return reply(400, { error: "There is no such twist." });
    // The turns, in the saved shape
    const turns: ConversationTurn[] = data.turns.map((turn) => ({ who: turn.who, text: turn.text, seconds: 0 }));
    // Write the line
    let written: Awaited<ReturnType<ConversationWriter["write"]>>;
    // Asking can fail
    try {
      // Ask the writer
      written = await deps.makeWriter(env).write(persona, scenario, data.twist, turns, data.stage, data.heard);
    } catch (error) {
      // Log the reason, never the conversation
      (deps.log ?? console.error)(`Conversation line failed: ${(error as Error).message}`);
      // The app ends the conversation kindly
      return reply(502, { error: "The conversation could not continue right now." });
    }
    // A decline ends it
    if (written.status === "declined") return reply(422, { error: "The conversation could not continue." });
    // Tidied
    const { spoken, shown } = cleanLine(written.line);
    // Nothing left to say
    if (!shown) return reply(502, { error: "The conversation could not continue right now." });
    // Say it in their voice, when ElevenLabs is set up
    let audio: string | null = null;
    // The voice
    const voice = deps.makeVoice();
    // Speaking can fail; the phone's own voice then says it
    if (voice) {
      // Try
      try {
        // The audio, as text for the reply
        audio = Buffer.from(await voice.speak(spoken, persona.voiceId)).toString("base64");
      } catch (error) {
        // Log the reason
        (deps.log ?? console.error)(`Conversation voice failed: ${(error as Error).message}`);
      }
    }
    // A goodbye only when winding down (always when time is up), so the conversation never ends early
    const goodbye = data.stage === "end" || (data.stage === "wrap" && written.goodbye);
    // The line, its audio, and whether it ends the conversation
    return reply(200, { text: shown, audio, goodbye });
  };
}
