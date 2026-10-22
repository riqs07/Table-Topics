// Your usual zone on Your progress (decision 115): for a few headline measures, a shaded band for the speaker's usual range (their usual level plus or minus their spread) and a dot for the latest take, with neutral words on which side it sits (decision 103). One colour for every dot: no colour says good or bad

// Load the shared card and heading looks
import { CARD, SECTION_HEADING } from "@/components/script/textStyles";
// Load the zone rule
import { usualZones } from "@/core/usualZone";
// Load the value formatter and the summary type
import { formatValue, type MetricSummary } from "@/core/analysis/profile";

// The bar's picture: 326 across, 16 down (it stretches to the card)
const BAR = { width: 326, height: 16 } as const;

// The card, or nothing when no measure has a usual band yet
export function UsualZone({ metrics }: { metrics: ReadonlyArray<MetricSummary> }) {
  // The bars
  const bars = usualZones(metrics);
  // Nothing to draw
  if (bars.length === 0) return null;
  // The card
  return (
    <section aria-labelledby="usual-zone-heading" data-usual-zone className={`mt-4 flex flex-col gap-3.5 p-5 ${CARD}`}>
      {/* Its name */}
      <h2 id="usual-zone-heading" className={SECTION_HEADING}>Your usual zone</h2>
      {/* Each measure */}
      {bars.map((bar) => {
        // Across the bar for a value
        const x = (value: number) => ((value - bar.from) / Math.max(1e-6, bar.to - bar.from)) * BAR.width;
        // One measure
        return (
          <div key={bar.id} data-zone={bar.id} className="flex flex-col gap-1.5">
            {/* Its name, the latest value and where it sits */}
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-footnote"><span className="font-semibold">{bar.name}</span><span className="text-ink-muted">{formatValue(bar.latest, bar.unit)} · {bar.words}</span></p>
            {/* The bar */}
            <svg viewBox={`0 0 ${BAR.width} ${BAR.height}`} preserveAspectRatio="none" role="img" aria-label={`Your usual ${bar.name.toLowerCase()} runs from ${formatValue(bar.low, bar.unit)} to ${formatValue(bar.high, bar.unit)}; your latest take was ${formatValue(bar.latest, bar.unit)}, ${bar.words}.`} className="h-4 w-full">
              {/* The track */}
              <rect x="0" y="6" width={BAR.width} height="4" rx="2" className="fill-rule" />
              {/* The usual band */}
              <rect x={x(bar.low)} y="2" width={Math.max(4, x(bar.high) - x(bar.low))} height="12" rx="6" className="fill-accent/25" />
              {/* The latest take */}
              <circle cx={x(bar.latest)} cy="8" r="6" className="fill-accent" />
            </svg>
          </div>
        );
      })}
      {/* What it shows */}
      <p className="text-footnote text-ink-muted">Shaded: your usual range from your own takes. Dot: your latest take.</p>
    </section>
  );
}
