// Rate limits and a daily cap on AI calls, counted in a store shared by every server copy (risk R4)

// Load the counter store settings type
import type { CounterStoreSettings } from "@/server/env";

// Something that can count events in a time window
export interface CounterStore {
  // Add one to a counter and return the new total; the counter disappears after the window
  increment(key: string, windowSec: number): Promise<number>;
}

// How many calls are allowed
export interface RateLimits {
  // Calls allowed per minute
  perMinute: number;
  // Calls allowed per day (the cost cap)
  perDay: number;
}

// The outcome of a limit check
export type RateLimitResult = { allowed: true } | { allowed: false; reason: "minute" | "day"; retryAfterSec: number };

// Seconds in a minute
const MINUTE = 60;
// Seconds in a day
const DAY = 86_400;

// Count a call and decide whether it is allowed
export async function checkRateLimit(store: CounterStore, limits: RateLimits, now: Date): Promise<RateLimitResult> {
  // Current time in whole seconds
  const seconds = Math.floor(now.getTime() / 1000);
  // Which minute and which day (UTC) this call falls in
  const minuteBucket = Math.floor(seconds / MINUTE);
  // The day bucket
  const dayBucket = Math.floor(seconds / DAY);
  // Count the call in this minute
  const inMinute = await store.increment(`feedback:minute:${minuteBucket}`, MINUTE);
  // Refuse if the minute is used up; wait until the next minute
  if (inMinute > limits.perMinute) return { allowed: false, reason: "minute", retryAfterSec: (minuteBucket + 1) * MINUTE - seconds };
  // Count the call in this day (only calls that passed the minute check)
  const inDay = await store.increment(`feedback:day:${dayBucket}`, DAY);
  // Refuse if the day is used up; wait until midnight UTC
  if (inDay > limits.perDay) return { allowed: false, reason: "day", retryAfterSec: (dayBucket + 1) * DAY - seconds };
  // Otherwise allow the call
  return { allowed: true };
}

// Counters kept in memory: for tests and local development only, since each server copy has its own memory
export class MemoryCounterStore implements CounterStore {
  // Counters by key
  private readonly counts = new Map<string, number>();

  // Add one to a counter (time windows are handled by the bucket in the key)
  async increment(key: string): Promise<number> {
    // Work out the new total
    const next = (this.counts.get(key) ?? 0) + 1;
    // Save it
    this.counts.set(key, next);
    // Hand it back
    return next;
  }
}

// Shape of a reply from the Upstash REST API
interface UpstashReply {
  // The command's result, when it worked
  result?: number;
  // An error message, when it failed
  error?: string;
}

// Counters kept in Upstash Redis (added through the Vercel integration), shared by every server copy
export class UpstashCounterStore implements CounterStore {
  // Remember the store address, token, and how to reach the network
  constructor(
    // Address and token
    private readonly settings: CounterStoreSettings,
    // Network function (the real fetch in the app, a fake in tests)
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  // Send one command to the store and return its numeric result
  private async command(path: string): Promise<number> {
    // Call the store's REST API
    const response = await this.fetchFn(`${this.settings.url}/${path}`, { method: "POST", headers: { Authorization: `Bearer ${this.settings.token}` } });
    // Read the reply
    const reply = (await response.json()) as UpstashReply;
    // Treat any failure as an error, so an outage cannot quietly lift the limits
    if (!response.ok || typeof reply.result !== "number") throw new Error(`The rate-limit store failed: ${reply.error ?? response.status}`);
    // Hand back the result
    return reply.result;
  }

  // Add one to a counter, starting its expiry window on first use
  async increment(key: string, windowSec: number): Promise<number> {
    // Increase the counter
    const count = await this.command(`incr/${encodeURIComponent(key)}`);
    // On first use, make the counter expire at the end of its window
    if (count === 1) await this.command(`expire/${encodeURIComponent(key)}/${windowSec}`);
    // Hand back the new total
    return count;
  }
}
