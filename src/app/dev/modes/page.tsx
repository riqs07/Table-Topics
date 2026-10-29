// Every way to practise on one page, for development (decision 132)
import type { Metadata } from "next";
// Load the screen
import { DevModesScreen } from "@/components/screens/DevModesScreen";

// The browser tab's title, and kept out of search results
export const metadata: Metadata = { title: "All modes · VoiceLab", robots: { index: false, follow: false } };

// Draw the page
export default function DevModesPage() {
  // The list
  return <DevModesScreen />;
}
