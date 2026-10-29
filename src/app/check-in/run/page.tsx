// The weekly check-in itself: four parts in order, then the finish screen (decision 100)
import type { Metadata } from "next";
// Load the screen
import { CheckInRunScreen } from "@/components/screens/CheckInRunScreen";
// Load the fade round a step started from Today (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";

// The browser tab's title
export const metadata: Metadata = { title: "Weekly check-in · VoiceLab" };

// Draw the page
export default function CheckInRunPage() {
  // The screen, fading in when opened from Today
  return <PageFade><CheckInRunScreen /></PageFade>;
}
