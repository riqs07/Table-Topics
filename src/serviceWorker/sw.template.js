// VoiceLab service worker: lets the installed app open and show saved data without a connection (milestone 10; decisions 88 and 98).
// The feedback API is never cached; waiting feedback is sent by the app itself when the connection returns.
// This is the source: `pnpm build` writes it to public/sw.js with the build's id in place of the marker below (scripts/build-sw.mjs), so every release is a new worker.

// This build's id, stamped in at build time, so a new release always installs a new worker
const BUILD = "__VOICELAB_BUILD__";
// Name of this build's cache of pages (their HTML and their data for in-app moves); older builds' page caches are deleted when this worker takes over
const CACHE = `voicelab-app-${BUILD}`;
// Name of the cache of built files (scripts, styles, fonts), shared across builds: their names carry content hashes, so a file never changes and a new release only downloads what changed (decision 99)
const STATIC_CACHE = "voicelab-static";
// Where the shared cache notes which built files each recent build uses, so a tab still open on the previous build keeps finding its files after an update (decision 99)
const BUILDS_KEY = "/__voicelab/builds.json";
// How many builds' files are kept: this one and the one before, so an open tab from the previous release never loses a script it loads later
const KEEP_BUILDS = 2;
// Every built script and style of this build, and the fonts its pages use, listed at build time, so code a page loads later (such as the speeches' text) is saved too
const BUILD_FILES = [/* __VOICELAB_FILES__ */];
// The same list, for checking a page against this build
const BUILD_SET = new Set(BUILD_FILES);
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
  // Skills, whole speeches, every small-talk unit and one unit (decision 95)
  "/skills", "/speech", "/small-talk", "/small-talk/unit",
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

// Decide how a request is handled: "network", "cache-first", "page" (a page's HTML) or "rsc" (a page's data for an in-app move)
function strategyFor(url, mode, rsc) {
  // Other sites are left alone
  if (url.origin !== self.location.origin) return "network";
  // The API always goes to the network
  if (url.pathname.startsWith("/api/")) return "network";
  // Built files (hashed names) and icons never change, so the cached copy is used first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) return "cache-first";
  // Pages: the saved copy at once, refreshed in the background (decision 99)
  if (mode === "navigate") return "page";
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

// Whether a page (or its data) belongs to this build: every built script it names is one of this build's, so it never mixes with another release's files (a page without any is fine)
function fromThisBuild(text) {
  // Each built script it names
  for (const match of text.matchAll(/\/_next\/static\/chunks\/[^"'\s)\\]+\.js/g)) {
    // One this build does not have: a newer release is out
    if (!BUILD_SET.has(match[0])) return false;
  }
  // All of them are this build's
  return true;
}

// Expose the build check so it can be tested
self.voicelabFromThisBuild = fromThisBuild;

// Save a fresh page (or its data) under its key when it belongs to this build; when it comes from a newer release, look for that release's worker instead, which saves its own pages when it installs
async function saveIfThisBuild(key, response) {
  // Read a copy, to check which build it belongs to
  const text = await response.clone().text();
  // This build's: saved
  if (fromThisBuild(text)) return (await caches.open(CACHE)).put(key, response);
  // A newer release: ask the browser to fetch its worker (it installs in the background and takes over)
  await Promise.resolve(self.registration?.update?.()).catch(() => undefined);
}

// Use the cached copy if there is one, otherwise fetch it and save it with the other built files
async function cacheFirst(request) {
  // Look in every cache (a built file from an older build may still be kept for a tab open on it)
  const cached = await caches.match(request);
  // Use it if found
  if (cached) return cached;
  // Otherwise fetch it
  const response = await fetch(request);
  // Save a copy of a good response in the shared cache of built files
  if (response.ok) (await caches.open(STATIC_CACHE)).put(request, response.clone());
  // Hand back the response
  return response;
}

// A marker for "the network took too long"
const TIMED_OUT = Symbol("timed out");

// Fetch the latest copy and save it under the key; if the network takes too long and a saved copy exists, use that; offline, the saved copy or the fallback
async function networkFirst(request, key, keepAlive, fallback) {
  // Ask the network, copying a good answer at once (before the page reads it) so it can be saved
  const fetched = fetch(request).then((response) => ({ response, copy: response.ok && !response.redirected ? response.clone() : null }));
  // Save the copy whenever it arrives (when it belongs to this build), even after a saved copy was used, keeping the worker alive until then
  keepAlive(fetched.then(async ({ copy }) => copy && saveIfThisBuild(key, copy)).catch(() => undefined));
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

// Answer from the saved copy at once and refresh it in the background (stale-while-revalidate, decision 99): the saved page and its files come from the same build, so they always fit together. With nothing saved, the network first, as before
async function staleWhileRevalidate(request, key, keepAlive, fallback) {
  // The saved copy
  const cached = await saved(key);
  // Nothing saved: wait for the network (up to the time limit), then the fallback
  if (!cached) return networkFirst(request, key, keepAlive, fallback);
  // Refresh it in the background, keeping the worker alive until then; a failure (offline) changes nothing
  keepAlive(fetch(request).then((response) => (response.ok && !response.redirected ? saveIfThisBuild(key, response) : undefined)).catch(() => undefined));
  // The saved copy now
  return cached;
}

// The built files this build uses: the listed ones, plus any its saved pages name that the list missed
async function buildAssets(cache) {
  // Start from the list
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
  // Each once
  return [...assets];
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
  // The shared cache of built files
  const statics = await caches.open(STATIC_CACHE);
  // This build's files that are not saved yet (files unchanged since the last release keep their names, so they are not downloaded again)
  const missing = [];
  // Check each
  for (const asset of await buildAssets(cache)) if (!(await statics.match(asset))) missing.push(asset);
  // Save them all (each once: the browser refuses a list with repeats)
  await statics.addAll(missing);
}

// On install, save the main pages and their files, then take over without waiting
self.addEventListener("install", (event) => {
  // Keep the worker installing until everything is saved
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

// Whether a cache belongs to an older build of this worker (the app's other stores, such as the saved voice recordings in voicelab-voice-v1 and the shared built files, are left alone; decision 82)
function isOldVersion(name) {
  // A hand-numbered cache from before decision 88, or another build's cache
  return (/^voicelab-v\d+$/.test(name) || name.startsWith("voicelab-app-")) && name !== CACHE;
}

// Expose the cleanup rule so it can be tested
self.voicelabIsOldVersion = isOldVersion;

// The note of which built files each recent build uses (oldest first), or none yet
async function readBuilds(statics) {
  // The saved note
  const note = await statics.match(BUILDS_KEY);
  // Read it, treating a damaged note as none
  try {
    // The list
    return note ? await note.json() : [];
  } catch {
    // Damaged: start again
    return [];
  }
}

// Take over from an older build (decision 99): its pages go, but the built files it uses are kept until the release after this one, so a tab still open on it can load the scripts it needs later (a tab two releases behind reloads)
async function takeOver() {
  // The shared cache of built files
  const statics = await caches.open(STATIC_CACHE);
  // Which built files the recent builds use
  const builds = await readBuilds(statics);
  // Each older build's cache
  for (const name of (await caches.keys()).filter(isOldVersion)) {
    // Open it
    const old = await caches.open(name);
    // Built files it saved itself (builds from before decision 99 kept them with their pages)
    const moved = [];
    // Each saved request
    for (const request of await old.keys()) {
      // Its path
      const path = new URL(request.url).pathname;
      // Only built files
      if (!path.startsWith("/_next/static/")) continue;
      // The saved copy
      const copy = await old.match(request);
      // Moved to the shared cache
      if (copy) await statics.put(request, copy);
      // Noted
      if (copy) moved.push(path);
    }
    // Noted as that build's files, unless it already was
    if (moved.length > 0 && !builds.some((build) => build.name === name)) builds.push({ name, files: moved });
    // Its pages go
    await caches.delete(name);
  }
  // This build's files
  const current = { name: CACHE, files: await buildAssets(await caches.open(CACHE)) };
  // This build and the one before
  const kept = [...builds.filter((build) => build.name !== CACHE), current].slice(-KEEP_BUILDS);
  // Saved as the new note
  await statics.put(BUILDS_KEY, new Response(JSON.stringify(kept), { headers: { "content-type": "application/json" } }));
  // The built files either of them uses
  const keep = new Set(kept.flatMap((build) => build.files));
  // Each saved built file
  for (const request of await statics.keys()) {
    // Its path
    const path = new URL(request.url).pathname;
    // A built file no kept build uses goes (icons and the note stay)
    if (path.startsWith("/_next/static/") && !keep.has(path)) await statics.delete(request);
  }
}

// On activate, take over from older builds and take control of open pages
self.addEventListener("activate", (event) => {
  // Keep activating until the take-over is done (a failure still takes control, so the app keeps working)
  event.waitUntil(takeOver().catch(() => undefined).then(() => self.clients.claim()));
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
  // Pages: the saved copy at once, refreshed in the background, saved under the path; with nothing saved, the network, then a plain offline page
  else if (strategy === "page") event.respondWith(staleWhileRevalidate(request, pageKey(url), keepAlive, offlinePage));
  // A page's data for an in-app move: the same, saved apart; when not saved offline, a failed fetch, so the app falls back to loading the page
  else if (strategy === "rsc") event.respondWith(staleWhileRevalidate(request, rscKey(url, request.headers), keepAlive, () => Response.error()));
  // Everything else is left to the browser
});
