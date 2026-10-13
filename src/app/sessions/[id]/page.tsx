// A saved session's page (logic and tests live in components/screens/SessionScreen.tsx)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the session screen
import { SessionScreen } from "@/components/screens/SessionScreen";

// Tab title
export const metadata: Metadata = { title: "Session · VoiceLab" };

// Read the session id from the address and draw the screen
export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  // Wait for the address parameters
  const { id } = await params;
  // The screen loads the session in the browser
  return <SessionScreen sessionId={id} />;
}
