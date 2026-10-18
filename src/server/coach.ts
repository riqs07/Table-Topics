// The AI coach: sends one session to Claude and returns three-part feedback

// Load the Anthropic SDK
import Anthropic from "@anthropic-ai/sdk";
// Load the SDK helper that turns a zod schema into a JSON output format
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// Load the model settings
import { COACH_EFFORT, COACH_MODEL } from "@/config/models";
// Load the coach instructions, message builder, schema, and checker
import { COACH_SYSTEM_PROMPT, CONNECTION_SYSTEM_PROMPT, ConnectionFeedbackSchema, FeedbackSchema, SMALL_TALK_SYSTEM_PROMPT, SmallTalkFeedbackSchema, buildCoachMessage, buildConnectionMessage, buildSmallTalkMessage, checkConnectionFeedback, checkFeedback, checkSmallTalkFeedback, type CoachInput } from "@/core/coachPrompt";
// Load the small-talk unit lookup
import { unitOf } from "@/content/smallTalk";
// Load the feedback record type
import type { Feedback } from "@/data/records";

// Room for the model's thinking (always on for the coach model) plus a short JSON reply; too small a cap cuts the reply off and no feedback arrives
const MAX_TOKENS = 16000;

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
      // A follow-up question or a reply to a story goes to the conversation coach, with its own instructions and reply shape
      if (input.mode === "smalltalk" && unitOf(input.promptId ?? "") !== "answering") {
        // Ask Claude, requiring the reply to match the conversation schema
        const response = await client.messages.parse({
          // The configured coach model
          model: COACH_MODEL,
          // Room for thinking and the reply
          max_tokens: MAX_TOKENS,
          // The conversation instructions, cached between replies
          system: [{ type: "text", text: CONNECTION_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          // What was said, details and transcript
          messages: [{ role: "user", content: buildConnectionMessage(input) }],
          // Thinking depth and the required JSON shape
          output_config: { effort: COACH_EFFORT, format: zodOutputFormat(ConnectionFeedbackSchema) },
        });
        // A safety decline is reported, not treated as a crash
        if (response.stop_reason === "refusal") return { status: "declined" };
        // A missing or unreadable reply is an error
        if (!response.parsed_output) throw new Error(`The coach returned no usable feedback (stop reason: ${response.stop_reason}).`);
        // Hand back the checked feedback, with its beats, and token counts
        return { status: "ok", feedback: checkConnectionFeedback(response.parsed_output, input.promptId ?? ""), usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } };
      }
      // A small-talk answer goes to the small-talk coach, with its own instructions and reply shape
      if (input.mode === "smalltalk") {
        // Ask Claude, requiring the reply to match the small-talk schema
        const response = await client.messages.parse({
          // The configured coach model
          model: COACH_MODEL,
          // Room for thinking and the reply
          max_tokens: MAX_TOKENS,
          // The small-talk instructions, cached between answers
          system: [{ type: "text", text: SMALL_TALK_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          // The question, details and transcript
          messages: [{ role: "user", content: buildSmallTalkMessage(input) }],
          // Thinking depth and the required JSON shape
          output_config: { effort: COACH_EFFORT, format: zodOutputFormat(SmallTalkFeedbackSchema) },
        });
        // A safety decline is reported, not treated as a crash
        if (response.stop_reason === "refusal") return { status: "declined" };
        // A missing or unreadable reply is an error
        if (!response.parsed_output) throw new Error(`The coach returned no usable feedback (stop reason: ${response.stop_reason}).`);
        // Hand back the checked feedback, with its beats, and token counts
        return { status: "ok", feedback: checkSmallTalkFeedback(response.parsed_output), usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } };
      }
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
