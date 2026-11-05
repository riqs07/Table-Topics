"use client";
// Every chart, for a week of testing (decision 124), drawn in the Chart Kit's language (second design pass: headline first, the five marks, no red): under a take's own views, each round-two chart that this take can draw, each saying what it answers, how sure it can be and what it needs; the charts it cannot draw are listed with why, so testing shows where each one makes sense

// Load React's memo tool
import { useMemo, type ReactNode } from "react";
// Load the shared looks
import { CARD, LAB, LABEL, SECTION_HEADING } from "@/components/script/textStyles";
// Load the Chart Kit's ribbon
import { VoiceRibbon } from "@/components/charts/VoiceRibbon";
import { ribbonFromLevels, ribbonSlots } from "@/core/chartKit";
import { PRESS } from "@/components/script/Buttons";
// Load the play type the lenses use
import type { PlayFrom } from "@/components/script/LensViews";
// Load the chart findings
import { emphasis, flowRibbon, focusProgress, loudShapes, paceStretch, paceStretchLine, sentenceEndings, shapeWorthDrawing, usualRows, voiceLine, voiceLinePhrase, voiceRange, type Emphasis, type Endings, type FlowRibbon, type FocusProgress, type LoudShapes, type UsualRow, type VoiceLine, type VoiceRange } from "@/core/chartTrial";
// Load the energy arc
import { energyArc, type EnergyArc } from "@/core/energyArc";
// Load the smooth curve drawer
import { smoothPath } from "@/core/pitchClean";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the lens types
import type { LensText } from "@/core/lenses/lensWords";
import type { PauseLens } from "@/core/lenses/pauseLens";
import type { PaceLens } from "@/core/lenses/paceLens";
import type { Phrase } from "@/core/pitchPhrases";
// Load the record types
import type { FullSession, SessionRecord } from "@/data/records";

// The pictures' width in picture units
const W = 326;

// What the trial needs
export interface ChartTrialProps {
  // The take
  session: FullSession;
  // Every take, for "usual" and progress
  sessions: ReadonlyArray<SessionRecord>;
  // The speaker's usual pitch range in steps, or null
  usual: number | null;
  // The take's words, when caught
  text: LensText | null;
  // Its pause lens, when its words have times
  pauses: PauseLens | null;
  // Its pace lens, when its words have times
  pace: PaceLens | null;
  // Its pitch phrases, when drawn
  phrases: ReadonlyArray<Phrase>;
  // Whether pause words are counted
  pauseWords: boolean;
  // Play from a moment, when the recording is kept
  onPlay: PlayFrom;
}

// A time as m:ss
function clock(seconds: number): string {
  // Minutes and seconds
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

// One chart's card: its name, the question it answers, the picture, its line, and how sure it is
function TrialCard({ id, title, answers, sure, needs, line, children }: { id: string; title: string; answers: string; sure: "high" | "medium"; needs: string; line: ReactNode; children: ReactNode }) {
  // The card
  return (
    <section aria-labelledby={`trial-${id}`} data-trial-chart={id} className={`flex flex-col gap-2.5 p-5 ${CARD}`}>
      {/* Its name, small */}
      <h3 id={`trial-${id}`} className={LAB}>{title}</h3>
      {/* What it shows: the headline the picture proves */}
      <p className="font-display text-running font-semibold leading-tight">{line}</p>
      {/* The picture */}
      {children}
      {/* The question it answers */}
      <p className="text-footnote text-ink-muted">Answers: {answers}</p>
      {/* How sure, and what it needs */}
      <p className="flex flex-wrap gap-1.5 text-tab font-semibold">
        {/* How sure */}
        <span className={`rounded-full px-2 py-0.5 ${sure === "high" ? "bg-accent/15 text-accent" : "bg-warm-tint text-warm-ink"}`}>How sure: {sure}</span>
        {/* What it needs */}
        <span className="rounded-full bg-rule/60 px-2 py-0.5 text-ink-muted">{needs}</span>
      </p>
    </section>
  );
}

// A small play button for a moment
function PlayChip({ label, onClick }: { label: string; onClick: () => void }) {
  // The button
  return <button type="button" onClick={onClick} className={`min-h-11 rounded-full border-2 border-rule px-3 text-footnote font-semibold text-ink hover:border-ink ${PRESS}`}>▶ {label}</button>;
}

// 1 · The voice line over the words
function VoiceLineChart({ line, onPlay }: { line: VoiceLine; onPlay: PlayFrom }) {
  // Down the picture for a step (the usual pitch in the middle)
  const y = (step: number) => Math.max(6, Math.min(58, 34 - step * 3.5));
  // The points
  const points = line.points.map((point) => ({ x: 6 + point.x * (W - 12), y: y(point.step) }));
  // The last point
  const last = points.at(-1)!;
  // The words' size in picture units, and a letter's width at that size (generous, so neighbours keep a gap)
  const [size, letter, gap] = [9, 5.6, 5];
  // The words in place, each pushed right of the one before so none overlap
  const placed = line.words.reduce<number[]>((places, word, index) => [...places, Math.max(word.x * W, index === 0 ? 0 : places[index - 1]! + line.words[index - 1]!.text.length * letter + gap)], []);
  // How far the last word reaches
  const reach = (placed.at(-1) ?? 0) + (line.words.at(-1)?.text.length ?? 0) * letter;
  // Squeezed to the row when it runs over: places and size together, so the gaps stay
  const squeeze = reach > W ? W / reach : 1;
  // The picture and the words
  return (
    <>
      <svg viewBox={`0 0 ${W} 84`} role="img" aria-label={line.phrase.risingStatement ? "Your voice rose at the end of a statement." : "Your voice through one phrase."} className="h-auto w-full">
        {/* Your usual pitch: a light grid line */}
        <line x1="0" x2={W} y1="34" y2="34" className="stroke-rule" strokeWidth="1.5" />
        {/* The pitch: one soft line, drawn in once */}
        <path d={smoothPath(points)} className="stroke-chart-voice motion-safe:animate-chart-draw" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Its end: a teal dot for a clean fall, an open ring for a statement that rose, otherwise a small dot */}
        <circle cx={last.x} cy={last.y} r={line.phrase.risingStatement ? 5 : 4.5} className={line.phrase.ending === "fell" ? "fill-chart-well" : line.phrase.risingStatement ? "fill-card stroke-chart-voice" : "fill-chart-voice"} strokeWidth="2" />
        {/* The words in place under the line, sized with the picture */}
        <g aria-hidden="true" className="fill-ink" fontSize={size * squeeze} fontWeight={600}>
          {/* Each word */}
          {line.words.map((word, index) => <text key={index} x={placed[index]! * squeeze} y="78">{word.text}</text>)}
        </g>
      </svg>
      {/* Hear it */}
      {onPlay && <div><PlayChip label="Hear this phrase" onClick={() => onPlay(line.phrase.start)} /></div>}
    </>
  );
}

// 2 · The flow ribbon, as the kit's voice ribbon: pauses between thoughts lit, long stops a grey dashed line
function FlowChart({ ribbon, levels, onPlay }: { ribbon: FlowRibbon; levels: ReadonlyArray<number>; onPlay: PlayFrom }) {
  // The long stops
  const stops = ribbon.pieces.filter((piece) => piece.kind === "stop");
  // The voice ribbon from the readings (fewer bars for a very short take)
  const voice = ribbonFromLevels(levels, LOUDNESS_TICK_MS, [], Math.min(ribbonSlots((levels.length * LOUDNESS_TICK_MS) / 1000), levels.length));
  // The picture
  return (
    <>
      {/* The ribbon */}
      {voice && <VoiceRibbon ribbon={voice} lit={ribbon.pieces.filter((piece) => piece.kind === "pause")} grey={stops} pauseNames={{ lit: "between thoughts", grey: "a long stop" }} pauseWords={false} label={ribbon.line} />}
      {/* The ends of the take */}
      <p className="flex justify-between text-tab text-ink-muted"><span>0:00</span><span>{clock(voice?.duration ?? ribbon.to)}</span></p>
      {/* Hear the long stops */}
      {onPlay && stops.length > 0 && <div className="flex flex-wrap gap-2">{stops.slice(0, 3).map((stop) => <PlayChip key={stop.start} label={`${(stop.end - stop.start).toFixed(1)} s stop at ${clock(stop.start)}`} onClick={() => onPlay(stop.start - 1.5)} />)}</div>}
    </>
  );
}

// 3 · The pace ribbon
function PaceChart({ lens }: { lens: PaceLens }) {
  // The longest stretch outside the band
  const stretch = paceStretch(lens);
  // A long take's line averaged into about 40 points, so it reads as a trend rather than every second
  const size = Math.max(1, Math.ceil(lens.line.length / 40));
  // (the averaged points)
  const shown = Array.from({ length: Math.ceil(lens.line.length / size) }, (_, part) => lens.line.slice(part * size, (part + 1) * size)).map((part) => ({ t: part.reduce((sum, point) => sum + point.t, 0) / part.length, wpm: part.reduce((sum, point) => sum + point.wpm, 0) / part.length }));
  // The pace scale
  const [low, high] = [Math.min(lens.band.low, ...lens.line.map((point) => point.wpm)) - 10, Math.max(lens.band.high, ...lens.line.map((point) => point.wpm)) + 10];
  // Down the picture for a pace
  const y = (wpm: number) => 4 + ((high - wpm) / Math.max(1, high - low)) * 52;
  // Across for a moment
  const [first, last] = [lens.line[0]!.t, lens.line.at(-1)!.t];
  // (across)
  const x = (t: number) => ((t - first) / Math.max(0.1, last - first)) * W;
  // The picture
  return (
    <svg viewBox={`0 0 ${W} 60`} role="img" aria-label={paceStretchLine(stretch)} className="h-auto w-full">
      {/* Your usual band: the target */}
      <rect x="0" y={y(lens.band.high)} width={W} height={Math.max(2, y(lens.band.low) - y(lens.band.high))} rx="6" className="fill-chart-band" />
      {/* The stretch outside it, a grey wash */}
      {stretch && <rect x={x(stretch.from) - 4} y="0" width={Math.max(8, x(stretch.to) - x(stretch.from) + 8)} height="60" rx="6" className="fill-chart-ghost" opacity="0.25" />}
      {/* The pace: one soft line, drawn in once */}
      <path d={smoothPath(shown.map((point) => ({ x: x(point.t), y: y(point.wpm) })))} className="stroke-chart-voice motion-safe:animate-chart-draw" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// A: loudness shapes
function LoudChart({ shapes }: { shapes: LoudShapes }) {
  // The take's span
  const [from, to] = [shapes.shapes[0]!.start, shapes.shapes.at(-1)!.end];
  // Across for a moment
  const x = (seconds: number) => ((seconds - from) / Math.max(0.1, to - from)) * W;
  // The picture
  return (
    <svg viewBox={`0 0 ${W} 56`} role="img" aria-label={shapes.line} className="h-auto w-full">
      {/* Each stretch as a shape, as tall as it was loud */}
      {shapes.shapes.map((shape, index) => {
        // Its points across
        const xs = shape.points.map((_, point) => x(shape.start) + (point / (shape.points.length - 1)) * Math.max(2, x(shape.end) - x(shape.start) - 2));
        // Its outline: the top, then the bottom back
        const outline = (points: number[], places: number[]) => `M${places.map((place, point) => `${place.toFixed(1)} ${(28 - points[point]! * 24).toFixed(1)}`).join(" L")} L${[...places].reverse().map((place, point) => `${place.toFixed(1)} ${(28 + points[points.length - 1 - point]! * 24).toFixed(1)}`).join(" L")} Z`;
        // The last quarter, for a fade
        const tail = Math.floor(shape.points.length * 0.75);
        // The shape, its fading end grey
        return (
          <g key={index}>
            {/* The whole shape */}
            <path d={outline(shape.points, xs)} className="fill-chart-voice" />
            {/* Its quiet end, grey */}
            {shape.faded && <path d={outline(shape.points.slice(tail - 1), xs.slice(tail - 1))} className="fill-chart-ghost" />}
          </g>
        );
      })}
    </svg>
  );
}

// B: sentence endings
function EndingsChart({ endings, onPlay }: { endings: Endings; onPlay: PlayFrom }) {
  // The little tail for each kind
  const tail = { fell: "M2 6 L16 6 L26 18", held: "M2 12 L26 12", rose: "M2 18 L16 18 L26 4" } as const;
  // Many endings: tails only, eight to a row
  const compact = endings.endings.length > 12;
  // The grid
  return (
    <ul className={compact ? "grid grid-cols-8 gap-1" : "grid grid-cols-3 gap-2 sm:grid-cols-4"} aria-label="How each sentence ended">
      {endings.endings.map((ending, index) => {
        // The tail and its words
        const body = (
          <>
            <svg viewBox="0 0 28 22" aria-hidden="true" className="h-5 w-7"><path d={tail[ending.ending]} className={ending.risingStatement ? "stroke-chart-voice" : ending.ending === "fell" ? "stroke-chart-well" : "stroke-ink-muted"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className={compact ? "sr-only" : "max-w-full truncate text-tab"}>…{ending.last} <span className="sr-only">{ending.ending}</span></span>
          </>
        );
        // One ending, playable when the recording is kept
        return <li key={index}>{onPlay ? <button type="button" onClick={() => onPlay(ending.start)} className={`flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 ${ending.risingStatement ? "bg-warm-tint" : "bg-paper"} ${PRESS}`}>{body}</button> : <div className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 ${ending.risingStatement ? "bg-warm-tint" : "bg-paper"}`}>{body}</div>}</li>;
      })}
    </ul>
  );
}

// C: today against your usual
function UsualChart({ rows }: { rows: UsualRow[] }) {
  // The rows
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        // Across for a value
        const x = (value: number) => ((value - row.from) / Math.max(1e-6, row.to - row.from)) * 100;
        // One row
        return (
          <li key={row.name} data-usual-row={row.name}>
            {/* Its name and words */}
            <p className="flex justify-between text-footnote"><b>{row.name}</b><span className={row.outside ? "font-semibold text-ink" : "text-ink-muted"}>{row.words}</span></p>
            {/* The bar */}
            <div className="relative mt-1 h-4" aria-hidden="true">
              {/* The light track */}
              <div className="absolute inset-x-0 top-1.5 h-1 rounded bg-rule" />
              {/* Your usual band: the target */}
              <div className="absolute top-0 h-4 rounded-full border border-chart-well bg-chart-band" style={{ left: `${x(row.low)}%`, width: `${x(row.high) - x(row.low)}%` }} />
              {/* Today: a filled dot inside, an open ring outside (shape as well as colour) */}
              <div className={`absolute top-0 size-4 -translate-x-1/2 rounded-full border-2 ${row.outside ? "border-chart-voice bg-card" : "border-card bg-chart-well"}`} style={{ left: `${x(row.value)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// D: emphasis in the words
function EmphasisChart({ found }: { found: Emphasis }) {
  // The look for each weight
  const looks = ["text-footnote text-ink-muted", "text-lede text-ink", "text-running font-semibold text-accent", "text-cue font-bold text-ink"] as const;
  // The words
  return <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 leading-snug">{found.words.map((word, index) => <span key={index} data-weight={word.weight} className={looks[word.weight]}>{word.text}</span>)}{found.more && <span className="text-footnote text-ink-muted">…</span>}</p>;
}

// E: the shape of the take
function ShapeChart({ arc }: { arc: EnergyArc }) {
  // The scale
  const [top, bottom] = [Math.max(...arc.thirds) + 0.15, Math.min(...arc.thirds) - 0.15];
  // Down for an energy
  const y = (value: number) => 6 + ((top - value) / Math.max(0.01, top - bottom)) * 54;
  // The points
  const points = [{ x: 0, y: y(arc.thirds[0]) }, { x: W / 6, y: y(arc.thirds[0]) }, { x: W / 2, y: y(arc.thirds[1]) }, { x: (W * 5) / 6, y: y(arc.thirds[2]) }, { x: W, y: y(arc.thirds[2]) }];
  // The lowest third, when it clearly dips
  const low = Math.max(...arc.thirds) - Math.min(...arc.thirds) >= 0.12 ? arc.thirds.indexOf(Math.min(...arc.thirds)) : -1;
  // The curve
  const curve = smoothPath(points);
  // The picture and the thirds' names
  return (
    <>
      <svg viewBox={`0 0 ${W} 70`} role="img" aria-label={arc.line} className="h-auto w-full">
        {/* The dip, a grey wash */}
        {low >= 0 && <rect x={(W * low) / 3} y="0" width={W / 3} height="70" rx="8" className="fill-chart-ghost" opacity="0.2" />}
        {/* The energy: one soft line, drawn in once */}
        <path d={curve} className="stroke-chart-voice motion-safe:animate-chart-draw" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
      {/* The thirds */}
      <p className="grid grid-cols-3 text-center text-footnote font-semibold">{["Start", "Middle", "End"].map((name, index) => <span key={name} className={index === low ? "text-ink" : "text-ink-muted"}>{name}</span>)}</p>
    </>
  );
}

// F: the voice range
function RangeChart({ range }: { range: VoiceRange }) {
  // The widest of the two, with room
  const widest = Math.max(range.today, range.usual) * 1.25;
  // One bar
  const bar = (label: string, steps: number, today: boolean) => (
    <div>
      {/* Its label */}
      <p className="text-footnote text-ink-muted">{label} · {Math.round(steps)} steps</p>
      {/* The track and the range, centred */}
      <div className="relative mt-1 h-5 rounded-full bg-paper" aria-hidden="true"><div className={`absolute top-0 h-5 rounded-full ${today ? "bg-chart-voice" : "bg-chart-ghost"}`} style={{ left: `${50 - (steps / widest) * 50}%`, width: `${(steps / widest) * 100}%` }} /></div>
    </div>
  );
  // Both bars
  return <div role="img" aria-label={range.line} className="flex flex-col gap-2">{bar("Your usual", range.usual, false)}{bar("Today", range.today, true)}</div>;
}

// G: progress on your focus
function ProgressChart({ progress }: { progress: FocusProgress }) {
  // The scale
  const [low, high] = [Math.min(progress.start.low, ...progress.values), Math.max(progress.start.high, ...progress.values)];
  // (room)
  const pad = (high - low) * 0.15 || 1;
  // Down for a value
  const y = (value: number) => 6 + ((high + pad - value) / Math.max(1e-6, high - low + 2 * pad)) * 64;
  // Across for a take
  const x = (index: number) => 10 + (index / Math.max(1, progress.values.length - 1)) * (W - 20);
  // The picture
  return (
    <svg viewBox={`0 0 ${W} 86`} role="img" aria-label={progress.line} className="h-auto w-full">
      {/* Where you started: a dashed grey band, the ghost */}
      <rect x="0" y={y(progress.start.high)} width={W} height={Math.max(2, y(progress.start.low) - y(progress.start.high))} rx="6" className="fill-none stroke-chart-ghost" strokeWidth="1.5" strokeDasharray="4 4" />
      {/* Its name */}
      <text x={W - 4} y="84" textAnchor="end" fontSize="9" className="fill-ink-muted">dashed band: where you started</text>
      {/* The line, drawn in once */}
      <path d={`M${progress.values.map((value, index) => `${x(index)} ${y(value)}`).join(" L")}`} className="stroke-chart-well motion-safe:animate-chart-draw" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Each take, this one bigger */}
      {progress.values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r={index === progress.values.length - 1 ? 6 : 4} className="fill-chart-well stroke-card" strokeWidth="2" />)}
    </svg>
  );
}

// Every chart this take can draw, and the ones it cannot with why
export function ChartTrial({ session, sessions, usual, text, pauses, pace, phrases, pauseWords, onPlay }: ChartTrialProps) {
  // Everything worked out once
  const charts = useMemo(() => {
    // The loudness readings
    const levels = session.loudness ?? [];
    // The pauses between thoughts, in seconds
    const between = text?.timed && pauses ? pauses.marks.filter((mark) => mark.kind === "between" || mark.beat).map((mark) => ({ start: text.words[mark.after]!.end ?? 0, end: text.words[mark.after + 1]?.start ?? text.words[mark.after]!.end ?? 0 })) : [];
    // The voice line's phrase
    const linePhrase = voiceLinePhrase(phrases);
    // Each chart, or why not
    return {
      line: linePhrase ? voiceLine(linePhrase) : null,
      flow: levels.length > 0 ? flowRibbon(levels, LOUDNESS_TICK_MS, between) : null,
      pace,
      loud: levels.length > 0 ? loudShapes(levels, LOUDNESS_TICK_MS) : null,
      endings: sentenceEndings(phrases),
      usual: usualRows(sessions, session, pauseWords),
      emphasis: emphasis(phrases),
      shape: shapeWorthDrawing(session.durationSec) && session.loudness && session.pitch ? energyArc(session.loudness, session.pitch, LOUDNESS_TICK_MS) : null,
      range: voiceRange(session.pitchRange, usual),
      progress: focusProgress(sessions, session),
    };
  }, [session, sessions, usual, text, pauses, pace, phrases, pauseWords]);
  // The charts not drawn, with why
  const missing = [
    !charts.line && "1 · Voice line: needs a phrase with enough voice heard.",
    !charts.flow && "2 · Flow ribbon: needs the loudness readings.",
    !charts.pace && "3 · Pace ribbon: needs at least eight timed words.",
    !charts.loud && "A · Loudness shapes: needs a stretch of speech a second or longer.",
    !charts.endings && "B · Sentence endings: needs phrases with enough voice heard.",
    charts.usual.length === 0 && `C · Today vs your usual: needs ${5} earlier takes of this kind.`,
    !charts.emphasis && "D · Emphasis: needs the words with their pitch.",
    !charts.shape && (session.durationSec < 30 ? "E · Shape of the take: for takes of 30 seconds or more." : "E · Shape of the take: needs enough voice in each third."),
    !charts.range && "F · Voice range: needs your usual range (a few takes) and today’s.",
    !charts.progress && "G · Progress: needs three takes of this kind.",
  ].filter((reason): reason is string => typeof reason === "string");
  // The section
  return (
    <section aria-labelledby="trial-heading" data-chart-trial className="mt-8 grid gap-4 lg:grid-cols-2">
      {/* Its name */}
      <h2 id="trial-heading" className={`${SECTION_HEADING} lg:col-span-2`}>Every chart (trial)</h2>
      {/* What it is */}
      <p className={`${LABEL} -mt-2 lg:col-span-2`}>On for a week of testing, to see which charts make sense where. Grey marks what to look at; teal what landed.</p>
      {/* 1 */}
      {charts.line && <TrialCard id="line" title="1 · Voice line over your words" answers="Where did I rise, fall or go flat?" sure="high" needs="Words with times" line={charts.line.phrase.risingStatement ? "Rose at the end, like a question." : charts.line.phrase.ending === "fell" ? "Fell at the end: it sounded finished." : "Your voice through this phrase."}><VoiceLineChart line={charts.line} onPlay={onPlay} /></TrialCard>}
      {/* 2 */}
      {charts.flow && <TrialCard id="flow" title="2 · Flow ribbon" answers="Where did I flow, and where did I stop?" sure="high" needs="Audio only" line={charts.flow.line}><FlowChart ribbon={charts.flow} levels={session.loudness ?? []} onPlay={onPlay} /></TrialCard>}
      {/* 3 */}
      {charts.pace && <TrialCard id="pace" title="3 · Pace ribbon" answers="Where did I rush or drag?" sure="medium" needs="Words with times" line={paceStretchLine(paceStretch(charts.pace))}><PaceChart lens={charts.pace} /></TrialCard>}
      {/* A */}
      {charts.loud && <TrialCard id="loud" title="A · Loudness shapes" answers="Did I trail off?" sure={session.autoGain === false ? "high" : "medium"} needs="Audio only" line={charts.loud.line}><LoudChart shapes={charts.loud} /></TrialCard>}
      {/* B */}
      {charts.endings && <TrialCard id="endings" title="B · Sentence endings" answers="How did my sentences land?" sure="high" needs="Words with times" line={charts.endings.line}><EndingsChart endings={charts.endings} onPlay={onPlay} /></TrialCard>}
      {/* C */}
      {charts.usual.length > 0 && <TrialCard id="usual" title="C · Today vs your usual" answers="Was today normal for me?" sure="high" needs="Five earlier takes" line={charts.usual.some((row) => row.outside) ? `${charts.usual.filter((row) => row.outside).map((row) => `${row.name}: ${row.words}`).join(". ")}.` : "Everything inside your usual."}><UsualChart rows={charts.usual} /></TrialCard>}
      {/* D */}
      {charts.emphasis && <TrialCard id="emphasis" title="D · Emphasis in your words" answers="Which words did I lean on?" sure="medium" needs="Words with times" line={charts.emphasis.line}><EmphasisChart found={charts.emphasis} /></TrialCard>}
      {/* E */}
      {charts.shape && <TrialCard id="shape" title="E · Shape of the take" answers="How did I start, middle and finish?" sure="high" needs="Audio only" line={charts.shape.line}><ShapeChart arc={charts.shape} /></TrialCard>}
      {/* F */}
      {charts.range && <TrialCard id="range" title="F · Voice range" answers="Did my voice move, or stay flat?" sure="high" needs="Audio only" line={charts.range.line}><RangeChart range={charts.range} /></TrialCard>}
      {/* G */}
      {charts.progress && <TrialCard id="progress" title="G · Progress on your focus" answers="Am I getting better at this?" sure="high" needs="Three takes" line={charts.progress.line}><ProgressChart progress={charts.progress} /></TrialCard>}
      {/* The situational ones, and what this take could not draw */}
      <div className={`p-4 text-footnote text-ink-muted lg:col-span-2 ${CARD}`}>
        {/* Where the others live */}
        <p>Before and after shows on a retry; conversation lanes on a conversation.</p>
        {/* Not drawn */}
        {missing.length > 0 && <><p className="mt-2 font-semibold text-ink">Not drawn for this take</p><ul data-trial-missing className="mt-1 list-disc pl-5">{missing.map((reason) => <li key={reason}>{reason}</li>)}</ul></>}
      </div>
    </section>
  );
}
