"use client";
// Reads the session id from the address and draws its Q&A page

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the Q&A page
import { QaScreen } from "@/components/screens/QaScreen";

// Draw the Q&A page for the session named in the address
export function QaFromAddress() {
  // The id after "?from="
  const fromId = useSearchParams().get("from") ?? "";
  // The page for it
  return <QaScreen fromId={fromId} />;
}
