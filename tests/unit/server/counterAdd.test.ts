// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the counters being checked
import { MemoryCounterStore, UpstashCounterStore, addToCounter, type CounterStore } from "@/server/rateLimit";

// Group the checks on adding whole amounts to a counter (decisions 119 and 122)
describe("adding to a counter", () => {
  // Upstash: one INCRBY, and the window set when the total is just this amount
  it("adds in one command on Upstash and sets the window on first use", async () => {
    // The total comes back as 120, then the expiry is confirmed
    const fetchFake = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ result: 120 }))).mockResolvedValueOnce(new Response(JSON.stringify({ result: 1 })));
    // The store
    const store = new UpstashCounterStore({ url: "https://kv.example", token: "t" }, fetchFake);
    // Added
    const total = await store.add("chars", 120, 99);
    // One add, one expiry
    expect([total, fetchFake.mock.calls.map((call) => call[0])]).toEqual([120, ["https://kv.example/incrby/chars/120", "https://kv.example/expire/chars/99"]]);
  });

  // Later adds leave the window alone
  it("leaves the window alone on later adds", async () => {
    // The total is already higher
    const fetchFake = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ result: 300 })));
    // Added
    await new UpstashCounterStore({ url: "https://kv.example", token: "t" }, fetchFake).add("chars", 120, 99);
    // Only the add
    expect(fetchFake).toHaveBeenCalledTimes(1);
  });

  // A store without add (the older stand-ins) is added to one at a time; nothing to add reads the total
  it("falls back to one at a time, and reads for nothing", async () => {
    // A store with only increment and read
    const inner = new MemoryCounterStore();
    // Without add
    const plain: CounterStore = { increment: (key) => inner.increment(key), read: (key) => inner.read(key) };
    // Three added, then nothing
    expect([await addToCounter(plain, "k", 3, 60), await addToCounter(plain, "k", 0, 60), await addToCounter(new MemoryCounterStore(), "j", 4, 60)]).toEqual([3, 3, 4]);
  });
});
