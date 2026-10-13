// The recording page, /session?prompt=...&mode=...&retryOf=... (logic and tests live in components/screens/RecordingScreen.tsx)

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's tool for waiting on the address to be read
import { Suspense } from "react";
// Load the address-reading wrapper
import { RecordingFromAddress } from "@/components/screens/RecordingFromAddress";

// Tab title
export const metadata: Metadata = { title: "Recording · VoiceLab" };

// Draw the recording screen for the prompt in the address
export default function RecordingPage() {
  // The address is read in the browser, so wrap it for Next.js
  return (
    <Suspense>
      <RecordingFromAddress />
    </Suspense>
  );
}
