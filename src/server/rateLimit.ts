// Rate limits and a daily cap on AI calls, counted in a store shared by every server copy (risk R4)

// Load the counter store settings type
import type { CounterStoreSettings } from "@/server/env";

// Something that can count events in a time window
export interface CounterStore {
  // Add one to a counter and return the new total; the counter disappears after the window
  increment(key: string, windowSec: number): Promise<number>;
  // Read a counter without changing it (zero when it does not exist)
  read(key: string): Promise<number>;
  // Add a whole amount at once and return the new total, starting the window on first use (optional: live minutes and voice characters use it, decisions 140 and 143; addToCounter falls back to adding one at a time)
  add?(key: string, amount: number, windowSec: number): Promise<number>;
}

// Add a whole amount to a counter: in one step when the store can, otherwise one at a time
export async function addToCounter(store: CounterStore, key: string, amount: number, windowSec: number): Promise<number> {
  // Nothing to add: the total as it is
  if (amount <= 0) return store.read(key);
  // In one step
  if (store.add) return store.add(key, amount, windowSec);
  // The running total
  let total = 0;
  // One at a time
  for (let step = 0; step < amount; step += 1) total = await store.increment(key, windowSec);
  // The new total
  return total;
}

// How many calls are allowed
export interface RateLimits {
  // Calls allowed per minute
  perMinute: number;
  // Calls allowed per day (the cost cap)
  perDay: number;
  // Which counters to use, so different routes keep separate counts (feedback when not given)
  scope?: string;
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
  const inMinute = await store.increment(`${limits.scope ?? "feedback"}:minute:${minuteBucket}`, MINUTE);
  // Refuse if the minute is used up; wait until the next minute
  if (inMinute > limits.perMinute) return { allowed: false, reason: "minute", retryAfterSec: (minuteBucket + 1) * MINUTE - seconds };
  // Count the call in this day (only calls that passed the minute check)
  const inDay = await store.increment(`${limits.scope ?? "feedback"}:day:${dayBucket}`, DAY);
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

  // Read a counter without changing it
  async read(key: string): Promise<number> {
    // The total, or zero when it was never counted
    return this.counts.get(key) ?? 0;
  }

  // Add a whole amount at once
  async add(key: string, amount: number): Promise<number> {
    // Work out the new total
    const next = (this.counts.get(key) ?? 0) + amount;
    // Save it
    this.counts.set(key, next);
    // Hand it back
    return next;
  }
}

// Shape of a reply from the Upstash REST API
interface UpstashReply {
  // The command's result, when it worked (a number from a count, text or nothing from a read)
  result?: number | string | null;
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

  // Send one command to the store and return its result as it came
  private async send(path: string): Promise<UpstashReply["result"]> {
    // Call the store's REST API
    const response = await this.fetchFn(`${this.settings.url}/${path}`, { method: "POST", headers: { Authorization: `Bearer ${this.settings.token}` } });
    // Read the reply
    const reply = (await response.json()) as UpstashReply;
    // Treat any failure as an error, so an outage cannot quietly lift the limits
    if (!response.ok || reply.error !== undefined || reply.result === undefined) throw new Error(`The rate-limit store failed: ${reply.error ?? response.status}`);
    // Hand back the result
    return reply.result;
  }

  // Send one command to the store and return its numeric result
  private async command(path: string): Promise<number> {
    // Send it
    const result = await this.send(path);
    // A count must come back as a number
    if (typeof result !== "number") throw new Error("The rate-limit store failed: the reply was not a number");
    // Hand back the result
    return result;
  }

  // Read a counter without changing it (the store answers with its text, or nothing when it does not exist)
  async read(key: string): Promise<number> {
    // Ask for the value
    const result = await this.send(`get/${encodeURIComponent(key)}`);
    // Nothing stored counts as zero
    if (result === null) return 0;
    // The stored count as a number
    const count = Number(result);
    // Anything else is a failure
    if (!Number.isFinite(count)) throw new Error("The rate-limit store failed: the reply was not a count");
    // Hand back the count
    return count;
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

  // Add a whole amount at once (Redis INCRBY), starting its expiry window on first use
  async add(key: string, amount: number, windowSec: number): Promise<number> {
    // Increase the counter by the amount
    const count = await this.command(`incrby/${encodeURIComponent(key)}/${Math.round(amount)}`);
    // On first use (the total is just this amount), make the counter expire at the end of its window
    if (count === Math.round(amount)) await this.command(`expire/${encodeURIComponent(key)}/${windowSec}`);
    // Hand back the new total
    return count;
  }
}
