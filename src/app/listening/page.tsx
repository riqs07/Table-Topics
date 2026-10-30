// Active listening: hear a story, answer to what mattered (decision 150)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the screen
import { ListeningScreen } from "@/components/screens/ListeningScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Active listening · VoiceLab" };

// Draw the page
export default function ListeningPage() {
  // The screen loads its own data in the browser
  return <ListeningScreen />;
}
