"use client";
// The Chart Kit's pause bars (second design pass): one rounded bar per mark, as tall as the pause, against the target band; a bar in the band is the "went well" colour, one outside it grey (never red); your words along the bottom, the length over each bar, and the full value on hover and focus

// Load the layout
import { pauseBarsLayout, type PauseBarInput } from "@/core/chartKit";
// Load the measured width
import { useChartWidth } from "@/components/charts/useChartWidth";
// Load the values on hover and focus
import { ChartMarks } from "@/components/charts/ChartMarks";

// The picture's height and margins, in pixels (its width is the space it is given)
const MARGINS = { height: 170, top: 22, bottom: 24 } as const;

// What the bars need
export interface PauseBarsProps {
  // Each mark: the word before it and the pause's length (null when not heard)
  gaps: ReadonlyArray<PauseBarInput>;
  // The target, in seconds
  target: { shortest: number; longest: number };
  // What the list of values is called, for screen readers
  listLabel: string;
  // The sentence read out for the picture
  label: string;
}

// A length as text, such as "1.4 s", or "not heard"
export function pauseText(seconds: number | null): string {
  // Not heard, or one decimal
  return seconds === null ? "not heard" : `${seconds.toFixed(1)} s`;
}

// A word cut to fit a width, about seven units a letter
function fit(word: string, width: number): string {
  // Letters that fit
  const room = Math.max(3, Math.floor(width / 7));
  // The word, or its start with an ellipsis
  return word.length <= room ? word : `${word.slice(0, room - 1)}…`;
}

// The bars
export function PauseBars({ gaps, target, listLabel, label }: PauseBarsProps) {
  // The width it is drawn at: the space it is given
  const { ref, width } = useChartWidth();
  // The picture's box
  const BOX = { ...MARGINS, width };
  // The layout
  const layout = pauseBarsLayout(gaps, target, BOX);
  // Width of each mark's slot
  const slot = BOX.width / Math.max(1, gaps.length);
  // The picture with its values over it
  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
        {/* The target band */}
        <rect data-band x="0" y={layout.band.y} width={BOX.width} height={layout.band.height} rx="6" className="fill-chart-band" />
        {/* Its name */}
        <text x={BOX.width - 4} y={layout.band.y - 5} textAnchor="end" fontSize="11" className="fill-ink-muted">sweet spot</text>
        {/* The baseline */}
        <line x1="0" x2={BOX.width} y1={layout.base} y2={layout.base} className="stroke-rule" strokeWidth="2" strokeLinecap="round" />
        {/* The bars, drawn in once */}
        <g className="motion-safe:animate-chart-draw">
          {layout.bars.map((bar, index) => (bar.seconds === null
            // Not heard: a short dashed stub
            ? <line key={index} x1={bar.x - bar.width / 2} x2={bar.x + bar.width / 2} y1={layout.base - 4} y2={layout.base - 4} className="stroke-chart-ghost" strokeWidth="3" strokeDasharray="3 3" strokeLinecap="round" />
            // The pause
            : <rect key={index} data-inside={bar.inside} x={bar.x - bar.width / 2} y={bar.y} width={bar.width} height={bar.height} rx={Math.min(5, bar.width / 2)} className={bar.inside ? "fill-chart-well" : "fill-chart-ghost"} />))}
        </g>
        {/* Each length over its bar */}
        {layout.bars.map((bar, index) => <text key={index} x={bar.x} y={(bar.seconds === null ? layout.base - 4 : bar.y) - 6} textAnchor="middle" fontSize="12" fontWeight="700" className="fill-ink">{bar.seconds === null ? "–" : `${bar.seconds.toFixed(1)}s`}</text>)}
        {/* Your words along the bottom */}
        {layout.bars.map((bar, index) => <text key={index} x={bar.x} y={BOX.height - 4} textAnchor="middle" fontSize="11" className="fill-ink-muted">{fit(bar.after, slot - 4)}</text>)}
      </svg>
      {/* Each value, on hover and focus */}
      <ChartMarks marks={layout.bars.map((bar) => ({ x: bar.x - slot / 2 + 2, y: 0, width: slot - 4, height: BOX.height, tip: `after “${bar.after}”: ${pauseText(bar.seconds)}` }))} box={BOX} label={listLabel} />
    </div>
  );
}
