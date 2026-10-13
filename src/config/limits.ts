// Limits on AI feedback calls; at roughly a cent per session, the daily cap bounds the worst day's cost

// Load the limits type
import type { RateLimits } from "@/server/rateLimit";

// At most 6 feedback calls a minute and 60 a day
export const FEEDBACK_LIMITS: RateLimits = { perMinute: 6, perDay: 60 };
