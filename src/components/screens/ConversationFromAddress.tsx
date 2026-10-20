"use client";
// Reads who to talk with, and optionally which skill to practise, from the address (/conversations/talk?id=&skill=) and shows the conversation (decisions 83 and 84)

// Load Next.js's tools for reading the address and changing page
import { useRouter, useSearchParams } from "next/navigation";
// Load the real browser recording pieces
import { browserRecordingServices } from "@/audio/browserServices";
// Load the conversation screen
import { ConversationScreen } from "@/components/screens/ConversationScreen";
// Load the small-talk units, to read a skill from the address
import { UNITS, type UnitId } from "@/content/smallTalk";

// Draw the conversation named in the address
export function ConversationFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The router, for moving to the saved conversation
  const router = useRouter();
  // A skill named in the address, if it is one
  const skill = UNITS.find((unit) => unit.id === params.get("skill"))?.id as UnitId | undefined;
  // The person, keyed by id so another person starts fresh
  return <ConversationScreen key={params.get("id") ?? ""} characterId={params.get("id") ?? ""} {...(skill ? { skill } : {})} services={browserRecordingServices} navigate={(path) => router.push(path)} />;
}
