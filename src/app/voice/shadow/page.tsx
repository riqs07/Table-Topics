// Shadowing: listen, say it back, compare (decision 80)

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { ShadowFromAddress } from "@/components/screens/ShadowFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Shadowing · VoiceLab" };

// Draw the page
export default function ShadowPage() {
  // The passage, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Shadowing" />}>
      {/* The passage */}
      <ShadowFromAddress />
    </Suspense>
  );
}
