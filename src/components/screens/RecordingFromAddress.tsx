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
// Load the check for a known kind of session
import { isSessionMode } from "@/data/records";

// Show the recording screen for the prompt in the address
export function RecordingFromAddress() {
  // Read the address
  const params = useSearchParams();
  // The router, for moving to the saved session
  const router = useRouter();
  // The kind of session named in the address (anything else is a full session)
  const named = params.get("mode");
  // A Table Topic, a Record Response, reading aloud, a pause drill, a rehearsal, a lesson, an old warm-up, or (with no mode) an old one-minute session
  const mode = isSessionMode(named) ? named : "standard";
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
      // A rehearsal of one section, when the address names one
      sectionIndex={/^\d+$/.test(params.get("section") ?? "") ? Number(params.get("section")) : null}
      // For a Q&A answer, which question
      questionIndex={/^\d+$/.test(params.get("question") ?? "") ? Number(params.get("question")) : 0}
      // The rung of the memory ladder to start on
      ladder={params.get("ladder") === "keywords" || params.get("ladder") === "none" ? (params.get("ladder") as "keywords" | "none") : "full"}
    />
  );
}
