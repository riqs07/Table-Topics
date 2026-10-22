"use client";
// A conversation's timeline (decision 115): their turns and yours in two lanes, each as long as it took, your questions marked, your share of the talking, and one plain line. With the turns' saved times (decision 141) the turns sit where they really were, stretches where you both talked are shaded, and each cut-in is marked; under it, only the timing findings that are sure show, the rest behind "See more" (focus first). Loaded only on a conversation's page

// Load React's state tool
import { useState } from "react";
// Load the shared card and label looks
import { CARD, LABEL } from "@/components/script/textStyles";
// Load the shared button look
import { QUIET } from "@/components/script/Buttons";
// Load the timeline rule
import { conversationTimeline } from "@/core/conversationTimeline";
// Load the timing findings
import { timingFindings } from "@/core/conversationTiming";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the record type
import type { ConversationTurn } from "@/data/records";

// The most sure timing findings shown before "See more"
const SURE_SHOWN = 2;

// The picture's size and lanes
const PICTURE = { width: 326, height: 74, left: 44, theirs: 8, yours: 40, lane: 16 } as const;

// The timeline card, or nothing without turns; live says the times came from a live service (the reply gap and listening sounds are then sure enough to show first)
export function ConversationTimeline({ turns, name, live = false }: { turns: ReadonlyArray<ConversationTurn>; name: string; live?: boolean }) {
  // Whether the rest of the timing findings are open
  const [more, setMore] = useState(false);
  // The timeline
  const timeline = conversationTimeline(turns);
  // Nothing to draw
  if (!timeline) return null;
  // Across the picture for a moment
  const x = (seconds: number) => PICTURE.left + (seconds / Math.max(1, timeline.total)) * (PICTURE.width - PICTURE.left - 2);
  // The timing findings, only with times (decision 141)
  const findings = timeline.timed ? timingFindings(turns, name, live) : [];
  // The sure ones shown first, at most two, so the card stays short (decision 115)
  const sure = findings.filter((finding) => finding.confident).slice(0, SURE_SHOWN);
  // The rest, behind "See more"
  const rest = findings.filter((finding) => !sure.includes(finding));
  // Who cut in, for the key
  const cutBy = new Set(timeline.cuts.map((cut) => cut.by));
  // The card
  return (
    <section aria-labelledby="timeline-heading" data-conversation-timeline className={`mt-5 flex flex-col gap-2.5 p-5 ${CARD}`}>
      {/* What it is */}
      <h2 id="timeline-heading" className={LABEL}>The turns · {formatClock(Math.round(timeline.total))}</h2>
      {/* The lanes */}
      <svg viewBox={`0 0 ${PICTURE.width} ${PICTURE.height}`} role="img" aria-label={`${turns.length} turns: ${timeline.turns.filter((turn) => turn.who === "you").length} yours and ${timeline.turns.filter((turn) => turn.who === "them").length} from ${name}; you asked ${timeline.turns.filter((turn) => turn.question).length} questions.${timeline.overlaps.length > 0 ? ` You talked at the same time ${timeline.overlaps.length} ${timeline.overlaps.length === 1 ? "time" : "times"}.` : ""}${timeline.cuts.length > 0 ? ` ${timeline.cuts.length} cut-ins marked.` : ""}`} className="w-full">
        {/* Their lane's name */}
        <text x="0" y={PICTURE.theirs + 12} className="fill-ink-muted text-footnote">{name}</text>
        {/* Yours */}
        <text x="0" y={PICTURE.yours + 12} className="fill-ink-muted text-footnote">You</text>
        {/* Stretches where both talked, shaded across both lanes, under the turns */}
        {timeline.overlaps.map((overlap, index) => <rect key={`o${index}`} data-overlap x={x(overlap.start)} y={PICTURE.theirs - 3} width={Math.max(4, x(overlap.start + overlap.seconds) - x(overlap.start))} height={PICTURE.yours + PICTURE.lane - PICTURE.theirs + 6} rx="2" className="fill-warm/30" />)}
        {/* Each turn (a listening sound of yours drawn lighter) */}
        {timeline.turns.map((turn, index) => <rect key={index} data-turn={turn.who} x={x(turn.start)} y={turn.who === "you" ? PICTURE.yours : PICTURE.theirs} width={Math.max(3, x(turn.start + turn.seconds) - x(turn.start) - 2)} height={PICTURE.lane} rx="4" className={turn.who === "you" ? (turn.backchannel ? "fill-accent/40" : "fill-accent") : "fill-ink-muted/40"} />)}
        {/* Each cut-in: a line across both lanes where it happened, with a notch on the side of whoever cut in */}
        {timeline.cuts.map((cut, index) => (
          <g key={`c${index}`} data-cut={cut.by} className={cut.by === "you" ? "fill-accent stroke-accent" : "fill-warm-ink stroke-warm-ink"}>
            {/* The line */}
            <line x1={x(cut.at)} x2={x(cut.at)} y1={PICTURE.theirs - 4} y2={PICTURE.yours + PICTURE.lane + 4} strokeWidth="2" />
            {/* The notch, on the cutter's lane */}
            <path d={cut.by === "you" ? `M ${x(cut.at) - 4} ${PICTURE.yours + PICTURE.lane + 4} L ${x(cut.at) + 4} ${PICTURE.yours + PICTURE.lane + 4} L ${x(cut.at)} ${PICTURE.yours + PICTURE.lane - 2} Z` : `M ${x(cut.at) - 4} ${PICTURE.theirs - 4} L ${x(cut.at) + 4} ${PICTURE.theirs - 4} L ${x(cut.at)} ${PICTURE.theirs + 2} Z`} strokeWidth="0" />
          </g>
        ))}
        {/* Your questions, marked under your turns */}
        {timeline.turns.map((turn, index) => (turn.question ? <circle key={`q${index}`} data-question cx={x(turn.start + turn.seconds) - 6} cy={PICTURE.yours + PICTURE.lane + 9} r="5" className="fill-warm" /> : null))}
      </svg>
      {/* The key and the share */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-footnote text-ink-muted">
        {/* Questions */}
        <span className="flex items-center gap-1.5"><svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="4" className="fill-warm" /></svg>You asked a question</span>
        {/* Talking at once, when there was some */}
        {timeline.overlaps.length > 0 && <span className="flex items-center gap-1.5"><svg width="12" height="10" aria-hidden="true"><rect width="12" height="10" rx="2" className="fill-warm/30" /></svg>Both talking</span>}
        {/* Cut-ins, by who */}
        {cutBy.has("you") && <span className="flex items-center gap-1.5"><svg width="6" height="12" aria-hidden="true"><rect x="2" width="2" height="12" className="fill-accent" /></svg>You cut in</span>}
        {/* (theirs) */}
        {cutBy.has("them") && <span className="flex items-center gap-1.5"><svg width="6" height="12" aria-hidden="true"><rect x="2" width="2" height="12" className="fill-warm-ink" /></svg>{name} cut in</span>}
        {/* The share */}
        {timeline.share !== null && <span>You said {timeline.share}% of the words</span>}
      </div>
      {/* The line */}
      <p className="text-footnote leading-snug">{timeline.line}</p>
      {/* The sure timing findings (decision 141) */}
      {sure.length > 0 && <ul data-timing="sure" className="flex flex-col gap-1 text-footnote leading-snug">{sure.map((finding) => <li key={finding.id}>{finding.line}</li>)}</ul>}
      {/* The rest, behind "See more" */}
      {rest.length > 0 && (
        <div>
          {/* Open or close */}
          <button type="button" aria-expanded={more} onClick={() => setMore(!more)} className={QUIET}>{more ? "See less" : "See more"}</button>
          {/* The rest, once open */}
          {more && <ul data-timing="more" className="mt-2 flex flex-col gap-1 text-footnote leading-snug text-ink-muted">{rest.map((finding) => <li key={finding.id}>{finding.line}</li>)}</ul>}
          {/* How rough these are, once open */}
          {more && !live && <p className="mt-2 text-footnote text-ink-muted">Times come from when the phone started and stopped recording, so they are rough. Live turns make them exact.</p>}
        </div>
      )}
    </section>
  );
}
