// The Rehearse my talk page (logic and tests live in components/screens/RehearseScreen.tsx)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the Rehearse screen
import { RehearseScreen } from "@/components/screens/RehearseScreen";

// Tab title
export const metadata: Metadata = { title: "Rehearse my talk · VoiceLab" };

// Draw the Rehearse screen with the browser's saved data
export default function RehearsePage() {
  // The screen loads its own data in the browser
  return <RehearseScreen />;
}
