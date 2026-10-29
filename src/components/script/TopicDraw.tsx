"use client";
// The Rapid Fire topic draw (decision 133): other topics flick past in the headline's place, slowing down, then the real topic lands with a small pop and the countdown begins. Screen readers hear "Picking your topic…" and then the topic as before

// Load React's state, effect and reference tools
import { useEffect, useRef, useState } from "react";
// Load the timing rules
import { DRAW_LAND_MS, drawDelays } from "@/core/topicDraw";

// What the draw is given
interface TopicDrawProps {
  // The topics in turn, the real one last
  steps: ReadonlyArray<string>;
  // Told once the real topic has landed and held
  onDone: () => void;
}

// Draw the spinning topic
export function TopicDraw({ steps, onDone }: TopicDrawProps) {
  // Which topic shows
  const [at, setAt] = useState(0);
  // The latest "done" handler, so a new one from the parent never restarts the draw
  const done = useRef(onDone);
  // Keep it current
  useEffect(() => {
    // The newest
    done.current = onDone;
  }, [onDone]);
  // Step through the topics, slowing down, then hold the last before saying done
  useEffect(() => {
    // How long each topic stays
    const delays = drawDelays(steps.length);
    // The timers set, so they can be cleared
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    // When each step starts, from the beginning
    let elapsed = 0;
    // Each step after the first
    for (let index = 1; index < steps.length; index += 1) {
      // It starts after the one before has stayed its time
      elapsed += delays[index - 1]!;
      // Show it then
      timers.push(setTimeout(() => setAt(index), elapsed));
    }
    // The real topic's own time, then the hold, then done
    timers.push(setTimeout(() => done.current(), elapsed + (delays[steps.length - 1] ?? 0) + DRAW_LAND_MS));
    // Clear them if the screen closes first
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [steps]);
  // Whether the real topic has landed
  const landed = at === steps.length - 1;
  // The headline's look, shared by the hidden real topic that sets the height and the topic shown over it
  const headline = "relative font-display text-prompt tracking-tight before:absolute before:-left-[0.42em] before:text-accent before:content-['“'] md:max-w-[16ch] md:text-prompt-xl";
  // The headline's place: as tall as the real topic all along, so nothing below it moves, with longer topics clipped top and bottom (never at the sides, where the quote mark and the landing pop reach)
  return (
    <div data-topic-draw={landed ? "landed" : "spinning"} className="relative mt-8 grid overflow-y-clip md:mt-0">
      {/* What a screen reader hears while it spins */}
      <p role="status" className="sr-only">{landed ? "" : "Picking your topic…"}</p>
      {/* The real topic, unseen, holding the height */}
      <p aria-hidden="true" className={`invisible col-start-1 row-start-1 ${headline}`}>{steps[steps.length - 1]}</p>
      {/* The topic showing: faint while spinning, then full ink with a pop when it lands, growing from the left edge where the text starts so it never runs off the screen */}
      <p aria-hidden="true" data-topic-shown key={at} className={`col-start-1 row-start-1 ${headline} ${landed ? "origin-left motion-safe:animate-pop" : "text-ink-muted motion-safe:animate-flick"}`}>
        {steps[at]}
      </p>
    </div>
  );
}
