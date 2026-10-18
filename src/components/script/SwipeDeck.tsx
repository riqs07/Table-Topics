"use client";
// One screen at a time, swiped sideways on a phone (with Back and Next buttons, the arrow keys, and a "2 of 5" marker)

// Load React's tools
import { useEffect, useRef, type ReactNode } from "react";

// What the deck needs
interface SwipeDeckProps {
  // The screens, in order
  screens: ReadonlyArray<ReactNode>;
  // The screen showing (owned by the page, so it can react to it)
  index: number;
  // Called when the showing screen changes, by a swipe, a button or a key
  onIndex: (index: number) => void;
  // What the deck is, for screen readers
  label: string;
}

// Draw the deck
export function SwipeDeck({ screens, index, onIndex, label }: SwipeDeckProps) {
  // The sliding row
  const row = useRef<HTMLDivElement | null>(null);
  // The screen a button or key is sliding to, while the slide is under way (its scroll events are not swipes)
  const target = useRef<{ to: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  // The last screen, counted from 0
  const last = screens.length - 1;

  // Slide the row to a screen and note it
  function go(to: number) {
    // Keep it within the deck
    const screen = Math.max(0, Math.min(last, to));
    // The row
    const element = row.current;
    // Forget any slide still under way
    if (target.current) clearTimeout(target.current.timer);
    // Remember where it is going, and stop waiting after a moment in case no scroll happens
    target.current = { to: screen, timer: setTimeout(() => (target.current = null), 1000) };
    // Slide there, if the browser can (without animation when motion is unwelcome)
    if (element && typeof element.scrollTo === "function") element.scrollTo({ left: screen * element.clientWidth, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    // Note it
    onIndex(screen);
  }

  // A swipe: work out which screen is now in view
  function onScroll() {
    // The row
    const element = row.current;
    // Nothing to measure without a width
    if (!element || element.clientWidth === 0) return;
    // The screen in view
    const inView = Math.round(element.scrollLeft / element.clientWidth);
    // During a button's slide, wait until it arrives instead of following the screens it passes
    if (target.current) {
      // Arrived: stop waiting
      if (inView === target.current.to) {
        // Stop the safety timer
        clearTimeout(target.current.timer);
        // Clear it
        target.current = null;
      }
      // Either way, the index is already right
      return;
    }
    // A swipe: note the new screen if it changed
    if (inView !== index) onIndex(inView);
  }

  // The arrow keys move between screens on a computer
  useEffect(() => {
    // Handle a key
    const onKey = (event: KeyboardEvent) => {
      // Leave typing alone
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) return;
      // Right: next
      if (event.key === "ArrowRight") go(index + 1);
      // Left: back
      if (event.key === "ArrowLeft") go(index - 1);
    };
    // Listen
    window.addEventListener("keydown", onKey);
    // Stop listening when the deck closes
    return () => window.removeEventListener("keydown", onKey);
  });

  // Draw it
  return (
    <section aria-roledescription="carousel" aria-label={label} className="flex flex-1 flex-col">
      {/* The screens, side by side, one in view at a time */}
      <div ref={row} onScroll={onScroll} className="-mx-6 flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:mx-0">
        {/* Each screen */}
        {screens.map((screen, position) => (
          // One screen, the full width of the row
          <div key={position} role="group" aria-roledescription="slide" aria-label={`${position + 1} of ${screens.length}`} aria-hidden={position !== index} inert={position !== index} className="w-full flex-none snap-start px-6 md:px-0">
            {/* Its content */}
            {screen}
          </div>
        ))}
      </div>
      {/* Where you are, and Back and Next */}
      <div className="mt-4 mb-6 flex items-center justify-between gap-4">
        {/* Back */}
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="inline-flex min-h-11 items-center italic underline underline-offset-4 disabled:invisible">Back</button>
        {/* The marker: a short bar per screen, the current one filled */}
        <span aria-hidden="true" className="flex gap-1.5">
          {/* Each screen's bar */}
          {screens.map((_, position) => <span key={position} className={`h-1 w-5 ${position === index ? "bg-accent" : "bg-rule"}`} />)}
        </span>
        {/* Next */}
        <button type="button" onClick={() => go(index + 1)} disabled={index === last} className="inline-flex min-h-11 items-center italic underline underline-offset-4 disabled:invisible">Next</button>
      </div>
    </section>
  );
}
