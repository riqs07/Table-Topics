// Every AI model name lives here, so a retired model is a one-line change (decision 7)

// Per-session feedback: Sonnet is fast and low-cost for short transcripts (decision 6)
export const COACH_MODEL = "claude-sonnet-5-5";
// Coach model prices in US dollars per million tokens (input, output), for cost estimates in the live check
export const COACH_PRICE_PER_MILLION = { input: 2, output: 10 };
// How hard the coach thinks; medium to start, to be tuned at checkpoint C10
export const COACH_EFFORT = "medium" as const;
// Weekly summaries (milestone 9): Opus, to be measured against Sonnet (decision 6)
export const WEEKLY_SUMMARY_MODEL = "claude-opus-5-5";
// Choosing a conversation character's next line (decision 83): the fast, low-cost Haiku, since it only picks from a short list
export const CONVERSATION_MODEL = "claude-haiku-5-5";
// How hard it thinks: low, to keep the pause before each reply short
export const CONVERSATION_EFFORT = "low" as const;
