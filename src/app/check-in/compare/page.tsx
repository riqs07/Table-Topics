// Two check-ins side by side, /check-in/compare?a=...&b=... (first and latest without them; decision 100)
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { CheckInCompareFromAddress } from "@/components/screens/CheckInCompareFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Compare check-ins · VoiceLab" };

// Draw the page
export default function CheckInComparePage() {
  // The comparison, once the address is read
  return (
    <Suspense fallback={<PageFallback title="VoiceLab" />}>
      {/* The comparison */}
      <CheckInCompareFromAddress />
    </Suspense>
  );
}
