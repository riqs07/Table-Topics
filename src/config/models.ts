// Every AI model name lives here, so a retired model is a one-line change (decision 7)

// Per-session feedback: Sonnet is fast and low-cost for short transcripts (decision 6)
export const COACH_MODEL = "claude-sonnet-5-5";
// Coach model prices in US dollars per million tokens (input, output), for cost estimates in the live check
export const COACH_PRICE_PER_MILLION = { input: 2, output: 10 };
// How hard the coach thinks; medium to start, to be tuned at checkpoint C10
export const COACH_EFFORT = "medium" as const;
// Weekly summaries (milestone 9): Opus, to be measured against Sonnet (decision 6)
export const WEEKLY_SUMMARY_MODEL = "claude-opus-5-5";
// How hard the weekly summary thinks: medium (set explicitly, as it is this model's default), since it reads a small table once a week (decision 90)
export const WEEKLY_SUMMARY_EFFORT = "medium" as const;
// Writing a conversation persona's next line (decisions 83 and 84): the fast, low-cost Haiku, since each line is short and the person is waiting
export const CONVERSATION_MODEL = "claude-haiku-5-5";
// How hard it thinks: low, to keep the pause before each reply short
export const CONVERSATION_EFFORT = "low" as const;
// The ElevenLabs model that speaks a written line in the persona's voice (decision 84): the same as their recorded lines, and the one that performs directions like [laughs]
export const CONVERSATION_VOICE_MODEL = "eleven_v4";
