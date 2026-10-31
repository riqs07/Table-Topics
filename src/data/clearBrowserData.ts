// Clears what "Delete all my data" must remove beyond the browser database: the app's own browser-storage notes (welcome seen, steps ticked, journal, drafts and the like) and its cache of spoken questions. The coach passphrase is kept, since it is a key the owner typed rather than their data, and the light or dark choice is kept, since it only describes the screen; the confirmation text says so

// Where the passphrase and the colour choice are kept, each left alone
const KEPT_KEYS = new Set(["voicelab-passphrase", "voicelab-color-mode"]);
// The start of every key this app writes (setup rule S1)
const PREFIX = "voicelab-";
// The cache of spoken questions (the same name as src/data/voiceClient.ts, kept here as text so this file needs nothing from it)
const VOICE_CACHE = "voicelab-voice-v1";

// The keys that will go: every one of the app's, except those kept
export function keysToClear(keys: Iterable<string>): string[] {
  // Each of the app's keys that is not kept
  return [...keys].filter((key) => key.startsWith(PREFIX) && !KEPT_KEYS.has(key));
}

// Remove the app's browser-storage notes and its spoken-question cache; a failure in either (blocked storage, no cache support) is swallowed, since the database is already gone
export async function clearBrowserData(storage: Storage | null = typeof localStorage === "undefined" ? null : localStorage, cacheStorage: CacheStorage | null = typeof caches === "undefined" ? null : caches): Promise<void> {
  // The notes
  try {
    // Every key present
    const keys = storage ? Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => key !== null) : [];
    // Each that must go
    for (const key of keysToClear(keys)) storage?.removeItem(key);
  } catch {
    // Blocked storage holds nothing to clear
  }
  // The cache
  try {
    // Gone
    await cacheStorage?.delete(VOICE_CACHE);
  } catch {
    // No cache support: nothing kept there
  }
}
