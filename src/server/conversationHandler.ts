// The conversation route's logic (decision 83): a character and the turns so far in, the next lines out, chosen by the partner and checked against the character's own lines

// Load the schema library to check the request body
import { z } from "zod";
// Load the characters and their lines, looked up on the server
import { findCharacter, findLine } from "@/content/conversations";
// Load the pick checks and the script that stands in
import { checkPick, scriptedNext } from "@/core/conversationTurn";
// Load the shared checks
import { admit, reply, type GuardDeps } from "@/server/guard";
// Load the settings type
import type { ServerEnv } from "@/server/env";
// Load the partner type
import type { ConversationPartner } from "@/server/conversationPartner";
// Load the saved turn type
import type { ConversationTurn } from "@/data/records";

// What the route needs
export interface ConversationDeps extends GuardDeps {
  // Make the partner
  makePartner(env: ServerEnv): ConversationPartner;
}

// One turn as sent: your words, or the id of their line (their words are looked up here, never taken from the browser)
const TurnSchema = z.object({
  // Who spoke
  who: z.enum(["you", "them"]),
  // Your words, capped so a runaway transcript cannot run up the bill
  text: z.string().max(1_000).optional(),
  // Their line's id
  lineId: z.string().max(16).optional(),
});

// The request
const RequestSchema = z.object({
  // The character's id
  characterId: z.string().max(16),
  // The turns so far: a three-minute conversation has a few dozen at most
  turns: z.array(TurnSchema).max(60),
  // Whether time is nearly up
  wrapUp: z.boolean(),
});

// Build the handler for POST /api/conversation
export function createConversationHandler(deps: ConversationDeps) {
  // Handle one request
  return async function handle(request: Request): Promise<Response> {
    // Settings, passphrase, body and rate limit, in that order
    const admitted = await admit(request, deps, RequestSchema, "The conversation coach is paused because the usage counter is unavailable.");
    // Refused at one of the checks
    if ("refusal" in admitted) return admitted.refusal;
    // The checked settings and body
    const { env, data } = admitted;
    // The character, from the app's own list
    const character = findCharacter(data.characterId);
    // Unknown: nothing to choose from
    if (!character) return reply(404, { error: "There is no such character." });
    // The turns, with their words taken from the character's own lines
    const turns: ConversationTurn[] = data.turns.map((turn) => (turn.who === "them" ? { who: "them", text: findLine(character, turn.lineId ?? "")?.text ?? "", seconds: 0, ...(turn.lineId ? { lineId: turn.lineId } : {}) } : { who: "you", text: turn.text ?? "", seconds: 0 }));
    // Ask the partner
    try {
      // The pick
      const result = await deps.makePartner(env).pick(character, turns, data.wrapUp);
      // A decline: the set script instead
      if (result.status === "declined") return reply(200, { lineIds: scriptedNext(character, turns, data.wrapUp), scripted: true });
      // The pick, checked against the character's lines
      return reply(200, { lineIds: checkPick(character, result.lineIds, turns, data.wrapUp) });
    } catch (error) {
      // Note why, for the server log (a status and error type, never the conversation)
      (deps.log ?? console.error)(`Conversation pick failed: ${(error as Error).message}`);
      // The app carries on with the set script
      return reply(502, { error: "The conversation coach is unavailable right now." });
    }
  };
}
