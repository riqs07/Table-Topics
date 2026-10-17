// Load the test helpers from the test runner
import { describe, expect, it, vi } from "vitest";
// Load the audio fetcher being checked
import { VOICE_CACHE, questionAudio } from "@/data/voiceClient";

// A stand-in for the phone's store of responses, remembering which store was opened
function fakeCaches() {
  // The kept responses, by key
  const kept = new Map<string, Response>();
  // The stores opened
  const opened: string[] = [];
  // The one store
  const store = { match: async (key: string) => kept.get(key)?.clone(), put: async (key: string, response: Response) => void kept.set(key, response) };
  // The store of stores
  const storage = { open: async (name: string) => (opened.push(name), store) } as unknown as CacheStorage;
  // Hand back both
  return { storage, opened, kept };
}

// A network answering with audio
const audioNetwork = () => vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "audio/mpeg" } }));

// Group the checks about fetching a question's audio
describe("questionAudio", () => {
  // The first time it is fetched with the passphrase and kept; the second time it comes from the phone
  it("fetches once with the passphrase, then keeps it on the phone", async () => {
    // A store and a network
    const caches = fakeCaches();
    // The network
    const network = audioNetwork();
    // Twice
    const first = await questionAudio("st01", { passphrase: "secret", fetchFn: network, cacheStorage: caches.storage });
    // Again
    const second = await questionAudio("st01", { passphrase: "secret", fetchFn: network, cacheStorage: caches.storage });
    // The call made
    const [url, init] = network.mock.calls[0] as unknown as [string, RequestInit];
    // Confirm one call with the id only, the voice's own store, and the same audio both times
    expect([network.mock.calls.length, url, JSON.parse(String(init.body)), caches.opened[0], first?.size, second?.size]).toEqual([1, "/api/voice", { promptId: "st01" }, VOICE_CACHE, 3, 3]);
  });

  // No passphrase, a refusal, or no network all mean the phone's own voice
  it("gives nothing when it cannot get the audio", async () => {
    // No passphrase
    const none = await questionAudio("st01", { passphrase: "", fetchFn: audioNetwork(), cacheStorage: null });
    // Refused
    const refused = await questionAudio("st01", { passphrase: "secret", fetchFn: vi.fn(async () => new Response("{}", { status: 500 })), cacheStorage: null });
    // Offline
    const offline = await questionAudio("st01", { passphrase: "secret", fetchFn: vi.fn(async () => { throw new TypeError("offline"); }), cacheStorage: null });
    // Confirm all three
    expect([none, refused, offline]).toEqual([null, null, null]);
  });
});
