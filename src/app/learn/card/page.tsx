// One Learn card
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the fade round a step started from Today (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
// Load the screen that reads the address
import { CardFromAddress } from "@/components/screens/CardFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Card · VoiceLab" };

// Draw the page
export default function CardPage() {
  // The card, once the address is read, fading in when opened from Today
  return (
    <PageFade>
      <Suspense fallback={<PageFallback title="Learn" />}>
        {/* The card */}
        <CardFromAddress />
      </Suspense>
    </PageFade>
  );
}
