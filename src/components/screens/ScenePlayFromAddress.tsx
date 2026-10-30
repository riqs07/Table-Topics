"use client";
// Reads which scene to play, and whether it is a step of today's practice, from the address (/scenes/play?id=sn-lisbon&plan=3)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the scene screen
import { ScenePlayScreen } from "@/components/screens/ScenePlayScreen";

// Draw the scene the address names
export function ScenePlayFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The screen, with its step number when there is one
  return <ScenePlayScreen sceneId={params.get("id") ?? ""} planStep={/^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null} />;
}
