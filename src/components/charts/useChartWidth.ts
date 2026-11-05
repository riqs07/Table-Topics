"use client";
// The width a chart is drawn at, measured from the space it is given (Chart Kit, second design pass): a chart drawn in its real pixels keeps its text, marks and dots the same size on a phone and on a wide card, instead of scaling up with the card

// Load React's state, callback and effect tools
import { useCallback, useEffect, useState } from "react";

// The element's width, kept up to date as it changes (the guess until the browser has measured it, as on the server and in tests)
export function useChartWidth(guess = 320): { ref: (element: HTMLElement | null) => void; width: number } {
  // The element, once drawn
  const [element, setElement] = useState<HTMLElement | null>(null);
  // Its width
  const [width, setWidth] = useState(guess);
  // Watch it
  useEffect(() => {
    // Nothing to watch yet
    if (!element) return;
    // Its width now, when the browser knows it
    const measure = () => {
      // The width inside it, in whole pixels
      const now = Math.floor(element.clientWidth);
      // Kept when real
      if (now > 0) setWidth(now);
    };
    // Measure once
    measure();
    // Browsers without the watcher keep the first measure
    if (typeof ResizeObserver === "undefined") return;
    // Measure again whenever it changes size
    const watcher = new ResizeObserver(measure);
    // Watch
    watcher.observe(element);
    // Stop watching when it goes
    return () => watcher.disconnect();
  }, [element]);
  // The callback the element is given
  const ref = useCallback((node: HTMLElement | null) => setElement(node), []);
  // Hand them back
  return { ref, width };
}
