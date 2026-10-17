"use client";
// Reads the speech's id from the address and draws its page

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the speech's page
import { SpeechScreen } from "@/components/screens/SpeechScreen";

// Draw the speech named in the address
export function SpeechFromAddress() {
  // The id after "?id="
  const speechId = useSearchParams().get("id") ?? "";
  // The page for it
  return <SpeechScreen speechId={speechId} />;
}
