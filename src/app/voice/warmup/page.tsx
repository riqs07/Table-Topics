// A one-minute warm-up, nothing recorded (decision 80)

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { WarmupFromAddress } from "@/components/screens/WarmupFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Warm-up · VoiceLab" };

// Draw the page
export default function WarmupPage() {
  // The warm-up, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Warm-up" />}>
      {/* The warm-up */}
      <WarmupFromAddress />
    </Suspense>
  );
}
