"use client";
// This week's challenge off the page (such as speaking first in a meeting), with a box to tick when done

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the footnote style
import { Footnote } from "@/components/script/Footnote";
// Load the weekly challenge picker
import { challengeForWeek, type Challenge } from "@/content/challenges";
// Load the day label helper
import { dayKey } from "@/core/dates";
// Load the practice week calculator
import { practiceWeek } from "@/core/practiceWeek";
// Load the repository type
import type { Repository } from "@/data/repository";

// What the challenge needs from saved data
interface ChallengeState {
  // This week's challenge
  challenge: Challenge;
  // Id of this week's challenge record
  recordId: string;
  // Day this practice week began (ISO text)
  weekStart: string;
  // Whether it is done
  done: boolean;
}

// Draw this week's challenge
export function WeeklyChallenge({ repo, today }: { repo: Repository; today: Date }) {
  // The challenge, once loaded
  const [state, setState] = useState<ChallengeState | null>(null);

  // Work out this week's challenge and whether it is done
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Load it
    (async () => {
      // Every session (newest first), for the first one's date
      const first = (await repo.listSessions()).at(-1);
      // Which practice week it is
      const week = practiceWeek(first ? new Date(first.createdAt) : null, today);
      // Its record's id
      const recordId = `week-${dayKey(week.weekStart)}`;
      // A saved record of it, if any
      const record = (await repo.listChallenges()).find((challenge) => challenge.id === recordId);
      // Keep it if still open
      if (!cancelled) setState({ challenge: challengeForWeek(week.weekNumber), recordId, weekStart: week.weekStart.toISOString(), done: Boolean(record?.completedAt) });
    })();
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

  // Save it as done (or not) when the box is ticked
  async function toggle(done: boolean) {
    // Nothing to do before it loads
    if (!state) return;
    // Save the record
    await repo.saveChallenge({ id: state.recordId, weekStart: state.weekStart, text: state.challenge.text, completedAt: done ? today.toISOString() : null });
    // Show the new state
    setState({ ...state, done });
  }

  // Nothing until loaded
  if (!state) return null;
  // The challenge as a footnote with a checkbox
  return (
    <Footnote>
      {/* Label wraps the box and text so either can be tapped */}
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        {/* Square checkbox, filled with the accent when ticked */}
        <input type="checkbox" checked={state.done} onChange={(event) => void toggle(event.target.checked)} className="mt-0.5 size-6 flex-none appearance-none border-2 border-ink checked:border-accent checked:bg-accent" />
        {/* The challenge */}
        <span>Off the page this week: <span>{state.challenge.text.charAt(0).toLowerCase() + state.challenge.text.slice(1)}</span></span>
      </label>
    </Footnote>
  );
}
