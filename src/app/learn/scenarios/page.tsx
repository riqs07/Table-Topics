// Quick scenarios: three situations, choose the best reply, then say it
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the fade round a step started from Today (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
// Load the screen that reads the address
import { ScenariosFromAddress } from "@/components/screens/ScenariosFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Scenarios · VoiceLab" };

// Draw the page
export default function ScenariosPage() {
  // The scenarios, once the address is read, fading in when opened from Today
  return (
    <PageFade>
      <Suspense fallback={<PageFallback title="Scenarios" />}>
        {/* The screen */}
        <ScenariosFromAddress />
      </Suspense>
    </PageFade>
  );
}
