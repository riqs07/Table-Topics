// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the vendor clients being checked
import { createAssemblyAiStreamingTokens, createElevenLabsAgentTokens } from "@/server/liveVendors";
// Load the live settings reader
import { readLiveSettings } from "@/server/env";

// A fake network that notes each call and answers with the given status and body
function fakeFetch(status: number, body: unknown): typeof fetch & { calls: Array<{ url: string; headers: Record<string, string> }> } {
  // The calls
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  // The network
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    // Noted
    calls.push({ url: String(input), headers: init?.headers as Record<string, string> });
    // The answer
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch & { calls: typeof calls };
  // With its calls
  fetchFn.calls = calls;
  // Handed back
  return fetchFn;
}

// Group the checks on the vendors' token calls (decisions 140 and 142)
describe("live vendor tokens", () => {
  // AssemblyAI: GET /v3/token on the streaming host, the key in Authorization, both times as the API names them
  it("asks AssemblyAI for a streaming token with the key and both times", async () => {
    // The network
    const fetchFn = fakeFetch(200, { token: "tok" });
    // Asked
    const token = await createAssemblyAiStreamingTokens("aai-key", fetchFn).token({ expiresInSeconds: 60, maxSessionSeconds: 300 });
    // The token, the address and the key
    expect([token, fetchFn.calls[0]?.url, fetchFn.calls[0]?.headers]).toEqual(["tok", "https://streaming.assemblyai.com/v3/token?expires_in_seconds=60&max_session_duration_seconds=300", { authorization: "aai-key" }]);
  });

  // A refusal is an error with the status only
  it("fails with the status when AssemblyAI refuses", async () => {
    // Refused
    await expect(createAssemblyAiStreamingTokens("aai-key", fakeFetch(401, { error: "bad key aai-key" })).token({ expiresInSeconds: 60, maxSessionSeconds: 300 })).rejects.toThrow("The live service answered 401.");
  });

  // A reply without a token is an error
  it("fails on a reply without a token", async () => {
    // No token
    await expect(createAssemblyAiStreamingTokens("aai-key", fakeFetch(200, {})).token({ expiresInSeconds: 60, maxSessionSeconds: 300 })).rejects.toThrow();
  });

  // ElevenLabs: the WebRTC token and the signed address, the key in xi-api-key
  it("asks ElevenLabs for a WebRTC token or a signed address for the agent", async () => {
    // The two networks
    const [rtc, socket] = [fakeFetch(200, { token: "rtc-token" }), fakeFetch(200, { signed_url: "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=a&conversation_signature=s" })];
    // Asked both ways
    const [first, second] = [await createElevenLabsAgentTokens("el-key", "agent_1", rtc).start("webrtc"), await createElevenLabsAgentTokens("el-key", "agent_1", socket).start("websocket")];
    // Each answer and address
    expect([first, rtc.calls[0]?.url, rtc.calls[0]?.headers, second.connection, socket.calls[0]?.url]).toEqual([{ connection: "webrtc", conversationToken: "rtc-token" }, "https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=agent_1", { "xi-api-key": "el-key" }, "websocket", "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=agent_1"]);
  });
});

// Group the checks on reading the live settings
describe("readLiveSettings", () => {
  // Defaults, the keys and the agent
  it("reads the keys, the agent and the default minutes", () => {
    // Read
    const settings = readLiveSettings({ ASSEMBLYAI_API_KEY: " a ", ELEVENLABS_API_KEY: "e", ELEVENLABS_AGENT_ID: "agent_8101m5j7zsgxer6ts7x3wvypahj7" }, { minutesPerMonth: 150, callMinutesPerMonth: 60 });
    // As set, with the defaults
    expect(settings).toEqual({ assemblyAiKey: "a", elevenLabsKey: "e", agentId: "agent_8101m5j7zsgxer6ts7x3wvypahj7", minutesPerMonth: 150, callMinutesPerMonth: 60, connection: "webrtc" });
  });

  // Set values, and nothing set
  it("reads set minutes and the connection, and nulls for missing keys", () => {
    // Read
    const settings = readLiveSettings({ LIVE_MINUTES_PER_MONTH: "30", LIVE_B_MINUTES_PER_MONTH: "0", LIVE_B_CONNECTION: "WebSocket" });
    // As set
    expect(settings).toEqual({ assemblyAiKey: null, elevenLabsKey: null, agentId: null, minutesPerMonth: 30, callMinutesPerMonth: 0, connection: "websocket" });
  });

  // A value that cannot be used is named
  it("names a setting that cannot be used", () => {
    // Each wrong
    expect([() => readLiveSettings({ LIVE_MINUTES_PER_MONTH: "lots" }), () => readLiveSettings({ LIVE_B_MINUTES_PER_MONTH: "-5" }), () => readLiveSettings({ LIVE_B_CONNECTION: "pigeon" })].map((read) => {
      // The message
      try {
        // Read
        read();
        // No error
        return "";
      } catch (error) {
        // Its words
        return (error as Error).message;
      }
    })).toEqual(["LIVE_MINUTES_PER_MONTH must be a whole number of minutes, such as 150.", "LIVE_B_MINUTES_PER_MONTH must be a whole number of minutes, such as 60.", "LIVE_B_CONNECTION must be webrtc or websocket."]);
  });
});
