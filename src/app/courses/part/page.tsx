// One part of a guided course lesson, a step at a time (decision 131)
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the fade round a step started from Today (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
// Load the screen that reads the address
import { CoursePartFromAddress } from "@/components/screens/CourseFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Lesson · VoiceLab" };

// Draw the page
export default function CoursePartPage() {
  // The screen, once the address is read, fading in when opened from Today
  return (
    <PageFade>
      <Suspense fallback={<PageFallback title="Lesson" />}>
        {/* The screen */}
        <CoursePartFromAddress />
      </Suspense>
    </PageFade>
  );
}
