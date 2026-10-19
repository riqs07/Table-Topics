// Quick scenarios: three situations, choose the best reply, then say it
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the screen that reads the address
import { ScenariosFromAddress } from "@/components/screens/ScenariosFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Scenarios · VoiceLab" };

// Draw the page
export default function ScenariosPage() {
  // The scenarios, once the address is read
  return (
    <Suspense>
      {/* The screen */}
      <ScenariosFromAddress />
    </Suspense>
  );
}
