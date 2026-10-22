"use client";
// Planned stress (decision 111): only where the text marks a key word (the "Stress the key word" lesson, a reading with stress marks, the check-in's passage, the stress drill). Each clause with a key word is drawn with its curve, the key words as dashed circles and the voice's highest point as a dot, and one plain line on where the lift went

// Load React's memo tool
import { useMemo } from "react";
// Load the shared pieces
import { CurveRow, useRowWidth, useWordMeasure } from "@/components/script/PitchShapes";
// Load the shared looks
import { CARD, LABEL, SECTION_HEADING } from "@/components/script/textStyles";
// Load the hook that reads the deeper analysis's words
import { useServerWords } from "@/components/screens/useServerWords";
// Load the pitch in the words and the stress checks
import { takePitch } from "@/core/takePitch";
import { judgeStress, stressCount, stressRows, type StressResult } from "@/core/plannedStress";
import { curveLines, highestPoint, yForStep, type PitchWords } from "@/core/pitchPhrases";
import { smoothPath } from "@/core/pitchClean";
// Load the record type
import type { FullSession } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// The line's look by its tone: warm box to work on, accent words for a hit, muted when it cannot be judged
const LINE_LOOKS = { work: "rounded-[10px] bg-warm-tint px-2.5 py-2 text-warm-ink", good: "text-accent", plain: "text-ink-muted" } as const;

// One clause: its curve over its words, the key words circled, the highest point marked, and its line
export function StressRowView({ result, pitch, width, measure }: { result: StressResult; pitch: PitchWords; width: number; measure: (text: string, bold: boolean) => number }) {
  // The words as drawn: the key words and the highest word in bold
  const words = result.words.map((word) => ({ ...word, peak: result.row.targets.includes(word.ref) || word === result.highest }));
  // The words in rows with their curves
  const lines = curveLines(words, pitch.curve, pitch.tickMs, width, measure);
  // The highest point of the whole clause
  const top = highestPoint(lines.flatMap((line) => line.points));
  // Each row, then the line
  return (
    <div data-stress-row className="flex flex-col gap-1">
      {/* Each row of the clause */}
      {lines.map((line, index) => {
        // This row's highest point, when it is the clause's
        const dot = top && line.points.some((point) => point === top) ? top : null;
        // The key words in this row, as circles where their pitch sits
        const targets = line.slots.filter((slot) => result.row.targets.includes(result.words[slot.index]!.ref)).map((slot) => ({ x: slot.left + slot.width / 2, y: yForStep(result.words[slot.index]!.step ?? 0) }));
        // The row
        return <CurveRow key={index} width={width} words={result.words} slots={line.slots} path={smoothPath(line.points)} label={`${result.hit === true ? "Your highest point landed on the key word" : result.hit === false ? `Your highest point landed on “${result.highest?.text ?? ""}”, not the key word` : "Your pitch through this line"}.`} targets={targets} dot={dot} look={(place) => (result.row.targets.includes(result.words[place]!.ref) ? "target" : result.highest && result.words[place] === result.highest ? "top" : "plain")} />;
      })}
      {/* Where the lift went */}
      <p className={`mt-1 text-footnote leading-snug ${LINE_LOOKS[result.line.tone]}`}>{result.line.text}</p>
    </div>
  );
}

// The key to the circles and the dot
export function StressKey() {
  // Two entries
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-footnote text-ink-muted">
      {/* The key word */}
      <span className="flex items-center gap-1.5"><svg width="14" height="14" aria-hidden="true" className="text-warm-ink"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" /></svg>Where the stress was meant to go</span>
      {/* The highest point */}
      <span className="flex items-center gap-1.5"><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5" className="fill-accent" /></svg>Your highest point</span>
    </div>
  );
}

// The planned-stress card on a take's page, for a text with key words
export function PlannedStressCard({ repo, session, script, kind }: { repo: Repository; session: FullSession; script: string; kind: string }) {
  // The deeper analysis's words, once read
  const server = useServerWords(repo, session.id);
  // The width the rows are drawn in
  const { ref, width } = useRowWidth();
  // How wide words are
  const measure = useWordMeasure();
  // The pitch in the words
  const pitch = useMemo(() => (server.ready ? takePitch(session, { serverWords: server.words, script }) : null), [server.ready, server.words, session, script]);
  // Each clause with a key word that was read, judged (a clause never reached is left out)
  const results = useMemo(() => (pitch?.state === "ready" ? judgeStress(stressRows(script), pitch.pitch).filter((result) => result.words.length > 0) : []), [pitch, script]);
  // Nothing to show: no readings (an older take shows its own note), or nothing heard yet
  if (!pitch || pitch.state === "none" || pitch.state === "trimmed") return null;
  // One line over several clauses
  const count = stressCount(results);
  // The card
  return (
    <section aria-labelledby="planned-stress-heading" data-planned-stress className="mt-5">
      {/* Where it is from */}
      <p className={LABEL}>{kind} · planned stress</p>
      {/* The question */}
      <h2 id="planned-stress-heading" className={`mt-1 ${SECTION_HEADING}`}>Did the key word get the lift?</h2>
      {/* How many landed */}
      {count && <p className="mt-1 text-footnote text-ink-muted">{count}</p>}
      {/* The rows */}
      <div ref={ref} className={`mt-3 flex flex-col gap-4 p-4 ${CARD}`}>
        {/* Too little voice */}
        {pitch.state !== "ready" ? <p className="text-footnote text-ink-muted">Too little voice was heard to check the key words.</p> : results.map((result) => <StressRowView key={result.row.from} result={result} pitch={pitch.pitch} width={width - 32} measure={measure} />)}
        {/* The key */}
        {pitch.state === "ready" && results.length > 0 && <StressKey />}
        {/* Rough word times, said quietly */}
        {pitch.state === "ready" && pitch.pitch.precision === "rough" && <p className="text-footnote text-ink-muted">Words are placed from the phone’s timings, so their places are rough.</p>}
      </div>
    </section>
  );
}
