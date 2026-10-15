// The Skills page: lessons and every text to read aloud
import type { Metadata } from "next";
// Load the screen
import { SkillsScreen } from "@/components/screens/SkillsScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Skills · VoiceLab" };

// Draw the page
export default function SkillsPage() {
  // The screen
  return <SkillsScreen />;
}
