// The Chart Kit's pitch over your words (second design pass; decision 111): one soft line for your pitch drawn over the words themselves (your words are the axis), your usual pitch as a light grid line, your last take (or the model voice) as a dashed grey ghost under it, a teal dot where a phrase fell cleanly at the end. The line is the smoothed curve the callers make (decision B7: it flows, never steps)

// Load the picture's sizes and the slot type
import { CURVE_HEIGHT, USUAL_Y, type WordSlot } from "@/core/pitchPhrases";
// Load the thick-line piece type
import type { ThickPiece } from "@/core/loudnessLine";

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
  target: "font-bold text-ink underline decoration-chart-well decoration-dotted decoration-2 underline-offset-4",
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
  // Where the phrase fell cleanly at its end (a teal dot), when it did
  fell?: { x: number; y: number } | null;
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

// One row: the soft pitch line over its words, the usual pitch a light line across it
export function CurveRow({ width, words, slots, path, label, under = null, faintUnder = null, targets = [], dot = null, fell = null, pieces = [], playhead = null, look = () => "plain", onWord = null, wordLabel }: CurveRowProps) {
  // The curve and the words
  return (
    <div>
      {/* The picture, named for screen readers */}
      <svg width={width} height={CURVE_HEIGHT} viewBox={`0 0 ${width} ${CURVE_HEIGHT}`} role="img" aria-label={label} className="block overflow-visible">
        {/* Your usual pitch: a light grid line */}
        <line x1="0" x2={width} y1={USUAL_Y} y2={USUAL_Y} className="stroke-rule" strokeWidth="1.5" strokeLinecap="round" />
        {/* The faintest ghost, dotted (a loop's first round) */}
        {faintUnder && <path data-under-faint d={faintUnder} className="stroke-chart-ghost" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="1 4" />}
        {/* The ghost: your last take, dashed grey */}
        {under && <path data-under d={under} className="stroke-chart-ghost" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="5 4" />}
        {/* Loudness: thicker where louder, soft behind the line */}
        {pieces.length > 0 && <g className="stroke-chart-voice" opacity="0.22">{pieces.map((piece, index) => <line key={index} data-thick x1={piece.x1} y1={piece.y1} x2={piece.x2} y2={piece.y2} strokeWidth={piece.width} strokeLinecap="round" />)}</g>}
        {/* This take's pitch: one soft line, drawn in once */}
        <path data-curve d={path} className="stroke-chart-voice motion-safe:animate-chart-draw" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* The key words, dashed rings */}
        {targets.map((target, index) => <circle key={index} data-target cx={target.x} cy={target.y} r="7" className="stroke-chart-well" strokeWidth="2" strokeDasharray="3 2" fill="none" />)}
        {/* The highest point */}
        {dot && <circle data-top cx={dot.x} cy={dot.y} r="4.5" className="fill-chart-voice stroke-card" strokeWidth="2" />}
        {/* A clean fall at the end */}
        {fell && <circle data-fell cx={fell.x} cy={fell.y} r="4" className="fill-chart-well" />}
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
      {/* The words under it, each at its place: the chart's axis */}
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

// The kit's name for the same row
export const PitchOverWords = CurveRow;
