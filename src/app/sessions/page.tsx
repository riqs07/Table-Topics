// The saved-session page, /sessions?id=... (logic and tests live in components/screens/SessionScreen.tsx)

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's tool for waiting on the address to be read
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the address-reading wrapper
import { SessionFromAddress } from "@/components/screens/SessionFromAddress";

// Tab title
export const metadata: Metadata = { title: "Session · VoiceLab" };

// Draw the session named in the address
export default function SessionsPage() {
  // The address is read in the browser, so wrap it for Next.js
  return (
    <Suspense fallback={<PageFallback title="Your take" />}>
      <SessionFromAddress />
    </Suspense>
  );
}
