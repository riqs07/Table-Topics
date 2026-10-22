// A take's pitch phrase by phrase, /sessions/voice?id=... (decision 111; logic and tests live in components/screens/PhraseRowsScreen.tsx). Its own page, so its code loads only when it is opened

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's tool for waiting on the address to be read
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the address-reading wrapper
import { PhraseRowsFromAddress } from "@/components/screens/PhraseRowsFromAddress";

// Tab title
export const metadata: Metadata = { title: "Your voice · VoiceLab" };

// Draw the take named in the address
export default function PhraseRowsPage() {
  // The address is read in the browser, so wrap it for Next.js
  return (
    <Suspense fallback={<PageFallback title="Your take" />}>
      <PhraseRowsFromAddress />
    </Suspense>
  );
}
