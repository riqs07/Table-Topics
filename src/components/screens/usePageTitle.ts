"use client";
// Name the browser tab after what the page shows, so moving between pages of the same kind is announced to screen readers (decision 76)

// Load React's effect tool
import { useEffect } from "react";

// Set the tab's title to the given name, followed by the app's name (nothing while the name is not known yet)
export function usePageTitle(name: string | null | undefined): void {
  // Whenever the name changes
  useEffect(() => {
    // Wait for a name
    if (!name) return;
    // Set it
    document.title = `${name} · VoiceLab`;
  }, [name]);
}
