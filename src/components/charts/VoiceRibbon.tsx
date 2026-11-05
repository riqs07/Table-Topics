"use client";
// The Chart Kit's voice ribbon (second design pass): your take as a row of thin rounded bars (taller where louder), a gap with a soft band for each real pause (lit for the one that mattered, a grey dashed line for one the headline does not praise), and a dot below for each pause word. Draws itself once from the left, then stays still (not at all with reduced motion)

// Load the layout and its sentence
import { ribbonLayout, ribbonSentence, thinRibbon, type Ribbon, type RibbonPause, type Span } from "@/core/chartKit";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the measured width
import { useChartWidth } from "@/components/charts/useChartWidth";
// Load the values on hover and focus
import { ChartMarks, type ChartMark } from "@/components/charts/ChartMarks";

// What the ribbon needs
export interface VoiceRibbonProps {
  // The ribbon
  ribbon: Ribbon;
  // The width drawn at until the space it is given has been measured, in pixels
  width?: number;
  // The bars' height in the same units
  height?: number;
  // Pauses to light: the one that mattered
  lit?: ReadonlyArray<Span>;
  // Pauses to grey: ones the headline does not praise, such as mid-sentence
  grey?: ReadonlyArray<Span>;
  // What a lit and a grey pause are called on hover, such as "between thoughts"
  pauseNames?: { lit?: string; grey?: string; well?: string };
  // Your voice, or your last time as a grey ghost
  tone?: "voice" | "ghost";
  // Whether pause words are shown (hidden by the setting, decision 79)
  pauseWords?: boolean;
  // The sentence read out (the ribbon's own by default); null hides the picture from screen readers when words beside it already say it
  label?: string | null;
  // Whether the pauses and pause words show their values on hover and focus
  marks?: boolean;
  // Whether it draws itself in once
  draw?: boolean;
}

// What a pause says on hover
function pauseTip(pause: RibbonPause, names: VoiceRibbonProps["pauseNames"]): string {
  // Its name, when it has one
  const name = names?.[pause.kind];
  // The words
  return `A ${pause.seconds.toFixed(1)}-second pause${name ? `, ${name}` : ""}, at ${formatClock(pause.start)}`;
}

// The ribbon
export function VoiceRibbon({ ribbon, width: guess = 320, height = 56, lit = [], grey = [], pauseNames, tone = "voice", pauseWords = true, label, marks = true, draw = true }: VoiceRibbonProps) {
  // The width it is drawn at: the space it is given
  const { ref, width } = useChartWidth(guess);
  // The layout, thinned to no more than a bar every three pixels
  const layout = ribbonLayout(thinRibbon(ribbon, Math.floor(width / 3)), { width, height }, { lit, grey });
  // Whether it is a small ribbon (a History row), with smaller dots closer under it
  const small = height < 40;
  // A pause word's dot
  const umRadius = small ? 2.5 : 4.5;
  // Where the pause words sit
  const umY = height + (small ? 4.5 : 10);
  // Room under the bars for the pause words
  const total = pauseWords ? umY + umRadius + 1 : height + 2;
  // The values to point at: each pause, then each pause word
  const points: ChartMark[] = marks ? [...layout.pauses.map((pause) => ({ x: pause.x, y: 0, width: Math.max(10, pause.width), height, tip: pauseTip(pause, pauseNames) })), ...(pauseWords ? layout.ums.map((um) => ({ x: um.x - 9, y: umY - 9, width: 18, height: 18, tip: `A pause word at ${formatClock(um.at)}` })) : [])] : [];
  // The sentence read out
  const sentence = label === undefined ? ribbonSentence(layout, { pauseWords }) : label;
  // The picture, with its values over it
  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${width} ${total}`} {...(sentence ? { role: "img", "aria-label": sentence } : { "aria-hidden": true })} className="block h-auto w-full overflow-visible">
        {/* The bars, drawn in once */}
        <g className={draw ? "motion-safe:animate-chart-draw" : undefined}>
          {layout.bars.map((bar) => <rect key={bar.slot} data-stretch x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx={Math.min(2, bar.width / 2)} className={tone === "voice" ? "fill-chart-voice" : "fill-chart-ghost"} />)}
        </g>
        {/* The real pauses: a soft band, lit for the one that mattered, a grey dashed line for the rest */}
        {layout.pauses.map((pause) => (pause.kind === "grey"
          ? <line key={pause.start} data-pause="grey" x1={pause.x + 3} x2={pause.x + Math.max(4, pause.width - 3)} y1={height / 2} y2={height / 2} className="stroke-chart-ghost" strokeWidth="3" strokeDasharray="3 3" strokeLinecap="round" />
          : <rect key={pause.start} data-pause={pause.kind} x={pause.x + 1} y={height / 2 - 3} width={Math.max(2, pause.width - 2)} height="6" rx="3" className="fill-chart-well" opacity={pause.kind === "lit" ? 0.9 : 0.35} />))}
        {/* The pause words, a dot each under the ribbon */}
        {pauseWords && layout.ums.map((um, index) => <circle key={index} data-um cx={um.x} cy={umY} r={umRadius} className="fill-chart-um" />)}
      </svg>
      {/* The values, on hover and focus */}
      {points.length > 0 && <ChartMarks marks={points} box={{ width, height: total }} label="Pauses and pause words" />}
    </div>
  );
}
