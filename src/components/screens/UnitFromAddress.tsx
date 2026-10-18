"use client";
// Reads which Connect unit to show from the address (/small-talk/unit?id=...), answering when it is not known

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the unit screen
import { SmallTalkScreen } from "@/components/screens/SmallTalkScreen";
// Load the units
import { UNITS, type UnitId } from "@/content/smallTalk";

// Draw the unit named in the address
export function UnitFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The unit named, if it is one
  const named = UNITS.find((unit) => unit.id === params.get("id"))?.id ?? ("answering" as UnitId);
  // The unit
  return <SmallTalkScreen key={named} unitId={named} />;
}
