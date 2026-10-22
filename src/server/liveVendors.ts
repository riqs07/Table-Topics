// The two live vendors' token calls (decisions 119 and 121), made on the server so the keys never reach the browser. AssemblyAI: GET /v3/token on its streaming host with the key in Authorization, giving a single-use token whose socket must open within expires_in_seconds and may stay open at most max_session_duration_seconds (60 to 10,800). ElevenLabs: GET /v1/convai/conversation/token (WebRTC) or /get-signed-url (WebSocket) with the key in xi-api-key, for the agent. Shapes checked in the vendors' own SDKs (assemblyai 4.41.7, @elevenlabs/elevenlabs-js 2.74.0); the docs sites were not reachable from the build environment

// Load the schema library, to check the vendors' replies
import { z } from "zod";
// Load the connection type
import type { LiveCallConnection } from "@/server/env";

// AssemblyAI's streaming host
export const ASSEMBLYAI_STREAMING_HOST = "https://streaming.assemblyai.com";
// ElevenLabs' API host
export const ELEVENLABS_API_HOST = "https://api.elevenlabs.io";
// How long a token call may take before giving up, in milliseconds
const TOKEN_TIMEOUT_MS = 8_000;

// Something that issues AssemblyAI streaming tokens (the real one, or a fake in tests)
export interface StreamingTokens {
  // A single-use token: its socket must open within expiresInSeconds and may stay open maxSessionSeconds
  token(options: { expiresInSeconds: number; maxSessionSeconds: number }): Promise<string>;
}

// What the agent's call needs in the browser: a WebRTC conversation token or a signed WebSocket address
export type AgentGrant = { connection: "webrtc"; conversationToken: string } | { connection: "websocket"; signedUrl: string };

// Something that starts the ElevenLabs agent's calls (the real one, or a fake in tests)
export interface AgentTokens {
  // A token or signed address for one call
  start(connection: LiveCallConnection): Promise<AgentGrant>;
}

// AssemblyAI's token reply
const StreamingTokenReply = z.object({ token: z.string().min(1) });
// ElevenLabs' WebRTC token reply
const AgentTokenReply = z.object({ token: z.string().min(1) });
// ElevenLabs' signed address reply
const SignedUrlReply = z.object({ signed_url: z.string().url() });

// Ask a vendor for JSON, with a time limit; a refusal is an error with its status (never the reply's words, which could hold details)
async function getJson(fetchFn: typeof fetch, url: string, headers: Record<string, string>): Promise<unknown> {
  // Ask
  const response = await fetchFn(url, { method: "GET", headers, signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS) });
  // Refused or failed
  if (!response.ok) throw new Error(`The live service answered ${response.status}.`);
  // The reply
  return response.json();
}

// AssemblyAI's streaming tokens
export function createAssemblyAiStreamingTokens(apiKey: string, fetchFn: typeof fetch = fetch, host: string = ASSEMBLYAI_STREAMING_HOST): StreamingTokens {
  // Hand back the issuer
  return {
    // One token
    async token({ expiresInSeconds, maxSessionSeconds }) {
      // The settings, as the API names them
      const query = new URLSearchParams({ expires_in_seconds: String(expiresInSeconds), max_session_duration_seconds: String(maxSessionSeconds) });
      // Asked for with the key
      const reply = StreamingTokenReply.parse(await getJson(fetchFn, `${host}/v3/token?${query.toString()}`, { authorization: apiKey }));
      // The token
      return reply.token;
    },
  };
}

// ElevenLabs' agent call tokens for one agent
export function createElevenLabsAgentTokens(apiKey: string, agentId: string, fetchFn: typeof fetch = fetch, host: string = ELEVENLABS_API_HOST): AgentTokens {
  // Hand back the issuer
  return {
    // One call
    async start(connection) {
      // The agent, as the API names it
      const query = new URLSearchParams({ agent_id: agentId });
      // WebRTC: a conversation token
      if (connection === "webrtc") {
        // Asked for with the key
        const reply = AgentTokenReply.parse(await getJson(fetchFn, `${host}/v1/convai/conversation/token?${query.toString()}`, { "xi-api-key": apiKey }));
        // The token
        return { connection, conversationToken: reply.token };
      }
      // WebSocket: a signed address
      const reply = SignedUrlReply.parse(await getJson(fetchFn, `${host}/v1/convai/conversation/get-signed-url?${query.toString()}`, { "xi-api-key": apiKey }));
      // The address
      return { connection, signedUrl: reply.signed_url };
    },
  };
}
