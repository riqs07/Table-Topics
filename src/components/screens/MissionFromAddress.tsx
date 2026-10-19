"use client";
// Reads which mission try to debrief from the address (/mission?id=...)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the debrief screen
import { MissionScreen } from "@/components/screens/MissionScreen";

// Draw the debrief named in the address
export function MissionFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The debrief
  return <MissionScreen key={params.get("id") ?? ""} recordId={params.get("id") ?? ""} from={params.get("from") === "today" ? "today" : "learn"} />;
}
