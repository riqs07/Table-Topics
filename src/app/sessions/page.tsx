// The saved-session page, /sessions?id=... (logic and tests live in components/screens/SessionScreen.tsx)

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's tool for waiting on the address to be read
import { Suspense } from "react";
// Load the address-reading wrapper, and the take's waiting view shown while the address is read (decision 76; second pass: the focus bar and your blob, not a page title over grey blocks)
import { SessionFromAddress } from "@/components/screens/SessionFromAddress";
import { SessionWaiting } from "@/components/screens/SessionScreen";

// Tab title
export const metadata: Metadata = { title: "Session · VoiceLab" };

// Draw the session named in the address
export default function SessionsPage() {
  // The address is read in the browser, so wrap it for Next.js
  return (
    <Suspense fallback={<SessionWaiting />}>
      <SessionFromAddress />
    </Suspense>
  );
}
