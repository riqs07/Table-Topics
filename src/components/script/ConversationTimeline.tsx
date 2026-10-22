"use client";
// A conversation's timeline (decision 115): their turns and yours in two lanes, each as long as it took, your questions marked, your share of the talking, and one plain line. Loaded only on a conversation's page

// Load the shared card and label looks
import { CARD, LABEL } from "@/components/script/textStyles";
// Load the timeline rule
import { conversationTimeline } from "@/core/conversationTimeline";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the record type
import type { ConversationTurn } from "@/data/records";

// The picture's size and lanes
const PICTURE = { width: 326, height: 74, left: 44, theirs: 8, yours: 40, lane: 16 } as const;

// The timeline card, or nothing without turns
export function ConversationTimeline({ turns, name }: { turns: ReadonlyArray<ConversationTurn>; name: string }) {
  // The timeline
  const timeline = conversationTimeline(turns);
  // Nothing to draw
  if (!timeline) return null;
  // Across the picture for a moment
  const x = (seconds: number) => PICTURE.left + (seconds / Math.max(1, timeline.total)) * (PICTURE.width - PICTURE.left - 2);
  // The card
  return (
    <section aria-labelledby="timeline-heading" data-conversation-timeline className={`mt-5 flex flex-col gap-2.5 p-5 ${CARD}`}>
      {/* What it is */}
      <h2 id="timeline-heading" className={LABEL}>The turns · {formatClock(Math.round(timeline.total))}</h2>
      {/* The lanes */}
      <svg viewBox={`0 0 ${PICTURE.width} ${PICTURE.height}`} role="img" aria-label={`${turns.length} turns: ${timeline.turns.filter((turn) => turn.who === "you").length} yours and ${timeline.turns.filter((turn) => turn.who === "them").length} from ${name}; you asked ${timeline.turns.filter((turn) => turn.question).length} questions.`} className="w-full">
        {/* Their lane's name */}
        <text x="0" y={PICTURE.theirs + 12} className="fill-ink-muted text-footnote">{name}</text>
        {/* Yours */}
        <text x="0" y={PICTURE.yours + 12} className="fill-ink-muted text-footnote">You</text>
        {/* Each turn */}
        {timeline.turns.map((turn, index) => <rect key={index} data-turn={turn.who} x={x(turn.start)} y={turn.who === "you" ? PICTURE.yours : PICTURE.theirs} width={Math.max(3, x(turn.start + turn.seconds) - x(turn.start) - 2)} height={PICTURE.lane} rx="4" className={turn.who === "you" ? "fill-accent" : "fill-ink-muted/40"} />)}
        {/* Your questions, marked under your turns */}
        {timeline.turns.map((turn, index) => (turn.question ? <circle key={`q${index}`} data-question cx={x(turn.start + turn.seconds) - 6} cy={PICTURE.yours + PICTURE.lane + 9} r="5" className="fill-warm" /> : null))}
      </svg>
      {/* The key and the share */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-footnote text-ink-muted">
        {/* Questions */}
        <span className="flex items-center gap-1.5"><svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="4" className="fill-warm" /></svg>You asked a question</span>
        {/* The share */}
        {timeline.share !== null && <span>You said {timeline.share}% of the words</span>}
      </div>
      {/* The line */}
      <p className="text-footnote leading-snug">{timeline.line}</p>
    </section>
  );
}
