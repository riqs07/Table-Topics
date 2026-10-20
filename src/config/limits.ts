// Limits on AI feedback calls; at roughly a cent per session, the daily cap bounds the worst day's cost

// Load the limits type
import type { RateLimits } from "@/server/rateLimit";

// At most 6 feedback calls a minute and 60 a day
export const FEEDBACK_LIMITS: RateLimits = { perMinute: 6, perDay: 60 };

// The question voice: at most 20 a minute and 300 a day, counted apart from feedback (each question is fetched once per phone, then kept)
export const VOICE_LIMITS: RateLimits = { perMinute: 20, perDay: 300, scope: "voice" };

// Conversation turns (decision 83): at most 30 a minute and 400 a day, counted apart from feedback (a three-minute conversation takes about ten)
export const CONVERSATION_LIMITS: RateLimits = { perMinute: 30, perDay: 400, scope: "conversation" };
