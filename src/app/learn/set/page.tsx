// One Learn set: its cards as a path
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the screen that reads the address
import { LearnSetFromAddress } from "@/components/screens/LearnSetFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Learn · VoiceLab" };

// Draw the page
export default function LearnSetPage() {
  // The set, once the address is read
  return (
    <Suspense>
      {/* The set */}
      <LearnSetFromAddress />
    </Suspense>
  );
}
