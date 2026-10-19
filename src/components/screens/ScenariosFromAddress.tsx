"use client";
// Reads whether quick scenarios are a step of today's practice from the address (/learn/scenarios?plan=3)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the scenarios screen
import { ScenariosScreen } from "@/components/screens/ScenariosScreen";

// Draw the scenarios, inside today's practice when the address says so
export function ScenariosFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The screen, with its step number when there is one
  return <ScenariosScreen planStep={/^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null} />;
}
