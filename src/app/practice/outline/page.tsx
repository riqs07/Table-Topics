// A short speech: plan the topic and a few points, then speak (decision 73)
import type { Metadata } from "next";
// Load the screen
import { OutlineScreen } from "@/components/screens/OutlineScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Short speech · VoiceLab" };

// Draw the page
export default function OutlinePage() {
  // The screen
  return <OutlineScreen />;
}
