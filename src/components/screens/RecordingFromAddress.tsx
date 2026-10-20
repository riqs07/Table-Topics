"use client";
// Reads the prompt, mode, and retry link from the address (?prompt=&mode=&retryOf=) and shows the recording screen

// Load Next.js's tools for reading the address and changing page
import { useRouter, useSearchParams } from "next/navigation";
// Load the in-app link
import Link from "next/link";
// Load the real browser recording pieces
import { browserRecordingServices } from "@/audio/browserServices";
// Load the recording screen
import { RecordingScreen } from "@/components/screens/RecordingScreen";
// Load the daily prompt picker, for an address without a prompt
import { promptForDay } from "@/content/prompts";
// Load the check for a known kind of session
import { isSessionMode } from "@/data/records";
// Load the reader for a short speech's plan
import { outlineFromQuery } from "@/core/outline";
// Load the text loader, so a speech part's text is loaded before the screen shows (decision 88)
import { useReading } from "@/components/screens/useReading";
// Load the loading frame and the buttons' look
import { PageFallback } from "@/components/script/PageFallback";
import { SECONDARY, TEXT_LINK } from "@/components/script/Buttons";

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
  // The prompt in the address, or today's (free talk and a short speech have no prompt; decision 73)
  const promptId = params.get("prompt") ?? (mode === "free" || mode === "outline" ? mode : promptForDay(new Date()).id);
  // The text to read, when reading aloud or doing a pause drill (a speech part's text loads first)
  const reading = useReading(mode === "read" || mode === "pause" ? promptId : null);
  // While a speech's text loads, the page's frame
  if (reading.status === "loading") return <PageFallback />;
  // If it could not load (offline before it was ever saved), say so with a way to try again
  if (reading.status === "failed") {
    // The explanation
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 bg-paper-raised px-6 pt-10">
        {/* What happened */}
        <p role="alert">This reading could not be loaded. Check your connection and try again.</p>
        {/* Try again, or go back */}
        <div className="flex flex-wrap gap-3">
          {/* Try again */}
          <button type="button" onClick={reading.retry} className={SECONDARY}>Try again</button>
          {/* Back to today */}
          <Link href="/" className={TEXT_LINK}>Back to today</Link>
        </div>
      </main>
    );
  }
  // Draw the screen with the real browser pieces
  return (
    <RecordingScreen
      // The prompt
      promptId={promptId}
      // A short speech's topic, points and length
      outline={mode === "outline" ? outlineFromQuery(params) : null}
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
      planStep={/^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null}
      ladder={params.get("ladder") === "keywords" || params.get("ladder") === "none" ? (params.get("ladder") as "keywords" | "none") : "full"}
    />
  );
}
