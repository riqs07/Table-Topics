// Every guided course (decision 131)
import type { Metadata } from "next";
// Load the list
import { CoursesScreen } from "@/components/screens/CoursesScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Courses · VoiceLab" };

// Draw the page
export default function CoursesPage() {
  // The list
  return <CoursesScreen />;
}
