// A step's blob scene as its mark on Today, in place of the number (decision 137): bigger on a white tile and moving when it is the next step, still on a tinted tile otherwise, faded once done or put off, with a small tick badge once done (said as "Done"). Just done since Today last showed it, it ticks off with a small moment: it starts at the next step's size, hops with sparkles, then settles and fades as the tick pops on; the step taking over grows into place (decision 141; all in globals.css, only when motion is welcome)

// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the scenes
import { Scene, type SceneName } from "@/components/scenes/Scene";
// Load the mark type the number tiles use
import type { LessonMark } from "@/core/lessonPath";

// Draw the mark
export function SceneMark({ scene, mark, faded, justDone = false, arriving = false }: { scene: SceneName; mark: LessonMark; faded: boolean; justDone?: boolean; arriving?: boolean }) {
  // Whether it is the next step
  const next = mark === "next";
  // The tile with its scene, and the tick once done
  return (
    <span data-step-scene={scene} data-tick={justDone ? "done" : arriving ? "arriving" : undefined} className="relative flex flex-none">
      {/* The tile and its scene (settling after its tick-off moment, or growing in as the next step) */}
      <span aria-hidden="true" className={`flex items-center justify-center ${next ? "size-14 rounded-2xl bg-card" : "size-12 rounded-xl bg-warm-tint"} ${faded ? "opacity-55" : ""} ${justDone ? "vl-just-done" : arriving ? "vl-arriving" : ""}`}>
        {/* The scene, moving only on the next step */}
        <Scene name={scene} motion={next ? "loop" : "still"} className={next ? "size-14" : "size-12"} />
      </span>
      {/* Sparks round a step just done, flashing once */}
      {justDone && (
        <span aria-hidden="true" className="vl-tick-sparks pointer-events-none absolute -inset-2.5">
          {/* Top left */}
          <span className="absolute top-0 left-0 size-2.5 rotate-45 rounded-[3px] bg-accent" />
          {/* Top right */}
          <span className="absolute top-1 right-0 size-2 rotate-45 rounded-[2px] bg-warm" />
          {/* Bottom left */}
          <span className="absolute bottom-1 left-1 size-2 rotate-45 rounded-[2px] bg-accent" />
        </span>
      )}
      {/* Once done, a tick badge on the corner (popping on after the moment when just done) */}
      {mark === "done" && (
        <span className={`absolute -right-1.5 -bottom-1.5 flex size-5.5 items-center justify-center rounded-full border-2 border-card bg-fill text-fill-ink ${justDone ? "motion-safe:animate-pop" : ""}`} style={justDone ? { animationDelay: "900ms" } : undefined}>
          {/* The tick */}
          <CheckIcon aria-hidden="true" weight="bold" className="size-3" />
          {/* Said aloud */}
          <span className="sr-only">Done</span>
        </span>
      )}
    </span>
  );
}
