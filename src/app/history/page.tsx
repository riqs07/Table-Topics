// The history page (logic and tests live in components/screens/HistoryScreen.tsx)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the History screen
import { HistoryScreen } from "@/components/screens/HistoryScreen";

// Tab title
export const metadata: Metadata = { title: "History · VoiceLab" };

// Draw the History screen with the browser's saved data
export default function HistoryPage() {
  // The screen loads its own data in the browser
  return <HistoryScreen />;
}
