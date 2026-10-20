"use client";
// Shared starting points for every screen: which repository to use, and today's date once in the browser (moved on to the new day when an installed app comes back after midnight; decision 86)

// Load React's state, effect and external-store tools
import { useEffect, useState, useSyncExternalStore } from "react";
// Load the calendar-day key
import { dayKey } from "@/core/dates";
// Load the shared browser repository
import { browserRepository } from "@/data/browserRepository";
// Load the repository type
import type { Repository } from "@/data/repository";

// What every screen can be given; both have real defaults and are replaced in tests
export interface ScreenProps {
  // Where data is saved and loaded
  repository?: Repository;
  // The current moment
  now?: Date;
}

// A subscription that never fires, used to tell the browser apart from the server
export function subscribeToNothing(): () => void {
  // Nothing to unsubscribe from
  return () => {};
}

// Pick the repository and today's date for a screen
export function useScreenBasics({ repository, now }: ScreenProps): { repo: Repository; today: Date | null } {
  // Use the given repository, or the browser's
  const [repo] = useState(() => repository ?? browserRepository());
  // The moment the screen was opened (worked out separately in the browser), moved on when the day changes
  const [openedAt, setOpenedAt] = useState(() => now ?? new Date());
  // Whether a fixed moment was given (in checks), which never moves
  const fixed = now !== undefined;
  // When the page comes back into view on a later day (a phone left the app open overnight), move to the new day so the screen reloads for it
  useEffect(() => {
    // A fixed moment stays put
    if (fixed) return;
    // Each time the page is shown or hidden
    const onVisibility = () => {
      // Only when it comes back into view
      if (document.visibilityState !== "visible") return;
      // The moment now
      const current = new Date();
      // Keep the same moment on the same day (no reload), or move to now on a new one
      setOpenedAt((previous) => (dayKey(previous) === dayKey(current) ? previous : current));
    };
    // Listen
    document.addEventListener("visibilitychange", onVisibility);
    // Stop listening when the screen goes
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fixed]);
  // True only in the browser, so date-based content is not drawn on the server (time zones could differ)
  const inBrowser = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  // Hand back the repository and, once in the browser, the date
  return { repo, today: inBrowser ? openedAt : null };
}
