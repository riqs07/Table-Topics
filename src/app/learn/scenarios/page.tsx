// Quick scenarios: three situations, choose the best reply, then say it
import type { Metadata } from "next";
// Load the screen
import { ScenariosScreen } from "@/components/screens/ScenariosScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Scenarios · VoiceLab" };

// Draw the page
export default function ScenariosPage() {
  // The screen
  return <ScenariosScreen />;
}
