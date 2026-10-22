"use client";
// Reads which take's phrase rows to show from the address (?id=...), so one cached page can show any take offline (decision 111)

// Load Next.js's tool for reading the address's query
import { useSearchParams } from "next/navigation";
// Load the phrase rows
import { PhraseRowsScreen } from "@/components/screens/PhraseRowsScreen";

// Show the take named in the address
export function PhraseRowsFromAddress() {
  // The address's query
  const params = useSearchParams();
  // Draw it (a missing id shows the "not on this device" note)
  return <PhraseRowsScreen sessionId={params.get("id") ?? ""} />;
}
