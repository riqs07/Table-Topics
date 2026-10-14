"use client";
// Shared starting points for every screen: which repository to use, and today's date once in the browser

// Load React's state and external-store tools
import { useState, useSyncExternalStore } from "react";
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
  // The moment the screen was opened (worked out separately in the browser)
  const [openedAt] = useState(() => now ?? new Date());
  // True only in the browser, so date-based content is not drawn on the server (time zones could differ)
  const inBrowser = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  // Hand back the repository and, once in the browser, the date
  return { repo, today: inBrowser ? openedAt : null };
}
