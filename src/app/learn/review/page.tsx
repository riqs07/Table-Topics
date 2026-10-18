// Learn review: the recall questions that are due
import type { Metadata } from "next";
// Load the screen
import { ReviewScreen } from "@/components/screens/ReviewScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Review · VoiceLab" };

// Draw the page
export default function ReviewPage() {
  // The screen
  return <ReviewScreen />;
}
