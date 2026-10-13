"use client";
// Registers the offline service worker in the released app (off while developing so pages are never stale)

// Load React's effect tool
import { useEffect } from "react";

// Register the worker; draws nothing
export function ServiceWorkerRegister({ enabled = process.env.NODE_ENV === "production" }: { enabled?: boolean }) {
  // Register once, in the browser, when enabled and supported
  useEffect(() => {
    // Skip while developing, or where service workers are not supported
    if (!enabled || !("serviceWorker" in navigator)) return;
    // Register the worker, ignoring failures (the app still works online)
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, [enabled]);
  // Nothing to draw
  return null;
}
