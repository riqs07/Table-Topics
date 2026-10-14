"use client";
// Reads the prompt, mode, and retry link from the address (?prompt=&mode=&retryOf=) and shows the recording screen

// Load Next.js's tools for reading the address and changing page
import { useRouter, useSearchParams } from "next/navigation";
// Load the real browser recording pieces
import { browserRecordingServices } from "@/audio/browserServices";
// Load the recording screen
import { RecordingScreen } from "@/components/screens/RecordingScreen";
// Load the daily prompt picker, for an address without a prompt
import { promptForDay } from "@/content/prompts";

// Show the recording screen for the prompt in the address
export function RecordingFromAddress() {
  // Read the address
  const params = useSearchParams();
  // The router, for moving to the saved session
  const router = useRouter();
  // The kind of session named in the address (anything else is a full session)
  const named = params.get("mode");
  // A warm-up, a three-minute talk, or a full session
  const mode = named === "warmup" || named === "talk" ? named : "standard";
  // Draw the screen with the real browser pieces
  return (
    <RecordingScreen
      // The prompt in the address, or today's
      promptId={params.get("prompt") ?? promptForDay(new Date()).id}
      // Full session or warm-up
      mode={mode}
      // The session being retried, if any
      retryOf={params.get("retryOf")}
      // The browser's microphone and speech recognition
      services={browserRecordingServices}
      // Move on with the router
      navigate={(path) => router.push(path)}
    />
  );
}
