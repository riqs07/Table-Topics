// One Learn card
import type { Metadata } from "next";
// Load React's boundary for reading the address
import { Suspense } from "react";
// Load the screen that reads the address
import { CardFromAddress } from "@/components/screens/CardFromAddress";

// The browser tab's title
export const metadata: Metadata = { title: "Card · VoiceLab" };

// Draw the page
export default function CardPage() {
  // The card, once the address is read
  return (
    <Suspense>
      {/* The card */}
      <CardFromAddress />
    </Suspense>
  );
}
