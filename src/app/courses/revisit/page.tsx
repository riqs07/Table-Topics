// A course part's prompt answered again days later, both answers side by side (decision 131)
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { CourseRevisitFromAddress } from "@/components/screens/CourseFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Back again · VoiceLab" };

// Draw the page
export default function CourseRevisitPage() {
  // The screen, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Back again" />}>
      {/* The screen */}
      <CourseRevisitFromAddress />
    </Suspense>
  );
}
