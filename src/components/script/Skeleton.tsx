// A quiet placeholder while saved data loads, so the page appears in one piece instead of jumping as blocks arrive (decision 76)

// Draw a few rounded blocks of the given heights (Tailwind height classes), with a word for screen readers
export function Skeleton({ blocks = ["h-56", "h-28", "h-28"] }: { blocks?: ReadonlyArray<string> }) {
  // The blocks, stacked like the content that will replace them
  return (
    <div className="mt-6 flex flex-col gap-3">
      {/* Said aloud while waiting */}
      <span className="sr-only">Loading</span>
      {/* The blocks (decorative), breathing gently when motion is welcome */}
      {blocks.map((height, index) => <span key={index} aria-hidden="true" className={`block rounded-[22px] bg-paper motion-safe:animate-pulse ${height}`} />)}
    </div>
  );
}
