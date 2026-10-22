// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the handler and counters being checked
import { createUsageHandler, type UsageDeps } from "@/server/usageHandler";
import { countLine, countVoiceCharacters } from "@/server/usageCounters";
// Load the counters
import { MemoryCounterStore, type CounterStore } from "@/server/rateLimit";
// Load the live budget's counter names
import { LIVE_KEYS } from "@/core/liveBudget";
// Load the conversation minutes counter
import { monthKey } from "@/server/conversationHandler";

// The passphrase the fake server expects
const SECRET = "a long passphrase for testing";
// The fixed "now"
const NOW = new Date(Date.UTC(2026, 9, 22, 10));

// The route's dependencies, with fakes
function deps(store: CounterStore, extra: Partial<UsageDeps> = {}): UsageDeps {
  // Everything
  return {
    // The passphrase
    readAccessSecret: () => SECRET,
    // Settings
    readEnv: () => ({ anthropicApiKey: "k", accessSecret: SECRET, counterStore: null }),
    // Live settings: step A set up, calls not
    liveSettings: () => ({ assemblyAiKey: "a", elevenLabsKey: null, agentId: null, minutesPerMonth: 150, callMinutesPerMonth: 60, connection: "webrtc" }),
    // Conversation settings
    conversationSettings: () => ({ minutesPerMonth: 150, voiceModel: "turbo" }),
    // The store
    makeCounterStore: () => store,
    // Limits (unused: the route is free)
    limits: { perMinute: 1, perDay: 1, scope: "live" },
    // The clock
    now: () => NOW,
    // Anything else
    ...extra,
  };
}

// A request
function request(passphrase: string | null = SECRET): Request {
  // With or without the passphrase
  return new Request("http://localhost/api/usage", { headers: passphrase ? { "x-voicelab-passphrase": passphrase } : {} });
}

// Group the checks on the usage route (decision 122)
describe("usage route", () => {
  // The month's counts as counted: live minutes reserved less returned, characters by model, lines
  it("reads this month's counts with the limits and what is left", async () => {
    // A store with some use
    const store = new MemoryCounterStore();
    // Live: 10 reserved, 3 handed back
    await store.add(LIVE_KEYS.reserved("a", "2026-10"), 10);
    // (returned)
    await store.add(LIVE_KEYS.returned("a", "2026-10"), 3);
    // Calls: 5
    await store.add(LIVE_KEYS.reserved("b", "2026-10"), 5);
    // Characters and lines, counted as the conversation route does
    await countVoiceCharacters(store, "turbo", 900, NOW, () => undefined);
    // (v4)
    await countVoiceCharacters(store, "v4", 100, NOW, () => undefined);
    // (two lines)
    await countLine(store, NOW, () => undefined);
    // (another)
    await countLine(store, NOW, () => undefined);
    // Conversation minutes
    await store.add(monthKey(NOW), 12);
    // Asked
    const response = await createUsageHandler(deps(store))(request());
    // Every count
    expect([response.status, await response.json(), response.headers.get("cache-control")]).toEqual([200, { month: "2026-10", live: { used: 7, limit: 150, left: 143, setUp: true }, call: { used: 5, limit: 60, left: 55, setUp: false }, voiceCharacters: { turbo: 900, v4: 100 }, lines: 2, conversationMinutes: { used: 12, limit: 150 } }, "no-store"]);
  });

  // Strangers get nothing, and nothing is read
  it("needs the passphrase", async () => {
    // Reads noted
    const reads: string[] = [];
    // A store that notes reads
    const store: CounterStore = { increment: async () => 1, read: async (key) => (reads.push(key), 0) };
    // Asked without the passphrase
    const response = await createUsageHandler(deps(store))(request(null));
    // Refused, only the wrong-passphrase counter read
    expect([response.status, reads.every((key) => key.startsWith("passphrase-failures:"))]).toEqual([401, true]);
  });

  // The counter down, and a bad setting
  it("says when the counter is down or a setting is wrong", async () => {
    // A store whose reads fail after the passphrase check
    const broken: CounterStore = { increment: async () => 1, read: async (key) => { if (key.startsWith("passphrase-failures:")) return 0; throw new Error("down"); } };
    // Down
    const down = await createUsageHandler(deps(broken))(request());
    // A bad setting
    const bad = await createUsageHandler(deps(new MemoryCounterStore(), { liveSettings: () => { throw new Error("LIVE_MINUTES_PER_MONTH must be a whole number of minutes, such as 150."); } }))(request());
    // Each said
    expect([down.status, bad.status, (await bad.json()).error]).toEqual([503, 500, "The server is not set up: LIVE_MINUTES_PER_MONTH must be a whole number of minutes, such as 150."]);
  });

  // Counting never throws, even with the store down
  it("never fails a reply over a count", async () => {
    // Logs
    const logs: string[] = [];
    // A failing store
    const broken: CounterStore = { increment: async () => { throw new Error("down"); }, read: async () => 0, add: async () => { throw new Error("down"); } };
    // Both counts
    await countVoiceCharacters(broken, "turbo", 10, NOW, (line) => void logs.push(line));
    // (line)
    await countLine(broken, NOW, (line) => void logs.push(line));
    // Logged twice
    expect(logs).toEqual(["Usage count failed: down", "Usage count failed: down"]);
  });
});
