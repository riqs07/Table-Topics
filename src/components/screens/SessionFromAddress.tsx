"use client";
// Reads which session to show from the address (?id=...), so one cached page can show any saved session offline

// Load Next.js's tools for reading the address's query and moving between pages
import { useRouter, useSearchParams } from "next/navigation";
// Load the session screen
import { SessionScreen } from "@/components/screens/SessionScreen";

// Show the session named in the address
export function SessionFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The router, for moving on to the next step of today's practice
  const router = useRouter();
  // Read the id from ?id=..., or "" if missing
  const sessionId = params.get("id") ?? "";
  // Inside today's practice, which step (from &plan=...)
  const planStep = /^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null;
  // Draw the session (a missing id shows the "not on this device" note)
  return <SessionScreen sessionId={sessionId} planStep={planStep} navigate={(path) => router.push(path)} />;
}
