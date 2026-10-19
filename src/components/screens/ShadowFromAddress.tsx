"use client";
// Reads the passage to shadow and its place in today's practice from the address (/voice/shadow?id=&plan=)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the real browser recording pieces
import { browserRecordingServices } from "@/audio/browserServices";
// Load the shadowing screen
import { ShadowScreen } from "@/components/screens/ShadowScreen";

// Draw the passage named in the address
export function ShadowFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The passage, keyed by its id so a new passage starts fresh
  return <ShadowScreen key={params.get("id") ?? ""} passageId={params.get("id") ?? ""} services={browserRecordingServices} planStep={/^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null} />;
}
