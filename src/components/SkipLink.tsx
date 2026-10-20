"use client";
// "Skip to content": the first stop for the keyboard, shown only when focused, leading past the masthead and tabs to the page's main heading (WCAG 2.4.1; decision 89)

// Load the click event type
import type { MouseEvent } from "react";

// Move focus to the page's main heading (the masthead sits inside the main area, so jumping to the area alone would land on the tabs again)
function skip(event: MouseEvent<HTMLAnchorElement>) {
  // The main heading, or else the main area
  const target = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("main");
  // Nothing to go to: let the link do its usual jump
  if (!target) return;
  // Handle it here instead
  event.preventDefault();
  // Make it focusable without adding it to the tab order
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  // Focus it, so the next Tab continues from the content
  target.focus();
}

// Draw the link (it still jumps to the main area if scripts have not loaded)
export function SkipLink() {
  // Hidden until focused, then a filled tile in the top corner
  return (
    <a href="#main" onClick={skip} className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-xl focus:bg-fill focus:px-4 focus:font-semibold focus:text-fill-ink">
      Skip to content
    </a>
  );
}
