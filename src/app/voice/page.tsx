// Your voice: warm-ups and voice drills (decision 80)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the screen
import { VoiceScreen } from "@/components/screens/VoiceScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Your voice · VoiceLab" };

// Draw the page
export default function VoicePage() {
  // The screen loads its own data in the browser
  return <VoiceScreen />;
}
