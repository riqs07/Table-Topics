"use client";
// A conversation's timeline (decision 115): their turns and yours in two lanes, each as long as it took, your questions marked, your share of the talking, and one plain line. With the turns' saved times (decision 120) the turns sit where they really were, stretches where you both talked are shaded, and each cut-in is marked; under it, only the timing findings that are sure show, the rest behind "See more" (focus first). Loaded only on a conversation's page

// Load React's state tool
import { useState } from "react";
// Load the shared card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
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

// The picture's size and lanes (the names sit beside it, outside the picture, so the lanes use its whole width)
const PICTURE = { width: 712, height: 76, theirs: 6, yours: 40, lane: 22 } as const;

// The timeline card, or nothing without turns; live says the times came from a live service (the reply gap and listening sounds are then sure enough to show first); highlight is the turn the one change is about, drawn in sun
export function ConversationTimeline({ turns, name, live = false, highlight = null }: { turns: ReadonlyArray<ConversationTurn>; name: string; live?: boolean; highlight?: number | null }) {
  // Whether the rest of the timing findings are open
  const [more, setMore] = useState(false);
  // The timeline
  const timeline = conversationTimeline(turns);
  // Nothing to draw
  if (!timeline) return null;
  // The length shown, at least a second
  const total = Math.max(1, timeline.total);
  // Across the picture for a moment
  const x = (seconds: number) => (seconds / total) * PICTURE.width;
  // The minute marks under the picture, then the end
  const minutes = Array.from({ length: Math.floor(total / 60) }, (_, index) => (index + 1) * 60).filter((seconds) => total - seconds > 12);
  // The timing findings, only with times (decision 120)
  const findings = timeline.timed ? timingFindings(turns, name, live) : [];
  // The sure ones shown first, at most two, so the card stays short (decision 115)
  const sure = findings.filter((finding) => finding.confident).slice(0, SURE_SHOWN);
  // The rest, behind "See more"
  const rest = findings.filter((finding) => !sure.includes(finding));
  // Who cut in, for the key
  const cutBy = new Set(timeline.cuts.map((cut) => cut.by));
  // The card
  return (
    <section aria-labelledby="timeline-heading" data-conversation-timeline className={`flex flex-col gap-3 p-5 md:px-6 ${CARD}`}>
      {/* What it is, and the key for the highlighted line */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* The name */}
        <h2 id="timeline-heading" className={LAB}>Who talked when<span className="sr-only"> · {formatClock(Math.round(timeline.total))}</span></h2>
        {/* The highlighted line, when there is one */}
        {highlight !== null && <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold text-ink-muted"><i aria-hidden="true" className="inline-block h-2.5 w-4.5 rounded-full bg-art-sun" />the line in One change</span>}
      </div>
      {/* The names beside the lanes, then the time under them */}
      <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-x-3">
        {/* The names */}
        <div aria-hidden="true" className="flex h-full flex-col justify-around text-sm font-extrabold">
          {/* Theirs */}
          <span className="truncate">{name}</span>
          {/* Yours */}
          <span>You</span>
        </div>
        {/* The lanes */}
        <svg viewBox={`0 0 ${PICTURE.width} ${PICTURE.height}`} preserveAspectRatio="none" role="img" aria-label={`${turns.length} turns: ${timeline.turns.filter((turn) => turn.who === "you").length} yours and ${timeline.turns.filter((turn) => turn.who === "them").length} from ${name}; you asked ${timeline.turns.filter((turn) => turn.question).length} questions.${timeline.overlaps.length > 0 ? ` You talked at the same time ${timeline.overlaps.length} ${timeline.overlaps.length === 1 ? "time" : "times"}.` : ""}${timeline.cuts.length > 0 ? ` ${timeline.cuts.length} cut-ins marked.` : ""}`} className="block h-auto w-full">
          {/* Their lane's track */}
          <rect x="0" y={PICTURE.theirs} width={PICTURE.width} height={PICTURE.lane} rx={PICTURE.lane / 2} className="fill-paper" />
          {/* Yours */}
          <rect x="0" y={PICTURE.yours} width={PICTURE.width} height={PICTURE.lane} rx={PICTURE.lane / 2} className="fill-paper" />
          {/* Stretches where both talked, shaded across both lanes, under the turns */}
          {timeline.overlaps.map((overlap, index) => <rect key={`o${index}`} data-overlap x={x(overlap.start)} y={PICTURE.theirs - 3} width={Math.max(4, x(overlap.start + overlap.seconds) - x(overlap.start))} height={PICTURE.yours + PICTURE.lane - PICTURE.theirs + 6} rx="4" className="fill-art-sun/40" />)}
          {/* Each turn: theirs in the friend's teal, yours in apricot, a listening sound of yours lighter, the line in One change in sun */}
          {timeline.turns.map((turn, index) => <rect key={index} data-turn={turn.who} data-highlight={index === highlight || undefined} x={x(turn.start) + 1} y={turn.who === "you" ? PICTURE.yours : PICTURE.theirs} width={Math.max(6, x(turn.start + turn.seconds) - x(turn.start) - 4)} height={PICTURE.lane} rx="8" className={index === highlight ? "fill-art-sun" : turn.who === "you" ? (turn.backchannel ? "fill-warm/45" : "fill-warm") : "fill-friend"} />)}
          {/* Each cut-in: a line across both lanes where it happened, with a notch on the side of whoever cut in */}
          {timeline.cuts.map((cut, index) => (
            <g key={`c${index}`} data-cut={cut.by} className={cut.by === "you" ? "fill-warm-ink stroke-warm-ink" : "fill-friend-shade stroke-friend-shade"}>
              {/* The line */}
              <line x1={x(cut.at)} x2={x(cut.at)} y1={PICTURE.theirs - 4} y2={PICTURE.yours + PICTURE.lane + 4} strokeWidth="3" />
              {/* The notch, on the cutter's lane */}
              <path d={cut.by === "you" ? `M ${x(cut.at) - 6} ${PICTURE.yours + PICTURE.lane + 6} L ${x(cut.at) + 6} ${PICTURE.yours + PICTURE.lane + 6} L ${x(cut.at)} ${PICTURE.yours + PICTURE.lane - 2} Z` : `M ${x(cut.at) - 6} ${PICTURE.theirs - 6} L ${x(cut.at) + 6} ${PICTURE.theirs - 6} L ${x(cut.at)} ${PICTURE.theirs + 2} Z`} strokeWidth="0" />
            </g>
          ))}
          {/* Your questions, marked inside the end of your turns */}
          {timeline.turns.map((turn, index) => (turn.question ? <circle key={`q${index}`} data-question cx={Math.max(x(turn.start) + 8, x(turn.start + turn.seconds) - 10)} cy={PICTURE.yours + PICTURE.lane / 2} r="5" className="fill-card" /> : null))}
        </svg>
        {/* Under the names: nothing */}
        <span />
        {/* The time: the start, each minute, the end */}
        <div aria-hidden="true" className="relative mt-1 h-5 text-sm font-bold tabular-nums text-ink-muted">
          {/* The start */}
          <span className="absolute left-0">0:00</span>
          {/* Each minute */}
          {minutes.map((seconds) => <span key={seconds} className="absolute -translate-x-1/2" style={{ left: `${(seconds / total) * 100}%` }}>{formatClock(seconds)}</span>)}
          {/* The end */}
          <span className="absolute right-0">{formatClock(Math.round(timeline.total))}</span>
        </div>
      </div>
      {/* The key and the share */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-ink-muted">
        {/* Questions */}
        <span className="flex items-center gap-1.5"><svg width="16" height="12" aria-hidden="true"><rect width="16" height="12" rx="5" className="fill-warm" /><circle cx="10" cy="6" r="3" className="fill-card" /></svg>You asked a question</span>
        {/* Talking at once, when there was some */}
        {timeline.overlaps.length > 0 && <span className="flex items-center gap-1.5"><svg width="12" height="10" aria-hidden="true"><rect width="12" height="10" rx="2" className="fill-art-sun/40" /></svg>Both talking</span>}
        {/* Cut-ins, by who */}
        {cutBy.has("you") && <span className="flex items-center gap-1.5"><svg width="6" height="12" aria-hidden="true"><rect x="2" width="2" height="12" className="fill-warm-ink" /></svg>You cut in</span>}
        {/* (theirs) */}
        {cutBy.has("them") && <span className="flex items-center gap-1.5"><svg width="6" height="12" aria-hidden="true"><rect x="2" width="2" height="12" className="fill-friend-shade" /></svg>{name} cut in</span>}
        {/* The share */}
        {timeline.share !== null && <span>You said {timeline.share}% of the words</span>}
      </div>
      {/* The line */}
      <p className="font-semibold leading-snug text-ink-muted">{timeline.line}</p>
      {/* The sure timing findings (decision 120) */}
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
