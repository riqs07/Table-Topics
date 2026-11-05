// Your usual zone on Your progress (decision 115), in the Chart Kit's language (second design pass): a headline on how many measures sat inside your usual, then for each a target band for your usual range (your usual level plus or minus your spread) and a dot for the latest take, with neutral words on which side it sits (decision 103). One colour for every dot: no colour says good or bad

// Load the kit's frame and headline
import { ChartCard, Emphasised } from "@/components/charts/ChartCard";
// Load the zone rule
import { usualZones } from "@/core/usualZone";
// Load the headline and the place across
import { shareAcross, usualHeadline } from "@/core/chartKit";
// Load the value formatter and the summary type
import { formatValue, type MetricSummary } from "@/core/analysis/profile";

// The card, or nothing when no measure has a usual band yet
export function UsualZone({ metrics }: { metrics: ReadonlyArray<MetricSummary> }) {
  // The bars
  const bars = usualZones(metrics);
  // Nothing to draw
  if (bars.length === 0) return null;
  // The headline the bars prove
  const headline = usualHeadline(bars);
  // The card
  return (
    <ChartCard id="usual-zone-heading" label="Your usual zone" heading="label" headline={<Emphasised text={headline.text} em={headline.em} />} note="The band is your usual range, from your own takes. The dot is your latest take." className="mt-4" data={{ "data-usual-zone": true }}>
      {/* Each measure */}
      {bars.map((bar) => {
        // Across the bar for a value, as a percentage
        const x = (value: number) => shareAcross(value, bar.from, bar.to) * 100;
        // One measure
        return (
          <div key={bar.id} data-zone={bar.id} className="flex flex-col gap-1.5">
            {/* Its name, the latest value and where it sits */}
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-footnote"><span className="font-semibold">{bar.name}</span><span className="text-ink-muted">{formatValue(bar.latest, bar.unit)} · {bar.words}</span></p>
            {/* The bar */}
            <div role="img" aria-label={`Your usual ${bar.name.toLowerCase()} runs from ${formatValue(bar.low, bar.unit)} to ${formatValue(bar.high, bar.unit)}; your latest take was ${formatValue(bar.latest, bar.unit)}, ${bar.words}.`} className="relative h-4">
              {/* The light track */}
              <span className="absolute inset-x-0 top-1.75 h-0.5 rounded-full bg-rule" />
              {/* Your usual: the target band */}
              <span className="absolute top-0 h-4 min-w-1 rounded-full border border-chart-well bg-chart-band" style={{ left: `${x(bar.low)}%`, width: `${x(bar.high) - x(bar.low)}%` }} />
              {/* The latest take, its dot kept inside the bar */}
              <span className="absolute top-0 size-4 -translate-x-1/2 rounded-full border-2 border-card bg-chart-voice" style={{ left: `clamp(0.5rem, ${x(bar.latest)}%, calc(100% - 0.5rem))` }} />
            </div>
          </div>
        );
      })}
    </ChartCard>
  );
}
