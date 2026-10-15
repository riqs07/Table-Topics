// The Q&A practice page for one session: likely audience questions and a way to answer each
import type { Metadata } from "next";
// Load React's wrapper for reading the address on the client
import { Suspense } from "react";
// Load the screen that reads the session id from the address
import { QaFromAddress } from "@/components/screens/QaFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Q&A practice · VoiceLab" };

// Draw the page
export default function QaPage() {
  // The address is read on the client
  return (
    // Wait for the address
    <Suspense>
      {/* The screen */}
      <QaFromAddress />
    </Suspense>
  );
}
