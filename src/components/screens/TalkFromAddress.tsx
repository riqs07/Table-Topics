"use client";
// Reads the talk's id from the address and draws its page

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the talk's page
import { TalkScreen } from "@/components/screens/TalkScreen";

// Draw the talk named in the address
export function TalkFromAddress() {
  // The id after "?id="
  const talkId = useSearchParams().get("id") ?? "";
  // The page for it
  return <TalkScreen talkId={talkId} />;
}
