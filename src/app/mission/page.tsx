// A mission's debrief: did you try it, how it went, what you noticed, and how that compares with what you expected
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { MissionFromAddress } from "@/components/screens/MissionFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Mission · VoiceLab" };

// Draw the page
export default function MissionPage() {
  // The debrief, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Mission" />}>
      {/* The debrief */}
      <MissionFromAddress />
    </Suspense>
  );
}
