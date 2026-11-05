// Course headers (the Illustration Study, art-style.md section 3b): a wide illustrated scene for the top of a course, a place with the course's idea acted out, lit from one source, in layers of depth, with a fine grain. It fills its container's width at a fixed 5:2 shape, or (fit="cover") fills a box of any shape behind words, cropped round its middle. It carries meaning, so it is an image with a label

// Load React's tool for a unique id
import { useId } from "react";
// Load the motion setting
import type { SceneMotion } from "@/components/scenes/Scene";
// Load the light and the grain
import { ArtDefs, Grain, litStyle } from "@/components/scenes/art/light";
// Load the scenes
import { HEADER_HEIGHT, HEADER_SCENES, HEADER_WIDTH } from "@/components/scenes/art/headerScenes";

// The courses with a header
export const COURSE_HEADER_IDS = Object.keys(HEADER_SCENES);

// Whether a course has a header
export function hasCourseHeader(course: string): boolean {
  // Its scene, if any
  return course in HEADER_SCENES;
}

// What a header takes
interface CourseHeaderProps {
  // The course's id (as in src/content)
  course: string;
  // How much it moves: a few rounds and rest by default (one drawing loops per screen)
  motion?: SceneMotion;
  // "width": fills the width at 5:2; "cover": fills its box, cropped round its middle (the box sets the size)
  fit?: "width" | "cover";
  // Extra classes (corners, a size for "cover")
  className?: string;
  // A label to use instead of the scene's own description
  label?: string;
}

// Draw a course's header, or nothing for a course without one
export function CourseHeader({ course, motion = "few", fit = "width", className = "", label }: CourseHeaderProps) {
  // An id for the gradients and the grain, unique on the page and safe inside url()
  const id = `head-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  // The course's scene
  const scene = HEADER_SCENES[course];
  // None for an unknown course
  if (!scene) return null;
  // The wide drawing, lit for its blobs
  return (
    <svg
      role="img"
      aria-label={label ?? scene.label}
      data-course-header={course}
      data-motion={motion}
      viewBox={`0 0 ${HEADER_WIDTH} ${HEADER_HEIGHT}`}
      preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
      fill="none"
      className={`vl-scene block ${fit === "cover" ? "size-full" : "h-auto w-full"} ${className}`}
      style={litStyle(id)}
    >
      {/* The light and the grain */}
      <defs>
        {/* Shared by every scene */}
        <ArtDefs id={id} />
      </defs>
      {/* The scene */}
      {scene.draw(id)}
      {/* The grain over it all */}
      <Grain id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} opacity={0.18} />
    </svg>
  );
}
