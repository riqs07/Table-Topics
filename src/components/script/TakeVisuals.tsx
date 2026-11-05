// Pictures of a voice drill's takes (decision 80), in the Chart Kit's language (second design pass): thin rounded bars in your voice's colour comparing how loud each take was, and pitch as one soft line against the speaker's usual pitch (a light grid line)

// Load the pitch steps
import { toSteps } from "@/core/pitch";
// Load the drawing smoother and the smooth path
import { smoothForDrawing, smoothPath } from "@/core/pitchClean";

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
            <span role="img" aria-label={`${take.label}: ${share}% of the loudest take`} className="h-2.5 overflow-hidden rounded-full bg-rule">
              {/* The filled part, drawn in once */}
              <span className="block h-full origin-left rounded-full bg-chart-voice motion-safe:animate-fill" style={{ width: `${share}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// A take's pitch as one soft line: up for higher, down for lower, around a light line at the speaker's usual pitch (gaps where there was no voice)
export function PitchLine({ pitches, usual, label }: { pitches: ReadonlyArray<number | null>; usual: number | null; label: string }) {
  // Nothing to draw without a usual pitch
  if (usual === null) return null;
  // The readings in steps, slips dropped
  const steps = toSteps(pitches, usual);
  // How wide the picture is: one unit per reading
  const width = Math.max(1, steps.length - 1);
  // The readings smoothed so the line flows like a voice (decision B7), each as a point (higher pitch higher up, kept inside the picture), a gap where there was no voice
  const points = smoothForDrawing(steps).map((step, index) => (step === null ? null : { x: index, y: PITCH_SPAN - Math.max(-PITCH_SPAN, Math.min(PITCH_SPAN, step)) }));
  // The picture
  return (
    <svg viewBox={`0 0 ${width} ${PITCH_SPAN * 2}`} preserveAspectRatio="none" role="img" aria-label={label} className="h-14 w-full overflow-visible">
      {/* The usual pitch: a light grid line */}
      <line x1="0" x2={width} y1={PITCH_SPAN} y2={PITCH_SPAN} className="stroke-rule" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* The voiced runs: one soft line, drawn in once */}
      <path data-curve d={smoothPath(points)} fill="none" className="stroke-chart-voice motion-safe:animate-chart-draw" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
