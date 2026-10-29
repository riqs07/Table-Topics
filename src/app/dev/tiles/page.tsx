// Every course tile on one page, for development (decision 145): the art style's check, each tile large and at 64 px
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen
import { DevTilesScreen } from "@/components/screens/DevTilesScreen";

// The browser tab's title, and kept out of search results
export const metadata: Metadata = { title: "All tiles · VoiceLab", robots: { index: false, follow: false } };

// Draw the page
export default function DevTilesPage() {
  // The tiles, once the address is read
  return (
    <Suspense fallback={<PageFallback title="All tiles" />}>
      {/* The screen */}
      <DevTilesScreen />
    </Suspense>
  );
}
