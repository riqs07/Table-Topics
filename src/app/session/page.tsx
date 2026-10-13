// The recording page: a placeholder until recording is built in milestone 5, after the iPhone test (C3, C5)

// Load the type for page metadata
import type { Metadata } from "next";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page masthead
import { Masthead } from "@/components/script/Masthead";

// Tab title
export const metadata: Metadata = { title: "Recording · VoiceLab" };

// Explain that recording is not built yet
export default function RecordingPlaceholderPage() {
  // A short, honest page with a way back
  return (
    // A single readable column
    <main className="mx-auto min-h-dvh max-w-2xl bg-paper-raised px-6 pt-6 md:pt-10">
      {/* Title */}
      <Masthead title="Recording" />
      {/* Explanation */}
      <p className="mt-6 font-display text-cue">Recording is not built yet.</p>
      {/* Why, and what to do meanwhile */}
      <p className="mt-4 text-lede text-ink-muted">
        It arrives once the iPhone test settles how transcription works. Meanwhile, Settings can fill the app with sample sessions so you can try History and feedback.
      </p>
      {/* Way back */}
      <p className="mt-6 text-lede"><Link href="/" className="underline underline-offset-4">Back to the prompt</Link></p>
    </main>
  );
}
