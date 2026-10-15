"use client";
// The skill path: ten short lessons, all open, each with how often it has been practised

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the lessons
import { LESSONS } from "@/content/lessons";

// How often a lesson has been practised, in words
function practisedText(count: number): string {
  // Never, once, or several times
  return count === 0 ? "Not practised yet" : count === 1 ? "Practised once" : `Practised ${count} times`;
}

// Draw the page
export function LessonsScreen(props: ScreenProps) {
  // The repository
  const { repo } = useScreenBasics(props);
  // How many times each lesson has been practised, by id
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(new Map());

  // Count lesson sessions once in the browser
  useEffect(() => {
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read the sessions
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // Count sessions per lesson
      const next = new Map<string, number>();
      // Each lesson session adds one
      for (const session of sessions) if (session.mode === "lesson") next.set(session.promptId, (next.get(session.promptId) ?? 0) + 1);
      // Show the counts
      setCounts(next);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // Draw the page
  return (
    // One column
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Navigation and title */}
      <Masthead title="Skill path" section="lessons" />
      {/* What this is */}
      <p className="mt-6 max-w-[52ch] text-lede">Ten short lessons, one practical tip each. Take them in any order and repeat them as often as you like.</p>
      {/* The lessons */}
      <ol className="mt-8 divide-y divide-rule border-y border-rule">
        {/* One row per lesson */}
        {LESSONS.map((lesson) => (
          // One row
          <li key={lesson.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4">
            {/* Number */}
            <span className="w-6 font-display text-cue text-ink-muted tabular-nums">{lesson.number}</span>
            {/* Title and tip */}
            <span className="min-w-0 flex-1">
              {/* Title */}
              <span className="block font-display text-cue">{lesson.title}</span>
              {/* The tip's first sentence */}
              <span className="block text-footnote text-ink-muted">{lesson.tip.split(". ")[0]}.</span>
              {/* How often practised */}
              <span className="block text-footnote italic text-ink-muted">{practisedText(counts.get(lesson.id) ?? 0)}</span>
            </span>
            {/* Practise it */}
            <Link href={`/session?mode=lesson&prompt=${lesson.id}`} aria-label={`Practise ${lesson.title}`} className="underline underline-offset-4">Practise</Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
