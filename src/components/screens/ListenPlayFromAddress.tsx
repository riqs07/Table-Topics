"use client";
// Reads which story to hear, and whether it is a step of today's practice, from the address (/listening/play?id=ls-radio&plan=3)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the story screen
import { ListenPlayScreen } from "@/components/screens/ListenPlayScreen";

// Draw the story the address names
export function ListenPlayFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The screen, with its step number when there is one
  return <ListenPlayScreen storyId={params.get("id") ?? ""} planStep={/^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null} />;
}
