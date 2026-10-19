// Pictures of a voice drill's takes (decision 80): bars comparing how loud each take was, and a pitch line drawn against the speaker's usual pitch

// Load the pitch steps
import { toSteps } from "@/core/pitch";

// How far above or below the usual pitch the line can go, in steps
const PITCH_SPAN = 8;

// One take's loudness, for the bars
interface LevelBar {
  // The take's name
  label: string;
  // Its typical loudness while speaking (0 to 1)
  level: number;
}

// Bars comparing the takes' loudness, longest for the loudest (levels only compare with each other: the microphone is not calibrated)
export function LevelBars({ takes }: { takes: ReadonlyArray<LevelBar> }) {
  // The loudest take, for scale
  const loudest = Math.max(0, ...takes.map((take) => take.level));
  // One row per take
  return (
    <ul aria-label="How loud each take was" className="flex flex-col gap-2">
      {/* Each take */}
      {takes.map((take) => {
        // Its share of the loudest, at least a sliver so a quiet take still shows
        const share = loudest > 0 ? Math.max(4, Math.round((take.level / loudest) * 100)) : 4;
        // Its name and bar
        return (
          <li key={take.label} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-footnote">
            {/* Its name */}
            <span className="truncate text-ink-muted">{take.label}</span>
            {/* The bar, named by its share for screen readers */}
            <span role="img" aria-label={`${take.label}: ${share}% of the loudest take`} className="h-3 rounded-full bg-rule">
              {/* The filled part */}
              <span className="block h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// A take's pitch as a line: up for higher, down for lower, around a dashed line at the speaker's usual pitch (gaps where there was no voice)
export function PitchLine({ pitches, usual, label }: { pitches: ReadonlyArray<number | null>; usual: number | null; label: string }) {
  // Nothing to draw without a usual pitch
  if (usual === null) return null;
  // The readings in steps, slips dropped
  const steps = toSteps(pitches, usual);
  // How wide the picture is: one unit per reading
  const width = Math.max(1, steps.length - 1);
  // The voiced runs, each its own line
  const runs: string[] = [];
  // The run being built
  let run: string[] = [];
  // Walk the readings
  steps.forEach((step, index) => {
    // A gap ends the run
    if (step === null) {
      // Keep it if it has a line in it
      if (run.length > 1) runs.push(run.join(" "));
      // Start afresh
      run = [];
      // Next reading
      return;
    }
    // Clamp to the picture and add the point (higher pitch is higher up)
    run.push(`${index},${PITCH_SPAN - Math.max(-PITCH_SPAN, Math.min(PITCH_SPAN, step))}`);
  });
  // The last run
  if (run.length > 1) runs.push(run.join(" "));
  // The picture
  return (
    <svg viewBox={`0 0 ${width} ${PITCH_SPAN * 2}`} preserveAspectRatio="none" role="img" aria-label={label} className="h-14 w-full text-accent">
      {/* The usual pitch */}
      <line x1="0" x2={width} y1={PITCH_SPAN} y2={PITCH_SPAN} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" vectorEffect="non-scaling-stroke" />
      {/* The voiced runs */}
      {runs.map((points) => <polyline key={points} points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}
