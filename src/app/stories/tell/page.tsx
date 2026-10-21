// Before telling a story: the prompt or moment, a shape, a focus and a length (decision 92)
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { TellStoryFromAddress } from "@/components/screens/TellStoryFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Tell a story · VoiceLab" };

// Draw the page
export default function TellStoryPage() {
  // The set-up, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Tell a story" />}>
      {/* The set-up */}
      <TellStoryFromAddress />
    </Suspense>
  );
}
