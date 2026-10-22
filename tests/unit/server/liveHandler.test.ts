// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the handlers being checked
import { createLiveEndHandler, createLiveStartHandler, liveMinutesUsed, type LiveDeps } from "@/server/liveHandler";
// Load the counters
import { MemoryCounterStore, type CounterStore } from "@/server/rateLimit";
// Load the budget's counter names
import { LIVE_KEYS } from "@/core/liveBudget";
// Load the settings type
import type { LiveSettings } from "@/server/env";
// Load the vendor types
import type { AgentTokens, StreamingTokens } from "@/server/liveVendors";

// The passphrase the fake server expects
const SECRET = "a long passphrase for testing";
// The fixed "now"
const NOW = new Date(Date.UTC(2026, 9, 22, 10));
// Every live setting set
const SETTINGS: LiveSettings = { assemblyAiKey: "aai-key", elevenLabsKey: "el-key", agentId: "agent_1", minutesPerMonth: 150, callMinutesPerMonth: 60, connection: "webrtc" };

// A fake streaming issuer that notes what it was asked, and answers or fails
function fakeStreaming(fails = false): StreamingTokens & { asked: Array<{ expiresInSeconds: number; maxSessionSeconds: number }> } {
  // What it was asked
  const asked: Array<{ expiresInSeconds: number; maxSessionSeconds: number }> = [];
  // The issuer
  return {
    // Noted
    asked,
    // One token
    async token(options) {
      // Noted
      asked.push(options);
      // Failing
      if (fails) throw new Error("The live service answered 401.");
      // A token
      return "aai-temporary-token";
    },
  };
}

// A fake agent issuer
const fakeAgent: AgentTokens = {
  // One call
  async start(connection) {
    // A token or address
    return connection === "webrtc" ? { connection, conversationToken: "el-conversation-token" } : { connection, signedUrl: "wss://api.elevenlabs.io/v1/convai/conversation?token=x" };
  },
};

// The routes' dependencies, with fakes; returns them with the store and what was asked and logged
function deps(extra: Partial<LiveDeps> & { store?: CounterStore; streaming?: ReturnType<typeof fakeStreaming>; settings?: Partial<LiveSettings>; logs?: string[]; order?: string[] } = {}): LiveDeps & { store: CounterStore; streaming: ReturnType<typeof fakeStreaming> } {
  // The counters
  const store = extra.store ?? new MemoryCounterStore();
  // The streaming issuer
  const streaming = extra.streaming ?? fakeStreaming();
  // Everything
  return {
    // The passphrase, noting when it was read
    readAccessSecret: () => {
      // Noted
      extra.order?.push("passphrase");
      // The secret
      return SECRET;
    },
    // Server settings
    readEnv: () => ({ anthropicApiKey: "sk-test", accessSecret: SECRET, counterStore: null }),
    // The live settings, noting when they were read
    liveSettings: () => {
      // Noted
      extra.order?.push("settings");
      // The settings
      return { ...SETTINGS, ...extra.settings };
    },
    // The issuers
    makeStreamingTokens: () => streaming,
    // (the agent)
    makeAgentTokens: () => fakeAgent,
    // The counters, noting when they were made
    makeCounterStore: () => {
      // Noted
      extra.order?.push("counter");
      // The store
      return store;
    },
    // Generous limits
    limits: { perMinute: 100, perDay: 1000, scope: "live" },
    // A fixed clock
    now: () => NOW,
    // Logs kept
    log: (line) => void extra.logs?.push(line),
    // The store and issuer, for the checks
    store, streaming,
    // Anything else
    ...extra,
  };
}

// A request to a live route
function request(body: unknown, passphrase: string | null = SECRET, raw?: string): Request {
  // With or without the passphrase
  return new Request("http://localhost/api/live", { method: "POST", headers: { "content-type": "application/json", ...(passphrase ? { "x-voicelab-passphrase": passphrase } : {}) }, body: raw ?? JSON.stringify(body) });
}

// A start body for step A
const START_A = { kind: "a", conversationId: "conv-0001" };

// Group the checks on starting a live conversation (decision 119)
describe("live start route", () => {
  // A token whose session closes with the cap, five minutes reserved, and the minutes left
  it("hands out a short-lived streaming token and reserves the minutes", async () => {
    // The fakes
    const wired = deps();
    // Asked
    const response = await createLiveStartHandler(wired)(request(START_A));
    // The reply
    const body = await response.json();
    // A token, five minutes granted and reserved, 145 left; the vendor told the same cap and a minute to open the socket
    expect([response.status, body.token, body.grantedSeconds, body.minutesLeft, await liveMinutesUsed(wired.store, "a", NOW), wired.streaming.asked, response.headers.get("cache-control")]).toEqual([200, "aai-temporary-token", 300, 145, 5, [{ expiresInSeconds: 60, maxSessionSeconds: 300 }], "no-store"]);
  });

  // The order: passphrase before anything; a wrong one costs nothing and reveals nothing
  it("refuses a wrong passphrase before reading the live settings or asking the vendor", async () => {
    // What was read, in order
    const order: string[] = [];
    // The fakes
    const wired = deps({ order });
    // Asked with the wrong passphrase
    const response = await createLiveStartHandler(wired)(request(START_A, "wrong passphrase, long enough"));
    // Refused, the live settings never read and the vendor never asked
    expect([response.status, order.includes("settings"), wired.streaming.asked.length]).toEqual([401, false, 0]);
  });

  // A bad body is refused before the rate limit counts anything
  it("refuses a bad body before counting the call", async () => {
    // The fakes
    const wired = deps();
    // Asked with a bad kind, then with text that is not JSON
    const [bad, notJson] = [await createLiveStartHandler(wired)(request({ kind: "c", conversationId: "conv-0001" })), await createLiveStartHandler(wired)(request(null, SECRET, "{"))];
    // Both refused, nothing counted
    expect([bad.status, notJson.status, await wired.store.read(`live:minute:${Math.floor(NOW.getTime() / 60_000)}`)]).toEqual([400, 400, 0]);
  });

  // Missing keys say "not set up", by name, after the passphrase
  it("says which setting is missing for each kind", async () => {
    // No AssemblyAI key
    const a = await createLiveStartHandler(deps({ settings: { assemblyAiKey: null } }))(request(START_A));
    // No agent
    const b = await createLiveStartHandler(deps({ settings: { agentId: null } }))(request({ kind: "b", conversationId: "conv-0002" }));
    // Both 503 with the setting named, and marked as not set up
    expect([a.status, (await a.json()).error, b.status, await b.json()]).toEqual([503, "Live conversations aren’t set up on the server: ASSEMBLYAI_API_KEY is not set.", 503, { error: "Phone calls aren’t set up on the server: ELEVENLABS_AGENT_ID is not set.", notSetUp: true }]);
  });

  // A bad monthly setting is named
  it("names a monthly setting that cannot be used", async () => {
    // Reading throws, as the real reader does on "lots"
    const response = await createLiveStartHandler(deps({ liveSettings: () => { throw new Error("LIVE_MINUTES_PER_MONTH must be a whole number of minutes, such as 150."); } }))(request(START_A));
    // Named
    expect([response.status, (await response.json()).error]).toEqual([500, "The server is not set up: LIVE_MINUTES_PER_MONTH must be a whole number of minutes, such as 150."]);
  });

  // Over the month's minutes: refused with the budget mark, and nothing asked of the vendor
  it("refuses when the month's live minutes are used up", async () => {
    // A store with 150 minutes reserved this month
    const store = new MemoryCounterStore();
    // Reserved
    await store.add(LIVE_KEYS.reserved("a", "2026-10"), 150);
    // The fakes
    const wired = deps({ store });
    // Asked
    const response = await createLiveStartHandler(wired)(request(START_A));
    // Refused, marked, vendor untouched
    expect([response.status, await response.json(), wired.streaming.asked.length]).toEqual([429, { error: "This month’s live minutes are used up.", budget: true, minutesLeft: 0 }, 0]);
  });

  // Fewer minutes left than the cap: the session is shorter, never under the vendor's one-minute floor
  it("grants only the minutes left", async () => {
    // A store with 148 used
    const store = new MemoryCounterStore();
    // Reserved
    await store.add(LIVE_KEYS.reserved("a", "2026-10"), 148);
    // The fakes
    const wired = deps({ store });
    // Asked
    const body = await (await createLiveStartHandler(wired)(request(START_A))).json();
    // Two minutes, and the vendor told so
    expect([body.grantedSeconds, body.minutesLeft, wired.streaming.asked[0]?.maxSessionSeconds]).toEqual([120, 0, 120]);
  });

  // A limit of zero turns a kind off
  it("treats a limit of zero as turned off", async () => {
    // Zero minutes
    const response = await createLiveStartHandler(deps({ settings: { minutesPerMonth: 0 } }))(request(START_A));
    // Refused with the budget mark
    expect([response.status, (await response.json()).budget]).toEqual([429, true]);
  });

  // The vendor failing: a 502, nothing reserved, the reason logged without the key
  it("reserves nothing when the vendor fails", async () => {
    // Logs
    const logs: string[] = [];
    // The fakes, with a failing vendor
    const wired = deps({ streaming: fakeStreaming(true), logs });
    // Asked
    const response = await createLiveStartHandler(wired)(request(START_A));
    // Refused, nothing reserved, logged without the key
    expect([response.status, await liveMinutesUsed(wired.store, "a", NOW), logs, logs.join(" ").includes("aai-key")]).toEqual([502, 0, ["Live a token failed: The live service answered 401."], false]);
  });

  // The same conversation asking again reuses its reservation; a third time is refused
  it("reuses a conversation's reservation and caps its tokens", async () => {
    // The fakes
    const wired = deps();
    // The handler
    const handle = createLiveStartHandler(wired);
    // Three asks for one conversation
    const statuses = [(await handle(request(START_A))).status, (await handle(request(START_A))).status, (await handle(request(START_A))).status];
    // Two allowed, one refused, five minutes reserved once
    expect([statuses, await liveMinutesUsed(wired.store, "a", NOW)]).toEqual([[200, 200, 409], 5]);
  });

  // Step B: the agent's WebRTC token by default, counted against the call minutes, apart from step A's
  it("hands out the agent's call token and reserves call minutes", async () => {
    // The fakes
    const wired = deps();
    // Asked
    const body = await (await createLiveStartHandler(wired)(request({ kind: "b", conversationId: "conv-0100" }))).json();
    // The token, five minutes, 55 of 60 left; step A untouched
    expect([body.connection, body.conversationToken, body.grantedSeconds, body.minutesLeft, await liveMinutesUsed(wired.store, "b", NOW), await liveMinutesUsed(wired.store, "a", NOW)]).toEqual(["webrtc", "el-conversation-token", 300, 55, 5, 0]);
  });

  // Step B over a WebSocket when chosen on the server
  it("hands out a signed address when the server chooses WebSocket", async () => {
    // WebSocket chosen
    const body = await (await createLiveStartHandler(deps({ settings: { connection: "websocket" } }))(request({ kind: "b", conversationId: "conv-0101" }))).json();
    // The address
    expect([body.connection, body.signedUrl]).toEqual(["websocket", "wss://api.elevenlabs.io/v1/convai/conversation?token=x"]);
  });

  // The call minutes have their own limit
  it("refuses a call when the month's call minutes are used up", async () => {
    // A store with 60 call minutes reserved
    const store = new MemoryCounterStore();
    // Reserved
    await store.add(LIVE_KEYS.reserved("b", "2026-10"), 60);
    // Asked
    const response = await createLiveStartHandler(deps({ store }))(request({ kind: "b", conversationId: "conv-0102" }));
    // Refused with the call's words
    expect([response.status, (await response.json()).error]).toEqual([429, "This month’s phone-call minutes are used up."]);
  });

  // The counter down: refused rather than run uncounted (rule: an outage never lifts a cap)
  it("refuses when the counter cannot be reached", async () => {
    // A store that fails
    const broken: CounterStore = { increment: async () => { throw new Error("down"); }, read: async () => { throw new Error("down"); } };
    // Asked
    const response = await createLiveStartHandler(deps({ store: broken }))(request(START_A));
    // Paused
    expect([response.status, (await response.json()).error]).toEqual([503, "Live conversations are paused because the usage counter is unavailable."]);
  });

  // The rate limit applies
  it("counts each start against the live rate limit", async () => {
    // One a minute
    const handle = createLiveStartHandler(deps({ limits: { perMinute: 1, perDay: 10, scope: "live" } }));
    // Two different conversations
    const statuses = [(await handle(request(START_A))).status, (await handle(request({ kind: "a", conversationId: "conv-0002" }))).status];
    // The second refused
    expect(statuses).toEqual([200, 429]);
  });
});

// Group the checks on settling a live conversation
describe("live end route", () => {
  // The minutes not used are handed back, once
  it("hands back the unused minutes once", async () => {
    // The fakes
    const wired = deps();
    // Started (five reserved)
    await createLiveStartHandler(wired)(request(START_A));
    // The settler
    const end = createLiveEndHandler(wired);
    // Ended after 70 seconds, twice
    const [first, second] = [await (await end(request({ ...START_A, seconds: 70 }))).json(), await (await end(request({ ...START_A, seconds: 1 }))).json()];
    // Three handed back once; two minutes used
    expect([first, second, await liveMinutesUsed(wired.store, "a", NOW)]).toEqual([{ refunded: 3 }, { refunded: 0 }, 2]);
  });

  // A conversation that never reserved hands back nothing, and a stranger cannot settle
  it("hands back nothing it did not reserve, and needs the passphrase", async () => {
    // The fakes
    const wired = deps();
    // The settler
    const end = createLiveEndHandler(wired);
    // Never started; and a wrong passphrase
    const [unknown, stranger] = [await (await end(request({ kind: "a", conversationId: "conv-9999", seconds: 0 }))).json(), await end(request({ ...START_A, seconds: 0 }, null))];
    // Nothing; refused
    expect([unknown, stranger.status]).toEqual([{ refunded: 0 }, 401]);
  });
});
