// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the limiter and its counter stores
import { MemoryCounterStore, UpstashCounterStore, checkRateLimit, type RateLimits } from "@/server/rateLimit";

// Small limits so the checks stay short
const LIMITS: RateLimits = { perMinute: 2, perDay: 3 };

// Build a moment on October 12, 2026 at a given hour and minute (UTC)
const at = (hour: number, minute: number) => new Date(Date.UTC(2026, 9, 12, hour, minute, 0));

// Group the checks about the limiter
describe("checkRateLimit", () => {
  // Each route counts on its own: the voice does not use up feedback calls
  it("keeps separate counts for each scope", async () => {
    // One store shared by both
    const store = new MemoryCounterStore();
    // Two voice calls fill the voice's minute
    for (let call = 0; call < 2; call++) await checkRateLimit(store, { ...LIMITS, scope: "voice" }, at(10, 0));
    // Confirm the voice is now refused but feedback is still allowed
    expect([(await checkRateLimit(store, { ...LIMITS, scope: "voice" }, at(10, 0))).allowed, (await checkRateLimit(store, LIMITS, at(10, 0))).allowed]).toEqual([false, true]);
  });

  // Requests under the limit are allowed
  it("allows requests under both limits", async () => {
    // Use an empty store
    const store = new MemoryCounterStore();
    // Confirm the first request is allowed
    expect((await checkRateLimit(store, LIMITS, at(10, 0))).allowed).toBe(true);
  });

  // Too many requests in one minute are refused, with a time to wait
  it("refuses the request after the per-minute limit", async () => {
    // Use an empty store
    const store = new MemoryCounterStore();
    // Use up the minute's allowance
    await checkRateLimit(store, LIMITS, at(10, 0));
    // Second request in the same minute
    await checkRateLimit(store, LIMITS, at(10, 0));
    // Third request in the same minute
    const result = await checkRateLimit(store, LIMITS, at(10, 0));
    // Confirm it is refused with the per-minute reason
    expect(result).toEqual({ allowed: false, reason: "minute", retryAfterSec: 60 });
  });

  // A new minute starts a new allowance, but the daily cap still applies
  it("refuses after the daily cap even in a new minute", async () => {
    // Use an empty store
    const store = new MemoryCounterStore();
    // Use three requests spread over three minutes
    for (const minute of [0, 1, 2]) await checkRateLimit(store, LIMITS, at(10, minute));
    // Try a fourth in a fresh minute
    const result = await checkRateLimit(store, LIMITS, at(10, 3));
    // Confirm the daily cap refuses it, waiting until midnight UTC (14 hours minus 3 minutes)
    expect(result).toEqual({ allowed: false, reason: "day", retryAfterSec: 14 * 3600 - 180 });
  });

  // Serverless hosting runs many copies of the server; limits must hold across all of them (risk R4)
  it("holds limits across separate server instances that share a store", async () => {
    // One shared store, as the real deployment has
    const shared = new MemoryCounterStore();
    // First server instance makes two requests
    await checkRateLimit(shared, LIMITS, at(10, 0));
    // Same instance, second request
    await checkRateLimit(shared, LIMITS, at(10, 0));
    // A different instance (same shared store) tries a third
    const result = await checkRateLimit(shared, LIMITS, at(10, 0));
    // Confirm it is refused
    expect(result.allowed).toBe(false);
  });
});

// Group the checks about the Upstash store adapter (with a fake network)
describe("UpstashCounterStore", () => {
  // The counter is increased with the store's REST command, and the window is set on first use
  it("increments a key and sets its expiry the first time", async () => {
    // Fake network: the first call returns a count of 1, the second confirms the expiry
    const fetchFake = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: 1 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: 1 })));
    // Make the adapter with the fake network
    const store = new UpstashCounterStore({ url: "https://kv.example", token: "t" }, fetchFake);
    // Increase a counter with a 60-second window
    const count = await store.increment("k", 60);
    // Confirm the count came back
    expect(count).toBe(1);
    // Confirm the increment command was sent with the token
    expect(fetchFake.mock.calls[0]).toEqual(["https://kv.example/incr/k", { method: "POST", headers: { Authorization: "Bearer t" } }]);
    // Confirm the expiry was set on first use
    expect(fetchFake.mock.calls[1]?.[0]).toBe("https://kv.example/expire/k/60");
  });

  // Later increments do not move the window
  it("does not reset the expiry on later increments", async () => {
    // Fake network: the count is already 2
    const fetchFake = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ result: 2 })));
    // Make the adapter with the fake network
    const store = new UpstashCounterStore({ url: "https://kv.example", token: "t" }, fetchFake);
    // Increase the counter
    await store.increment("k", 60);
    // Confirm only the increment was sent
    expect(fetchFake).toHaveBeenCalledTimes(1);
  });

  // A store outage must not silently allow unlimited calls
  it("throws when the store reports an error", async () => {
    // Fake network: the store returns an error
    const fetchFake = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ error: "bad token" }), { status: 401 }));
    // Make the adapter with the fake network
    const store = new UpstashCounterStore({ url: "https://kv.example", token: "t" }, fetchFake);
    // Confirm the failure is raised
    await expect(store.increment("k", 60)).rejects.toThrow(/rate-limit store/);
  });

  // Reading a counter does not change it, and a missing one is zero (the failed-passphrase check reads before it compares)
  it("reads a counter, missing as zero, and throws on an outage", async () => {
    // Fake network: a stored count, then nothing stored, then an error
    const fetchFake = vi.fn()
      // A stored count comes back as text
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: "7" }), { status: 200 }))
      // A missing key comes back as nothing
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: null }), { status: 200 }))
      // An outage
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "bad token" }), { status: 401 }));
    // Make the adapter with the fake network
    const store = new UpstashCounterStore({ url: "https://kv.example", token: "t" }, fetchFake);
    // Read twice
    const counts = [await store.read("k"), await store.read("other")];
    // Confirm the counts, the read command, and the failure
    expect([counts, (fetchFake.mock.calls[0] as unknown as [string])[0]]).toEqual([[7, 0], "https://kv.example/get/k"]);
    // The outage is raised, not read as zero
    await expect(store.read("k")).rejects.toThrow(/rate-limit store/);
  });
});

// Group the checks about the in-memory counters' reads
describe("MemoryCounterStore.read", () => {
  // Reads see the count without adding to it
  it("reads without counting", async () => {
    // A fresh store
    const store = new MemoryCounterStore();
    // Count once
    await store.increment("k");
    // Confirm two reads both see one
    expect([await store.read("k"), await store.read("k"), await store.read("missing")]).toEqual([1, 1, 0]);
  });
});
