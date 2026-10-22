// The conversation writer (decision 84): asks Claude for a persona's next line, in character, for the situation and the conversation so far

// Load the Anthropic SDK
import Anthropic from "@anthropic-ai/sdk";
// Load the SDK helper that turns a zod schema into a JSON output format
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// Load the model settings
import { CONVERSATION_EFFORT, CONVERSATION_MODEL } from "@/config/models";
// Load the writing instructions, message and reply shape
import { WRITER_STREAM_SYSTEM_PROMPT, WRITER_SYSTEM_PROMPT, WriteSchema, writeMessage, type ConversationStage } from "@/core/conversationTurn";
// Load the streamed writer's event type
import type { WriterEvent } from "@/server/conversationStream";
// Load the persona and situation types
import type { Persona, Scenario } from "@/content/conversations";
// Load the saved turn type
import type { ConversationDifficulty, ConversationTurn } from "@/data/records";

// A line is a few dozen words of JSON
const MAX_TOKENS = 1024;

// What asking can produce
export type WriteResult =
  // The line as written (unchecked) and whether it says goodbye
  | { status: "ok"; line: string; goodbye: boolean }
  // The model declined for safety reasons
  | { status: "declined" };

// Anything that can write the next line (the real writer, or a fake in tests)
export interface ConversationWriter {
  // Write what the persona says next; heard is false when the person's last turn was not caught; difficulty makes it easier or harder (decision 120; normal when left out)
  write(persona: Persona, scenario: Scenario, twist: number, turns: ReadonlyArray<ConversationTurn>, stage: ConversationStage, heard: boolean, difficulty?: ConversationDifficulty): Promise<WriteResult>;
  // The same, streamed as plain text with a goodbye header first, ending with whether it was declined (decision 102); the signal stops it when the phone stops listening
  stream(persona: Persona, scenario: Scenario, twist: number, turns: ReadonlyArray<ConversationTurn>, stage: ConversationStage, heard: boolean, signal?: AbortSignal, difficulty?: ConversationDifficulty): AsyncIterable<WriterEvent>;
}

// Build a writer that asks Claude; the network function can be replaced in tests
export function createClaudeWriter(apiKey: string, fetchFn?: typeof fetch): ConversationWriter {
  // Make the API client (no retries and a short timeout, since the person is waiting mid-conversation)
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 15_000, ...(fetchFn ? { fetch: fetchFn } : {}) });
  // Hand back the writer
  return {
    // Write the next line
    async write(persona, scenario, twist, turns, stage, heard, difficulty) {
      // Ask Claude, requiring the reply to match the line shape
      const response = await client.messages.parse({
        // The fast model
        model: CONVERSATION_MODEL,
        // A short reply
        max_tokens: MAX_TOKENS,
        // No thinking, to keep the pause short
        thinking: { type: "disabled" },
        // The standing instructions, cached between turns
        system: [{ type: "text", text: WRITER_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        // The persona, the situation and the conversation so far
        messages: [{ role: "user", content: writeMessage(persona, scenario, twist, turns, stage, heard, difficulty) }],
        // Low effort and the required JSON shape
        output_config: { effort: CONVERSATION_EFFORT, format: zodOutputFormat(WriteSchema) },
      });
      // A safety decline is reported, not treated as a crash
      if (response.stop_reason === "refusal") return { status: "declined" };
      // A missing or unreadable reply is an error
      if (!response.parsed_output) throw new Error(`The writer returned no usable line (stop reason: ${response.stop_reason}).`);
      // The line, unchecked (the handler tidies it)
      return { status: "ok", line: response.parsed_output.line, goodbye: response.parsed_output.goodbye };
    },
    // Write the next line as a stream of text
    async *stream(persona, scenario, twist, turns, stage, heard, signal, difficulty) {
      // Ask Claude, streaming plain text
      const stream = client.messages.stream({
        // The fast model
        model: CONVERSATION_MODEL,
        // A short reply
        max_tokens: MAX_TOKENS,
        // No thinking, to keep the pause short
        thinking: { type: "disabled" },
        // The standing instructions for the streamed format, cached between turns
        system: [{ type: "text", text: WRITER_STREAM_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        // The persona, the situation and the conversation so far
        messages: [{ role: "user", content: writeMessage(persona, scenario, twist, turns, stage, heard, difficulty) }],
        // Low effort
        output_config: { effort: CONVERSATION_EFFORT },
      }, { signal });
      // Each piece of text as it arrives
      for await (const event of stream) {
        // Only the words
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield { type: "text", text: event.delta.text };
      }
      // How it ended
      const final = await stream.finalMessage();
      // A safety decline is reported, not treated as a crash
      yield { type: "end", declined: final.stop_reason === "refusal" };
    },
  };
}
