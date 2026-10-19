// The page for one full speech: its parts, read one at a time
import type { Metadata } from "next";
// Load React's wrapper for reading the address on the client
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the speech's id from the address
import { SpeechFromAddress } from "@/components/screens/SpeechFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Speech · VoiceLab" };

// Draw the page
export default function SpeechPage() {
  // The address is read on the client
  return (
    // Wait for the address
    <Suspense fallback={<PageFallback title="Speech" />}>
      {/* The screen */}
      <SpeechFromAddress />
    </Suspense>
  );
}
