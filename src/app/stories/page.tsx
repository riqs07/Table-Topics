// Stories: today's story, your stories to tell again, your moments to tell properly, and the prompt bank (decision 92)
import type { Metadata } from "next";
// Load the screen
import { StoriesScreen } from "@/components/screens/StoriesScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Stories · VoiceLab" };

// Draw the page
export default function StoriesPage() {
  // The screen
  return <StoriesScreen />;
}
