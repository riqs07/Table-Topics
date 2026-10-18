// One Connect unit: its practice, recipe and lessons
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the screen that reads the address
import { UnitFromAddress } from "@/components/screens/UnitFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Connect · VoiceLab" };

// Draw the page
export default function UnitPage() {
  // The unit, once the address is read
  return (
    <Suspense>
      {/* The unit */}
      <UnitFromAddress />
    </Suspense>
  );
}
