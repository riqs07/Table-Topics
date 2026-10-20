// Fetches a fixed line's audio: its saved recording from the app's own files (decision 82), or for a small-talk line without one, the voice route; either is kept on the phone after the first time

// Load the passphrase header name
import { PASSPHRASE_HEADER } from "@/config/headers";
// Load the saved recordings
import { voiceClip } from "@/content/voiceClips";

// The name of the phone's store for line audio (app-specific, as setup rule S1 asks; bump the number to drop old audio after a voice change or a recording is made again)
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

// The line's audio, from the phone's store, its saved recording or the voice route, or null when there is none (no recording and no passphrase, no voice set up, or offline)
export async function questionAudio(promptId: string, { passphrase, fetchFn = fetch, cacheStorage = typeof caches === "undefined" ? null : caches }: VoiceClientOptions): Promise<Blob | null> {
  // The line's saved recording, when it has one
  const clip = voiceClip(promptId);
  // The phone's store, if it can be opened
  const store = cacheStorage ? await cacheStorage.open(VOICE_CACHE).catch(() => null) : null;
  // Audio kept from before: a recording under its own address, otherwise the route's audio
  const kept = store ? await store.match(clip ? clip.url : cacheKey(promptId)).catch(() => undefined) : undefined;
  // Use it
  if (kept) return kept.blob();
  // Without a recording or a passphrase there is nothing to ask for (the route would refuse)
  if (!clip && !passphrase) return null;
  // Ask for it
  let response: Response;
  // The network can fail
  try {
    // The saved recording from the app's own files, or the route with just the question's id
    response = clip ? await fetchFn(clip.url) : await fetchFn("/api/voice", { method: "POST", headers: { "content-type": "application/json", [PASSPHRASE_HEADER]: passphrase }, body: JSON.stringify({ promptId }) });
  } catch {
    // Offline: the phone's own voice instead
    return null;
  }
  // Refused or failed: the phone's own voice instead
  if (!response.ok) return null;
  // The audio
  const audio = await response.blob();
  // Keep it for next time, if the store is there
  await store?.put(clip ? clip.url : cacheKey(promptId), new Response(audio, { headers: { "content-type": "audio/mpeg" } })).catch(() => undefined);
  // Hand it back
  return audio;
}
