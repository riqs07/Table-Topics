// A step's place on a path (lessons, today's steps, the parts of a speech): a filled tick when done, the number on the sun when next, cream otherwise (decision 69; second design pass: the rounded squares of a lesson's parts on a course page, Desktop Screens "CoursePath")

// Load the tick for a done step
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the mark type
import type { LessonMark } from "@/core/lessonPath";

// Draw the mark
export function PathMark({ mark, number }: { mark: LessonMark; number: number }) {
  // Done: a filled rounded square with a tick
  if (mark === "done") return (
    <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-fill text-fill-ink">
      {/* The tick */}
      <CheckIcon aria-hidden="true" weight="bold" className="size-5" />
      {/* Said aloud */}
      <span className="sr-only">Done</span>
    </span>
  );
  // Next or still open: the number on a rounded square, on the sun when next, cream otherwise
  return <span className={`flex size-10 flex-none items-center justify-center rounded-xl font-display text-lg font-semibold tabular-nums ${mark === "next" ? "bg-art-sun text-on-warm" : "bg-rule text-ink"}`}>{number}</span>;
}
