// The Small talk page: everyday questions, the recipe and the lessons
import type { Metadata } from "next";
// Load the screen
import { SmallTalkScreen } from "@/components/screens/SmallTalkScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Small talk · VoiceLab" };

// Draw the page
export default function SmallTalkPage() {
  // The screen
  return <SmallTalkScreen />;
}
