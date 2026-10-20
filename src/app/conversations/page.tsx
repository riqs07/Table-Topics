// Talk with someone: the people to have a short conversation with (decision 83)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the screen
import { ConversationsScreen } from "@/components/screens/ConversationsScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Talk with someone · VoiceLab" };

// Draw the page
export default function ConversationsPage() {
  // The screen loads its own data in the browser
  return <ConversationsScreen />;
}
