"use client";
// Reads who to talk with from the address (/conversations/talk?id=) and shows the conversation (decision 83)

// Load Next.js's tools for reading the address and changing page
import { useRouter, useSearchParams } from "next/navigation";
// Load the real browser recording pieces
import { browserRecordingServices } from "@/audio/browserServices";
// Load the conversation screen
import { ConversationScreen } from "@/components/screens/ConversationScreen";

// Draw the conversation named in the address
export function ConversationFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The router, for moving to the saved conversation
  const router = useRouter();
  // The person, keyed by id so another person starts fresh
  return <ConversationScreen key={params.get("id") ?? ""} characterId={params.get("id") ?? ""} services={browserRecordingServices} navigate={(path) => router.push(path)} />;
}
