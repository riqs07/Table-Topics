// The practice library page (logic and tests live in components/screens/LibraryScreen.tsx)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the Library screen
import { LibraryScreen } from "@/components/screens/LibraryScreen";

// Tab title
export const metadata: Metadata = { title: "Library · VoiceLab" };

// Draw the Library screen
export default function LibraryPage() {
  // Everything on it is built in
  return <LibraryScreen />;
}
