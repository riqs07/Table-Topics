// One guided course: its lessons and parts (decision 131)
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { CourseFromAddress } from "@/components/screens/CourseFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Course · VoiceLab" };

// Draw the page
export default function CoursePage() {
  // The screen, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Course" />}>
      {/* The screen */}
      <CourseFromAddress />
    </Suspense>
  );
}
