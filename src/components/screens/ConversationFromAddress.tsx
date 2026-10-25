"use client";
// Reads who to talk with, and optionally the skill, the situation and whether to start at once, from the address (/conversations/talk?id=&skill=&situation=&start=1), and shows the conversation (decisions 83, 84 and 127)

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
  // A situation named in the address (the screen checks it is real)
  const situation = params.get("situation") ?? undefined;
  // The person and situation, keyed so another one starts fresh
  return <ConversationScreen key={`${params.get("id") ?? ""}:${situation ?? ""}`} characterId={params.get("id") ?? ""} {...(skill ? { skill } : {})} situationId={situation} autostart={params.get("start") === "1"} services={browserRecordingServices} navigate={(path) => router.push(path)} />;
}
