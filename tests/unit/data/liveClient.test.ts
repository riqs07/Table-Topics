// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the client being checked
import { endLive, liveRefusalLine, startLive } from "@/data/liveClient";

// A network that answers with the given status and body, noting each call
function answering(status: number, body: unknown): typeof fetch & { calls: Array<{ url: string; init: RequestInit }> } {
  // The calls
  const calls: Array<{ url: string; init: RequestInit }> = [];
  // The network
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    // Noted
    calls.push({ url: String(input), init: init ?? {} });
    // The answer
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch & { calls: typeof calls };
  // With its calls
  fetchFn.calls = calls;
  // Handed back
  return fetchFn;
}

// Group the checks on the live client (decisions 140 and 142)
describe("live client", () => {
  // A grant comes back as it is
  it("hands back a granted token", async () => {
    // The network
    const fetchFn = answering(200, { kind: "a", token: "tok", grantedSeconds: 300, minutesLeft: 140 });
    // Asked
    const result = await startLive("a", "conv-0001", { passphrase: "pass", fetchFn, online: () => true });
    // The grant, sent with the passphrase
    expect([result, JSON.parse(String(fetchFn.calls[0]?.init.body)), (fetchFn.calls[0]?.init.headers as Record<string, string>)["x-voicelab-passphrase"]]).toEqual([{ grant: { kind: "a", token: "tok", grantedSeconds: 300, minutesLeft: 140 } }, { kind: "a", conversationId: "conv-0001" }, "pass"]);
  });

  // Each refusal is told apart
  it("tells the reasons apart", async () => {
    // Over budget, not set up, another error, a broken grant
    const results = await Promise.all([
      startLive("a", "c-0000001", { passphrase: "p", fetchFn: answering(429, { budget: true }), online: () => true }),
      startLive("a", "c-0000001", { passphrase: "p", fetchFn: answering(503, { notSetUp: true }), online: () => true }),
      startLive("a", "c-0000001", { passphrase: "p", fetchFn: answering(502, { error: "x" }), online: () => true }),
      startLive("b", "c-0000001", { passphrase: "p", fetchFn: answering(200, { kind: "b", connection: "webrtc", grantedSeconds: 300, minutesLeft: 1 }), online: () => true }),
      startLive("a", "c-0000001", { passphrase: "", fetchFn: answering(200, {}), online: () => true }),
      startLive("a", "c-0000001", { passphrase: "p", fetchFn: answering(200, {}), online: () => false }),
    ]);
    // Each reason
    expect(results).toEqual([{ refused: "budget" }, { refused: "not-set-up" }, { refused: "unavailable" }, { refused: "unavailable" }, { refused: "no-coach" }, { refused: "offline" }]);
  });

  // A network failure is unavailable
  it("treats a failed network as unavailable", async () => {
    // A network that throws
    const result = await startLive("a", "conv-0001", { passphrase: "p", fetchFn: async () => { throw new TypeError("Failed to fetch"); }, online: () => true });
    // Unavailable
    expect(result).toEqual({ refused: "unavailable" });
  });

  // Ending is sent kept alive, bounded, and never fails out loud
  it("settles kept alive and quietly", async () => {
    // The network
    const fetchFn = answering(200, { refunded: 2 });
    // Settled with an overlong time, then with a network that fails
    await endLive("a", "conv-0001", 9_999, { passphrase: "p", fetchFn });
    // Never throws
    await endLive("a", "conv-0001", 10, { passphrase: "p", fetchFn: async () => { throw new TypeError("offline"); } });
    // Kept alive, the time bounded to what the route accepts
    expect([fetchFn.calls[0]?.url, fetchFn.calls[0]?.init.keepalive, JSON.parse(String(fetchFn.calls[0]?.init.body)).seconds]).toEqual(["/api/live/end", true, 420]);
  });

  // The lines say why and what happens instead
  it("says each reason in one line", () => {
    // Each
    expect([liveRefusalLine("budget", "a", "turns end automatically"), liveRefusalLine("not-set-up", "b", "it uses live turns"), liveRefusalLine("dropped", "a", "turns now end automatically")]).toEqual(["This month’s live minutes are used up, so turns end automatically.", "Phone calls aren’t set up on the server, so it uses live turns.", "The live connection dropped, so turns now end automatically."]);
  });
});
