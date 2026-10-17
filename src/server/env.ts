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
function counterStore(source: EnvSource): CounterStoreSettings | null {
  // Take the address under either name
  const url = source.KV_REST_API_URL ?? source.UPSTASH_REDIS_REST_URL;
  // Take the token under either name
  const token = source.KV_REST_API_TOKEN ?? source.UPSTASH_REDIS_REST_TOKEN;
  // Use the store only when both are present
  return url && token ? { url, token } : null;
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
  const store = counterStore(source);
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
