"use client";
// After moving to another page, put keyboard and screen-reader focus on its main heading, as a fresh page load would (the framework leaves focus where it was; decision 76)

// Load the address readers
import { usePathname, useSearchParams } from "next/navigation";
// Load React's effect and ref tools
import { useEffect, useRef } from "react";

// Focus the new page's main heading (or the page itself) whenever the address changes, but not on the first load
export function RouteFocus() {
  // The path
  const pathname = usePathname();
  // The query
  const search = useSearchParams().toString();
  // The address last seen (null before the first)
  const last = useRef<string | null>(null);

  // On each change of address
  useEffect(() => {
    // The address now
    const address = `${pathname}?${search}`;
    // The first load keeps the browser's own focus
    if (last.current === null || last.current === address) {
      // Remember it
      last.current = address;
      // Nothing to move
      return;
    }
    // Remember it
    last.current = address;
    // Wait a moment for the new page to draw its heading
    const timer = window.setTimeout(() => {
      // The main heading, or else the page's main area
      const target = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("main");
      // Nothing to focus
      if (!target) return;
      // Make it focusable without adding it to the tab order
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      // Focus it without jumping the page
      target.focus({ preventScroll: true });
    }, 120);
    // Cancel if the address changes again first
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  // Nothing to draw
  return null;
}
