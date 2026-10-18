// A step's place on a path (lessons, or the parts of a speech): a filled tick when done, the number in an accent outline when next, a quiet outline otherwise

// Load the tick for a done step
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the mark type
import type { LessonMark } from "@/core/lessonPath";

// Draw the mark
export function PathMark({ mark, number }: { mark: LessonMark; number: number }) {
  // Done: a filled square with a tick
  if (mark === "done") return (
    <span className="flex size-9 flex-none items-center justify-center bg-fill text-fill-ink">
      {/* The tick */}
      <CheckIcon aria-hidden="true" weight="bold" className="size-5" />
      {/* Said aloud */}
      <span className="sr-only">Done</span>
    </span>
  );
  // Next or still open: the lesson's number in a square outline
  return <span className={`flex size-9 flex-none items-center justify-center border-2 font-display tabular-nums ${mark === "next" ? "border-accent text-accent" : "border-rule text-ink-muted"}`}>{number}</span>;
}

