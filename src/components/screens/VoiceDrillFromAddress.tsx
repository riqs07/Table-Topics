"use client";
// Reads the voice drill, its sentence (for a drill with several, counted from 1) and its place in today's practice from the address (/voice/drill?id=&set=&plan=)

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
  // The sentence named, counted from 1 in the address and from 0 on the screen, or none
  const set = /^[1-9]\d*$/.test(params.get("set") ?? "") ? Number(params.get("set")) - 1 : null;
  // The drill, keyed by its id and sentence so a new one starts fresh
  return <VoiceDrillScreen key={`${params.get("id") ?? ""}-${set ?? ""}`} drillId={params.get("id") ?? ""} set={set} services={browserRecordingServices} planStep={/^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null} />;
}
