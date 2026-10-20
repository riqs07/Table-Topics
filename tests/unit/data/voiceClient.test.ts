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

// The first address a stand-in network was asked for
const firstUrl = (network: ReturnType<typeof audioNetwork>) => (network.mock.calls[0] as unknown as [string] | undefined)?.[0];

// A line with no saved recording, which goes to the voice route (every line in the app has one today; the route is kept for lines made on the fly later)
const UNRECORDED = "zz01";

// Group the checks about fetching a line's audio
describe("questionAudio", () => {
  // A saved recording comes from the app's own files, with no passphrase, and is kept on the phone under its own address (decision 82)
  it("fetches a saved recording once, without the passphrase, then keeps it", async () => {
    // A store and a network
    const caches = fakeCaches();
    // The network
    const network = audioNetwork();
    // Twice
    const first = await questionAudio("st01", { passphrase: "", fetchFn: network, cacheStorage: caches.storage });
    // Again
    const second = await questionAudio("st01", { passphrase: "", fetchFn: network, cacheStorage: caches.storage });
    // One plain fetch of the file, kept under its address, and the same audio both times
    expect([network.mock.calls.length, firstUrl(network), [...caches.kept.keys()], first?.size, second?.size]).toEqual([1, "/clips/st01.mp3", ["/clips/st01.mp3"], 3, 3]);
  });

  // Lines with the same words share one file
  it("shares one file between lines with the same words", async () => {
    // The network
    const network = audioNetwork();
    // A lesson that asks the same question as an everyday one
    await questionAudio("stl1", { passphrase: "", fetchFn: network, cacheStorage: null });
    // The everyday question's file
    expect(firstUrl(network)).toBe("/clips/st01.mp3");
  });

  // A saved recording that cannot be fetched means the phone's own voice
  it("gives nothing when a saved recording cannot be fetched", async () => {
    // Missing
    const missing = await questionAudio("st01", { passphrase: "", fetchFn: vi.fn(async () => new Response("", { status: 404 })), cacheStorage: null });
    // Offline
    const offline = await questionAudio("st01", { passphrase: "", fetchFn: vi.fn(async () => { throw new TypeError("offline"); }), cacheStorage: null });
    // Both nothing
    expect([missing, offline]).toEqual([null, null]);
  });

  // A line without a recording: the first time it is fetched from the route with the passphrase and kept; the second time it comes from the phone
  it("fetches an unrecorded line once with the passphrase, then keeps it on the phone", async () => {
    // A store and a network
    const caches = fakeCaches();
    // The network
    const network = audioNetwork();
    // Twice
    const first = await questionAudio(UNRECORDED, { passphrase: "secret", fetchFn: network, cacheStorage: caches.storage });
    // Again
    const second = await questionAudio(UNRECORDED, { passphrase: "secret", fetchFn: network, cacheStorage: caches.storage });
    // The call made
    const [url, init] = network.mock.calls[0] as unknown as [string, RequestInit];
    // Confirm one call with the id only, the voice's own store, and the same audio both times
    expect([network.mock.calls.length, url, JSON.parse(String(init.body)), caches.opened[0], first?.size, second?.size]).toEqual([1, "/api/voice", { promptId: UNRECORDED }, VOICE_CACHE, 3, 3]);
  });

  // No passphrase, a refusal, or no network all mean the phone's own voice
  it("gives nothing when it cannot get an unrecorded line's audio", async () => {
    // No passphrase
    const none = await questionAudio(UNRECORDED, { passphrase: "", fetchFn: audioNetwork(), cacheStorage: null });
    // Refused
    const refused = await questionAudio(UNRECORDED, { passphrase: "secret", fetchFn: vi.fn(async () => new Response("{}", { status: 500 })), cacheStorage: null });
    // Offline
    const offline = await questionAudio(UNRECORDED, { passphrase: "secret", fetchFn: vi.fn(async () => { throw new TypeError("offline"); }), cacheStorage: null });
    // Confirm all three
    expect([none, refused, offline]).toEqual([null, null, null]);
  });
});
