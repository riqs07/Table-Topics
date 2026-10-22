"use client";
// The shared pieces of pitch in your words (decision 111): the fell, held and rose marks, a hook that measures a row's width, and one row of curve with its words under it (used by the phrase rows, planned stress, last try and this try, the model voice in shadowing and loudness as thickness)

// Load React's state, callback and effect tools
import { useCallback, useEffect, useState } from "react";
// Load the picture's sizes and the slot type
import { CURVE_HEIGHT, USUAL_Y, type PhraseEnd, type WordSlot } from "@/core/pitchPhrases";
// Load the thick-line piece type
import type { ThickPiece } from "@/core/loudnessLine";

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
export const MOST_ROW_WIDTH = 560;

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

// How a word under a curve is shown
export type WordLook = "plain" | "peak" | "top" | "target" | "current" | "muted";

// Each look's classes
const LOOKS: Readonly<Record<WordLook, string>> = {
  // An ordinary word
  plain: "text-ink",
  // One of the phrase's peaks
  peak: "font-bold text-ink",
  // The highest point, in the planned-stress card
  top: "font-bold text-accent",
  // A key word to lean on
  target: "font-bold text-warm-ink underline decoration-dotted decoration-2 underline-offset-4",
  // The word playing now
  current: "-mx-1 rounded-md bg-fill px-1 font-bold text-fill-ink",
  // A word in a flat phrase
  muted: "text-ink-muted",
};

// What one row of curve and words needs
export interface CurveRowProps {
  // The row's width in pixels
  width: number;
  // The words with their times
  words: ReadonlyArray<{ text: string; start: number; end: number }>;
  // Where each word of this row sits
  slots: ReadonlyArray<WordSlot>;
  // This take's curve, as path text
  path: string;
  // What the curve shows, read out by screen readers
  label: string;
  // A curve drawn dashed underneath: the last take, or the model voice
  under?: string | null;
  // A second, fainter curve underneath: the first round of a 4/3/2 loop (decision 118)
  faintUnder?: string | null;
  // Where the key words sit on the curve (dashed circles)
  targets?: ReadonlyArray<{ x: number; y: number }>;
  // The highest point (a dot)
  dot?: { x: number; y: number } | null;
  // Loudness as thickness: pieces drawn behind the curve
  pieces?: ReadonlyArray<ThickPiece>;
  // The playhead, while this row plays
  playhead?: { x: number; y: number } | null;
  // How each word looks, by its place in the words
  look?: (index: number) => WordLook;
  // Tap a word: given, the words are buttons
  onWord?: ((index: number) => void) | null;
  // Each word button's label
  wordLabel?: (index: number) => string;
}

// One row: the curve over its words, the usual pitch dashed across it
export function CurveRow({ width, words, slots, path, label, under = null, faintUnder = null, targets = [], dot = null, pieces = [], playhead = null, look = () => "plain", onWord = null, wordLabel }: CurveRowProps) {
  // The curve and the words
  return (
    <div>
      {/* The picture, named for screen readers */}
      <svg width={width} height={CURVE_HEIGHT} viewBox={`0 0 ${width} ${CURVE_HEIGHT}`} role="img" aria-label={label} className="block overflow-visible">
        {/* The usual pitch */}
        <line x1="0" x2={width} y1={USUAL_Y} y2={USUAL_Y} className="text-ink-muted" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.45" />
        {/* The faintest curve, dashed and lighter still (a loop's first round) */}
        {faintUnder && <path data-under-faint d={faintUnder} className="text-ink-muted" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="2 4" opacity="0.45" />}
        {/* The other curve, dashed and muted */}
        {under && <path data-under d={under} className="text-ink-muted" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="6 4" />}
        {/* Loudness: thicker where louder */}
        {pieces.length > 0 && <g className="text-accent" opacity="0.35">{pieces.map((piece, index) => <line key={index} data-thick x1={piece.x1} y1={piece.y1} x2={piece.x2} y2={piece.y2} stroke="currentColor" strokeWidth={piece.width} strokeLinecap="round" />)}</g>}
        {/* This take's curve */}
        <path data-curve d={path} className="text-accent" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* The key words */}
        {targets.map((target, index) => <circle key={index} data-target cx={target.x} cy={target.y} r="7" className="text-warm-ink" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" fill="none" />)}
        {/* The highest point */}
        {dot && <circle data-top cx={dot.x} cy={dot.y} r="5" className="fill-accent" />}
        {/* The playhead */}
        {playhead && (
          <g data-playhead className="text-ink">
            {/* The line across */}
            <line x1={playhead.x} x2={playhead.x} y1="0" y2={CURVE_HEIGHT} stroke="currentColor" strokeWidth="1.5" />
            {/* The point on the curve */}
            <circle cx={playhead.x} cy={playhead.y} r="5" className="fill-card" stroke="currentColor" strokeWidth="2" />
          </g>
        )}
      </svg>
      {/* The words under it, each at its place */}
      <div className={`relative ${onWord ? "h-11" : "h-7"}`} style={{ width }}>
        {/* Each word */}
        {slots.map((slot) => {
          // The word
          const word = words[slot.index]!;
          // Its look
          const wordLook = look(slot.index);
          // Its classes (a playing button takes its highlight on the word inside, so the tap area stays the same)
          const classes = `absolute top-0 whitespace-nowrap text-footnote ${onWord && wordLook === "current" ? "font-bold text-ink" : LOOKS[wordLook]}`;
          // A button that plays from it, or plain text
          return onWord ? (
            <button key={slot.index} type="button" data-word={slot.index} onClick={() => onWord(slot.index)} aria-label={wordLabel?.(slot.index)} className={`${classes} -mx-1 flex h-11 items-start px-1 pt-0.5`} style={{ left: slot.left }}>
              {/* The word, highlighted when playing */}
              <span className={wordLook === "current" ? LOOKS.current : ""}>{word.text}</span>
            </button>
          ) : (
            <span key={slot.index} className={classes} style={{ left: slot.left }}>{word.text}</span>
          );
        })}
      </div>
    </div>
  );
}
