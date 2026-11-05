// One job's ways to practise (second design pass): /practice/ways?job=… lists every way under one of Practice's picture cards
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { PracticeWaysFromAddress } from "@/components/screens/PracticeWaysScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Practice · VoiceLab" };

// Draw the page
export default function PracticeWaysPage() {
  // The screen, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Practice" />}>
      {/* The screen */}
      <PracticeWaysFromAddress />
    </Suspense>
  );
}
