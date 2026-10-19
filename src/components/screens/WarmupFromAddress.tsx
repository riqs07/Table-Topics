"use client";
// Reads the warm-up's place in today's practice and what follows it from the address (/voice/warmup?plan=&then=)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the warm-up screen
import { WarmupScreen } from "@/components/screens/WarmupScreen";

// Draw the warm-up named in the address
export function WarmupFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The warm-up
  return <WarmupScreen planStep={/^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null} then={params.get("then")} />;
}
