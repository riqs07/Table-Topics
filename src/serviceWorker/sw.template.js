// VoiceLab service worker: lets the installed app open and show saved data without a connection (milestone 10; decision 88).
// The feedback API is never cached; waiting feedback is sent by the app itself when the connection returns.
// This is the source: `pnpm build` writes it to public/sw.js with the build's id in place of the marker below (scripts/build-sw.mjs), so every release is a new worker.

// This build's id, stamped in at build time, so a new release always installs a new worker
const BUILD = "__VOICELAB_BUILD__";
// Name of this build's cache; older builds' caches are deleted when this worker takes over
const CACHE = `voicelab-app-${BUILD}`;
// Every built script, style and font of this build, listed at build time, so code a page loads later (such as the speeches' text) is saved too
const BUILD_FILES = [/* __VOICELAB_FILES__ */];
// Pages saved at install so the app opens offline, every main page included (redirect-only and design pages are left out; /sessions shows any saved session, chosen by ?id=)
const SHELL = [
  // Today
  "/",
  // Practice and its short-speech planner
  "/practice", "/practice/outline",
  // Learn, its cards, sets, scenarios and missions
  "/learn", "/learn/card", "/learn/set", "/learn/scenarios", "/mission",
  // Conversations and one conversation
  "/conversations", "/conversations/talk",
  // Your voice and its drills
  "/voice", "/voice/drill", "/voice/shadow", "/voice/warmup",
  // Skills, whole speeches, openings and closings, and small-talk units
  "/skills", "/speech", "/bookends", "/small-talk/unit",
  // Your own talks
  "/rehearse", "/talk",
  // Recording, a saved session, history and settings
  "/session", "/sessions", "/history", "/settings",
  // Your speaking profile (decision 90)
  "/profile",
  // Stories and telling one (decision 92)
  "/stories", "/stories/tell",
];
// How long a page waits for the network before the saved copy is used instead (the network answer still updates the saved copy)
const NETWORK_TIMEOUT_MS = 3000;

// Whether a request asks for a page's data for an in-app move (Next.js sends an RSC header and a cache-busting _rsc address part) rather than its HTML
function isRscRequest(url, headers) {
  // Either sign marks it
  return headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

// Decide how a request is handled: "network", "cache-first", "network-first" (a page's HTML) or "rsc" (a page's data for an in-app move)
function strategyFor(url, mode, rsc) {
  // Other sites are left alone
  if (url.origin !== self.location.origin) return "network";
  // The API always goes to the network
  if (url.pathname.startsWith("/api/")) return "network";
  // Built files (hashed names) and icons never change, so the cached copy is used first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) return "cache-first";
  // Pages try the network for the latest version, then the saved copy
  if (mode === "navigate") return "network-first";
  // A page's data for a move between tabs: the same, saved apart from the HTML
  if (rsc && !url.pathname.startsWith("/_next/")) return "rsc";
  // Anything else goes to the network
  return "network";
}

// The address a page's HTML is saved under: the path alone, so /sessions?id=… and /session?mode=…&prompt=… share one copy (the page reads the address itself)
function pageKey(url) {
  // The site and path, no query
  return `${url.origin}${url.pathname}`;
}

// The address a page's data is saved under: the path, marked as data and with the kind of prefetch it answers, without the changing _rsc part, so it never mixes with the HTML
function rscKey(url, headers) {
  // Mark it as data
  const variant = new URLSearchParams({ __rsc: "1" });
  // A prefetch asks for less than a full move, so it is kept apart
  const prefetch = headers.get("Next-Router-Prefetch");
  // Note the prefetch kind
  if (prefetch) variant.set("prefetch", prefetch);
  // A prefetch of one part of the page is kept apart too
  const segment = headers.get("Next-Router-Segment-Prefetch");
  // Note which part
  if (segment) variant.set("segment", segment);
  // The site, path and marks
  return `${url.origin}${url.pathname}?${variant}`;
}

// Expose the routing and saving rules so they can be tested
self.voicelabStrategyFor = strategyFor;
self.voicelabPageKey = pageKey;
self.voicelabRscKey = rscKey;

// A plain page shown when this page is not saved on the device and there is no connection
function offlinePage() {
  // Minimal page with a way home
  const html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · VoiceLab</title><body style="max-width:32rem;margin:3rem auto;padding:0 1.5rem;line-height:1.5"><p>You\'re offline and this page isn\'t saved on this device yet. Pages you\'ve opened while online work offline.</p><p><a href="/">Back to today</a></p></body>';
  // Wrap it as a response
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

// The saved copy under a key in this build's cache, if there is one
async function saved(key) {
  // Look only in this build's cache, ignoring Vary (the key already says which kind it is)
  return (await caches.open(CACHE)).match(key, { ignoreVary: true });
}

// Use the cached copy if there is one, otherwise fetch and save it
async function cacheFirst(request) {
  // Look in the cache
  const cached = await caches.match(request);
  // Use it if found
  if (cached) return cached;
  // Otherwise fetch it
  const response = await fetch(request);
  // Save a copy of a good response
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  // Hand back the response
  return response;
}

// A marker for "the network took too long"
const TIMED_OUT = Symbol("timed out");

// Fetch the latest copy and save it under the key; if the network takes too long and a saved copy exists, use that; offline, the saved copy or the fallback
async function networkFirst(request, key, keepAlive, fallback) {
  // Ask the network, copying a good answer at once (before the page reads it) so it can be saved
  const fetched = fetch(request).then((response) => ({ response, copy: response.ok && !response.redirected ? response.clone() : null }));
  // Save the copy whenever it arrives, even after a saved copy was used, keeping the worker alive until then
  keepAlive(fetched.then(async ({ copy }) => copy && (await caches.open(CACHE)).put(key, copy)).catch(() => undefined));
  // The network's answer on its own
  const network = fetched.then(({ response }) => response);
  // Try the network first
  try {
    // The timer, so a bad connection does not hold the page for long
    let timer;
    // Whichever comes first: the answer, or the time limit
    const first = await Promise.race([network, new Promise((resolve) => (timer = setTimeout(() => resolve(TIMED_OUT), NETWORK_TIMEOUT_MS)))]);
    // Stop the timer
    clearTimeout(timer);
    // The network answered in time
    if (first !== TIMED_OUT) return first;
    // Too slow: the saved copy, or keep waiting for the network when there is none
    return (await saved(key)) ?? (await network);
  } catch {
    // Offline: the saved copy, or the fallback
    return (await saved(key)) ?? fallback();
  }
}

// Save the main pages, their data for in-app moves, and every built file, so they all work offline even if never opened online
async function precache() {
  // Open this build's cache
  const cache = await caches.open(CACHE);
  // Save the main pages (each under its path)
  await cache.addAll(SHELL);
  // Save each page's data for in-app moves too, so the tab bar works offline at once (a page that fails is skipped; it is saved when first opened instead)
  await Promise.all(SHELL.map(async (page) => {
    // Its full address, with the empty _rsc part Next.js expects when no other routing headers are sent (without it the server answers with a redirect)
    const url = new URL(`${page}?_rsc`, self.location.origin);
    // The headers an in-app move sends
    const headers = new Headers({ RSC: "1" });
    // Fetch and save it, ignoring a failure
    try {
      // Ask for the data
      const response = await fetch(url, { headers });
      // Save a good answer under the data key
      if (response.ok && !response.redirected) await cache.put(rscKey(url, headers), response);
    } catch {
      // Skipped; saved later when the page is opened
    }
  }));
  // Collect this build's files, plus any the pages name that the list missed
  const assets = new Set(BUILD_FILES);
  // Read each saved page
  for (const page of SHELL) {
    // Find the saved copy
    const savedPage = await cache.match(page);
    // Skip a page that could not be saved
    if (!savedPage) continue;
    // Find every built-file address in its HTML
    for (const match of (await savedPage.text()).matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assets.add(match[0]);
  }
  // Save them all (each once: the browser refuses a list with repeats)
  await cache.addAll([...assets]);
}

// On install, save the main pages and their files, then take over without waiting
self.addEventListener("install", (event) => {
  // Keep the worker installing until everything is saved
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

// Whether a cache belongs to an older build of this worker (the app's other stores, such as the saved voice recordings in voicelab-voice-v1, are left alone; decision 82)
function isOldVersion(name) {
  // A hand-numbered cache from before decision 88, or another build's cache
  return (/^voicelab-v\d+$/.test(name) || name.startsWith("voicelab-app-")) && name !== CACHE;
}

// Expose the cleanup rule so it can be tested
self.voicelabIsOldVersion = isOldVersion;

// On activate, delete caches from older builds and take control of open pages
self.addEventListener("activate", (event) => {
  // Keep activating until cleanup is done
  event.waitUntil(
    // List every cache, delete the old builds', then take control
    caches.keys().then((names) => Promise.all(names.filter(isOldVersion).map((name) => caches.delete(name)))).then(() => self.clients.claim()),
  );
});

// Route every request
self.addEventListener("fetch", (event) => {
  // The request
  const request = event.request;
  // Only GET requests can be cached
  if (request.method !== "GET") return;
  // Its address
  const url = new URL(request.url);
  // Decide how to handle it
  const strategy = strategyFor(url, request.mode, isRscRequest(url, request.headers));
  // Keeps the worker alive while a copy is saved
  const keepAlive = (promise) => event.waitUntil(promise);
  // Built files and icons: cache first
  if (strategy === "cache-first") event.respondWith(cacheFirst(request));
  // Pages: network first, saved under the path, with a plain offline page when not saved
  else if (strategy === "network-first") event.respondWith(networkFirst(request, pageKey(url), keepAlive, offlinePage));
  // A page's data for an in-app move: network first, saved apart; when not saved offline, a failed fetch, so the app falls back to loading the page
  else if (strategy === "rsc") event.respondWith(networkFirst(request, rscKey(url, request.headers), keepAlive, () => Response.error()));
  // Everything else is left to the browser
});
