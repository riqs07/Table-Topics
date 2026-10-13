"use client";
// Sends waiting feedback in the background: when the app opens and whenever the device comes back online (milestone 10)

// Load React's effect and state tools
import { useEffect, useState } from "react";
// Load the shared browser repository
import { browserRepository } from "@/data/browserRepository";
// Load the waiting-feedback sender
import { sendPendingFeedback } from "@/data/feedbackClient";
// Load the saved passphrase reader
import { readPassphrase } from "@/data/passphrase";
// Load the repository type
import type { Repository } from "@/data/repository";

// What the sender can be given; both have real defaults and are replaced in tests
interface FeedbackSyncProps {
  // Where sessions are saved
  repository?: Repository;
  // Network function
  fetchFn?: typeof fetch;
}

// Run in the background; draws nothing
export function FeedbackSync({ repository, fetchFn }: FeedbackSyncProps) {
  // Use the given repository, or the browser's
  const [repo] = useState(() => repository ?? browserRepository());

  // Send now and on every reconnection
  useEffect(() => {
    // True while a send is in progress, so two never overlap
    let busy = false;
    // Send everything waiting
    const send = async () => {
      // Skip if already sending
      if (busy) return;
      // Mark as busy
      busy = true;
      // Try, never letting a failure surface as an error
      try {
        // Send waiting sessions with the saved passphrase
        await sendPendingFeedback(repo, { passphrase: readPassphrase(), ...(fetchFn ? { fetchFn } : {}) });
      } catch {
        // A storage or network problem; the next trigger will try again
      } finally {
        // Ready for the next trigger
        busy = false;
      }
    };
    // Send once now
    void send();
    // Send again whenever the connection comes back
    window.addEventListener("online", send);
    // Stop listening when the app closes
    return () => window.removeEventListener("online", send);
  }, [repo, fetchFn]);

  // Nothing to draw
  return null;
}
