"use client";
// A text to read aloud by id, loading the full speeches' text only when a part of one is asked for (decision 88): short passages are at hand at once, and the speeches' text stays out of every page's first download

// Load React's state, effect and callback tools
import { useCallback, useEffect, useState } from "react";
// Load the short passages' lookup and the passage type
import { findPassage, type Passage } from "@/content/prompts";
// Load the check for a part of a full speech
import { speechPartOf } from "@/content/readingIndex";

// The module with the full speeches' text, once loaded (kept for the whole visit, so later pages have it at once)
let readings: typeof import("@/content/readings") | null = null;

// Load the module with the full speeches' text (once)
export async function loadReadings(): Promise<typeof import("@/content/readings")> {
  // Load it the first time
  readings ??= await import("@/content/readings");
  // Hand it back
  return readings;
}

// The text for an id if it can be had now: a short passage, or a speech part once the speeches are loaded
function readingNow(id: string): Passage | undefined {
  // A short passage, or a part from the loaded speeches
  return findPassage(id) ?? readings?.findReading(id);
}

// Whether the id needs the speeches loaded first
function needsSpeeches(id: string | null): boolean {
  // A speech part, before the speeches are loaded
  return id !== null && !findPassage(id) && speechPartOf(id) !== undefined && readings === null;
}

// What useReading gives back
export interface ReadingState {
  // The text, once known (none for an id that names no text)
  passage: Passage | undefined;
  // Ready, still loading the speeches, or failed to load them (offline before they were ever saved)
  status: "ready" | "loading" | "failed";
  // Try loading again after a failure
  retry: () => void;
}

// The text for an id (null for none), loading the speeches when needed
export function useReading(id: string | null): ReadingState {
  // Bumped to re-render once the speeches arrive, or to try again
  const [, setVersion] = useState(0);
  // Whether the last load failed
  const [failed, setFailed] = useState(false);
  // Whether the speeches are still needed
  const needed = needsSpeeches(id);

  // Load the speeches when a part of one is asked for
  useEffect(() => {
    // Nothing to load
    if (!needed || failed) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load them
    loadReadings().then(() => {
      // Draw again with the text
      if (!cancelled) setVersion((version) => version + 1);
    }).catch(() => {
      // Say it failed, so the screen can explain and offer to try again
      if (!cancelled) setFailed(true);
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [needed, failed]);

  // Try again after a failure
  const retry = useCallback(() => setFailed(false), []);
  // The state now
  return { passage: id === null ? undefined : readingNow(id), status: !needed ? "ready" : failed ? "failed" : "loading", retry };
}
