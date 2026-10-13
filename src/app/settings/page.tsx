// The settings page (logic and tests live in components/screens/SettingsScreen.tsx)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the Settings screen
import { SettingsScreen } from "@/components/screens/SettingsScreen";

// Tab title
export const metadata: Metadata = { title: "Settings · VoiceLab" };

// Draw the Settings screen with the browser's saved data
export default function SettingsPage() {
  // The screen loads its own data in the browser
  return <SettingsScreen />;
}
