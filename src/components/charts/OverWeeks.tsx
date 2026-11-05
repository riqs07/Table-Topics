"use client";
// The Chart Kit's over-weeks line (second design pass): one axis from zero with a light grid, the first value as a dashed ghost across, and one line through the weeks (a gap where a week had none), the latest a bigger dot with its value; each week's value on hover and focus

// Load the layout
import { weeksLayout, type WeekPoint } from "@/core/chartKit";
// Load the measured width
import { useChartWidth } from "@/components/charts/useChartWidth";
// Load the values on hover and focus
import { ChartMarks } from "@/components/charts/ChartMarks";

// The picture's height and margins, in pixels (its width is the space it is given)
const MARGINS = { height: 170, left: 26, right: 18, top: 16, bottom: 26 } as const;

// What the line needs
export interface OverWeeksProps {
  // The weeks (or takes), oldest first
  weeks: ReadonlyArray<WeekPoint>;
  // How a value is written, such as 2.3
  format: (value: number) => string;
  // What each week says on hover and focus
  tip: (week: WeekPoint) => string;
  // What the list of values is called, for screen readers
  listLabel: string;
  // The sentence read out for the picture
  label: string;
  // The ghost's name, such as "two weeks ago" (null leaves the ghost out)
  ghostName?: string | null;
}

// The line
export function OverWeeks({ weeks, format, tip, listLabel, label, ghostName = null }: OverWeeksProps) {
  // The width it is drawn at: the space it is given
  const { ref, width } = useChartWidth();
  // The picture's box
  const BOX = { ...MARGINS, width };
  // The layout
  const layout = weeksLayout(weeks, BOX);
  // The latest point with a value
  const latest = [...layout.points].reverse().find((point) => point.y !== null);
  // Width of each week's column, for pointing at it
  const column = (BOX.width - BOX.left - BOX.right) / Math.max(1, weeks.length - 1);
  // The picture with its values over it
  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
        {/* The light grid, with its values */}
        {layout.grid.map((line) => (
          <g key={line.value}>
            {/* The line */}
            <line x1={BOX.left - 6} x2={BOX.width} y1={line.y} y2={line.y} className="stroke-rule" strokeWidth="1" />
            {/* Its value */}
            <text x="0" y={line.y + 4} fontSize="11" className="fill-ink-muted">{format(line.value).replace(/\.0$/, "")}</text>
          </g>
        ))}
        {/* The ghost: the first value, dashed across */}
        {ghostName && layout.ghostY !== null && (
          <g data-ghost>
            {/* The dashed line */}
            <line x1={BOX.left - 6} x2={BOX.width} y1={layout.ghostY} y2={layout.ghostY} className="stroke-chart-ghost" strokeWidth="2" strokeDasharray="4 4" />
            {/* Its name */}
            <text x={BOX.width} y={layout.ghostY - 6} textAnchor="end" fontSize="11" className="fill-ink-muted">{ghostName}</text>
          </g>
        )}
        {/* The line, drawn in once */}
        <path d={layout.path} className="stroke-chart-well motion-safe:animate-chart-draw" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Each week's dot, the latest bigger */}
        {layout.points.map((point) => point.y !== null && <circle key={point.label} cx={point.x} cy={point.y} r={point === latest ? 6 : 4} className="fill-chart-well stroke-card" strokeWidth="2" />)}
        {/* The latest value, under its dot (over it when it sits low) */}
        {latest && latest.value !== null && <text x={latest.x} y={latest.y! + 22 > BOX.height - BOX.bottom ? latest.y! - 12 : latest.y! + 22} textAnchor="middle" fontSize="12" fontWeight="700" className="fill-ink">{format(latest.value)}</text>}
        {/* Each week's name along the bottom */}
        {layout.points.map((point, index) => <text key={point.label} x={point.x} y={BOX.height - 4} textAnchor={weeks.length > 1 && index === 0 ? "start" : weeks.length > 1 && index === weeks.length - 1 ? "end" : "middle"} dx={weeks.length > 1 && index === 0 ? -8 : weeks.length > 1 && index === weeks.length - 1 ? 8 : 0} fontSize="11" className="fill-ink-muted">{point.label}</text>)}
      </svg>
      {/* Each week's value, on hover and focus */}
      <ChartMarks marks={layout.points.map((point) => ({ x: point.x - Math.min(column, 64) / 2, y: BOX.top - 6, width: Math.min(column, 64), height: BOX.height - BOX.top - BOX.bottom + 12, tip: tip({ label: point.label, value: point.value }) }))} box={BOX} label={listLabel} />
    </div>
  );
}
