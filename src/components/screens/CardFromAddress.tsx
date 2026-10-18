"use client";
// Reads which card to show from the address (/learn/card?id=...)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the card screen
import { CardScreen } from "@/components/screens/CardScreen";

// Draw the card named in the address
export function CardFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The card
  return <CardScreen key={params.get("id") ?? ""} cardId={params.get("id") ?? ""} />;
}
