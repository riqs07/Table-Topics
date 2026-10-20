// The conversation partner (decision 83): asks Claude which of a character's recorded lines comes next

// Load the Anthropic SDK
import Anthropic from "@anthropic-ai/sdk";
// Load the SDK helper that turns a zod schema into a JSON output format
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// Load the model settings
import { CONVERSATION_EFFORT, CONVERSATION_MODEL } from "@/config/models";
// Load the picking instructions, message and reply shape
import { PICKER_SYSTEM_PROMPT, PickSchema, pickMessage } from "@/core/conversationTurn";
// Load the character type
import type { ConversationCharacter } from "@/content/conversations";
// Load the saved turn type
import type { ConversationTurn } from "@/data/records";

// A pick is a few dozen tokens of JSON
const MAX_TOKENS = 1024;

// What asking can produce
export type PickResult =
  // The line ids the model chose, unchecked
  | { status: "ok"; lineIds: string[] }
  // The model declined for safety reasons
  | { status: "declined" };

// Anything that can choose the next lines (the real partner, or a fake in tests)
export interface ConversationPartner {
  // Choose what the character says next
  pick(character: ConversationCharacter, turns: ReadonlyArray<ConversationTurn>, wrapUp: boolean): Promise<PickResult>;
}

// Build a partner that asks Claude; the network function can be replaced in tests
export function createClaudePartner(apiKey: string, fetchFn?: typeof fetch): ConversationPartner {
  // Make the API client (no retries and a short timeout, since the person is waiting mid-conversation)
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 15_000, ...(fetchFn ? { fetch: fetchFn } : {}) });
  // Hand back the partner
  return {
    // Choose the next lines
    async pick(character, turns, wrapUp) {
      // Ask Claude, requiring the reply to match the pick shape
      const response = await client.messages.parse({
        // The fast model
        model: CONVERSATION_MODEL,
        // A short reply
        max_tokens: MAX_TOKENS,
        // No thinking, to keep the pause short
        thinking: { type: "disabled" },
        // The standing instructions, cached between turns
        system: [{ type: "text", text: PICKER_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        // The character, their lines and the conversation so far
        messages: [{ role: "user", content: pickMessage(character, turns, wrapUp) }],
        // Low effort and the required JSON shape
        output_config: { effort: CONVERSATION_EFFORT, format: zodOutputFormat(PickSchema) },
      });
      // A safety decline is reported, not treated as a crash
      if (response.stop_reason === "refusal") return { status: "declined" };
      // A missing or unreadable reply is an error
      if (!response.parsed_output) throw new Error(`The partner returned no usable pick (stop reason: ${response.stop_reason}).`);
      // The ids, unchecked (the handler checks them against the bank)
      return { status: "ok", lineIds: [response.parsed_output.first, ...(response.parsed_output.second ? [response.parsed_output.second] : [])] };
    },
  };
}
