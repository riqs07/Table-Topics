"use client";
// The shared pieces of pitch in your words (decision 111): the fell, held and rose marks, a hook that measures a row's width, and one row of curve with its words under it (used by the phrase rows, planned stress, last try and this try, the model voice in shadowing and loudness as thickness)

// Load React's state, callback and effect tools
import { useCallback, useEffect, useState } from "react";
// Load the phrase-end type
import type { PhraseEnd } from "@/core/pitchPhrases";

// The marks' drawings, in a 14-unit square
const END_PATHS: Readonly<Record<PhraseEnd, string>> = {
  // Down to the right: fell, sounds finished
  fell: "M2 3 L11 11 M11 5 L11 11 L5 11",
  // Straight on: held, more to come
  held: "M2 7 L12 7 M8 3 L12 7 L8 11",
  // Up to the right: rose, sounds like a question
  rose: "M2 11 L11 3 M5 3 L11 3 L11 9",
};

// Each mark's colour role: the accent for a finished fall, muted for a hold, the warm ink for a rise
export const END_COLOURS: Readonly<Record<PhraseEnd, string>> = { fell: "text-accent", held: "text-ink-muted", rose: "text-warm-ink" };

// The mark for how a phrase ended; given a label, it is read out, otherwise it is decoration beside words that say it
export function EndIcon({ end, label }: { end: PhraseEnd; label?: string }) {
  // The drawing in the end's colour
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={`inline-block flex-none ${END_COLOURS[end]}`} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      {/* The arrow */}
      <path d={END_PATHS[end]} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// About how wide a word is in the small text, in pixels (a little generous, so words never overlap; measured text would need a canvas the tests do not have)
export function wordWidth(text: string, bold = false): number {
  // Wide letters, narrow letters, and the rest, at about 15-pixel text
  return [...text].reduce((sum, letter) => sum + (/[mwMW]/.test(letter) ? 13 : /[A-Z]/.test(letter) ? 10.5 : /[iljtf.,'’:;!]/.test(letter) ? 4.8 : 8.6), 0) * (bold ? 1.07 : 1);
}

// The widest a row of curve and words is drawn, in pixels, so a few words do not spread across a wide screen
export const MOST_ROW_WIDTH = 860;

// How wide words are in the small text, measured on a hidden word in the page's own type (so the real font and size are used), with a generous guess where nothing can be measured; measured afresh once the fonts have loaded
export function useWordMeasure(): (text: string, bold: boolean) => number {
  // The measuring function: the guess until the page can measure
  const [measure, setMeasure] = useState<(text: string, bold: boolean) => number>(() => wordWidth);
  // Measure in the page, now and once the fonts have loaded
  useEffect(() => {
    // A hidden word in the small text, off to the side
    const probe = document.createElement("span");
    // Out of view and out of the way, in the small text
    probe.className = "pointer-events-none invisible absolute top-0 left-0 whitespace-nowrap text-footnote";
    // Hidden from screen readers too
    probe.setAttribute("aria-hidden", "true");
    // In the page
    document.body.appendChild(probe);
    // Make the measuring function, with its own store of widths
    const make = () => {
      // Widths already measured
      const known = new Map<string, number>();
      // Each word's width, in bold or regular
      setMeasure(() => (text: string, bold: boolean) => {
        // The store's key
        const key = `${bold ? "b" : "r"}${text}`;
        // Measured before
        const stored = known.get(key);
        // Hand it back
        if (stored !== undefined) return stored;
        // The weight asked for
        probe.style.fontWeight = bold ? "700" : "400";
        // The word
        probe.textContent = text;
        // Its width, or the guess where the page cannot lay it out
        const width = probe.getBoundingClientRect().width || wordWidth(text, bold);
        // Kept
        known.set(key, width);
        // Hand it back
        return width;
      });
    };
    // Now
    make();
    // Ignore a late answer
    let cancelled = false;
    // And when every font is loaded, where the browser can say
    void document.fonts?.ready.then(() => {
      // Measured afresh
      if (!cancelled) make();
    });
    // Stop on leaving
    return () => {
      // Ignore late answers
      cancelled = true;
      // The hidden word goes
      probe.remove();
    };
  }, []);
  // Hand it back
  return measure;
}

// The width of the element a row is drawn in, kept up to date as it changes (a guess until it has been measured)
export function useRowWidth(guess = 300): { ref: (element: HTMLElement | null) => void; width: number } {
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
      // The width inside it, no wider than a row is drawn
      const now = Math.min(MOST_ROW_WIDTH, Math.floor(element.clientWidth));
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

// One row of curve and words is the Chart Kit's pitch over your words (second design pass), kept here under its old names so every caller stays the same
export { CurveRow, PitchOverWords, type CurveRowProps, type WordLook } from "@/components/charts/PitchOverWords";
