// Every AI model name lives here, so a retired model is a one-line change (decision 7)

// Per-session feedback: Sonnet is fast and low-cost for short transcripts (decision 6)
export const COACH_MODEL = "claude-sonnet-5-5";
// How hard the coach thinks; medium to start, to be tuned at checkpoint C10
export const COACH_EFFORT = "medium" as const;
// Weekly summaries (milestone 9): Opus, to be measured against Sonnet (decision 6)
export const WEEKLY_SUMMARY_MODEL = "claude-opus-5-5";
