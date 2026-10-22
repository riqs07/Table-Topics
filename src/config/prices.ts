// Every price the usage section estimates with (decision 122), in one place, each with the day it was checked, where it came from and whether that source was the vendor's own. Change a number here when a bill disagrees; nothing else holds a price. The estimates are only as good as these: the providers' bills are the real numbers

// One price
export interface Price {
  // US dollars per unit
  usd: number;
  // What one unit is
  per: string;
  // The day it was checked (YYYY-MM-DD)
  checkedOn: string;
  // Where it came from
  source: string;
  // True only when read from the vendor's own page or SDK; false for third-party or search-snippet figures
  verified: boolean;
}

// The prices, by what they price
export const PRICES = {
  // AssemblyAI Universal-Streaming, billed for every hour a socket is open (live turns, decision 119)
  assemblyAiStreaming: { usd: 0.15, per: "hour of open connection", checkedOn: "2026-10-21", source: "AssemblyAI pricing reference and a third-party tracker, seen through search results (live-conversation research, 4.2); the pricing page was not reachable", verified: false },
  // ElevenLabs Agents, billed per minute of call (phone calls, decision 121)
  elevenLabsAgents: { usd: 0.08, per: "minute of call", checkedOn: "2026-10-21", source: "Third-party pricing write-ups, consistent across several (live-conversation research, 4.3); ElevenLabs' help page confirms per-minute billing but its price was not seen", verified: false },
  // ElevenLabs Turbo text to speech, per 1,000 characters (the persona's written lines, decision 102)
  elevenLabsTurbo: { usd: 0.04, per: "1,000 characters", checkedOn: "2026-10-21", source: "Third-party list price after the launch offer ended on 2026-10-12 (live-conversation research, 3)", verified: false },
  // ElevenLabs v4 text to speech, per 1,000 characters (when CONVERSATION_VOICE_MODEL=v4)
  elevenLabsV4: { usd: 0.08, per: "1,000 characters", checkedOn: "2026-10-21", source: "Third-party list price; decision 84 saw about $0.17 per 1,000 credits on the account, so this may be low (live-conversation research, 3)", verified: false },
  // Claude Haiku 5.5 input, per million tokens (the persona's lines, decisions 84 and 102; and inside the phone-call agent)
  haikuInput: { usd: 0.1, per: "million input tokens", checkedOn: "2026-10-06", source: "Anthropic's model table in the Claude API skill (cached 2026-10-06)", verified: true },
  // Claude Haiku 5.5 output, per million tokens
  haikuOutput: { usd: 0.5, per: "million output tokens", checkedOn: "2026-10-06", source: "Anthropic's model table in the Claude API skill (cached 2026-10-06)", verified: true },
} as const satisfies Record<string, Price>;

// How many tokens one written line takes, for the estimate (decision 84's measurement: about 1,300 in and 40 out); the route counts lines, not tokens
export const TOKENS_PER_LINE = { input: 1_300, output: 40 } as const;

// How many of the persona's lines a minute of phone call holds, for the agent's LLM pass-through (the call's own LLM is billed from ElevenLabs credits at the model's price; an assumption: a line every 20 seconds)
export const CALL_LINES_PER_MINUTE = 3;
