"use client";
// This week's challenge off the page (such as speaking first in a meeting), with a box to tick when done

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the tick and the card look (decision 79)
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { LAB } from "@/components/script/textStyles";
// Load the filter that leaves out private moment notes
import { practiceSessions } from "@/core/sessionHome";
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
      const first = practiceSessions(await repo.listSessions()).at(-1);
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
  // The challenge as a soft card with a checkbox (decision 79; second pass: a label over the challenge in bold)
  return (
    <div data-wide className="mt-8 md:mt-10">
      {/* Label wraps the box and text so either can be tapped */}
      <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[22px] border-2 border-rule bg-paper px-3 py-3 shadow-card md:gap-4 md:px-5 md:py-4">
        {/* A rounded box, filled with the accent when ticked, inside a 44-pixel target (decision 79) */}
        <span className="relative flex size-11 flex-none items-center justify-center">
          {/* The box */}
          <input type="checkbox" checked={state.done} onChange={(event) => void toggle(event.target.checked)} className="peer size-7 appearance-none rounded-[9px] border-2 border-ink-muted checked:border-fill checked:bg-fill" />
          {/* The tick, shown when ticked */}
          <CheckIcon aria-hidden="true" weight="bold" className="pointer-events-none absolute size-4 text-fill-ink opacity-0 peer-checked:opacity-100" />
        </span>
        {/* The label, then the challenge */}
        <span className="flex min-w-0 flex-col gap-0.5">
          {/* What it is */}
          <span className={LAB}>Off the page this week</span>
          {/* The challenge */}
          <b className="leading-snug font-extrabold">{state.challenge.text}</b>
        </span>
      </label>
    </div>
  );
}
