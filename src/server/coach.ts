// The AI coach: sends one session to Claude and returns three-part feedback

// Load the Anthropic SDK
import Anthropic from "@anthropic-ai/sdk";
// Load the SDK helper that turns a zod schema into a JSON output format
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// Load the model settings
import { COACH_EFFORT, COACH_MODEL } from "@/config/models";
// Load the coach instructions, message builder, schema, and checker
import { COACH_SYSTEM_PROMPT, FeedbackSchema, buildCoachMessage, checkFeedback, type CoachInput } from "@/core/coachPrompt";
// Load the feedback record type
import type { Feedback } from "@/data/records";

// Room for the model's thinking plus a short JSON reply
const MAX_TOKENS = 4000;

// What asking the coach can produce
export type CoachResult =
  // Feedback came back, with token counts for cost tracking
  | { status: "ok"; feedback: Feedback; usage: { inputTokens: number; outputTokens: number } }
  // The model declined for safety reasons
  | { status: "declined" };

// Anything that can give feedback (the real coach, or a fake in tests)
export interface Coach {
  // Get feedback for one session
  getFeedback(input: CoachInput): Promise<CoachResult>;
}

// Build a coach that calls Claude; the network function can be replaced in tests
export function createClaudeCoach(apiKey: string, fetchFn?: typeof fetch): Coach {
  // Make the API client (one retry on temporary failures, a 60-second timeout)
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 60_000, ...(fetchFn ? { fetch: fetchFn } : {}) });
  // Hand back the coach
  return {
    // Get feedback for one session
    async getFeedback(input) {
      // Ask Claude, requiring the reply to match the feedback schema
      const response = await client.messages.parse({
        // The configured coach model
        model: COACH_MODEL,
        // Room for thinking and the reply
        max_tokens: MAX_TOKENS,
        // The standing instructions, cached between sessions
        system: [{ type: "text", text: COACH_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        // The session details and transcript
        messages: [{ role: "user", content: buildCoachMessage(input) }],
        // Thinking depth and the required JSON shape
        output_config: { effort: COACH_EFFORT, format: zodOutputFormat(FeedbackSchema) },
      });
      // A safety decline is reported, not treated as a crash
      if (response.stop_reason === "refusal") return { status: "declined" };
      // A missing or unreadable reply is an error
      if (!response.parsed_output) throw new Error(`The coach returned no usable feedback (stop reason: ${response.stop_reason}).`);
      // Hand back the checked feedback and token counts
      return {
        // Mark success
        status: "ok",
        // Trim and check the three parts
        feedback: checkFeedback(response.parsed_output),
        // Token counts, for cost tracking
        usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
      };
    },
  };
}
