// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load Node's file reader and sandbox runner
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
// Load the build step that stamps the worker with the build's id (decision 88)
import { BUILD_MARKER, FILES_MARKER, stampWorker, usedMedia } from "../../scripts/build-sw.mjs";

// The worker's source, as written to public/sw.js by the build with this test build's id
const TEMPLATE = readFileSync("src/serviceWorker/sw.template.js", "utf8");
// The id this test's build has
const BUILD = "build-new";
// The stamped worker the browser would load, with this build's list of files (one script a page loads later)
const SOURCE = stampWorker(TEMPLATE, BUILD, ["/_next/static/chunks/later-speeches.js", "/_next/static/media/font.woff2"]);
// The site's address in these checks
const ORIGIN = "https://voicelab.example";
// This build's cache name
const CACHE = `voicelab-app-${BUILD}`;
// The cache of built files shared across builds (decision 99)
const STATIC = "voicelab-static";

// How the fake network answers: a function from the request to a response (or a rejection for offline)
type Network = (request: { url: string; headers?: Headers }) => Promise<Response>;

// What the sandboxed worker exposes back to the test
interface Worker {
  // The routing decision for a request
  strategyFor(url: URL, mode: string, rsc: boolean): string;
  // The key a page's HTML is saved under
  pageKey(url: URL): string;
  // The key a page's data is saved under
  rscKey(url: URL, headers: Headers): string;
  // Whether a cache is an older build's, to delete
  isOldVersion(name: string): boolean;
  // Whether a page's text belongs to this build
  fromThisBuild(text: string): boolean;
  // How many times the worker asked the browser to look for a newer worker
  updates(): number;
  // Event handlers the worker registered, by event name
  handlers: Record<string, (event: unknown) => void>;
  // The fake cache stores, by name, each a map from address to saved response
  stores: Map<string, Map<string, Response>>;
  // Swap how the network answers
  setNetwork(network: Network): void;
}

// A network that is down
const OFFLINE: Network = async () => {
  // Fail as a browser does offline
  throw new TypeError("Failed to fetch");
};

// A network that answers every address with a short page naming it
const ONLINE: Network = async (request) => new Response(`fresh ${request.url}${request.headers?.get("RSC") === "1" ? " data" : " page"}`);

// Load the worker (this build's, unless another build's source is given) into a fresh sandbox with fake browser parts
function loadWorker(stores = new Map<string, Map<string, Response>>(), source = SOURCE): Worker {
  // Collected event handlers
  const handlers: Record<string, (event: unknown) => void> = {};
  // How the network answers now
  let network: Network = OFFLINE;
  // The address a cache key stands for (a string, a URL or a request)
  const keyOf = (key: string | URL | { url: string }) => (typeof key === "string" ? new URL(key, ORIGIN).toString() : key instanceof URL ? key.toString() : key.url);
  // One fake cache store
  const storeFor = (name: string) => {
    // Its saved responses, made on first use
    const store = stores.get(name) ?? new Map<string, Response>();
    // Remember it
    stores.set(name, store);
    // The cache's methods
    return {
      // Fetch and save every address, failing if any fails (as the browser does)
      addAll: async (urls: string[]) => {
        // Fetch them all
        const responses = await Promise.all(urls.map((url) => network({ url: keyOf(url) })));
        // Save each under its address
        urls.forEach((url, index) => store.set(keyOf(url), responses[index]!));
      },
      // Save one response
      put: async (key: string | URL | { url: string }, response: Response) => void store.set(keyOf(key), response),
      // Find a saved response (a copy, so it can be read more than once), matching the whole address
      match: async (key: string | URL | { url: string }) => store.get(keyOf(key))?.clone(),
      // Every saved request
      keys: async () => [...store.keys()].map((url) => ({ url })),
      // Remove one saved response
      delete: async (key: string | URL | { url: string }) => store.delete(keyOf(key)),
    };
  };
  // Times the worker asked for a newer worker
  let updates = 0;
  // The fake worker global
  const self: Record<string, unknown> = {
    // The worker's registration, which can look for a newer worker
    registration: { update: async () => void (updates += 1) },
    // Record each handler the worker registers
    addEventListener: (name: string, handler: (event: unknown) => void) => void (handlers[name] = handler),
    // The site's address
    location: { origin: ORIGIN },
    // Skip-waiting and claim do nothing here
    skipWaiting: vi.fn(), clients: { claim: vi.fn() },
  };
  // Fake cache storage over the stores
  const caches = {
    // Open (or make) a store
    open: async (name: string) => storeFor(name),
    // Every store's name
    keys: async () => [...stores.keys()],
    // Delete a store
    delete: async (name: string) => stores.delete(name),
    // Look in every store
    match: async (key: string | { url: string }) => [...stores.values()].map((store) => store.get(keyOf(key))).find(Boolean)?.clone(),
  };
  // Run the worker's code with the fakes (timers looked up when called, so fake timers work)
  runInNewContext(source, { self, caches, fetch: (request: string | URL | { url: string }, init?: { headers?: Headers }) => network({ url: keyOf(request), headers: init?.headers ?? (typeof request === "object" && "headers" in request ? (request.headers as Headers) : undefined) }), Response, Headers, URL, URLSearchParams, Promise, setTimeout: (run: () => void, ms: number) => setTimeout(run, ms), clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id) });
  // Hand back what the worker exposed
  return { strategyFor: self.voicelabStrategyFor as Worker["strategyFor"], pageKey: self.voicelabPageKey as Worker["pageKey"], rscKey: self.voicelabRscKey as Worker["rscKey"], isOldVersion: self.voicelabIsOldVersion as Worker["isOldVersion"], fromThisBuild: self.voicelabFromThisBuild as Worker["fromThisBuild"], updates: () => updates, handlers, stores, setNetwork: (next) => void (network = next) };
}

// Run the activate step and wait for it
async function activate(target: Worker): Promise<void> {
  // Collect the work activation waits for
  let pending: Promise<unknown> = Promise.resolve();
  // Run the activate handler
  target.handlers.activate!({ waitUntil: (promise: Promise<unknown>) => void (pending = promise) });
  // Wait for it
  await pending;
}

// A fetch event as the browser sends it, with what the worker answered and kept alive
function fetchEvent(path: string, mode: string, headers: Record<string, string> = {}) {
  // The answer, once given
  let reply: Promise<Response> | undefined;
  // Work the worker kept itself alive for
  const kept: Promise<unknown>[] = [];
  // The event
  const event = { request: { url: `${ORIGIN}${path}`, mode, method: "GET", headers: new Headers(headers) }, respondWith: (response: Promise<Response>) => void (reply = response), waitUntil: (promise: Promise<unknown>) => void kept.push(promise) };
  // Hand back the event and ways to read what happened
  return { event, reply: () => reply, settled: () => Promise.all(kept) };
}

// Run the install step and wait for it
async function install(worker: Worker): Promise<void> {
  // Collect the work the install step waits for
  let pending: Promise<unknown> = Promise.resolve();
  // Run the install handler
  worker.handlers.install!({ waitUntil: (promise: Promise<unknown>) => void (pending = promise) });
  // Wait for it
  await pending;
}

// The worker under test
let worker: Worker;
// Load a fresh worker before each check
beforeEach(() => {
  // Load it
  worker = loadWorker();
});
// Put real timers back after any check that faked them
afterEach(() => {
  // Real timers
  vi.useRealTimers();
});

// Group the checks about how requests are handled
describe("service worker routing", () => {
  // The AI route must never come from a cache
  it("never caches the feedback API", () => {
    // Confirm the API goes to the network
    expect(worker.strategyFor(new URL(`${ORIGIN}/api/feedback`), "cors", false)).toBe("network");
  });

  // Built files have content hashes in their names, so a cached copy is always right
  it("serves built files and icons from the cache first", () => {
    // Confirm a built script
    expect(worker.strategyFor(new URL(`${ORIGIN}/_next/static/chunks/app.js`), "no-cors", false)).toBe("cache-first");
    // Confirm an icon
    expect(worker.strategyFor(new URL(`${ORIGIN}/icons/icon-192.png`), "no-cors", false)).toBe("cache-first");
  });

  // Pages come from the saved copy at once, refreshed in the background (decision 99)
  it("handles page loads as pages", () => {
    // Confirm a page navigation
    expect(worker.strategyFor(new URL(`${ORIGIN}/history`), "navigate", false)).toBe("page");
  });

  // The tab bar moves between pages by fetching their data, not by navigating; those requests used to go uncached, so pages opened that way never worked offline
  it("handles a page's data for an in-app move", () => {
    // Confirm a data request for the Practice tab
    expect(worker.strategyFor(new URL(`${ORIGIN}/practice?_rsc=abc12`), "cors", true)).toBe("rsc");
  });

  // Other sites are left alone
  it("leaves other sites alone", () => {
    // Confirm another origin goes straight to the network
    expect(worker.strategyFor(new URL("https://fonts.example/font.woff2"), "no-cors", false)).toBe("network");
  });
});

// Group the checks about what pages are saved under
describe("service worker cache keys", () => {
  // Every session and prompt address used to be saved separately, so copies piled up
  it("saves a page's HTML under its path alone", () => {
    // Two session addresses and two recording addresses
    const keys = ["/sessions?id=a", "/sessions?id=b", "/session?mode=read&prompt=r001&plan=2", "/session"].map((path) => worker.pageKey(new URL(`${ORIGIN}${path}`)));
    // Confirm they share one key per page
    expect(keys).toEqual([`${ORIGIN}/sessions`, `${ORIGIN}/sessions`, `${ORIGIN}/session`, `${ORIGIN}/session`]);
  });

  // The data key drops the changing _rsc part, keeps prefetches apart, and never equals the HTML key
  it("saves a page's data apart from its HTML and from prefetches", () => {
    // A full move's data, twice with different _rsc parts
    const move = [worker.rscKey(new URL(`${ORIGIN}/learn?_rsc=one`), new Headers({ RSC: "1" })), worker.rscKey(new URL(`${ORIGIN}/learn?_rsc=two`), new Headers({ RSC: "1" }))];
    // A prefetch of one part of the page
    const prefetch = worker.rscKey(new URL(`${ORIGIN}/learn?_rsc=three`), new Headers({ RSC: "1", "Next-Router-Prefetch": "1", "Next-Router-Segment-Prefetch": "/_tree" }));
    // Confirm the two moves share a key, the prefetch has its own, and neither is the HTML's
    expect([move[0] === move[1], prefetch === move[0], move[0] === worker.pageKey(new URL(`${ORIGIN}/learn`))]).toEqual([true, false, false]);
  });
});

// Group the checks about clearing old caches
describe("service worker cleanup", () => {
  // Only older builds of the worker's own cache go; the saved voice recordings and anything else stay (decision 82)
  it("deletes only older builds of its own cache", () => {
    // A hand-numbered old cache, another build's, this build's, the voice store, and another store
    expect(["voicelab-v3", "voicelab-app-build-old", CACHE, "voicelab-voice-v1", "other"].map(worker.isOldVersion)).toEqual([true, true, false, false, false]);
  });

  // On activate, an older build's cache is deleted while the voice recordings survive
  it("deletes the old build's cache when it takes over, keeping the voice recordings", async () => {
    // Stores left by the previous build, the voice clips, and this build
    const stores = new Map([["voicelab-app-build-old", new Map<string, Response>()], ["voicelab-v3", new Map<string, Response>()], ["voicelab-voice-v1", new Map<string, Response>()], [CACHE, new Map<string, Response>()]]);
    // A worker over them
    const fresh = loadWorker(stores);
    // Collect the work activation waits for
    let pending: Promise<unknown> = Promise.resolve();
    // Run the activate handler
    fresh.handlers.activate!({ waitUntil: (promise: Promise<unknown>) => void (pending = promise) });
    // Wait for it
    await pending;
    // Confirm only the voice store, this build's pages and the shared built files remain
    expect([...stores.keys()].sort()).toEqual([CACHE, STATIC, "voicelab-voice-v1"].sort());
  });

  // The update bug (decision 99): a tab still open on the previous release loads a script later (the plan, a reading) and must still find it after the new worker takes over
  it("keeps the previous build's files until the release after, so an open old tab still loads them", async () => {
    // The previous release's cache, laid out as before decision 99: its pages and its own built files together
    const stores = new Map([["voicelab-app-build-old", new Map<string, Response>([[`${ORIGIN}/`, new Response("old today")], [`${ORIGIN}/_next/static/chunks/old-plan.js`, new Response("old plan")]])]]);
    // This release's worker over them, installed and taking over
    const fresh = loadWorker(stores);
    // Online for the install
    fresh.setNetwork(ONLINE);
    // Installed
    await install(fresh);
    // Taking over
    await activate(fresh);
    // The old tab asks for its script, offline
    fresh.setNetwork(OFFLINE);
    // (the request)
    const kept = fetchEvent("/_next/static/chunks/old-plan.js", "no-cors");
    // Answered by the new worker
    fresh.handlers.fetch!(kept.event);
    // The text it got
    const text = await (await kept.reply()!).text();
    // The release after this one takes over in turn
    const later = loadWorker(stores, stampWorker(TEMPLATE, "build-third", ["/_next/static/chunks/third.js"]));
    // (online for its install)
    later.setNetwork(ONLINE);
    // (installed)
    await install(later);
    // (activated: the note keeps this build and the third, and drops the oldest)
    await activate(later);
    // Confirm the old tab got its script, the old pages went, and the oldest build's file is gone after the next update
    expect([text, stores.has("voicelab-app-build-old"), stores.get(STATIC)?.has(`${ORIGIN}/_next/static/chunks/old-plan.js`)]).toEqual(["old plan", false, false]);
  });

  // A file unchanged between releases keeps its name, so an update does not download it again
  it("does not download a built file again when an update still uses it", async () => {
    // The shared cache already holds this build's later-loaded script, from the release before
    const stores = new Map([[STATIC, new Map<string, Response>([[`${ORIGIN}/_next/static/chunks/later-speeches.js`, new Response("kept speeches")]])]]);
    // A worker over them
    const fresh = loadWorker(stores);
    // The addresses fetched
    const fetched: string[] = [];
    // Online, noting each address
    fresh.setNetwork(async (request) => { fetched.push(new URL(request.url).pathname); return ONLINE(request); });
    // Installed
    await install(fresh);
    // Confirm the script was not fetched again and kept its saved copy
    expect([fetched.includes("/_next/static/chunks/later-speeches.js"), await stores.get(STATIC)?.get(`${ORIGIN}/_next/static/chunks/later-speeches.js`)?.text()]).toEqual([false, "kept speeches"]);
  });
});

// Group the checks about stamping each build into the worker (decision 88)
describe("service worker versioning", () => {
  // The source carries the marker once, and the stamped worker names its cache after the build
  it("names the cache after the build", () => {
    // Confirm each marker is in the source once, and the build's name and files are in the stamped worker
    expect([TEMPLATE.split(BUILD_MARKER).length, TEMPLATE.split(FILES_MARKER).length, SOURCE.includes(BUILD_MARKER), SOURCE.includes(`const BUILD = "${BUILD}"`), SOURCE.includes('const BUILD_FILES = ["/_next/static/chunks/later-speeches.js", "/_next/static/media/font.woff2"]')]).toEqual([2, 2, false, true, true]);
  });

  // Only the fonts the pages name are saved at install: the other theme's fonts and the extra-alphabet subsets were 650 KB nobody used (decision 99)
  it("lists only the media the prerendered pages name", () => {
    // Three fonts built; the pages preload two
    const media = ["/_next/static/media/atkinson.p.woff2", "/_next/static/media/fraunces-latin.p.woff2", "/_next/static/media/young-serif-ext.woff2"];
    // The pages' HTML, one naming a font inside escaped script text
    const pages = ['<link rel="preload" href="/_next/static/media/atkinson.p.woff2" as="font">', 'self.__next_f.push([1,"\\"/_next/static/media/fraunces-latin.p.woff2\\""])'];
    // Confirm the two named fonts are kept and the unused one is not
    expect(usedMedia(media, pages)).toEqual(["/_next/static/media/atkinson.p.woff2", "/_next/static/media/fraunces-latin.p.woff2"]);
  });

  // Two builds give two different workers, so the browser installs the new one
  it("gives each build a different worker", () => {
    // Confirm two builds differ
    expect(stampWorker(TEMPLATE, "a1")).not.toBe(stampWorker(TEMPLATE, "b2"));
  });

  // A broken id or a source without the marker stops the build instead of shipping a worker that never updates
  it("refuses a bad build id or an unmarked source", () => {
    // Confirm each is refused
    expect([() => stampWorker(TEMPLATE, ""), () => stampWorker(TEMPLATE, 'x"; alert(1)'), () => stampWorker("const BUILD = 'fixed';", "a1"), () => stampWorker(TEMPLATE, "a1", ['/x"];alert(1);//'])].map((run) => { try { run(); return "ok"; } catch { return "refused"; } })).toEqual(["refused", "refused", "refused", "refused"]);
  });
});

// Group the checks about installing the worker
describe("service worker install", () => {
  // Every main page, tabs included, is saved on install so the app opens offline (only five used to be)
  it("saves every main page when installed", async () => {
    // Online for the install
    worker.setNetwork(ONLINE);
    // Install
    await install(worker);
    // The saved addresses
    const saved = [...(worker.stores.get(CACHE)?.keys() ?? [])];
    // Confirm the tabs and the pages a tab leads to were saved
    expect(saved).toEqual(expect.arrayContaining(["/", "/practice", "/learn", "/conversations", "/conversations/talk", "/voice", "/skills", "/small-talk", "/history", "/settings", "/session", "/sessions"].map((path) => `${ORIGIN}${path}`)));
  });

  // Each page's data for in-app moves is saved too, under the data key
  it("saves each main page's data for moving between tabs", async () => {
    // Online for the install
    worker.setNetwork(ONLINE);
    // Install
    await install(worker);
    // Confirm the Learn tab's data was saved apart from its HTML
    expect(await worker.stores.get(CACHE)?.get(worker.rscKey(new URL(`${ORIGIN}/learn`), new Headers({ RSC: "1" })))?.text()).toBe(`fresh ${ORIGIN}/learn?_rsc data`);
  });

  // Code a page loads later is not named in any page's HTML, so the build lists every file and the worker saves them all
  it("saves every built file the build listed", async () => {
    // Online for the install
    worker.setNetwork(ONLINE);
    // Install
    await install(worker);
    // Confirm the later-loaded script and the font were saved with the shared built files
    expect(["/_next/static/chunks/later-speeches.js", "/_next/static/media/font.woff2"].map((path) => worker.stores.get(STATIC)?.has(`${ORIGIN}${path}`))).toEqual([true, true]);
  });

  // Each saved page's scripts are saved too, so pages never opened online still work offline
  it("saves the built files that the main pages use", async () => {
    // Every page's HTML refers to one built script
    worker.setNetwork(async (request) => new Response(request.url.includes("/_next/") ? "script" : '<script src="/_next/static/chunks/page-abc.js"></script>'));
    // Install
    await install(worker);
    // Confirm the script named in the pages was saved
    expect(worker.stores.get(STATIC)?.has(`${ORIGIN}/_next/static/chunks/page-abc.js`)).toBe(true);
  });
});

// Group the checks about answering requests
describe("service worker fetch", () => {
  // Requests to the API are not intercepted at all
  it("does not intercept API requests", () => {
    // A fake fetch event for the API
    const event = { request: { url: `${ORIGIN}/api/feedback`, mode: "cors", method: "POST", headers: new Headers() }, respondWith: vi.fn(), waitUntil: vi.fn() };
    // Run the fetch handler
    worker.handlers.fetch!(event);
    // Confirm the worker stayed out of the way
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  // Opened online with one session's address, then offline with another's: the one saved copy serves both
  it("saves a page under its path and serves it offline whatever the query", async () => {
    // Online
    worker.setNetwork(ONLINE);
    // Open one session
    const online = fetchEvent("/sessions?id=abc", "navigate");
    // Run the fetch handler
    worker.handlers.fetch!(online.event);
    // Wait for the answer and the save
    await online.reply();
    await online.settled();
    // Go offline
    worker.setNetwork(OFFLINE);
    // Open another session
    const offline = fetchEvent("/sessions?id=xyz", "navigate");
    // Run the fetch handler
    worker.handlers.fetch!(offline.event);
    // Confirm the saved page came back, and only one copy was kept
    expect([await (await offline.reply()!).text(), [...(worker.stores.get(CACHE)?.keys() ?? [])]]).toEqual([`fresh ${ORIGIN}/sessions?id=abc page`, [`${ORIGIN}/sessions`]]);
  });

  // A tab opened online by an in-app move works offline afterwards (the reported bug: Practice and Learn showed the offline page)
  it("saves a page's data from an in-app move and serves it offline", async () => {
    // Online
    worker.setNetwork(ONLINE);
    // Move to Practice from the tab bar
    const online = fetchEvent("/practice?_rsc=one", "cors", { RSC: "1" });
    // Run the fetch handler
    worker.handlers.fetch!(online.event);
    // Wait for the answer and the save
    await online.reply();
    await online.settled();
    // Go offline
    worker.setNetwork(OFFLINE);
    // Move to Practice again, with a new _rsc part
    const offline = fetchEvent("/practice?_rsc=two", "cors", { RSC: "1" });
    // Run the fetch handler
    worker.handlers.fetch!(offline.event);
    // Confirm the saved data came back
    expect(await (await offline.reply()!).text()).toBe(`fresh ${ORIGIN}/practice?_rsc=one data`);
  });

  // Saved data is never handed to a page load, and a saved page never to an in-app move
  it("never mixes a page's HTML with its data", async () => {
    // Only Practice's data is saved
    worker.stores.set(CACHE, new Map([[worker.rscKey(new URL(`${ORIGIN}/practice`), new Headers({ RSC: "1" })), new Response("data")]]));
    // Only Learn's HTML is saved
    worker.stores.get(CACHE)!.set(`${ORIGIN}/learn`, new Response("<html>learn</html>"));
    // Offline, load Practice's page and move to Learn
    const page = fetchEvent("/practice", "navigate");
    const move = fetchEvent("/learn?_rsc=x", "cors", { RSC: "1" });
    // Run the fetch handler for both
    worker.handlers.fetch!(page.event);
    worker.handlers.fetch!(move.event);
    // Confirm the page load got the offline page and the move a failed fetch (so the app loads the page instead)
    expect([await (await page.reply()!).text(), (await move.reply()!).type]).toEqual([expect.stringContaining("this page isn't saved on this device yet"), "error"]);
  });

  // The offline page no longer claims the page was never opened (it may have been opened before this build)
  it("explains the offline page without blaming the user", async () => {
    // Offline with nothing saved
    const page = fetchEvent("/voice", "navigate");
    // Run the fetch handler
    worker.handlers.fetch!(page.event);
    // The page's text
    const text = await (await page.reply()!).text();
    // Confirm the new wording, and that the old claim is gone
    expect([text.includes("Pages you've opened while online work offline."), text.includes("has not been opened")]).toEqual([true, false]);
  });

  // A saved page is shown at once, without waiting for the network at all, and the network's answer refreshes it for next time (decision 99: a poor connection held a saved page for 2.5 seconds)
  it("shows the saved copy at once, then saves the fresh answer", async () => {
    // Fake timers, to wait without waiting
    vi.useFakeTimers();
    // A saved copy of History
    worker.stores.set(CACHE, new Map([[`${ORIGIN}/history`, new Response("saved history")]]));
    // A network that answers after ten seconds
    worker.setNetwork((request) => new Promise((resolve) => setTimeout(() => resolve(new Response(`late ${new URL(request.url).pathname}`)), 10_000)));
    // Open History
    const page = fetchEvent("/history", "navigate");
    // Run the fetch handler
    worker.handlers.fetch!(page.event);
    // No time passes
    await vi.advanceTimersByTimeAsync(0);
    // The answer given
    const shown = await (await page.reply()!).text();
    // The network answers later
    await vi.advanceTimersByTimeAsync(10_000);
    // Wait for the save
    await page.settled();
    // Confirm the saved copy was shown at once and the late answer replaced it
    expect([shown, await worker.stores.get(CACHE)?.get(`${ORIGIN}/history`)?.text()]).toEqual(["saved history", "late /history"]);
  });

  // A page from a newer release is never saved into this build's cache (its scripts are not this build's); the worker looks for the newer worker instead
  it("never mixes a newer release's page into this build's saved pages", async () => {
    // A saved copy of Today from this build
    worker.stores.set(CACHE, new Map([[`${ORIGIN}/`, new Response("this build's today")]]));
    // The network now serves a newer release, naming a script this build does not have
    worker.setNetwork(async () => new Response('<script src="/_next/static/chunks/newer-release.js"></script>'));
    // Open Today
    const page = fetchEvent("/", "navigate");
    // Run the fetch handler
    worker.handlers.fetch!(page.event);
    // The answer, and the background refresh
    const shown = await (await page.reply()!).text();
    // (the refresh)
    await page.settled();
    // Confirm the saved copy was shown and kept, and a newer worker was looked for
    expect([shown, await worker.stores.get(CACHE)?.get(`${ORIGIN}/`)?.text(), worker.updates()]).toEqual(["this build's today", "this build's today", 1]);
  });

  // The build check: a page naming only this build's scripts, or none, belongs to it
  it("tells this build's pages from a newer release's", () => {
    // This build's script, none, and an unknown one
    expect([worker.fromThisBuild('<script src="/_next/static/chunks/later-speeches.js">'), worker.fromThisBuild("plain text"), worker.fromThisBuild('"/_next/static/chunks/other.js"')]).toEqual([true, true, false]);
  });

  // With nothing saved, a slow network is still waited for (there is nothing better to show)
  it("waits for a slow network when nothing is saved", async () => {
    // Fake timers, to wait without waiting
    vi.useFakeTimers();
    // A network that answers after five seconds
    worker.setNetwork(() => new Promise((resolve) => setTimeout(() => resolve(new Response("slow page")), 5_000)));
    // Open Settings
    const page = fetchEvent("/settings", "navigate");
    // Run the fetch handler
    worker.handlers.fetch!(page.event);
    // Five seconds pass
    await vi.advanceTimersByTimeAsync(5_000);
    // Confirm the network's page came back
    expect(await (await page.reply()!).text()).toBe("slow page");
  });
});
