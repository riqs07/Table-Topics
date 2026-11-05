// "Your week" in Settings under Your progress (decision 78; moved from Today, decision 140), in the Chart Kit's over-weeks form (second design pass): a headline on how pause words a minute changed, the line over three weeks with the first as a dashed ghost, exactly one suggestion, and the way to the full history

// Load the link component for moving between pages
import Link from "next/link";
// Load the shared text link style
import { TEXT_LINK } from "@/components/script/Buttons";
// Load the card style and the section heading
import { CARD, LAB } from "@/components/script/textStyles";
// Load the kit's headline and line
import { Emphasised, HEADLINE } from "@/components/charts/ChartCard";
import { OverWeeks } from "@/components/charts/OverWeeks";
// Load the rate formatter
import { formatRate } from "@/core/copy";
// Load the headline rule
import { weeksHeadline } from "@/core/chartKit";
// Load the summary type
import type { YourWeek } from "@/core/yourWeek";

// Draw the card
export function YourWeekCard({ week }: { week: YourWeek }) {
  // The headline the line proves
  const headline = weeksHeadline(week.weeks);
  // The first week with a value, for the ghost's name
  const first = week.weeks.find((item) => item.value !== null);
  // The card
  return (
    <section aria-labelledby="your-week" className={`flex flex-col gap-2.5 p-5 text-ink ${CARD}`}>
      {/* Run-in heading, under the page group's heading */}
      <h3 id="your-week" className={LAB}>Your week</h3>
      {/* The line, unless pause words are hidden (decision 79) */}
      {week.weeks.length > 0 && (
        <>
          {/* The headline the line proves */}
          <p className={HEADLINE}><Emphasised text={headline.text} em={headline.em} /></p>
          {/* Three weeks as one line, oldest first, the first as a ghost */}
          <OverWeeks weeks={week.weeks} format={formatRate} tip={(item) => `${item.label}: ${item.value === null ? "no first tries" : formatRate(item.value)}`} listLabel="Pause words a minute by week" label={`Pause words a minute on first tries over three weeks: ${week.weeks.map((item) => `${item.label.toLowerCase()} ${item.value === null ? "none" : formatRate(item.value)}`).join(", ")}.`} ghostName={first && first !== week.weeks.at(-1) ? first.label.toLowerCase() : null} />
          {/* How to read it */}
          <p className="text-footnote text-ink-muted">Pause words a minute on first tries.{first && first !== week.weeks.at(-1) ? " The dashed line is where you started." : ""}</p>
        </>
      )}
      {/* The one suggestion */}
      <p className="mt-2 text-lede">{week.suggestion.text}</p>
      {/* Where to act on it, when there is a place */}
      {week.suggestion.href && week.suggestion.action && <p><Link href={week.suggestion.href} className={TEXT_LINK}>{week.suggestion.action}</Link></p>}
      {/* The full history */}
      <p><Link href="/history" className={`${TEXT_LINK} text-ink-muted`}>All your history</Link></p>
    </section>
  );
}
