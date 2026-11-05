// How long the pause was at each mark of a pause drill (decision 80), as the Chart Kit's pause bars (second design pass): the line on how many landed first with its count emphasised, then one bar per mark against the target band, your words along the bottom

// Load the target and the line
import { PAUSE_TARGET, pauseLengthsLine } from "@/core/wordTiming";
// Load the count to emphasise
import { pauseLineEmphasis } from "@/core/chartKit";
// Load the kit's headline and bars
import { Emphasised } from "@/components/charts/ChartCard";
import { PauseBars } from "@/components/charts/PauseBars";

// The line, then the bars
export function PauseLengths({ gaps }: { gaps: ReadonlyArray<{ after: string; seconds: number | null }> }) {
  // The line on how many were in the target
  const line = pauseLengthsLine(gaps);
  // How many were measured
  const measured = gaps.filter((gap) => gap.seconds !== null).length;
  // The line and the bars
  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* How many were in the target, the count emphasised */}
      <p className="font-display text-running font-semibold text-ink"><Emphasised text={line} em={pauseLineEmphasis(line)} /></p>
      {/* One bar per mark */}
      <PauseBars gaps={gaps} target={PAUSE_TARGET} listLabel="Pause at each mark" label={`Bars for the pause at each of ${gaps.length} marks against the one-to-two-second band; ${measured === gaps.length ? "all were heard" : `${measured} were heard`}.`} />
      {/* How to read it */}
      <p className="text-footnote text-ink-muted">The band is the target. A pause outside it is grey.</p>
    </div>
  );
}
