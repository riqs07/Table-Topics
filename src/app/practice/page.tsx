// The Practice page: every way to speak on the spot
import type { Metadata } from "next";
// Load the screen
import { PracticeScreen } from "@/components/screens/PracticeScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Practice · VoiceLab" };

// Draw the page
export default function PracticePage() {
  // The screen
  return <PracticeScreen />;
}
