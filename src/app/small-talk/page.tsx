// Connect: today's mission and the four units as cards
import type { Metadata } from "next";
// Load the screen
import { ConnectScreen } from "@/components/screens/ConnectScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Connect · VoiceLab" };

// Draw the page
export default function ConnectPage() {
  // The screen
  return <ConnectScreen />;
}
