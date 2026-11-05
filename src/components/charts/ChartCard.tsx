// The Chart Kit's frame (second design pass): a card with a small label, a headline the chart proves (its key words in the "went well" colour), the chart, and a quiet note on how to read it

// Load React's fragment and node type
import { Fragment, type ReactNode } from "react";
// Load the shared card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the headline split
import { splitEmphasis } from "@/core/chartKit";

// The headline's look: large and rounded, the kit's card title
export const HEADLINE = "font-display text-cue font-semibold leading-tight text-ink";

// Emphasised words in a headline, in the "went well" colour (large text, so the colour reads)
export function Em({ children }: { children: ReactNode }) {
  // The words, bold so the colour reads as large text, not italic
  return <em className="font-bold not-italic text-chart-well">{children}</em>;
}

// A sentence with one phrase emphasised (the whole sentence plain when the phrase is not in it)
export function Emphasised({ text, em }: { text: string; em: string | null }) {
  // Each part, emphasised or plain text (plain parts stay bare text, so the sentence reads as one)
  return <>{splitEmphasis(text, em).map((part, index) => (part.em ? <Em key={index}>{part.text}</Em> : <Fragment key={index}>{part.text}</Fragment>))}</>;
}

// What the frame needs
export interface ChartCardProps {
  // The id its heading is given, so the card is a named region
  id: string;
  // The small label above, such as "After a take"
  label: string;
  // The headline the chart proves
  headline: ReactNode;
  // Which of the two is the card's heading (the other is plain text): the headline by default
  heading?: "headline" | "label";
  // The heading's level
  level?: 2 | 3;
  // The chart and anything under it
  children: ReactNode;
  // A quiet note under the chart on how to read it
  note?: ReactNode;
  // Extra classes for the card
  className?: string;
  // Data attributes for the card, such as { "data-fingerprint": true }
  data?: Readonly<Record<`data-${string}`, string | boolean | undefined>>;
}

// The card: label, headline, chart, note
export function ChartCard({ id, label, headline, heading = "headline", level = 2, children, note, className = "", data = {} }: ChartCardProps) {
  // The heading's element
  const Heading = level === 2 ? "h2" : "h3";
  // The card, named by its heading
  return (
    <section aria-labelledby={id} className={`flex min-w-0 flex-col gap-2.5 p-5 ${CARD} ${className}`} {...data}>
      {/* The small label: the heading, or plain text above it */}
      {heading === "label" ? <Heading id={id} className={LAB}>{label}</Heading> : <p className={LAB}>{label}</p>}
      {/* The headline: the heading, or a large line under the label */}
      {heading === "headline" ? <Heading id={id} className={HEADLINE}>{headline}</Heading> : <p className={HEADLINE}>{headline}</p>}
      {/* The chart */}
      {children}
      {/* How to read it */}
      {note && <p className="text-footnote text-ink-muted">{note}</p>}
    </section>
  );
}
