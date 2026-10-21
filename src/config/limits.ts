// Limits on the paid routes, so a leaked passphrase has a bounded cost (risk R4, decision 87)
//
// The worst day if every cap is used to the full, at the prices of 2026-10 (Haiku 5.5 $0.10 / $0.50 and Sonnet 5.5 $2 / $10 per million tokens in / out; ElevenLabs about $0.17 per 1,000 characters on eleven_v4):
// - Feedback: 60 calls. Each reads at most 45,000 characters of text (the request total) plus the instructions: about 13,000 tokens of English, or up to about 47,000 for text built to tokenise badly, so $0.03 to $0.09; and writes at most 16,000 tokens with its thinking, $0.16. At most about $0.25 a call, $15 a day. No retries inside a call; the app's later retries count against the same 60.
// - Conversation lines: 150 calls. Haiku reads at most 60 turns of 1,000 characters (at most about $0.006) and writes at most 1,024 tokens ($0.0005); ElevenLabs speaks at most 280 characters ($0.05). At most about $0.055 a line, $8 a day.
// - Question voice: 60 calls of at most 234 characters, about $0.04 each, $2.40 a day.
// - Weekly summaries (decision 90): 3 calls. Opus 5.5 ($4 / $20 per million) reads at most 12,000 characters of table and quotes plus the instructions (about 5,000 tokens, $0.02) and writes at most 16,000 tokens with its thinking ($0.32). At most about $0.35 a call, $1 a day; the app asks once a week.
// - Deeper analysis (decision 91): 40 calls. AssemblyAI transcribes at most about 16 minutes of audio (the 4 MB upload cap at 32 kbit/s) at about $0.21 to $0.26 an hour plus about $0.05 an hour for keeping hesitation sounds, so at most about $0.09 a call, $3.60 a day; the voice worker is a few seconds of CPU on a host you run, well under a cent a call.
// - All five together: at most about $31 a day (about $27 with ordinary text). A real session costs a few cents; set monthly spend limits in every dashboard as the last stop (setup-requirements.md).

// Load the limits type
import type { RateLimits } from "@/server/rateLimit";

// At most 6 feedback calls a minute and 60 a day
export const FEEDBACK_LIMITS: RateLimits = { perMinute: 6, perDay: 60 };

// The question voice: at most 10 a minute and 60 a day, counted apart from feedback; almost every line now plays from a saved recording (decision 82), so only a line without one asks ElevenLabs, and each phone keeps what it fetched
export const VOICE_LIMITS: RateLimits = { perMinute: 10, perDay: 60, scope: "voice" };

// Conversation lines (decision 84): each is written by Claude and spoken by ElevenLabs, at most 20 a minute and 150 a day, counted apart from feedback (a three-minute conversation takes about ten, so about fifteen conversations a day at most)
export const CONVERSATION_LIMITS: RateLimits = { perMinute: 20, perDay: 150, scope: "conversation" };

// The weekly summary (decision 90): at most 2 a minute and 3 a day, counted apart from feedback; the app asks once a week when the profile opens
export const SUMMARY_LIMITS: RateLimits = { perMinute: 2, perDay: 3, scope: "summary" };

// Deeper analysis (decision 91): at most 3 uploads a minute and 40 a day, counted apart from feedback; the app sends each saved take once, only when "Send my recordings for deeper analysis" is on
export const ANALYSE_LIMITS: RateLimits = { perMinute: 3, perDay: 40, scope: "analyse" };

// How long the deeper-analysis route waits for the transcription service and the voice worker, each, before giving up on that part (the route itself may run five minutes on Vercel)
export const ANALYSE_TIMEOUT_MS = 240_000;

// How often the route asks the transcription service whether a transcript is ready
export const TRANSCRIPT_POLL_MS = 3_000;

// Wrong passphrases one caller (by network address) may send in an hour before every request from it is refused until the next hour, so the passphrase cannot be guessed at speed
export const PASSPHRASE_FAILURES_PER_HOUR = 20;
