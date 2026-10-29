// "Your week" in Settings under Your progress (decision 78; moved from Today, decision 128): pause words a minute over three weeks as three bars, exactly one suggestion, and the way to the full history

// Load the link component for moving between pages
import Link from "next/link";
// Load the shared text link style
import { TEXT_LINK } from "@/components/script/Buttons";
// Load the card style and the section heading
import { CARD, SECTION_HEADING } from "@/components/script/textStyles";
// Load the rate formatter
import { formatRate } from "@/core/copy";
// Load the summary type
import type { YourWeek } from "@/core/yourWeek";

// Draw the card
export function YourWeekCard({ week }: { week: YourWeek }) {
  // The largest weekly number, so the bars share a scale (at least 1, so small numbers are not stretched)
  const top = Math.max(1, ...week.weeks.map((item) => item.value ?? 0));
  // The card
  return (
    <section aria-labelledby="your-week" className={`p-5 text-ink ${CARD}`}>
      {/* Run-in heading, under the page group's heading */}
      <h3 id="your-week" className={SECTION_HEADING}>Your week</h3>
      {/* The bars, unless pause words are hidden (decision 79) */}
      {week.weeks.length > 0 && (
        <>
          {/* What the bars count */}
          <p className="mt-1 text-footnote text-ink-muted">Pause words a minute, first tries</p>
          {/* Three weeks as bars, oldest first */}
          <ul aria-label="Pause words a minute by week" className="mt-3 grid grid-cols-3 items-end gap-3">
            {/* Each week */}
            {week.weeks.map((item, index) => (
              // One week: the number over its bar, the week under it
              <li key={item.label} aria-label={`${item.label}: ${item.value === null ? "no first tries" : formatRate(item.value)}`} className="flex flex-col items-center gap-1">
                {/* The number, or a dash with none */}
                <span aria-hidden="true" className="font-display text-lede font-semibold tabular-nums">{item.value === null ? "–" : formatRate(item.value)}</span>
                {/* The bar, this week in the accent (a thin line with none) */}
                <span aria-hidden="true" className="flex h-16 w-full items-end">
                  <span className={`block w-full rounded-lg ${index === week.weeks.length - 1 ? "bg-accent" : "bg-paper"}`} style={{ height: item.value === null ? "2px" : `${Math.max(8, (item.value / top) * 100)}%` }} />
                </span>
                {/* The week */}
                <span aria-hidden="true" className="text-center text-footnote leading-tight text-ink-muted">{item.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {/* The one suggestion */}
      <p className="mt-4 text-lede">{week.suggestion.text}</p>
      {/* Where to act on it, when there is a place */}
      {week.suggestion.href && week.suggestion.action && <p><Link href={week.suggestion.href} className={TEXT_LINK}>{week.suggestion.action}</Link></p>}
      {/* The full history */}
      <p><Link href="/history" className={`${TEXT_LINK} text-ink-muted`}>All your history</Link></p>
    </section>
  );
}
