"use client";
// "Your voice" on a results page (decisions 81 and 111): the take's words shown with their pitch (pitch in your words), then a few plain lines on the pitch in the words, the range and how the volume held up, and the way to see it phrase by phrase

// Load React's memo tool
import { useMemo } from "react";
// Load the text view
import { PitchText } from "@/components/script/PitchText";
// Load the shared card look and the button looks
import { CARD } from "@/components/script/textStyles";
import { PrimaryLink, SECONDARY } from "@/components/script/Buttons";
// Load the hook that reads the deeper analysis's words
import { useServerWords } from "@/components/screens/useServerWords";
// Load the pitch in the words
import { takePitch } from "@/core/takePitch";
import { pitchSummary, yForStep, CURVE_HEIGHT, USUAL_Y, type LinePart } from "@/core/pitchPhrases";
import { smoothForDrawing, smoothPath } from "@/core/pitchClean";
// Load the voice report
import { voiceReport, type VoiceLineKind } from "@/core/voiceFeedback";
// Load the record type
import type { FullSession } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// What the section needs
interface VoiceSectionProps {
  // Where the take's analysis is read from (for the deeper analysis's exact word times)
  repo: Repository;
  // The recording
  session: FullSession;
  // The speaker's usual range from earlier recordings, or null
  usual: number | null;
  // A line the one change above already says, left out here
  hide?: VoiceLineKind;
  // Whether fluency is judged (fading ends are left out when not; decision 79)
  fluency: boolean;
  // The text that was read, for a reading or a lesson, so its words are placed (null otherwise)
  script?: string | null;
  // Play the take from the start, when its recording is kept
  onPlay?: (() => void) | null;
}

// One plain line, with a dot: warm to work on, the accent for what went well, muted for the flat phrases shown in grey
interface ShownLine {
  // A stable key
  key: string;
  // The dot's tone
  tone: "work" | "good" | "flat";
  // The words
  parts: ReadonlyArray<LinePart>;
}

// The dots' colours and what they mean, for screen readers
const DOTS = { work: { dot: "bg-warm", said: "To work on: " }, good: { dot: "bg-accent", said: "Went well: " }, flat: { dot: "bg-ink-muted", said: "" } } as const;

// The whole take's pitch as one smooth curve, for a take whose words were not caught
function WholeCurve({ steps }: { steps: ReadonlyArray<number | null> }) {
  // The curve across one unit per reading
  const path = smoothPath(smoothForDrawing(steps).map((step, index) => (step === null ? null : { x: index, y: yForStep(step) })));
  // The picture, stretched to the card's width
  return (
    <svg viewBox={`0 0 ${Math.max(1, steps.length - 1)} ${CURVE_HEIGHT}`} preserveAspectRatio="none" role="img" aria-label="Your pitch across the take" className="mt-3 h-16 w-full">
      {/* The usual pitch */}
      <line x1="0" x2={steps.length} y1={USUAL_Y} y2={USUAL_Y} className="text-ink-muted" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.45" vectorEffect="non-scaling-stroke" />
      {/* The curve */}
      <path d={path} className="text-accent" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Draw the section, or nothing when there is nothing to say
export function VoiceSection({ repo, session, usual, hide, fluency, script = null, onPlay = null }: VoiceSectionProps) {
  // The deeper analysis's words, once read
  const server = useServerWords(repo, session.id);
  // What the voice showed (range and volume)
  const report = voiceReport(session, usual, { fluency });
  // The pitch in the words, once the analysis has been read (memoised: the readings are only worked through again when the take changes)
  const pitch = useMemo(() => (server.ready ? takePitch(session, { serverWords: server.words, script }) : null), [server.ready, server.words, session, script]);
  // The pitch in the words is drawn
  const ready = pitch?.state === "ready" ? pitch.pitch : null;
  // The pitch lines in the words, leaving out what the one change already says
  const pitchLines: ShownLine[] = ready ? pitchSummary(ready.phrases).filter((line) => !(hide === "ends" && (line.kind === "rising" || line.kind === "ends"))).map((line) => ({ key: line.kind, tone: line.tone, parts: line.parts })) : [];
  // The report's lines: the endings are said in the words when they are drawn
  const reportLines: ShownLine[] = report.lines.filter((line) => line.kind !== hide && !(ready && line.kind === "ends")).map((line) => ({ key: line.kind, tone: line.tone, parts: [{ text: line.text }] }));
  // Every line
  const lines = [...pitchLines, ...reportLines];
  // Nothing yet while the analysis is read (a moment), so the endings line does not flash before the words replace it
  if (!server.ready) return null;
  // Nothing to say (an older recording, or too little voice)
  if (!ready && pitch?.state !== "no-words" && lines.length === 0) return null;
  // The card
  return (
    <section aria-labelledby="voice-section-heading" className={`mt-5 p-5 ${CARD}`}>
      {/* Small heading */}
      <h2 id="voice-section-heading" className="text-footnote font-semibold text-ink-muted">Your voice</h2>
      {/* The words with their pitch */}
      {ready && <PitchText phrases={ready.phrases} />}
      {/* No words caught: the voice alone */}
      {pitch?.state === "no-words" && (
        <>
          {/* The curve */}
          <WholeCurve steps={pitch.steps} />
          {/* What the dashed line is */}
          <p className="mt-1 text-footnote text-ink-muted">No words were caught, so this is your pitch on its own. The dashed line is your usual pitch.</p>
        </>
      )}
      {/* The lines, the pitch in the words first */}
      {lines.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {/* Each line with its dot */}
          {lines.map((line) => (
            <li key={line.key} className="flex gap-2.5 text-lede">
              {/* The dot */}
              <span aria-hidden="true" className={`mt-2.5 size-2 flex-none rounded-full ${DOTS[line.tone].dot}`} />
              {/* The words, with what the dot's colour means for screen readers */}
              <span><span className="sr-only">{DOTS[line.tone].said}</span>{line.parts.map((part, index) => (part.strong ? <b key={index}>{part.text}</b> : <span key={index}>{part.text}</span>))}</span>
            </li>
          ))}
        </ul>
      )}
      {/* Phrase by phrase, and play */}
      {ready && (
        <div className="mt-4 flex flex-wrap gap-2">
          {/* The phrase rows */}
          <PrimaryLink href={`/sessions/voice?id=${encodeURIComponent(session.id)}`}>See it phrase by phrase</PrimaryLink>
          {/* Play the take */}
          {onPlay && <button type="button" onClick={onPlay} className={SECONDARY}>Play</button>}
        </div>
      )}
      {/* Rough word times, said quietly */}
      {ready?.precision === "rough" && <p className="mt-3 text-footnote text-ink-muted">Words are placed from the phone’s timings, so their places are rough.</p>}
      {/* When the browser kept its levelling, say why the volume says little */}
      {session.autoGain === true && <p className="mt-3 text-footnote text-ink-muted">This browser evened out your volume while recording, so only fading phrase ends are measured.</p>}
    </section>
  );
}
