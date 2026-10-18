// The Learn page: short cards on what research says
import type { Metadata } from "next";
// Load the screen
import { LearnScreen } from "@/components/screens/LearnScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Learn · VoiceLab" };

// Draw the page
export default function LearnPage() {
  // The screen
  return <LearnScreen />;
}
