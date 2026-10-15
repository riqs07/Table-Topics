"use client";
// The Home screen: today's prompt as the page, with streak, focus, and the weekly challenge around it

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Footnote } from "@/components/script/Footnote";
import { Masthead } from "@/components/script/Masthead";
// Load the weekly challenge picker
import { challengeForWeek, type Challenge } from "@/content/challenges";
// Load the daily prompt picker
import { passageForDay, promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the streak sentence
import { streakSentence } from "@/core/copy";
// Load the day label helper
import { dayKey } from "@/core/dates";
// Load the weekly focus rules
import { currentFocus, type Focus } from "@/core/focus";
// Load the practice week calculator
import { practiceWeek } from "@/core/practiceWeek";
// Load the streak calculator
import { currentStreak } from "@/core/streak";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";

// Everything Home shows that comes from saved data
interface HomeData {
  // Number of sessions so far
  sessionCount: number;
  // Consecutive practice days
  streak: number;
  // This week's focus
  focus: Focus;
  // This week's challenge
  challenge: Challenge;
  // Id of this week's challenge record
  challengeRecordId: string;
  // Day this practice week began (ISO text)
  weekStart: string;
  // Whether the challenge is done
  challengeDone: boolean;
}

// Load and prepare everything Home shows, saving the weekly focus if it moved on
async function loadHome(repository: Repository, now: Date): Promise<HomeData> {
  // Read every session
  const sessions = await repository.listSessions();
  // Read the settings (defaults for a new user)
  const settings = await repository.getSettings(now);
  // Work out the focus, advancing one step per full week
  const active = currentFocus({ focusIndex: settings.focusIndex, focusStartedOn: new Date(settings.focusStartedOn) }, now);
  // Save the settings so a new user's start date sticks and any advance is kept
  await repository.saveSettings({ ...settings, focusIndex: active.focusIndex, focusStartedOn: active.focusStartedOn.toISOString() });
  // Find the first session's time (the list is newest first)
  const first = sessions.at(-1);
  // Work out which practice week it is
  const week = practiceWeek(first ? new Date(first.createdAt) : null, now);
  // Id of this week's challenge record
  const challengeRecordId = `week-${dayKey(week.weekStart)}`;
  // Look for a saved record of this week's challenge
  const record = (await repository.listChallenges()).find((challenge) => challenge.id === challengeRecordId);
  // Put everything together
  return {
    // How many sessions there are
    sessionCount: sessions.length,
    // Consecutive days with a session
    streak: currentStreak(sessions.map((session) => new Date(session.createdAt)), now),
    // This week's focus
    focus: active.focus,
    // This week's challenge
    challenge: challengeForWeek(week.weekNumber),
    // Its record id
    challengeRecordId,
    // When the week began
    weekStart: week.weekStart.toISOString(),
    // Whether it is done
    challengeDone: Boolean(record?.completedAt),
  };
}

// Draw the Home screen
export function HomeScreen(props: ScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // Which prompt along from today's ("or choose another" adds one)
  const [offset, setOffset] = useState(0);
  // Saved data, once loaded
  const [data, setData] = useState<HomeData | null>(null);

  // Load saved data once the time is known
  useEffect(() => {
    // Wait for the time
    if (!today) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load and store the data
    loadHome(repo, today).then((loaded) => {
      // Keep it only if the screen is still open
      if (!cancelled) setData(loaded);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

  // Save the weekly challenge as done (or not) when the box is ticked
  async function toggleChallenge(done: boolean) {
    // Nothing to do before data has loaded
    if (!data || !today) return;
    // Save the challenge record
    await repo.saveChallenge({ id: data.challengeRecordId, weekStart: data.weekStart, text: data.challenge.text, completedAt: done ? today.toISOString() : null });
    // Show the new state
    setData({ ...data, challengeDone: done });
  }

  // Today's Record Response prompt (after the time is known)
  const prompt = today ? promptForDay(today, offset) : null;
  // Today's Table Topic, kept off the page so it is a surprise
  const topic = today ? tableTopicForDay(today, offset) : null;
  // Today's passage to read aloud
  const passage = today ? passageForDay(today, offset) : null;

  // Draw the page
  return (
    // Full-height page: one column on a phone, margin plus main column on a computer
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Name and links */}
      <Masthead title="VoiceLab">
        {/* History link */}
        <Link href="/history" className="hover:underline">History</Link>
        {/* Separator */}
        {" · "}
        {/* Settings link */}
        <Link href="/settings" className="hover:underline">Settings</Link>
      </Masthead>

      {/* Two columns on a computer */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[240px_1fr] md:gap-14 md:pt-8">
        {/* Context: streak, focus, challenge (above the prompt on a phone, in the margin on a computer) */}
        <aside className="mt-5 text-lede text-ink-muted md:mt-0 md:text-footnote md:leading-relaxed">
          {/* Streak, or a first-time line */}
          {data && <p>{data.sessionCount === 0 ? "Your first recording becomes your starting point, to look back on later." : streakSentence(data.streak)}</p>}
          {/* This week's focus */}
          {data && (
            <p className="md:mt-6 md:border-t md:border-rule md:pt-3">
              This week: <em className="text-ink">{data.focus.title.toLowerCase()}</em>. {data.focus.description}
            </p>
          )}
        </aside>

        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* The prompt, set like a headline with a hanging quote */}
          {prompt && (
            <h1 className="relative mt-9 font-display text-prompt tracking-tight before:absolute before:-left-[0.42em] before:text-accent before:content-['“'] md:mt-0 md:max-w-[16ch] md:text-prompt-xl">
              {/* The prompt text (the hanging quote is drawn by the style above, so it is not read aloud) */}
              {prompt.text}
            </h1>
          )}
          {/* A quieter option: swap the prompt (the Table Topic changes with it) */}
          <p className="mt-4 italic text-ink-muted">
            {/* Swap the prompt */}
            <button type="button" onClick={() => setOffset(offset + 1)} className="italic hover:underline">or choose another</button>
          </p>
          {/* Push the footer down */}
          <div className="flex-1" />
          {/* This week's challenge as a footnote with a checkbox */}
          {data && (
            <Footnote>
              {/* Label wraps the box and text so either can be tapped */}
              <label className="flex cursor-pointer items-start gap-3">
                {/* Square checkbox, filled with the accent when ticked */}
                <input type="checkbox" checked={data.challengeDone} onChange={(event) => toggleChallenge(event.target.checked)} className="mt-1 size-3.5 flex-none appearance-none border-2 border-ink checked:border-accent checked:bg-accent" />
                {/* The challenge */}
                <span>Off the page this week: <span>{data.challenge.text.charAt(0).toLowerCase() + data.challenge.text.slice(1)}</span></span>
              </label>
            </Footnote>
          )}
          {/* The two modes: a Table Topic on a surprise question, or a prepared response to the prompt above */}
          {topic && <ActionBand quiet action="Table Topic" aside="surprise question · 1 to 2 min" href={`/session?mode=talk&prompt=${topic.id}`} />}
          {/* Reading aloud: a famous speech or a practice passage */}
          {passage && <ActionBand quiet action="Read aloud" aside={passage.kind === "speech" ? "a famous speech" : "a practice passage"} href={`/session?mode=read&prompt=${passage.id}`} />}
          {/* The main action */}
          {prompt && <ActionBand action="Record a response" aside="2 min to think · 3 to speak" href={`/session?mode=response&prompt=${prompt.id}`} />}
        </div>
      </div>
    </main>
  );
}
