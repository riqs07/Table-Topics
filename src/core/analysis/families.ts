// The families of practice (decision 90): practice that behaves alike is compared only with itself (reading aloud is never compared with Rapid Fire). Kept apart from the profile so a page that only needs the families loads this small part

// Load the session kind type
import type { SessionMode } from "@/data/records";

// A family of practice
export type FamilyId = "spot" | "reading" | "rehearse" | "smalltalk" | "conversation" | "story";

// The families, their names, and the kinds of session in each (voice drills and moment notes are left out)
export const FAMILIES: ReadonlyArray<{ id: FamilyId; name: string; modes: ReadonlyArray<SessionMode> }> = [
  // Speaking on the spot or from a light plan
  { id: "spot", name: "Speaking on the spot", modes: ["talk", "response", "bookend", "free", "outline", "qa", "standard", "warmup"] },
  // Reading a text aloud
  { id: "reading", name: "Reading aloud", modes: ["read", "pause", "lesson"] },
  // Rehearsing your own talk
  { id: "rehearse", name: "Rehearsing your talks", modes: ["rehearse"] },
  // Small-talk answers and replies
  { id: "smalltalk", name: "Small talk", modes: ["smalltalk"] },
  // Conversations with a character
  { id: "conversation", name: "Conversations", modes: ["conversation"] },
  // Told stories, compared only with each other (decision 92)
  { id: "story", name: "Stories", modes: ["story"] },
];

// Which family a kind of session belongs to, or null when it is left out
export function familyOf(mode: SessionMode): FamilyId | null {
  // The family listing it
  return FAMILIES.find((family) => family.modes.includes(mode))?.id ?? null;
}
