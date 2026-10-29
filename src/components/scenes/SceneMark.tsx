// A step's blob scene as its mark on Today, in place of the number (decision 137): bigger on a white tile and moving when it is the next step, still on a tinted tile otherwise, faded once done or put off, with a small tick badge once done (said as "Done")

// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the scenes
import { Scene, type SceneName } from "@/components/scenes/Scene";
// Load the mark type the number tiles use
import type { LessonMark } from "@/core/lessonPath";

// Draw the mark
export function SceneMark({ scene, mark, faded }: { scene: SceneName; mark: LessonMark; faded: boolean }) {
  // Whether it is the next step
  const next = mark === "next";
  // The tile with its scene, and the tick once done
  return (
    <span data-step-scene={scene} className="relative flex flex-none">
      {/* The tile and its scene */}
      <span aria-hidden="true" className={`flex items-center justify-center ${next ? "size-14 rounded-2xl bg-card" : "size-12 rounded-xl bg-warm-tint"} ${faded ? "opacity-55" : ""}`}>
        {/* The scene, moving only on the next step */}
        <Scene name={scene} motion={next ? "loop" : "still"} className={next ? "size-14" : "size-12"} />
      </span>
      {/* Once done, a tick badge on the corner */}
      {mark === "done" && (
        <span className="absolute -right-1.5 -bottom-1.5 flex size-5.5 items-center justify-center rounded-full border-2 border-card bg-fill text-fill-ink">
          {/* The tick */}
          <CheckIcon aria-hidden="true" weight="bold" className="size-3" />
          {/* Said aloud */}
          <span className="sr-only">Done</span>
        </span>
      )}
    </span>
  );
}
