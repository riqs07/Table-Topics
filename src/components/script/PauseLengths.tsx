// How long the pause was at each mark of a pause drill, as bars against the one-to-two-second target (decision 80)

// Load the target and the line
import { PAUSE_TARGET, pauseLengthsLine } from "@/core/wordTiming";

// The longest pause the bars show, in seconds (longer ones fill the bar)
const SCALE_SECONDS = 3;

// The bars, one per mark, with the target shaded and a line on how many were in it
export function PauseLengths({ gaps }: { gaps: ReadonlyArray<{ after: string; seconds: number | null }> }) {
  // Where the target starts and ends along the bar, as shares
  const [from, to] = [(PAUSE_TARGET.shortest / SCALE_SECONDS) * 100, (PAUSE_TARGET.longest / SCALE_SECONDS) * 100];
  // The list and its line
  return (
    <div className="mt-4">
      {/* How many were in the target */}
      <p className="text-footnote text-ink-muted">{pauseLengthsLine(gaps)}</p>
      {/* One bar per mark */}
      <ul aria-label="Pause at each mark" className="mt-2 flex flex-col gap-2">
        {/* Each mark */}
        {gaps.map((gap, index) => (
          <li key={`${gap.after}-${index}`} className="grid grid-cols-[minmax(0,8rem)_1fr_3.5rem] items-center gap-3 text-footnote">
            {/* The word before it */}
            <span className="truncate text-ink-muted">after “{gap.after}”</span>
            {/* The bar, with the target shaded behind it */}
            <span aria-hidden="true" className="relative h-3 rounded-full bg-rule">
              {/* The target */}
              <span className="absolute inset-y-0 rounded-full bg-accent-tint" style={{ left: `${from}%`, width: `${to - from}%` }} />
              {/* The pause */}
              {gap.seconds !== null && <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${Math.max(3, Math.min(100, (gap.seconds / SCALE_SECONDS) * 100))}%` }} />}
            </span>
            {/* The length */}
            <span className="text-right tabular-nums">{gap.seconds === null ? "not heard" : `${gap.seconds.toFixed(1)} s`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
