// Playing one scene (decision 149)

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the fade round a step started from Today (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
// Load the screen that reads the address
import { ScenePlayFromAddress } from "@/components/screens/ScenePlayFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Scene · VoiceLab" };

// Draw the page
export default function ScenePlayPage() {
  // The scene, once the address is read, fading in when opened from Today
  return (
    <PageFade>
      <Suspense fallback={<PageFallback title="Scenes" />}>
        {/* The screen */}
        <ScenePlayFromAddress />
      </Suspense>
    </PageFade>
  );
}
