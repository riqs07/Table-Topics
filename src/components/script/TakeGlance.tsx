"use client";
// A long take at a glance (decision 115): its fingerprint (one strip of speech stretches, taller where louder, with pause-word ticks, pitch-peak dots and marks under pauses that split a sentence, and a plain headline), its best moment (the words, why, and a play button for just that window), its energy arc by thirds, and a story's shape strip. Colour roles only

// Load the shared card and label looks
import { CARD, LABEL } from "@/components/script/textStyles";
// Load the play and stop icons
import { PlayIcon } from "@phosphor-icons/react/dist/ssr";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the smooth path drawer
import { smoothPath } from "@/core/pitchClean";
// Load the types drawn here
import type { Fingerprint } from "@/core/fingerprint";
import type { BestMoment } from "@/core/bestMoment";
import type { EnergyArc } from "@/core/energyArc";
import { SHAPE_NAMES, type StoryShape } from "@/core/storyShape";

// The strip's picture: 326 across, 84 down (it stretches to the card)
const STRIP = { width: 326, height: 84, middle: 40 } as const;

// The fingerprint card
export function FingerprintCard({ print }: { print: Fingerprint }) {
  // Across the picture for a moment
  const x = (seconds: number) => (seconds / Math.max(1, print.duration)) * STRIP.width;
  // The usual stretch's level, for drawing the quieter last stretch lighter
  const quieterLast = print.note !== null;
  // The card
  return (
    <section aria-labelledby="glance-heading" data-fingerprint className={`mt-5 flex flex-col gap-2 p-5 ${CARD}`}>
      {/* What it is */}
      <p className={LABEL}>Your take at a glance</p>
      {/* The headline */}
      <h2 id="glance-heading" className="font-display text-cue font-semibold tracking-tight">{print.headline}</h2>
      {/* The strip */}
      <svg viewBox={`0 0 ${STRIP.width} ${STRIP.height - 14}`} preserveAspectRatio="none" role="img" aria-label={`The whole take as a strip: ${print.stretches.length} stretches of speech, ${print.ums.length} pause ${print.ums.length === 1 ? "word" : "words"}, ${print.peaks.length} pitch ${print.peaks.length === 1 ? "peak" : "peaks"} and ${print.midPauses.length} ${print.midPauses.length === 1 ? "pause" : "pauses"} mid-sentence.`} className="mt-1 h-[70px] w-full">
        {/* The pause words, as ticks at the top */}
        {print.ums.map((at, index) => <polygon key={`u${index}`} data-um points={`${x(at)},4 ${x(at) + 4},11 ${x(at) - 4},11`} className="fill-warm" />)}
        {/* The stretches, taller where louder */}
        {print.stretches.map((stretch, index) => {
          // Its height
          const tall = 8 + stretch.level * 30;
          // The stretch
          return <rect key={`s${index}`} data-stretch x={x(stretch.start)} y={STRIP.middle - tall / 2} width={Math.max(2, x(stretch.end) - x(stretch.start) - 1)} height={tall} rx="4" className={quieterLast && index === print.stretches.length - 1 ? "fill-accent/45" : "fill-accent"} />;
        })}
        {/* The pauses that split a sentence, under the strip */}
        {print.midPauses.map((pause, index) => <rect key={`m${index}`} data-mid x={x(pause.start)} y={STRIP.middle + 22} width={Math.max(4, x(pause.end) - x(pause.start))} height="4" rx="2" className="fill-warm" />)}
        {/* The pitch peaks, as dots above */}
        {print.peaks.map((at, index) => <circle key={`p${index}`} data-peak cx={x(at)} cy="18" r="3.5" className="fill-ink" />)}
      </svg>
      {/* The ends */}
      <p className="flex justify-between text-footnote text-ink-muted"><span>0:00</span><span>{formatClock(Math.round(print.duration))}</span></p>
      {/* What the marks mean */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-footnote text-ink-muted">
        {/* Speech */}
        <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-[18px] flex-none rounded-sm bg-accent" />Speaking (taller = louder)</span>
        {/* Pause words */}
        <span className="flex items-center gap-1.5"><svg width="10" height="10" aria-hidden="true" className="flex-none"><polygon points="5,0 10,9 0,9" className="fill-warm" /></svg>Pause word</span>
        {/* Peaks */}
        <span className="flex items-center gap-1.5"><svg width="10" height="10" aria-hidden="true" className="flex-none"><circle cx="5" cy="5" r="4" className="fill-ink" /></svg>Pitch peak</span>
        {/* Split sentences */}
        <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-1 w-[18px] flex-none rounded-full bg-warm" />Pause mid-sentence</span>
      </div>
      {/* The volume at the end */}
      {print.note && <p className="mt-1 text-footnote text-ink-muted">{print.note}</p>}
    </section>
  );
}

// The best-moment card
export function BestMomentCard({ moment, onPlay }: { moment: BestMoment; onPlay: ((start: number, end: number) => void) | null }) {
  // How long it is
  const seconds = Math.round(moment.end - moment.start);
  // The card, in the filled colour
  return (
    <section aria-labelledby="best-moment-heading" data-best-moment className="mt-5 flex flex-col gap-2.5 rounded-[22px] bg-fill p-5 text-fill-ink">
      {/* What it is */}
      <h2 id="best-moment-heading" className="text-footnote font-semibold">Your best moment</h2>
      {/* The words */}
      <p className="font-display text-cue font-semibold leading-snug">“{moment.words}”</p>
      {/* Why */}
      <p className="text-footnote leading-snug">{moment.why}</p>
      {/* Play it, and when */}
      <div className="flex items-center gap-3">
        {/* The button, when the recording is kept */}
        {onPlay && <button type="button" onClick={() => onPlay(moment.start, moment.end)} aria-label="Play your best moment" className="flex size-11 flex-none items-center justify-center rounded-full bg-fill-ink text-fill"><PlayIcon weight="fill" aria-hidden="true" className="size-4" /></button>}
        {/* When */}
        <span className="text-footnote">{formatClock(Math.floor(moment.start))} to {formatClock(Math.ceil(moment.end))} · {seconds} seconds</span>
      </div>
    </section>
  );
}

// The energy-arc card
export function EnergyArcCard({ arc }: { arc: EnergyArc }) {
  // The picture's size
  const [width, height] = [326, 70];
  // The scale: a little room above the highest and below the lowest
  const [top, bottom] = [Math.max(...arc.thirds) + 0.15, Math.min(...arc.thirds) - 0.15];
  // Down the picture for an energy
  const y = (value: number) => 6 + ((top - value) / Math.max(0.01, top - bottom)) * (height - 16);
  // The points: held flat at both ends, through each third's middle
  const points = [{ x: 0, y: y(arc.thirds[0]) }, { x: width / 6, y: y(arc.thirds[0]) }, { x: width / 2, y: y(arc.thirds[1]) }, { x: (width * 5) / 6, y: y(arc.thirds[2]) }, { x: width, y: y(arc.thirds[2]) }];
  // The curve
  const curve = smoothPath(points);
  // The card
  return (
    <section aria-labelledby="energy-heading" data-energy-arc className={`mt-5 flex flex-col gap-2 p-5 ${CARD}`}>
      {/* What it is */}
      <h2 id="energy-heading" className={LABEL}>Energy</h2>
      {/* The picture */}
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={arc.line} className="h-[70px] w-full">
        {/* The area under the curve */}
        <path d={`${curve}L${width} ${height}L0 ${height}Z`} className="fill-accent/15" />
        {/* The curve */}
        <path d={curve} className="text-accent" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {/* The thirds */}
        <line x1={width / 3} x2={width / 3} y1="0" y2={height} className="text-rule" stroke="currentColor" vectorEffect="non-scaling-stroke" />
        {/* (second line) */}
        <line x1={(width * 2) / 3} x2={(width * 2) / 3} y1="0" y2={height} className="text-rule" stroke="currentColor" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* The thirds' names */}
      <p className="grid grid-cols-3 text-center text-footnote text-ink-muted"><span>Beginning</span><span>Middle</span><span>End</span></p>
      {/* What it shows */}
      <p className="text-footnote leading-snug">Loudness and pitch variety together. <b>{arc.line}</b></p>
    </section>
  );
}

// Each part's look on the strip
const PART_LOOKS = { setup: "bg-accent/20 text-ink", turn: "bg-fill text-fill-ink", end: "bg-accent/55 text-ink", point: "bg-warm text-on-warm" } as const;

// A story's shape strip
export function StoryShapeStrip({ shape }: { shape: StoryShape }) {
  // When the point came, when known
  const point = shape.parts.find((part) => part.part === "point");
  // The card
  return (
    <section aria-labelledby="story-shape-heading" data-story-shape className={`mt-5 flex flex-col gap-2.5 p-5 ${CARD}`}>
      {/* What it is */}
      <h2 id="story-shape-heading" className={LABEL}>Story shape</h2>
      {/* The strip */}
      <div role="img" aria-label={shape.parts.map((part) => `${SHAPE_NAMES[part.part]} ${Math.round(part.share * 100)}%`).join(", ")} className="flex h-8 overflow-hidden rounded-lg text-footnote font-semibold">
        {/* Each part */}
        {shape.parts.map((part) => <div key={part.part} data-part={part.part} style={{ flexGrow: Math.max(0.02, part.share), flexBasis: 0 }} className={`flex min-w-0 items-center overflow-hidden px-1.5 whitespace-nowrap ${PART_LOOKS[part.part]}`}>{part.share >= 0.12 ? SHAPE_NAMES[part.part] : ""}</div>)}
      </div>
      {/* The ends, in time when known */}
      {point?.at !== null && point?.at !== undefined && <p className="flex justify-between text-footnote text-ink-muted"><span>0:00</span><span>Point: {formatClock(point.at)}</span></p>}
      {/* The line */}
      <p className="text-footnote leading-snug">{shape.line}</p>
      {/* Where it came from */}
      <p className="text-footnote text-ink-muted">{shape.source === "coach" ? "From the beats the coach heard." : "Rough: from the words the phone caught."}</p>
    </section>
  );
}
