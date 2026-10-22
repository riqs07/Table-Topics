"use client";
// Reads the prompt, mode, and retry link from the address (?prompt=&mode=&retryOf=) and shows the recording screen

// Load Next.js's tools for reading the address and changing page
import { useRouter, useSearchParams } from "next/navigation";
// Load React's effect tool, to send a retired kind of session elsewhere
import { useEffect } from "react";
// Load the in-app link
import Link from "next/link";
// Load the real browser recording pieces
import { browserRecordingServices } from "@/audio/browserServices";
// Load the recording screen
import { RecordingScreen } from "@/components/screens/RecordingScreen";
// Load the daily prompt picker, for an address without a prompt
import { promptForDay } from "@/content/prompts";
// Load the check for a known kind of session
import { isCheckInPart, isSessionMode } from "@/data/records";
// Load the check-in's pitch, the plan its part is recorded with (decision 100)
import { CHECK_IN_PITCH } from "@/content/checkIn";
// Load the check that an id names a check-in
import { checkInDayOf } from "@/core/checkIn";
// Load the reader for a short speech's plan
import { outlineFromQuery } from "@/core/outline";
// Load the story choice checks and today's story prompt (decision 92)
import { isStoryFocus, isStoryLength, isStoryShape, storyPromptForDay } from "@/content/stories";
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
  const promptId = params.get("prompt") ?? (mode === "free" || mode === "outline" ? mode : mode === "story" ? storyPromptForDay(new Date()).id : promptForDay(new Date()).id);
  // A story's shape, focus and length from the address, each only when it is a known one (decision 92)
  const [shape, focus, length] = [params.get("shape"), params.get("focus"), params.get("length")];
  // Inside the weekly check-in: its id and part, only when both are real (decision 100)
  const [checkInId, part] = [params.get("checkin"), params.get("part")];
  // (both checked)
  const checkIn = checkInId && checkInDayOf(checkInId) && isCheckInPart(part) ? { id: checkInId, part } : null;
  // A 4/3/2 round (decision 118): "new" starts round 1 with no loop id yet; otherwise the loop's id and its round, 1 to 3
  const [loopParam, roundParam] = [params.get("loop"), params.get("round")];
  // (read)
  const loop = loopParam === "new" ? { id: null, round: 1 } : loopParam && /^[1-3]$/.test(roundParam ?? "") ? { id: loopParam, round: Number(roundParam) } : null;
  // The text to read, when reading aloud or doing a pause drill (a speech part's text loads first)
  const reading = useReading(mode === "read" || mode === "pause" ? promptId : null);
  // The openings and closings drill was retired (decision 106): its old addresses lead to Practice, so no new one is recorded
  const retired = named === "bookend";
  // Move there once in the browser
  useEffect(() => {
    // Only for the retired drill
    if (retired) router.replace("/practice");
  }, [retired, router]);
  // While moving, the page's frame
  if (retired) return <PageFallback />;
  // While a speech's text loads, the page's frame
  if (reading.status === "loading") return <PageFallback />;
  // If it could not load (offline before it was ever saved), say so with a way to try again
  if (reading.status === "failed") {
    // The explanation
    return (
      <main id="main" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 bg-paper-raised px-6 pt-10">
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
      // A fresh screen for each round of a 4/3/2 loop, which moves on within this page (decision 118)
      key={loop ? `loop-${loop.id ?? "new"}-${loop.round}` : "take"}
      // The prompt
      promptId={promptId}
      // A short speech's topic, points and length
      outline={mode === "outline" ? (checkIn?.part === "pitch" ? CHECK_IN_PITCH : outlineFromQuery(params)) : null}
      // Inside the weekly check-in, which check-in and part
      checkIn={checkIn}
      // A round of a 4/3/2 loop
      loop={loop}
      // A story's set-up (Classic, no focus and full length when the address has none)
      story={mode === "story" ? { shape: isStoryShape(shape) ? shape : "classic", focus: isStoryFocus(focus) ? focus : null, length: isStoryLength(length) ? length : "full" } : null}
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
