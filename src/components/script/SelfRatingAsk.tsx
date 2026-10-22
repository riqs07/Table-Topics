"use client";
// Rate yourself before the results (decision 116): one question, three answers as big buttons, and a way to skip, all one tap. The take is already saved; the answer goes on it and the results open

// Load React's state tool
import { useState } from "react";
// Load the shared button looks
import { PRESS, QUIET, SECONDARY } from "@/components/script/Buttons";
// Load the question and its answers
import { RATING_OPTIONS, RATING_QUESTION } from "@/core/selfRating";
// Load the record types
import type { RatingAnswer, RatingScale } from "@/data/records";

// What the question needs
interface SelfRatingAskProps {
  // Which scale it asks about
  scale: RatingScale;
  // Save an answer (may fail), then go on to the results
  onAnswer: (answer: RatingAnswer) => Promise<void>;
  // Go on to the results without answering
  onSkip: () => void;
}

// The question, its three answers and the skip
export function SelfRatingAsk({ scale, onAnswer, onSkip }: SelfRatingAskProps) {
  // Saving an answer, or the answer could not be saved
  const [state, setState] = useState<"idle" | "saving" | "failed">("idle");

  // Save the tapped answer, saying so if it fails
  async function answer(choice: RatingAnswer) {
    // Saving
    setState("saving");
    // Saved and gone on, or failed
    try {
      // Save and go on
      await onAnswer(choice);
    } catch (error) {
      // The details for debugging
      console.warn("The answer could not be saved", error);
      // Said on the page, with the way on
      setState("failed");
    }
  }

  // The question
  return (
    <section aria-labelledby="rating-question" data-self-rating-ask className="mt-8 flex flex-col md:mt-0 md:max-w-xl">
      {/* The take is saved */}
      <p className="text-footnote font-medium text-accent">Saved. Before your results</p>
      {/* The question */}
      <h1 id="rating-question" className="mt-2 font-display text-statement tracking-tight">{RATING_QUESTION}</h1>
      {/* The three answers, one tap each */}
      <div role="group" aria-labelledby="rating-question" className="mt-6 grid grid-cols-3 gap-2">
        {/* Each answer */}
        {RATING_OPTIONS[scale].map((option) => (
          <button key={option.answer} type="button" disabled={state === "saving"} onClick={() => void answer(option.answer)} className={`min-h-16 rounded-2xl border-2 border-rule bg-card px-2 font-semibold text-ink hover:border-ink disabled:opacity-60 ${PRESS}`}>{option.label}</button>
        ))}
      </div>
      {/* The answer could not be saved: said, with the way on */}
      {state === "failed" ? (
        <p role="alert" className="mt-5 flex flex-wrap items-center gap-3 text-lede">
          {/* What happened */}
          <span>Your answer could not be saved. Your take is saved.</span>
          {/* On to the results */}
          <button type="button" onClick={onSkip} className={SECONDARY}>See your results</button>
        </p>
      ) : (
        // Skip, one tap
        <p className="mt-4"><button type="button" onClick={onSkip} disabled={state === "saving"} className={QUIET}>Skip</button></p>
      )}
      {/* What it is for */}
      <p className="mt-4 max-w-[44ch] text-footnote text-ink-muted">Your results compare your call with what was measured, when the measure is clear.</p>
    </section>
  );
}
