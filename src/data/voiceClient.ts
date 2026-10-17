// Fetches a small-talk question's audio from the voice route, keeping it on the phone after the first time

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";

// The name of the phone's store for question audio (app-specific, as setup rule S1 asks; bump the number to drop old audio after a voice change)
export const VOICE_CACHE = "voicelab-voice-v1";

// What fetching the audio needs
export interface VoiceClientOptions {
  // The passphrase saved on this device
  passphrase: string;
  // The network (replaced in tests)
  fetchFn?: typeof fetch;
  // The phone's store for audio (missing in some browsers and in tests)
  cacheStorage?: CacheStorage | null;
}

// The key a question's audio is kept under
const cacheKey = (promptId: string) => `/voice/${encodeURIComponent(promptId)}.mp3`;

// The question's audio, from the phone's store or the voice route, or null when there is none (no passphrase, no voice set up, or offline)
export async function questionAudio(promptId: string, { passphrase, fetchFn = fetch, cacheStorage = typeof caches === "undefined" ? null : caches }: VoiceClientOptions): Promise<Blob | null> {
  // The phone's store, if it can be opened
  const store = cacheStorage ? await cacheStorage.open(VOICE_CACHE).catch(() => null) : null;
  // Audio kept from before
  const kept = store ? await store.match(cacheKey(promptId)).catch(() => undefined) : undefined;
  // Use it
  if (kept) return kept.blob();
  // Without a passphrase the route would refuse
  if (!passphrase) return null;
  // Ask the route
  let response: Response;
  // The network can fail
  try {
    // Just the question's id
    response = await fetchFn("/api/voice", { method: "POST", headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase }, body: JSON.stringify({ promptId }) });
  } catch {
    // Offline: the phone's own voice instead
    return null;
  }
  // Refused or failed: the phone's own voice instead
  if (!response.ok) return null;
  // The audio
  const audio = await response.blob();
  // Keep it for next time, if the store is there
  await store?.put(cacheKey(promptId), new Response(audio, { headers: { "content-type": "audio/mpeg" } })).catch(() => undefined);
  // Hand it back
  return audio;
}
