// A step's place on a path (lessons, today's steps, the parts of a speech): a filled tick when done, the number on the warm accent when next, a quiet tile otherwise (decision 69)

// Load the tick for a done step
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the mark type
import type { LessonMark } from "@/core/lessonPath";

// Draw the mark
export function PathMark({ mark, number }: { mark: LessonMark; number: number }) {
  // Done: a filled rounded tile with a tick
  if (mark === "done") return (
    <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-fill text-fill-ink">
      {/* The tick */}
      <CheckIcon aria-hidden="true" weight="bold" className="size-5" />
      {/* Said aloud */}
      <span className="sr-only">Done</span>
    </span>
  );
  // Next or still open: the number on a rounded tile, warm when next
  return <span className={`flex size-9 flex-none items-center justify-center rounded-xl font-semibold tabular-nums ${mark === "next" ? "bg-warm text-on-warm" : "bg-paper text-ink-muted"}`}>{number}</span>;
}
