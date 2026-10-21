"use client";
// The app's background work: once a page is idle, moves older records to the current layout, tidies old recordings, and sends waiting feedback; sends again whenever the device comes back online (milestone 10, decision 99)

// Load React's effect and state tools
import { useEffect, useState } from "react";
// Load the shared browser repository
import { browserRepository } from "@/data/browserRepository";
// Load the saved passphrase reader
import { readPassphrase } from "@/data/passphrase";
// Load the repository type
import type { Repository } from "@/data/repository";

// The longest wait for the browser to say it is idle before the work runs anyway
const IDLE_TIMEOUT_MS = 4000;
// Where the browser cannot say it is idle, the wait after the page has loaded
const FALLBACK_DELAY_MS = 300;

// What the background work can be given; both have real defaults and are replaced in tests
interface FeedbackSyncProps {
  // Where sessions are saved
  repository?: Repository;
  // Network function
  fetchFn?: typeof fetch;
}

// Run a task once the browser is idle (or after a short wait where it cannot say); hands back a way to cancel it
function whenIdle(task: () => void): () => void {
  // The browser can say when it is idle
  if (typeof window.requestIdleCallback === "function") {
    // Asked for, with an upper limit so it always runs
    const handle = window.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
    // Cancelled by handle
    return () => window.cancelIdleCallback(handle);
  }
  // A short wait instead (Safari)
  const timer = setTimeout(task, FALLBACK_DELAY_MS);
  // Cancelled by timer
  return () => clearTimeout(timer);
}

// Run in the background; draws nothing
export function FeedbackSync({ repository, fetchFn }: FeedbackSyncProps) {
  // Use the given repository, or the browser's
  const [repo] = useState(() => repository ?? browserRepository());

  // Work once the page is idle, and send again on every reconnection
  useEffect(() => {
    // True while work is in progress, so two runs never overlap
    let busy = false;
    // Set when the app closes, so nothing starts after
    let closed = false;
    // Run one piece of work, loading its code first (it is not part of the page's own download)
    const run = async (all: boolean) => {
      // Skip if already working, or closed
      if (busy || closed) return;
      // Mark as busy
      busy = true;
      // Try, never letting a failure surface as an error
      try {
        // The code, loaded on first use
        const work = await import("@/data/backgroundWork");
        // The request options: the saved passphrase, and the network function when given
        const options = { passphrase: readPassphrase(), ...(fetchFn ? { fetchFn } : {}) };
        // Everything at start; only the feedback when the connection returns
        await (all ? work.runBackgroundWork(repo, options) : work.sendWaitingFeedback(repo, options));
      } catch {
        // The code could not load (offline before it was saved); the next trigger will try again
      } finally {
        // Ready for the next trigger
        busy = false;
      }
    };
    // Everything once the page is idle
    const cancel = whenIdle(() => void run(true));
    // Send again whenever the connection comes back
    const online = () => void run(false);
    // Listen for it
    window.addEventListener("online", online);
    // Stop when the app closes
    return () => {
      // Nothing new starts
      closed = true;
      // The idle wait dropped
      cancel();
      // No more listening
      window.removeEventListener("online", online);
    };
  }, [repo, fetchFn]);

  // Nothing to draw
  return null;
}
