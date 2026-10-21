"use client";
// The star on a take's page (decision 98): a starred take keeps its recording and its detailed charts however old it gets. A plain toggle button, its state said in words and to screen readers

// Load React's state tool
import { useState } from "react";
// Load the star icons, outlined and filled
import { StarIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared button look
import { SECONDARY } from "@/components/script/Buttons";
// Load the repository type
import type { Repository } from "@/data/repository";

// What the star needs: where to save, which take, whether it is starred, and who to tell when it changes
interface StarToggleProps {
  // Where the take is saved
  repo: Repository;
  // The take's id
  sessionId: string;
  // Whether it is starred now
  starred: boolean;
  // Told the new state once it is saved
  onChange?: (starred: boolean) => void;
}

// A toggle button that stars or unstars a take, with a line on what a star keeps
export function StarToggle({ repo, sessionId, starred, onChange }: StarToggleProps) {
  // The state shown (follows the saved state once it is saved)
  const [on, setOn] = useState(starred);
  // True while saving, so two taps never overlap
  const [saving, setSaving] = useState(false);
  // Why the last change could not be saved, if it could not
  const [error, setError] = useState("");

  // Flip the star and save it
  async function toggle() {
    // The new state
    const next = !on;
    // Saving now
    setSaving(true);
    // Saving can fail
    try {
      // Saved on the take
      await repo.setStarred(sessionId, next);
      // Shown
      setOn(next);
      // No problem to show
      setError("");
      // Told
      onChange?.(next);
    } catch (failure) {
      // Said plainly, with the way forward
      setError(`The star could not be saved (${failure instanceof Error ? failure.message : String(failure)}). Try again.`);
    } finally {
      // Ready for the next tap
      setSaving(false);
    }
  }

  // Draw the button and its line
  return (
    <div className="mt-4">
      {/* The toggle: pressed when starred */}
      <button type="button" aria-pressed={on} onClick={() => void toggle()} disabled={saving} className={`${SECONDARY} gap-2`}>
        {/* The star, filled when on (the words say the same, so colour is never the only sign) */}
        <StarIcon aria-hidden="true" weight={on ? "fill" : "regular"} className={`size-5 ${on ? "text-accent" : ""}`} />
        {/* The words */}
        {on ? "Starred" : "Star this take"}
      </button>
      {/* What a star does */}
      <p className="mt-1 text-footnote text-ink-muted">{on ? "This take keeps its recording and charts for good." : "Starred takes keep their recording and charts for good. Older takes without a star keep their words and numbers."}</p>
      {/* A failed save, said where it happened */}
      {error && <p role="alert" className="mt-1 text-footnote">{error}</p>}
    </div>
  );
}
