"use client";
// Reads which two check-ins to compare from the address (?a=...&b=...), so one cached page can compare any two offline (decision 100)

// Load Next.js's tool for reading the address's query
import { useSearchParams } from "next/navigation";
// Load the comparison screen
import { CheckInCompareScreen } from "@/components/screens/CheckInCompareScreen";

// Show the two check-ins named in the address, or the first and the latest
export function CheckInCompareFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The comparison, started afresh for each pair named
  return <CheckInCompareScreen key={`${params.get("a")}|${params.get("b")}`} aId={params.get("a")} bId={params.get("b")} />;
}
