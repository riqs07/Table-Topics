"use client";
// Reads which session to show from the address (?id=...), so one cached page can show any saved session offline

// Load Next.js's tool for reading the address's query
import { useSearchParams } from "next/navigation";
// Load the session screen
import { SessionScreen } from "@/components/screens/SessionScreen";

// Show the session named in the address
export function SessionFromAddress() {
  // Read the id from ?id=..., or "" if missing
  const sessionId = useSearchParams().get("id") ?? "";
  // Draw the session (a missing id shows the "not on this device" note)
  return <SessionScreen sessionId={sessionId} />;
}
