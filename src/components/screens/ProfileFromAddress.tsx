"use client";
// Reads which take to show from the address (?session=...), so one cached page can show the whole profile or one take's measures offline (decision 90)

// Load Next.js's tool for reading the address's query
import { useSearchParams } from "next/navigation";
// Load the profile screen
import { ProfileScreen } from "@/components/screens/ProfileScreen";

// Show the profile, or the take named in the address
export function ProfileFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The take's id from ?session=..., or none
  const sessionId = params.get("session") || null;
  // Draw it
  return <ProfileScreen sessionId={sessionId} />;
}
