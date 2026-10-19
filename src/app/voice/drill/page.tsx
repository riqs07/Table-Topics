// A voice drill, take by take (decision 80)

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { VoiceDrillFromAddress } from "@/components/screens/VoiceDrillFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Voice drill · VoiceLab" };

// Draw the page
export default function VoiceDrillPage() {
  // The drill, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Voice drill" />}>
      {/* The drill */}
      <VoiceDrillFromAddress />
    </Suspense>
  );
}
