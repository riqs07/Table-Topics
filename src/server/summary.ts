// The weekly coach: sends one week's table to Claude and returns a structured summary (decision 90)

// Load the Anthropic SDK
import Anthropic from "@anthropic-ai/sdk";
// Load the SDK helper that turns a zod schema into a JSON output format
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// Load the model settings
import { WEEKLY_SUMMARY_EFFORT, WEEKLY_SUMMARY_MODEL } from "@/config/models";
// Load the instructions, message builder, schema and checker
import { SUMMARY_SYSTEM_PROMPT, WeeklySummarySchema, buildSummaryMessage, checkSummary, type SummaryInput, type WeeklySummary } from "@/core/weeklySummary";

// Room for the model's thinking (always on for this model) plus a short JSON reply; a cut-off reply is billed and gives nothing, so it is generous
const MAX_TOKENS = 16000;

// What asking the weekly coach can produce
export type SummaryResult =
  // A summary came back, with the model that wrote it and token counts
  | { status: "ok"; summary: WeeklySummary; model: string; usage: { inputTokens: number; outputTokens: number } }
  // The model declined for safety reasons
  | { status: "declined" };

// Anything that can write a weekly summary (the real one, or a fake in tests)
export interface Summarizer {
  // Write one week's summary
  summarize(input: SummaryInput): Promise<SummaryResult>;
}

// Build a summarizer that calls Claude; the network function can be replaced in tests
export function createClaudeSummarizer(apiKey: string, fetchFn?: typeof fetch): Summarizer {
  // The API client with no retries inside a call (each retry is billed again; the app asks again next time the profile opens) and a two-minute timeout
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 120_000, ...(fetchFn ? { fetch: fetchFn } : {}) });
  // Hand back the summarizer
  return {
    // Write one week's summary
    async summarize(input) {
      // Ask Claude, requiring the reply to match the summary schema
      const response = await client.messages.parse({
        // The configured weekly model
        model: WEEKLY_SUMMARY_MODEL,
        // Room for thinking and the reply
        max_tokens: MAX_TOKENS,
        // The standing instructions, cached
        system: [{ type: "text", text: SUMMARY_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        // The week's table
        messages: [{ role: "user", content: buildSummaryMessage(input) }],
        // Thinking depth and the required JSON shape
        output_config: { effort: WEEKLY_SUMMARY_EFFORT, format: zodOutputFormat(WeeklySummarySchema) },
      });
      // A safety decline is reported, not treated as a crash
      if (response.stop_reason === "refusal") return { status: "declined" };
      // A missing or unreadable reply is an error
      if (!response.parsed_output) throw new Error(`The weekly coach returned no usable summary (stop reason: ${response.stop_reason}).`);
      // The checked summary
      return { status: "ok", summary: checkSummary(response.parsed_output), model: WEEKLY_SUMMARY_MODEL, usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } };
    },
  };
}
