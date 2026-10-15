// The openings and closings page
import type { Metadata } from "next";
// Load the screen
import { BookendsScreen } from "@/components/screens/BookendsScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Openings and closings · VoiceLab" };

// Draw the page
export default function BookendsPage() {
  // The screen
  return <BookendsScreen />;
}
