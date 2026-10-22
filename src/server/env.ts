// Reads server-only settings and fails with a clear message when one is missing (setup-requirements.md)
// None of these may start with NEXT_PUBLIC_, which would expose them in the browser

// Load the shortest passphrase allowed (shared with the Settings screen)
import { MIN_PASSPHRASE_LENGTH } from "@/config/headers";

// Address and token for the shared counter store used by rate limits
export interface CounterStoreSettings {
  // The store's REST address
  url: string;
  // The store's access token
  token: string;
}

// The settings the AI routes need
export interface ServerEnv {
  // Key for the Anthropic API (coach feedback)
  anthropicApiKey: string;
  // Passphrase that gates the AI routes
  accessSecret: string;
  // Shared counter store, or null to keep counters in memory (development only)
  counterStore: CounterStoreSettings | null;
}

// The environment variables, as a plain map (process.env in the app, a fixed object in tests)
type EnvSource = Record<string, string | undefined>;

// Read one required variable or explain how to set it
function required(source: EnvSource, name: string): string {
  // Take the value, ignoring surrounding spaces
  const value = source[name]?.trim();
  // Explain what is missing and where to set it
  if (!value) throw new Error(`${name} is not set. Add it to .env.local (and to the Vercel project settings when deployed). See documents/setup-requirements.md.`);
  // Hand back the value
  return value;
}

// Read the counter store settings; the Upstash integration may name them either way
export function readCounterStore(source: EnvSource = process.env): CounterStoreSettings | null {
  // Take the address under either name
  const url = source.KV_REST_API_URL ?? source.UPSTASH_REDIS_REST_URL;
  // Take the token under either name
  const token = source.KV_REST_API_TOKEN ?? source.UPSTASH_REDIS_REST_TOKEN;
  // Use the store only when both are present
  return url && token ? { url, token } : null;
}

// Read only the passphrase, or null when it is not set, so a caller's passphrase can be checked before any other setting is read and explained (the length rule is checked in readServerEnv)
export function readAccessSecret(source: EnvSource = process.env): string | null {
  // The value without surrounding spaces, or null when empty
  return source.APP_ACCESS_SECRET?.trim() || null;
}

// Read and check every server setting
export function readServerEnv(source: EnvSource = process.env): ServerEnv {
  // The AI key is required
  const anthropicApiKey = required(source, "ANTHROPIC_API_KEY");
  // The passphrase is required
  const accessSecret = required(source, "APP_ACCESS_SECRET");
  // The passphrase must be long enough to resist guessing
  if (accessSecret.length < MIN_PASSPHRASE_LENGTH) throw new Error(`APP_ACCESS_SECRET must be at least ${MIN_PASSPHRASE_LENGTH} characters long.`);
  // Read the shared counter store
  const store = readCounterStore(source);
  // In production, counters in server memory do not hold up, so the store is required (risk R4)
  if (!store && source.NODE_ENV === "production") throw new Error("The rate-limit store is not set up. Add the Upstash Redis integration in Vercel (it sets KV_REST_API_URL and KV_REST_API_TOKEN).");
  // Hand back the checked settings
  return { anthropicApiKey, accessSecret, counterStore: store };
}

// The ElevenLabs settings for the question voice
export interface VoiceSettings {
  // The API key (kept on the server; never sent to the browser)
  apiKey: string;
  // The voice to use
  voiceId: string;
}

// Read the voice settings, or null when the voice is not set up (the phone's own voice is used instead)
export function readVoiceSettings(source: EnvSource = process.env): VoiceSettings | null {
  // The key
  const apiKey = source.ELEVENLABS_API_KEY?.trim();
  // The voice
  const voiceId = source.ELEVENLABS_VOICE_ID?.trim();
  // Both are needed
  return apiKey && voiceId ? { apiKey, voiceId } : null;
}

// The ElevenLabs key alone, for speaking a conversation persona's written lines in their own voice (decision 84); null when not set, so the phone's own voice says them
export function readElevenLabsKey(source: EnvSource = process.env): string | null {
  // The key, if set
  return source.ELEVENLABS_API_KEY?.trim() || null;
}

// Which ElevenLabs model speaks conversation lines (decision 102): the faster, cheaper one, or the expressive one their recordings used
export type ConversationVoiceChoice = "turbo" | "v4";

// The conversation settings (decision 102): the monthly minutes and the voice model
export interface ConversationSettings {
  // Conversation minutes allowed a month
  minutesPerMonth: number;
  // Which voice model speaks the lines
  voiceModel: ConversationVoiceChoice;
}

// Read the conversation settings, using the defaults when they are not set; a value that cannot be used is an error naming the setting (rule T13)
export function readConversationSettings(source: EnvSource = process.env, defaults: { minutesPerMonth: number } = { minutesPerMonth: 150 }): ConversationSettings {
  // The minutes, if set
  const minutes = source.CONVERSATION_MINUTES_PER_MONTH?.trim();
  // A whole number from 0 up (0 turns written lines off)
  if (minutes && !/^\d{1,6}$/.test(minutes)) throw new Error("CONVERSATION_MINUTES_PER_MONTH must be a whole number of minutes, such as 150.");
  // The model, if set
  const model = source.CONVERSATION_VOICE_MODEL?.trim().toLowerCase();
  // Only the two choices
  if (model && model !== "turbo" && model !== "v4") throw new Error("CONVERSATION_VOICE_MODEL must be turbo or v4.");
  // The settings
  return { minutesPerMonth: minutes ? Number(minutes) : defaults.minutesPerMonth, voiceModel: model === "v4" ? "v4" : "turbo" };
}

// The deeper-analysis services (decision 91): the AssemblyAI key and the voice worker's address and shared secret, each null when not set or not usable, with what is wrong in words (they name settings, never values; rule T13)
export interface AnalysisSettings {
  // The AssemblyAI key, or null
  assemblyAiKey: string | null;
  // The voice worker, or null
  voiceWorker: { url: string; secret: string } | null;
  // What is wrong with a half-set setting, one sentence each
  problems: string[];
}

// The shortest worker secret allowed (the same rule as the passphrase)
export const MIN_WORKER_SECRET_LENGTH = MIN_PASSPHRASE_LENGTH;

// Read the deeper-analysis settings; a worker needs both its address and a long enough secret, and the address must be https (or http on this computer, for trying it locally)
export function readAnalysisSettings(source: EnvSource = process.env): AnalysisSettings {
  // The key, if set
  const assemblyAiKey = source.ASSEMBLYAI_API_KEY?.trim() || null;
  // The worker's address, if set
  const url = source.VOICE_WORKER_URL?.trim() || "";
  // Its secret, if set
  const secret = source.VOICE_WORKER_SECRET?.trim() || "";
  // What is wrong
  const problems: string[] = [];
  // A safe address: https anywhere, or http only on this computer
  const safe = /^https:\/\//.test(url) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(url);
  // An address that is not safe
  if (url && !safe) problems.push("VOICE_WORKER_URL must start with https:// (http:// only for localhost).");
  // One half without the other
  if (url && !secret) problems.push("VOICE_WORKER_URL is set but VOICE_WORKER_SECRET is not.");
  // (the other half)
  if (secret && !url) problems.push("VOICE_WORKER_SECRET is set but VOICE_WORKER_URL is not.");
  // A secret too short to resist guessing
  if (url && secret && secret.length < MIN_WORKER_SECRET_LENGTH) problems.push(`VOICE_WORKER_SECRET must be at least ${MIN_WORKER_SECRET_LENGTH} characters long.`);
  // The worker, when every part is right
  const voiceWorker = url && safe && secret.length >= MIN_WORKER_SECRET_LENGTH ? { url: url.replace(/\/+$/, ""), secret } : null;
  // Everything read
  return { assemblyAiKey, voiceWorker, problems };
}

// How the browser joins the ElevenLabs agent's call (decision 121): WebRTC, whose echo cancellation lets you talk over the persona on a phone speaker, or a WebSocket as a fallback
export type LiveCallConnection = "webrtc" | "websocket";

// The live-conversation settings (decisions 119 and 121): the keys and agent, each null when not set, and the monthly minutes
export interface LiveSettings {
  // The AssemblyAI key, for live step A's streaming tokens (the same key deeper analysis uses)
  assemblyAiKey: string | null;
  // The ElevenLabs key, for the agent's call tokens (it needs the ElevenLabs Agents permission)
  elevenLabsKey: string | null;
  // The ElevenLabs agent's id
  agentId: string | null;
  // Live minutes a month with AssemblyAI streaming
  minutesPerMonth: number;
  // Phone-call minutes a month with the ElevenLabs agent
  callMinutesPerMonth: number;
  // How the browser joins the call
  connection: LiveCallConnection;
}

// Read a whole number of minutes, or the default when not set; anything else is an error naming the setting (rule T13)
function wholeMinutes(source: EnvSource, name: string, fallback: number): number {
  // The value, if set
  const value = source[name]?.trim();
  // Not set: the default
  if (!value) return fallback;
  // A whole number from 0 up (0 turns that kind of live conversation off)
  if (!/^\d{1,6}$/.test(value)) throw new Error(`${name} must be a whole number of minutes, such as ${fallback}.`);
  // The number
  return Number(value);
}

// Read the live-conversation settings, with the given default minutes; a value that cannot be used is an error naming the setting
export function readLiveSettings(source: EnvSource = process.env, defaults: { minutesPerMonth: number; callMinutesPerMonth: number } = { minutesPerMonth: 150, callMinutesPerMonth: 60 }): LiveSettings {
  // The connection, if set
  const connection = source.LIVE_B_CONNECTION?.trim().toLowerCase();
  // Only the two choices
  if (connection && connection !== "webrtc" && connection !== "websocket") throw new Error("LIVE_B_CONNECTION must be webrtc or websocket.");
  // Everything read
  return {
    // The keys and the agent, each null when not set
    assemblyAiKey: source.ASSEMBLYAI_API_KEY?.trim() || null, elevenLabsKey: source.ELEVENLABS_API_KEY?.trim() || null, agentId: source.ELEVENLABS_AGENT_ID?.trim() || null,
    // The monthly minutes
    minutesPerMonth: wholeMinutes(source, "LIVE_MINUTES_PER_MONTH", defaults.minutesPerMonth), callMinutesPerMonth: wholeMinutes(source, "LIVE_B_MINUTES_PER_MONTH", defaults.callMinutesPerMonth),
    // WebRTC unless chosen otherwise
    connection: connection === "websocket" ? "websocket" : "webrtc",
  };
}
