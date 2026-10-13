// VoiceLab service worker: lets the installed app open and show saved data without a connection (milestone 10).
// The feedback API is never cached; waiting feedback is sent by the app itself when the connection returns.

// Name of this version's cache; change it to replace every cached file
const CACHE = "voicelab-v1";
// Pages saved at install so the app opens offline
const SHELL = ["/", "/history", "/settings", "/session"];

// Decide how a request is handled: "network", "cache-first", or "network-first"
function strategyFor(url, mode) {
  // Other sites are left alone
  if (url.origin !== self.location.origin) return "network";
  // The API always goes to the network
  if (url.pathname.startsWith("/api/")) return "network";
  // Built files (hashed names) and icons never change, so the cached copy is used first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) return "cache-first";
  // Pages try the network for the latest version, then the saved copy
  if (mode === "navigate") return "network-first";
  // Anything else goes to the network
  return "network";
}

// Expose the routing decision so it can be tested
self.voicelabStrategyFor = strategyFor;

// A plain page shown when a page was never opened before and there is no connection
function offlinePage() {
  // Minimal page with a way home
  const html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · VoiceLab</title><body style="font-family:Georgia,serif;max-width:32rem;margin:3rem auto;padding:0 1.5rem;line-height:1.5"><p>You are offline, and this page has not been opened on this device before.</p><p><a href="/">Back to the prompt</a></p></body>';
  // Wrap it as a response
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
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

// Fetch the latest page, saving a copy; offline, use the saved copy or the offline page
async function networkFirst(request) {
  // Try the network
  try {
    // Fetch the page
    const response = await fetch(request);
    // Save a copy of a good response for offline use
    if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
    // Hand back the response
    return response;
  } catch {
    // Offline: use the saved copy, or the offline page
    return (await caches.match(request)) ?? offlinePage();
  }
}

// On install, save the main pages, then take over without waiting
self.addEventListener("install", (event) => {
  // Keep the worker installing until the pages are saved
  event.waitUntil(
    // Open this version's cache and save the main pages
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

// On activate, delete caches from older versions and take control of open pages
self.addEventListener("activate", (event) => {
  // Keep activating until cleanup is done
  event.waitUntil(
    // List every cache, delete the old ones, then take control
    caches.keys().then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)))).then(() => self.clients.claim()),
  );
});

// Route every request
self.addEventListener("fetch", (event) => {
  // Only GET requests can be cached
  if (event.request.method !== "GET") return;
  // Decide how to handle it
  const strategy = strategyFor(new URL(event.request.url), event.request.mode);
  // Built files and icons: cache first
  if (strategy === "cache-first") event.respondWith(cacheFirst(event.request));
  // Pages: network first
  else if (strategy === "network-first") event.respondWith(networkFirst(event.request));
  // Everything else is left to the browser
});
