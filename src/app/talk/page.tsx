// The page for one of the user's talks: its date, today's step, and its run times
import type { Metadata } from "next";
// Load React's wrapper for reading the address on the client
import { Suspense } from "react";
// Load the screen that reads the talk's id from the address
import { TalkFromAddress } from "@/components/screens/TalkFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Your talk · VoiceLab" };

// Draw the page
export default function TalkPage() {
  // The address is read on the client
  return (
    // Wait for the address
    <Suspense>
      {/* The screen */}
      <TalkFromAddress />
    </Suspense>
  );
}
