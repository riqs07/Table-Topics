"use client";
// Your voice: the warm-up, then every voice drill by mode, each mode a folded card (decision 80)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the page title
import { PageTitle } from "@/components/script/PageTitle";
// Load the whole-row link
import { RowLink } from "@/components/script/Buttons";
// Load the folded group card
import { FoldCard, useOpenFoldFromAddress } from "@/components/script/FoldCard";
// Load the card looks and the section heading
import { CARD_LIST, SECTION_HEADING } from "@/components/script/textStyles";
// Load the page shell
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the voice content
import { SHADOW_PASSAGES, VOICE_DRILLS, VOICE_MODE_NAMES, type VoiceDrillKind } from "@/content/voice";
// Load the pause drills
import { PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";

// What each drill mode is for, in a few words
const MODE_LINES: Readonly<Record<VoiceDrillKind, string>> = { clear: "Finish every word: drills and word lists", volume: "Be heard without shouting, 1 min", pitch: "End low, lift a question, stress the key word", tone: "One line, three feelings" };

// How often something was done, in a few words
function doneText(count: number): string {
  // Never, once, twice, or a number
  return count === 0 ? "" : count === 1 ? " · done once" : count === 2 ? " · done twice" : ` · done ${count} times`;
}

// Draw the page
export function VoiceScreen(props: ScreenProps) {
  // The repository
  const { repo } = useScreenBasics(props);
  // How often each drill, pause drill and passage was done
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(new Map());
  // Open the mode a link points at
  useOpenFoldFromAddress();

  // Count once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // Count by prompt
      const next = new Map<string, number>();
      // Voice drills and pause drills
      for (const session of sessions) if (session.mode === "voice" || session.mode === "pause" || session.mode === "read") next.set(session.promptId, (next.get(session.promptId) ?? 0) + 1);
      // Keep them
      setCounts(next);
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo]);

  // Draw it
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Practice" section="practice" />
      {/* The page's name */}
      <PageTitle title="Your voice">Warm up, then train how you sound.</PageTitle>

      {/* The warm-up */}
      <section aria-labelledby="warmup" className="mt-6">
        {/* Heading */}
        <h2 id="warmup" className={SECTION_HEADING}>Warm-up</h2>
        {/* One row */}
        <ul className={`mt-2 ${CARD_LIST}`}>
          {/* Today's routine */}
          <li><RowLink href="/voice/warmup" meta="1 min"><span className="block font-semibold">A one-minute routine</span><span className="block text-footnote text-ink-muted">Breath, face and mouth. Nothing is recorded.</span></RowLink></li>
        </ul>
      </section>

      {/* Every drill, by mode */}
      <section aria-labelledby="drills" className="mt-8">
        {/* Heading */}
        <h2 id="drills" className={SECTION_HEADING}>Drills</h2>
        {/* The modes */}
        <div className="mt-2 flex flex-col gap-2">
          {/* Clear sounds, volume, pitch and stress, tone */}
          {(["clear", "volume", "pitch", "tone"] as const).map((kind) => {
            // The mode's drills
            const drills = VOICE_DRILLS.filter((drill) => drill.kind === kind);
            // Clear sounds holds the tricky-word lists too: one row on Practice and one fold here (decision 108)
            const lists = kind === "clear" ? TRICKY_WORDS : [];
            // One fold
            return (
              <FoldCard key={kind} id={kind} name={VOICE_MODE_NAMES[kind]} detail={MODE_LINES[kind]} count={drills.length + lists.length}>
                {/* The drills, then any word lists */}
                <ul className="divide-y divide-rule">
                  {/* Each drill */}
                  {drills.map((drill) => <li key={drill.id}><RowLink href={`/voice/drill?id=${drill.id}`} meta={`${drill.takes.length} ${drill.takes.length === 1 ? "take" : "takes"}${doneText(counts.get(drill.id) ?? 0)}`}>{drill.title}</RowLink></li>)}
                  {/* Each word list, read aloud and checked word by word (once its own "Tricky words" fold; decision 80) */}
                  {lists.map((list) => <li key={list.id}><RowLink href={`/session?mode=read&prompt=${list.id}`} meta={`word list, 1 min${doneText(counts.get(list.id) ?? 0)}`}>{list.title}</RowLink></li>)}
                </ul>
              </FoldCard>
            );
          })}
          {/* Pausing: the pause drills */}
          <FoldCard id="pausing" name="Pausing" detail="Pause for effect, after a question, between points" count={PAUSE_DRILLS.length}>
            {/* The drills */}
            <ul className="divide-y divide-rule">
              {/* Each drill */}
              {PAUSE_DRILLS.map((drill) => <li key={drill.id}><RowLink href={`/session?mode=pause&prompt=${drill.id}`} meta={`1 min${doneText(counts.get(drill.id) ?? 0)}`}>{drill.title}</RowLink></li>)}
            </ul>
          </FoldCard>
          {/* Shadowing */}
          <FoldCard id="shadowing" name={VOICE_MODE_NAMES.shadow} detail="Hear a phrase, say it back the same way" count={SHADOW_PASSAGES.length}>
            {/* The passages */}
            <ul className="divide-y divide-rule">
              {/* Each passage */}
              {SHADOW_PASSAGES.map((passage) => <li key={passage.id}><RowLink href={`/voice/shadow?id=${passage.id}`} meta={`${passage.phrases.length} phrases${doneText(counts.get(passage.id) ?? 0)}`}><span className="block">{passage.title}</span><span className="block text-footnote text-ink-muted">{passage.source}</span></RowLink></li>)}
            </ul>
          </FoldCard>
        </div>
      </section>
    </main>
  );
}
