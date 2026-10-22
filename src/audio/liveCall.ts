// Live conversations, step B (decision 142): a phone call with the ElevenLabs agent through its browser SDK, loaded only when a call starts (so people who never use it download none of it). WebRTC by default, for its echo cancellation (you can talk over the persona on a phone speaker), or a WebSocket. The agent's events are handed on with the time each arrived, for the transcript and its timing; the SDK's audio worklets are served from this site (/vendor/elevenlabs), since the content policy does not allow blob: scripts

// Load the call's event type
import type { CallEvent, CallOverrides } from "@/core/liveCall";
// Load the grant type
import type { LiveGrant } from "@/data/liveClient";

// Where the SDK's worklets are served from (copies of @elevenlabs/client's own files, checked by a unit test)
export const CALL_WORKLETS = { rawAudioProcessor: "/vendor/elevenlabs/rawAudioProcessor.js", audioConcatProcessor: "/vendor/elevenlabs/audioConcatProcessor.js" } as const;

// What the page hears from a call
export interface CallHandlers {
  // Each event, with when it arrived
  onEvent(event: CallEvent): void;
  // The call connected
  onConnected(): void;
  // The call ended by itself (the agent hung up, the time ran out, or the connection dropped), with whether it was an error
  onEnded(error: boolean): void;
}

// A call under way
export interface LiveCall {
  // Hang up
  end(): Promise<void>;
}

// Starts a call (the SDK in the app, a fake in checks); throws when it cannot connect
export type StartCall = (grant: Extract<LiveGrant, { kind: "b" }>, overrides: CallOverrides["overrides"], handlers: CallHandlers) => Promise<LiveCall>;

// The real call through the SDK, loaded on first use
export const startElevenLabsCall: StartCall = async (grant, overrides, handlers) => {
  // The SDK, loaded now
  const { Conversation } = await import("@elevenlabs/client");
  // The time now
  const now = () => Date.now();
  // Whether it connected
  let connected = false;
  // The callbacks shared by both connection kinds
  const callbacks = {
    // The SDK's overrides
    overrides,
    // The worklets from this site
    workletPaths: CALL_WORKLETS,
    // Connected
    onConnect: () => {
      // Noted
      connected = true;
      // Said
      handlers.onConnected();
    },
    // Ended: by the agent or the time (not an error), or by a fault
    onDisconnect: (details: { reason: string }) => handlers.onEnded(connected ? details.reason === "error" : true),
    // A fault: logged without details (they can hold the address), the end comes through onDisconnect
    onError: () => console.warn("The phone call reported a problem."),
    // Each line, yours or the agent's
    onMessage: (message: { role: "user" | "agent"; message: string }) => handlers.onEvent({ type: message.role === "user" ? "user" : "agent", at: now(), text: message.message }),
    // The agent speaking or listening
    onModeChange: ({ mode }: { mode: "speaking" | "listening" }) => handlers.onEvent({ type: "mode", at: now(), mode }),
    // How sure it is that you are talking
    onVadScore: ({ vadScore }: { vadScore: number }) => handlers.onEvent({ type: "vad", at: now(), score: vadScore }),
    // You cut the agent short
    onInterruption: () => handlers.onEvent({ type: "interruption", at: now() }),
    // The agent's line cut to what was said
    onAgentResponseCorrection: (correction: { corrected_agent_response: string }) => handlers.onEvent({ type: "correction", at: now(), text: correction.corrected_agent_response }),
  };
  // Started over WebRTC with the token, or a WebSocket with the signed address
  const session = grant.connection === "webrtc" ? await Conversation.startSession({ ...callbacks, conversationToken: grant.conversationToken, connectionType: "webrtc" }) : await Conversation.startSession({ ...callbacks, signedUrl: grant.signedUrl, connectionType: "websocket" });
  // Hanging up
  return { end: () => session.endSession() };
};
