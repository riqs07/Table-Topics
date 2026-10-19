"use client";
// Reads the voice drill and its place in today's practice from the address (/voice/drill?id=&plan=)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the real browser recording pieces
import { browserRecordingServices } from "@/audio/browserServices";
// Load the drill screen
import { VoiceDrillScreen } from "@/components/screens/VoiceDrillScreen";

// Draw the drill named in the address
export function VoiceDrillFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The drill, keyed by its id so a new drill starts fresh
  return <VoiceDrillScreen key={params.get("id") ?? ""} drillId={params.get("id") ?? ""} services={browserRecordingServices} planStep={/^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null} />;
}
