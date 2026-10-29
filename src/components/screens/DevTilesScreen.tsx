"use client";
// Every course tile on one page, for development (decision 145): course by course, each tile at 240 px beside the same tile at 64 px, the size it must still read at (art style, section 3). "?course=" shows one course; "?still=1" stills the motion for screenshots

// Load Next.js's address reader
import { useSearchParams } from "next/navigation";
// Load the page frame and the shared looks
import { Masthead } from "@/components/script/Masthead";
import { PAGE } from "@/components/script/layout";
import { SECTION_HEADING } from "@/components/script/textStyles";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the tile and which tile stands for what
import { CourseTile } from "@/components/scenes/CourseTile";
import { courseTile, lessonTile } from "@/components/scenes/tileFor";
// Load the courses
import { COURSES } from "@/content/courses";

// Draw the page
export function DevTilesScreen() {
  // Name the tab
  usePageTitle("All tiles");
  // The address
  const params = useSearchParams();
  // One course, when named
  const only = params.get("course");
  // Still, when asked
  const motion = params.get("still") === "1" ? "still" : "loop";
  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Heading */}
      <Masthead title="All tiles" nav={false} close={{ href: "/settings", label: "Close, back to Settings" }} />
      {/* Each course */}
      {COURSES.filter((course) => !only || course.id === only).map((course) => {
        // The course's tile, then each lesson's, with what it stands for
        const tiles = [{ label: course.title, name: courseTile(course.id) }, ...course.lessons.map((lesson, index) => ({ label: `${index + 1}. ${lesson.title}`, name: lessonTile(course.id, lesson.id) }))];
        // The course's section
        return (
          <section key={course.id} aria-label={course.title} className="mt-8">
            {/* Its name */}
            <h2 className={SECTION_HEADING}>{course.title}</h2>
            {/* Its tiles */}
            <ul className="mt-4 flex flex-wrap gap-6">
              {tiles.map((tile) => (
                <li key={tile.label} data-dev-tile={tile.name ?? "none"} className="flex w-[240px] flex-col gap-2">
                  {/* Large */}
                  {tile.name ? <CourseTile name={tile.name} motion={motion} className="size-[240px]" /> : <div className="size-[240px] rounded-3xl border border-rule" />}
                  {/* Small, with its label */}
                  <div className="flex items-center gap-3">
                    {/* At 64 px */}
                    {tile.name && <CourseTile name={tile.name} motion={motion} className="size-16 shrink-0" />}
                    {/* What it stands for, and its name */}
                    <p className="text-footnote">{tile.label}<br /><span className="text-ink-muted">{tile.name}</span></p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
