// The skill path page (logic and tests live in components/screens/LessonsScreen.tsx)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the Lessons screen
import { LessonsScreen } from "@/components/screens/LessonsScreen";

// Tab title
export const metadata: Metadata = { title: "Lessons · VoiceLab" };

// Draw the Lessons screen with the browser's saved data
export default function LessonsPage() {
  // The screen loads its own data in the browser
  return <LessonsScreen />;
}
