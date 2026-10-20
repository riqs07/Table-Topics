// A conversation with one person: they talk, you answer out loud and tap Done (decision 83)

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the frame shown while the address is read
import { PageFallback } from "@/components/script/PageFallback";
// Load the screen that reads the address
import { ConversationFromAddress } from "@/components/screens/ConversationFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Conversation · VoiceLab" };

// Draw the page
export default function ConversationPage() {
  // The person, once the address is read
  return (
    <Suspense fallback={<PageFallback title="Conversation" />}>
      {/* The conversation */}
      <ConversationFromAddress />
    </Suspense>
  );
}
