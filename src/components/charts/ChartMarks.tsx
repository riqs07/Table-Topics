// The Chart Kit's values on hover and focus (second design pass): a list laid over a chart, one item per mark, each reachable by keyboard and showing its value in a small bubble while pointed at or focused; a screen reader reads the list as the chart's values. Values are never printed on every mark

// One mark's place in the chart's picture units, and what it says
export interface ChartMark {
  // Left edge
  x: number;
  // Top edge
  y: number;
  // Width
  width: number;
  // Height
  height: number;
  // Its value in words, such as "A 1.9-second pause at 0:42"
  tip: string;
}

// Where the bubble sits over a mark: kept inside the chart near its edges
function bubblePlace(share: number): string {
  // Near the left: from the mark's left edge
  if (share < 0.25) return "left-0";
  // Near the right: from the mark's right edge
  if (share > 0.75) return "right-0";
  // Otherwise centred over it
  return "left-1/2 -translate-x-1/2";
}

// The list of marks over a chart drawn at its picture's size (the chart must keep its shape as it scales: full width, height from its viewBox)
export function ChartMarks({ marks, box, label }: { marks: ReadonlyArray<ChartMark>; box: { width: number; height: number }; label: string }) {
  // Nothing to point at
  if (marks.length === 0) return null;
  // The list, over the whole chart
  return (
    <ul aria-label={label} className="absolute inset-0">
      {/* Each mark */}
      {marks.map((mark, index) => {
        // Its middle across, as a share of the chart
        const share = (mark.x + mark.width / 2) / box.width;
        // The mark: a focusable area named by its value
        return (
          <li key={index} tabIndex={0} aria-label={mark.tip} className="group absolute cursor-default rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ink" style={{ left: `${(mark.x / box.width) * 100}%`, top: `${(mark.y / box.height) * 100}%`, width: `${(mark.width / box.width) * 100}%`, height: `${(mark.height / box.height) * 100}%` }}>
            {/* The bubble, shown while pointed at or focused */}
            <span aria-hidden="true" className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden w-max max-w-56 rounded-xl bg-ink px-2.5 py-1.5 text-footnote font-semibold leading-snug text-card group-hover:block group-focus-visible:block ${bubblePlace(share)}`}>{mark.tip}</span>
          </li>
        );
      })}
    </ul>
  );
}
