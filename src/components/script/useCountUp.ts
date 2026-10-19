"use client";
// How far numbers have counted up, from 0 to 1 over a short moment; straight to 1 when motion is unwelcome or the browser cannot animate (decision 69)

// Load React's state and effect tools
import { useEffect, useState } from "react";

// Whether counting up should run here
function motionWelcome(): boolean {
  // Only in a browser that can animate and has not asked for less motion
  return typeof window !== "undefined" && typeof window.requestAnimationFrame === "function" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
}

// Give the progress, starting the count when first shown
export function useCountUp(durationMs = 900): number {
  // Start at 0 only when it will count up, otherwise show the final numbers at once
  const [progress, setProgress] = useState(() => (motionWelcome() ? 0 : 1));

  // Run the count once
  useEffect(() => {
    // Nothing to do when already at the end
    if (progress >= 1) return;
    // When it started
    const started = performance.now();
    // The pending frame
    let frame = 0;
    // One step of the count
    const step = (time: number) => {
      // How far through
      const next = Math.min(1, (time - started) / durationMs);
      // Show it
      setProgress(next);
      // Keep going until the end
      if (next < 1) frame = window.requestAnimationFrame(step);
    };
    // Begin
    frame = window.requestAnimationFrame(step);
    // Stop if the numbers go away first
    return () => window.cancelAnimationFrame(frame);
    // Run once, on first showing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The progress
  return progress;
}
