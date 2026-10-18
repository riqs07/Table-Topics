"use client";
// Reads which Learn set to show from the address (/learn/set?id=...)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the set screen
import { LearnSetScreen } from "@/components/screens/LearnSetScreen";

// Draw the set named in the address
export function LearnSetFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The set
  return <LearnSetScreen key={params.get("id") ?? ""} setId={params.get("id") ?? ""} />;
}
