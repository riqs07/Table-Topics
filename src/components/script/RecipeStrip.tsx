"use client";
// The small-talk recipe under the question: four beats, each with its reminder until it becomes a habit, then just the word, then hidden

// Load React's state tool
import { useState } from "react";
// Load the beats
import { BEATS, type BeatId } from "@/content/smallTalk";
// Load the strip's level type
import type { StripLevel } from "@/core/smallTalk";

// Draw the strip
export function RecipeStrip({ level, focus = null }: { level: StripLevel; focus?: BeatId | null }) {
  // Whether the user brought a hidden strip back
  const [shown, setShown] = useState(false);
  // Hidden once every beat is a habit, unless brought back
  if (level.hidden && !shown) {
    // A quiet way to bring it back
    return (
      <p className="mt-4">
        {/* Show it */}
        <button type="button" onClick={() => setShown(true)} className="inline-flex min-h-11 items-center text-footnote italic text-ink-muted underline underline-offset-4">Show the recipe</button>
      </p>
    );
  }
  // The four beats in a row (two by two on a narrow phone)
  return (
    <ol aria-label="The recipe" className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-rule py-3 sm:grid-cols-4">
      {/* Each beat */}
      {BEATS.map((beat, index) => (
        // One beat: the lesson's own beat is marked in the accent
        <li key={beat.id} data-level={level.beats[beat.id]} className={beat.id === focus ? "border-l-2 border-accent pl-2" : "pl-2.5"}>
          {/* Its number and name */}
          <span className={`block font-display ${beat.id === focus ? "text-accent" : ""}`}>{index + 1}. {beat.name}</span>
          {/* Its reminder, until it is a habit (always in a lesson about it) */}
          {(level.beats[beat.id] === "full" || beat.id === focus) && <span className="block text-footnote leading-snug text-ink-muted">{beat.reminder}</span>}
        </li>
      ))}
    </ol>
  );
}
