// One Learn set: its cards as a path
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { LearnSetFromAddress } from "@/components/screens/LearnSetFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Learn set · VoiceLab" };

// Draw the page
export default function LearnSetPage() {
  // The set, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Learn" />}>
      {/* The set */}
      <LearnSetFromAddress />
    </Suspense>
  );
}
