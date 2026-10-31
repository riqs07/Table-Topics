// Checks for what "Delete all my data" clears beyond the database
import { describe, expect, it, vi } from "vitest";
// The code under test
import { clearBrowserData, keysToClear } from "@/data/clearBrowserData";

// A small stand-in for browser storage
function fakeStorage(entries: Record<string, string>): Storage {
  // The entries kept as a map
  const map = new Map(Object.entries(entries));
  // The parts the clearer uses
  return { get length() { return map.size; }, key: (index: number) => [...map.keys()][index] ?? null, getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => void map.set(key, value), removeItem: (key: string) => void map.delete(key), clear: () => map.clear() } as Storage;
}

// Group the checks
describe("clearBrowserData", () => {
  // Every app key goes except the passphrase and the colour choice; other sites' keys are left alone
  it("picks every app key except the passphrase and colour choice", () => {
    // Confirm the choice
    expect(keysToClear(["voicelab-welcome-seen", "voicelab-passphrase", "voicelab-color-mode", "voicelab-practice-journal", "other-app"])).toEqual(["voicelab-welcome-seen", "voicelab-practice-journal"]);
  });

  // The notes and the question cache are cleared
  it("removes the notes and the spoken-question cache", async () => {
    // Storage with notes, a passphrase and a stranger's key
    const storage = fakeStorage({ "voicelab-steps-ticked": "x", "voicelab-passphrase": "secret-secret-secret", "other-app": "y" });
    // A cache store
    const cacheStorage = { delete: vi.fn().mockResolvedValue(true) } as unknown as CacheStorage;
    // Cleared
    await clearBrowserData(storage, cacheStorage);
    // Confirm what is left and what was deleted
    expect([storage.getItem("voicelab-steps-ticked"), storage.getItem("voicelab-passphrase"), storage.getItem("other-app"), cacheStorage.delete]).toEqual([null, "secret-secret-secret", "y", expect.any(Function)]);
    // Confirm the cache was asked to go
    expect(cacheStorage.delete).toHaveBeenCalledWith("voicelab-voice-v1");
  });

  // A failing storage or cache does not stop the delete
  it("survives blocked storage and a failing cache", async () => {
    // Storage that throws on every read
    const storage = { get length() { throw new Error("blocked"); } } as unknown as Storage;
    // A cache that fails
    const cacheStorage = { delete: vi.fn().mockRejectedValue(new Error("no")) } as unknown as CacheStorage;
    // Confirm it finishes without throwing
    await expect(clearBrowserData(storage, cacheStorage)).resolves.toBeUndefined();
  });
});
