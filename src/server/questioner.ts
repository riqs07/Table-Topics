// The Claude-backed writer of likely audience questions (plan step B3)

// Load the Anthropic SDK
import Anthropic from "@anthropic-ai/sdk";
// Load the helper that turns a zod schema into a JSON output format
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// Load the model and effort the coach uses
import { COACH_EFFORT, COACH_MODEL } from "@/config/models";
// Load the instructions, message builder, schema and checker
import { QUESTIONS_SYSTEM_PROMPT, QuestionsSchema, buildQuestionsMessage, checkQuestions, type QuestionsInput } from "@/core/questionsPrompt";

// Room for the model's thinking plus a short reply (thinking is always on for this model)
const MAX_TOKENS = 16000;

// What a request for questions can come back with
export type QuestionsResult = { status: "ok"; questions: string[] } | { status: "declined" };

// Anything that can write the questions (Claude in the app, fakes in tests)
export interface Questioner {
  // Write three questions for a transcript
  getQuestions(input: QuestionsInput): Promise<QuestionsResult>;
}

// Make a question writer that calls Claude
export function createClaudeQuestioner(apiKey: string, fetchFn?: typeof fetch): Questioner {
  // One client, retrying once, giving up after a minute
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 60_000, ...(fetchFn ? { fetch: fetchFn } : {}) });
  // The writer
  return {
    // Ask Claude for the questions
    async getQuestions(input) {
      // Ask, requiring the reply to match the schema
      const response = await client.messages.parse({
        // The coach's model
        model: COACH_MODEL,
        // Room for thinking and the reply
        max_tokens: MAX_TOKENS,
        // The standing instructions, cached
        system: [{ type: "text", text: QUESTIONS_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        // The context and transcript
        messages: [{ role: "user", content: buildQuestionsMessage(input) }],
        // The coach's effort, and the reply's shape
        output_config: { effort: COACH_EFFORT, format: zodOutputFormat(QuestionsSchema) },
      });
      // A safety decline
      if (response.stop_reason === "refusal") return { status: "declined" };
      // Nothing usable
      if (!response.parsed_output) throw new Error(`The coach returned no usable questions (stop reason: ${response.stop_reason}).`);
      // The tidy questions
      return { status: "ok", questions: checkQuestions(response.parsed_output) };
    },
  };
}
