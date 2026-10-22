"use client";
// Pitch in your words on the voice drills (decision 111): planned stress on the stress drill's takes, loudness as thickness on the volume drills' takes, and the model voice's curve under yours in shadowing. A drill's takes keep no word times, so each line's known words are spread over the voiced time (rough)

// Load React's memo tool
import { useMemo } from "react";
// Load the shared pieces
import { CurveRow, useRowWidth, useWordMeasure } from "@/components/script/PitchShapes";
import { StressKey, StressRowView } from "@/components/script/PlannedStressCard";
// Load the word placement, the phrases, the cleaning and the stress checks
import { alignFromText } from "@/core/wordAlign";
import { curveLines, pitchWords, rowPoints, stretchPoints } from "@/core/pitchPhrases";
import { cleanSteps, fillShortGaps, smoothForDrawing, smoothPath } from "@/core/pitchClean";
import { judgeStress, stressRows } from "@/core/plannedStress";
import { markWord } from "@/core/stressMarks";
import { thickPieces } from "@/core/loudnessLine";
import { scriptTexts } from "@/core/takePitch";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the take type
import type { TakeRecording } from "@/core/voiceFindings";
// Load the model voice's pitch, read once from its recordings
import { SHADOW_PITCH } from "@/content/shadowPitch";

// The longest gap joined in the model voice's curve, in milliseconds
const MODEL_GAP_MS = 600;

// A drill take's planned stress: its line with the key word starred, judged against where the voice lifted
export function TakeStress({ take, text, stress }: { take: TakeRecording; text: string; stress: string }) {
  // The width the row is drawn in
  const { ref, width } = useRowWidth();
  // How wide words are
  const measure = useWordMeasure();
  // The line with its key word starred
  const marked = markWord(text, stress);
  // Its words spread over the voice, then judged
  const result = useMemo(() => {
    // The words, as the script numbers them
    const alignment = alignFromText(scriptTexts(marked).join(" "), take.levels, LOUDNESS_TICK_MS, take.durationSec);
    // The pitch in them
    const pitch = pitchWords({ pitch: take.pitches, alignment, tickMs: LOUDNESS_TICK_MS });
    // Judged, when there was voice
    return pitch ? { pitch, judged: judgeStress(stressRows(marked), pitch)[0] ?? null } : null;
  }, [marked, take]);
  // Too little voice
  if (!result || !result.judged) return <p className="mt-3 text-footnote text-ink-muted">Too little voice was heard to check the key word.</p>;
  // The row and the key
  return (
    <div ref={ref} data-planned-stress className="mt-3 flex flex-col gap-2">
      {/* The line */}
      <StressRowView result={result.judged} pitch={result.pitch} width={width} measure={measure} />
      {/* The key */}
      <StressKey />
    </div>
  );
}

// A volume drill take's line: the pitch curve, thicker where the voice was louder, against the loudest of the drill's takes
export function TakeThickness({ take, text, loudest, label }: { take: TakeRecording; text: string; loudest: number; label: string }) {
  // The width the row is drawn in
  const { ref, width } = useRowWidth();
  // How wide words are
  const measure = useWordMeasure();
  // The rows ready to draw
  const rows = useMemo(() => {
    // The words spread over the voice
    const words = alignFromText(text, take.levels, LOUDNESS_TICK_MS, take.durationSec).words;
    // The cleaned readings in steps, smoothed for drawing (decision 112)
    const steps = smoothForDrawing(cleanSteps(take.pitches, LOUDNESS_TICK_MS).steps);
    // Each row with its curve and thick pieces
    return { words, lines: curveLines(words, steps, LOUDNESS_TICK_MS, width, measure).map((line) => ({ ...line, pieces: thickPieces(steps, take.levels, loudest, LOUDNESS_TICK_MS, line.slots, words) })) };
  }, [take, text, loudest, width, measure]);
  // Nothing voiced to draw
  if (rows.lines.every((line) => line.points.every((point) => point === null))) return null;
  // The rows
  return (
    <div ref={ref} data-thickness className="mt-3 flex flex-col gap-1">
      {/* Each row */}
      {rows.lines.map((line, index) => <CurveRow key={index} width={width} words={rows.words} slots={line.slots} path={smoothPath(line.points)} pieces={line.pieces} label={`${label}: your pitch line, thicker where you were louder.`} />)}
    </div>
  );
}

// A shadowing take: your curve over your words, with the model voice's curve dashed under it, stretched over the same words
export function ShadowCurve({ take, text, model, label }: { take: TakeRecording; text: string; model: ReadonlyArray<number | null> | undefined; label: string }) {
  // The width the row is drawn in
  const { ref, width } = useRowWidth();
  // How wide words are
  const measure = useWordMeasure();
  // The rows ready to draw
  const drawn = useMemo(() => {
    // Your words spread over your voice
    const words = alignFromText(text, take.levels, LOUDNESS_TICK_MS, take.durationSec).words;
    // Your readings in steps around your usual pitch
    const yours = smoothForDrawing(cleanSteps(take.pitches, LOUDNESS_TICK_MS).steps);
    // The model's, its gaps up to 0.6 s joined first (the reader catches a recorded voice only now and then, and the model is a guide, not a measure), then cleaned around its own usual pitch
    const theirs = model ? smoothForDrawing(cleanSteps(fillShortGaps(model, LOUDNESS_TICK_MS, MODEL_GAP_MS), LOUDNESS_TICK_MS).steps) : [];
    // Whether the model's pitch could be read
    const modelDrawn = theirs.filter((step) => step !== null).length >= 5;
    // Your words' stretch of time
    const [from, to] = [words[0]?.start ?? 0, words.at(-1)?.end ?? 0];
    // Each row: your curve, and the model's stretched over the same words
    return { words, modelDrawn, lines: curveLines(words, yours, LOUDNESS_TICK_MS, width, measure).map((line) => ({ path: smoothPath(rowPoints(yours, LOUDNESS_TICK_MS, line.slots, words)), under: modelDrawn ? smoothPath(stretchPoints(theirs, from, to, line.slots, words)) : null, slots: line.slots })) };
  }, [take, text, model, width, measure]);
  // Nothing of yours to draw
  if (drawn.lines.length === 0) return null;
  // The rows and the key
  return (
    <div ref={ref} data-shadow-curve className="mt-3 flex flex-col gap-1">
      {/* Each row */}
      {drawn.lines.map((line, index) => <CurveRow key={index} width={width} words={drawn.words} slots={line.slots} path={line.path} under={line.under} label={`${label}: your pitch line${drawn.modelDrawn ? ", with the model voice's dashed under it" : ""}.`} />)}
      {/* The key */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-footnote text-ink-muted">
        {/* The model */}
        {drawn.modelDrawn ? <span className="flex items-center gap-1.5"><svg width="22" height="6" aria-hidden="true" className="text-ink-muted"><line x1="0" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" /></svg>Model voice</span> : <span>The model voice’s pitch couldn’t be read for this phrase.</span>}
        {/* You */}
        <span className="flex items-center gap-1.5"><svg width="22" height="6" aria-hidden="true" className="text-accent"><line x1="0" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth="3" /></svg>You</span>
      </div>
    </div>
  );
}

// A shadowing take with its step's model voice, found by the step's recording id
export function ShadowModelCurve({ take, text, voiceId, label }: { take: TakeRecording; text: string; voiceId: string; label: string }) {
  // The curve with the model's readings
  return <ShadowCurve take={take} text={text} model={SHADOW_PITCH[voiceId]} label={label} />;
}
