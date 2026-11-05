"use client";
// A long take at a glance (decision 115): its fingerprint (one strip of speech stretches, taller where louder, with pause-word ticks, pitch-peak dots and marks under pauses that split a sentence, and a plain headline), its best moment (the words, why, and a play button for just that window), and its energy arc by thirds. Colour roles only

// Load the play and stop icons
import { PlayIcon } from "@phosphor-icons/react/dist/ssr";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the smooth path drawer
import { smoothPath } from "@/core/pitchClean";
// Load the Chart Kit's frame, ribbon and key, the ribbon from stretches and the headline's key words
import { ChartCard, Emphasised } from "@/components/charts/ChartCard";
import { VoiceRibbon } from "@/components/charts/VoiceRibbon";
import { ChartKey } from "@/components/charts/ChartKey";
import { glanceEmphasis, ribbonFromStretches } from "@/core/chartKit";
// Load the types drawn here
import type { Fingerprint } from "@/core/fingerprint";
import type { BestMoment } from "@/core/bestMoment";
import type { EnergyArc } from "@/core/energyArc";

// The fingerprint card, as the Chart Kit's "after a take" (second design pass): the headline with its key words lit, the whole take as a voice ribbon (pauses as gaps with a soft band, a pause that split a sentence as a grey dashed line, a dot below for each pause word), its ends, and a key
export function FingerprintCard({ print }: { print: Fingerprint }) {
  // The ribbon: from the readings when kept on the fingerprint, otherwise from its stretches
  const ribbon = print.ribbon ?? ribbonFromStretches(print.stretches, print.duration, print.ums);
  // The headline's key words
  const em = glanceEmphasis(print.headline);
  // The card
  return (
    <ChartCard id="glance-heading" label="Your take at a glance" headline={<Emphasised text={print.headline} em={em} />} note={print.note} className="mt-5" data={{ "data-fingerprint": true }}>
      {/* The ribbon, with the pauses and pause words to point at */}
      {ribbon && <div className="mt-1"><VoiceRibbon ribbon={ribbon} width={480} height={48} grey={print.midPauses} pauseNames={{ grey: "mid-sentence" }} label={`The whole take as a ribbon: ${print.stretches.length} stretches of speech, ${print.ums.length} pause ${print.ums.length === 1 ? "word" : "words"} and ${print.midPauses.length} ${print.midPauses.length === 1 ? "pause" : "pauses"} mid-sentence.`} /></div>}
      {/* The ends */}
      <p className="flex justify-between text-footnote text-ink-muted"><span>0:00</span><span>{formatClock(Math.round(print.duration))}</span></p>
      {/* What the marks mean */}
      <ChartKey items={[{ kind: "voice", name: "Speaking (taller = louder)" }, { kind: "pause", name: "A real pause" }, ...(print.midPauses.length > 0 ? [{ kind: "pause-grey" as const, name: "Pause mid-sentence" }] : []), { kind: "um", name: "Pause word" }]} />
    </ChartCard>
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

// The energy-arc card, in the Chart Kit's language (second design pass): the arc's line as the headline, then the energy by thirds as one soft line over a light grid
export function EnergyArcCard({ arc }: { arc: EnergyArc }) {
  // The picture's size
  const [width, height] = [326, 70];
  // The scale: a little room above the highest and below the lowest
  const [top, bottom] = [Math.max(...arc.thirds) + 0.15, Math.min(...arc.thirds) - 0.15];
  // Down the picture for an energy
  const y = (value: number) => 6 + ((top - value) / Math.max(0.01, top - bottom)) * (height - 16);
  // The points: held flat at both ends, through each third's middle
  const points = [{ x: 0, y: y(arc.thirds[0]) }, { x: width / 6, y: y(arc.thirds[0]) }, { x: width / 2, y: y(arc.thirds[1]) }, { x: (width * 5) / 6, y: y(arc.thirds[2]) }, { x: width, y: y(arc.thirds[2]) }];
  // The card
  return (
    <ChartCard id="energy-heading" label="Energy" heading="label" headline={arc.line} note="Loudness and pitch variety together, by thirds of the take." className="mt-5" data={{ "data-energy-arc": true }}>
      {/* The picture */}
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={arc.line} className="block h-auto w-full overflow-visible">
        {/* The thirds, light grid lines */}
        {[width / 3, (width * 2) / 3].map((x) => <line key={x} x1={x} x2={x} y1="0" y2={height} className="stroke-rule" strokeWidth="1.5" />)}
        {/* The energy: one soft line, drawn in once */}
        <path d={smoothPath(points)} className="stroke-chart-voice motion-safe:animate-chart-draw" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
      {/* The thirds' names */}
      <p className="grid grid-cols-3 text-center text-footnote text-ink-muted"><span>Beginning</span><span>Middle</span><span>End</span></p>
    </ChartCard>
  );
}
