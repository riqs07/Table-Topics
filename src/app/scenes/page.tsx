// Scenes: choose your way through a short conversation (decision 149)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the screen
import { ScenesScreen } from "@/components/screens/ScenesScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Scenes · VoiceLab" };

// Draw the page
export default function ScenesPage() {
  // The screen loads its own data in the browser
  return <ScenesScreen />;
}
