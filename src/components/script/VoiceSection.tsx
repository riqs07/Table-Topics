// "Your voice" on a results page (decision 81): the take's pitch line around the speaker's usual pitch, then a few plain lines on the pitch range, how phrases ended and how the volume held up

// Load the pitch line
import { PitchLine } from "@/components/script/TakeVisuals";
// Load the shared card look
import { CARD } from "@/components/script/textStyles";
// Load the pitch helpers
import { thinReadings, usualPitch } from "@/core/pitch";
// Load the voice report
import { voiceReport, type VoiceLineKind } from "@/core/voiceFeedback";
// Load the record type
import type { FullSession } from "@/data/records";

// Most points drawn on the pitch line
const MOST_POINTS = 240;

// What the section needs
interface VoiceSectionProps {
  // The recording
  session: FullSession;
  // The speaker's usual range from earlier recordings, or null
  usual: number | null;
  // A line the one change above already says, left out here
  hide?: VoiceLineKind;
  // Whether fluency is judged (fading ends are left out when not; decision 79)
  fluency: boolean;
}

// Draw the section, or nothing when there is nothing to say
export function VoiceSection({ session, usual, hide, fluency }: VoiceSectionProps) {
  // What the voice showed
  const report = voiceReport(session, usual, { fluency });
  // The lines to show
  const lines = report.lines.filter((line) => line.kind !== hide);
  // Nothing to say (an older recording, or too little voice)
  if (!report.pitch && lines.length === 0) return null;
  // The speaker's usual pitch in this take, for the line
  const middle = session.pitch ? usualPitch(session.pitch) : null;
  // The card
  return (
    <section aria-labelledby="voice-section-heading" className={`mt-5 p-5 ${CARD}`}>
      {/* Small heading */}
      <h2 id="voice-section-heading" className="text-footnote font-semibold text-ink-muted">Your voice</h2>
      {/* The pitch line, when there was enough voice */}
      {report.pitch && session.pitch && (
        <>
          {/* The line */}
          <div className="mt-3"><PitchLine pitches={thinReadings(session.pitch, MOST_POINTS)} usual={middle} label={`Your pitch across the take, moving across ${report.pitch.rangeSteps} steps`} /></div>
          {/* What the dashed line is */}
          <p className="mt-1 text-footnote text-ink-muted">The dashed line is your usual pitch; up is higher.</p>
        </>
      )}
      {/* The lines, things to work on first */}
      {lines.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {/* Each line, with a warm dot to work on or an accent dot for what went well */}
          {lines.map((line) => (
            <li key={line.kind} className="flex gap-2.5 text-lede">
              {/* The dot */}
              <span aria-hidden="true" className={`mt-2.5 size-2 flex-none rounded-full ${line.tone === "good" ? "bg-accent" : "bg-warm"}`} />
              {/* The words, with what the dot's colour means for screen readers */}
              <span><span className="sr-only">{line.tone === "good" ? "Went well: " : "To work on: "}</span>{line.text}</span>
            </li>
          ))}
        </ul>
      )}
      {/* When the browser kept its levelling, say why the volume says little */}
      {session.autoGain === true && <p className="mt-3 text-footnote text-ink-muted">This browser evened out your volume while recording, so only fading phrase ends are measured.</p>}
    </section>
  );
}
