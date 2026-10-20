// Load the test helpers from the test runner
import { beforeEach, describe, expect, it, vi } from "vitest";
// Load Node's file reader and sandbox runner
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

// The service worker's source, as the browser would load it
const SOURCE = readFileSync("public/sw.js", "utf8");
// The site's address in these checks
const ORIGIN = "https://voicelab.example";

// What the sandboxed worker exposes back to the test
interface Worker {
  // The routing decision for a request
  strategyFor(url: URL, mode: string): string;
  // Whether a cache is an older version to delete
  isOldVersion(name: string): boolean;
  // Event handlers the worker registered, by event name
  handlers: Record<string, (event: unknown) => void>;
  // Files the install step stored
  precached: string[];
}

// Load the worker into a fresh sandbox with fake browser parts
function loadWorker(): Worker {
  // Collected event handlers
  const handlers: Record<string, (event: unknown) => void> = {};
  // Files stored during install
  const precached: string[] = [];
  // A fake cache that records what is added
  const cache = {
    // Record every saved address
    addAll: vi.fn(async (urls: string[]) => void precached.push(...urls)),
    // Saving one response does nothing here
    put: vi.fn(),
    // Every saved page's HTML refers to one built script
    match: vi.fn(async () => new Response('<script src="/_next/static/chunks/page-abc.js"></script>')),
  };
  // The fake worker global
  const self: Record<string, unknown> = {
    // Record each handler the worker registers
    addEventListener: (name: string, handler: (event: unknown) => void) => void (handlers[name] = handler),
    // The site's address
    location: { origin: ORIGIN },
    // Skip-waiting and claim do nothing here
    skipWaiting: vi.fn(), clients: { claim: vi.fn() },
  };
  // Fake cache storage: holds a saved copy of /sessions, matched only when the query is ignored
  const caches = { open: vi.fn(async () => cache), keys: vi.fn(async () => []), delete: vi.fn(), match: vi.fn(async (request: { url: string }, options?: { ignoreSearch?: boolean }) => (new URL(request.url).pathname === "/sessions" && options?.ignoreSearch ? new Response("saved sessions page") : undefined)) };
  // Run the worker's code with the fakes
  runInNewContext(SOURCE, { self, caches, fetch: vi.fn(async () => { throw new TypeError("offline"); }), Response, URL, Promise });
  // Hand back what the worker exposed
  return { strategyFor: self.voicelabStrategyFor as Worker["strategyFor"], isOldVersion: self.voicelabIsOldVersion as Worker["isOldVersion"], handlers, precached };
}

// The worker under test
let worker: Worker;
// Load a fresh worker before each check
beforeEach(() => {
  // Load it
  worker = loadWorker();
});

// Group the checks about how requests are handled
describe("service worker routing", () => {
  // The AI route must never come from a cache
  it("never caches the feedback API", () => {
    // Confirm the API goes to the network
    expect(worker.strategyFor(new URL(`${ORIGIN}/api/feedback`), "cors")).toBe("network");
  });

  // Built files have content hashes in their names, so a cached copy is always right
  it("serves built files and icons from the cache first", () => {
    // Confirm a built script
    expect(worker.strategyFor(new URL(`${ORIGIN}/_next/static/chunks/app.js`), "no-cors")).toBe("cache-first");
    // Confirm an icon
    expect(worker.strategyFor(new URL(`${ORIGIN}/icons/icon-192.png`), "no-cors")).toBe("cache-first");
  });

  // Pages try the network for the latest version, falling back to the saved copy offline
  it("loads pages from the network first", () => {
    // Confirm a page navigation
    expect(worker.strategyFor(new URL(`${ORIGIN}/history`), "navigate")).toBe("network-first");
  });

  // Other sites are left alone
  it("leaves other sites alone", () => {
    // Confirm another origin goes straight to the network
    expect(worker.strategyFor(new URL("https://fonts.example/font.woff2"), "no-cors")).toBe("network");
  });
});

// Group the checks about clearing old caches
describe("service worker cleanup", () => {
  // Only older versions of the worker's own cache go; the saved voice recordings and anything else stay (decision 82)
  it("deletes only older versions of its own cache", () => {
    // An old version, this version, the voice store, and another store
    expect(["voicelab-v2", "voicelab-v3", "voicelab-voice-v1", "other"].map(worker.isOldVersion)).toEqual([true, false, false, false]);
  });
});

// Group the checks about installing the worker
describe("service worker install", () => {
  // The main pages (including the one page that shows any session) are saved on install so the app opens offline
  it("saves the main pages when installed", async () => {
    // Collect the work the install step waits for
    let pending: Promise<unknown> = Promise.resolve();
    // Run the install handler
    worker.handlers.install!({ waitUntil: (promise: Promise<unknown>) => void (pending = promise) });
    // Wait for it
    await pending;
    // Confirm the main pages were saved
    expect(worker.precached).toEqual(expect.arrayContaining(["/", "/history", "/settings", "/sessions"]));
  });

  // Each saved page's scripts are saved too, so pages never opened online still work offline
  it("saves the built files that the main pages use", async () => {
    // Collect the work the install step waits for
    let pending: Promise<unknown> = Promise.resolve();
    // Run the install handler
    worker.handlers.install!({ waitUntil: (promise: Promise<unknown>) => void (pending = promise) });
    // Wait for it
    await pending;
    // Confirm the script named in the pages was saved
    expect(worker.precached).toContain("/_next/static/chunks/page-abc.js");
  });

  // Requests to the API are not intercepted at all
  it("does not intercept API requests", () => {
    // A fake fetch event for the API
    const event = { request: { url: `${ORIGIN}/api/feedback`, mode: "cors", method: "POST" }, respondWith: vi.fn() };
    // Run the fetch handler
    worker.handlers.fetch!(event);
    // Confirm the worker stayed out of the way
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  // Offline, any session address uses the one saved session page
  it("serves the saved session page offline whatever the ?id= is", async () => {
    // Collect the response the worker gives
    let reply: Promise<Response> | undefined;
    // A page request for a session, while offline
    const event = { request: { url: `${ORIGIN}/sessions?id=abc`, mode: "navigate", method: "GET" }, respondWith: (response: Promise<Response>) => void (reply = response) };
    // Run the fetch handler
    worker.handlers.fetch!(event);
    // Confirm the saved page came back
    expect(await (await reply!).text()).toBe("saved sessions page");
  });
});
