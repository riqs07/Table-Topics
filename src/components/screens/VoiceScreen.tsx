"use client";
// Your voice: the warm-up, then every voice drill by mode, each mode a folded card (decision 80). Second design pass, extrapolated from Practice and a job's list of ways: "‹ Practice", the job's tile on its leaf tint, the warm-up as the band to start on, and each mode's fold with its own tile, in columns across the page (fix round: hub pages use the full width)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the whole-row link
import { RowLink } from "@/components/script/Buttons";
// Load the hub header (the way back, the tile on its tint and the name) and the band to start on
import { HubHeader } from "@/components/script/HubHeader";
import { NextUpBand } from "@/components/script/NextUpBand";
// Load the mode tile
import { ModeTile } from "@/components/scenes/ModeTile";
// Load the tile look type
import type { ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the folded group card
import { FoldCard, useOpenFoldFromAddress } from "@/components/script/FoldCard";
// Load the card looks and the section heading
import { SECTION_HEADING } from "@/components/script/textStyles";
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

// Each mode's tile: a ground and one prop (second design pass; the job's own tile is leaf with sound waves)
const MODE_TILES: Readonly<Record<VoiceDrillKind | "pausing" | "shadowing", ModeTileLook>> = { clear: { ground: "sky", prop: "mic", face: "sing" }, volume: { ground: "sun", prop: "waves", face: "wow" }, pitch: { ground: "plum", prop: "target", face: "ready" }, tone: { ground: "bloom", prop: "star", face: "happy" }, pausing: { ground: "leaf", prop: "pause", face: "ready" }, shadowing: { ground: "coral", prop: "loop", face: "sing" } };

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

  // How many drills there are in all, for the header
  const total = VOICE_DRILLS.length + TRICKY_WORDS.length + PAUSE_DRILLS.length + SHADOW_PASSAGES.length;
  // A mode's tile at the start of its fold
  const tile = (look: ModeTileLook) => <ModeTile ground={look.ground} prop={look.prop} face={look.face} still className="size-16" />;

  // Draw it
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="practice" />
      {/* The way back, then the job's tile on its leaf tint, its name and how many drills (as a job's list of ways), across the page */}
      <div data-wide>
        <HubHeader back={{ href: "/practice", label: "Practice" }} look={{ ground: "leaf", prop: "waves", face: "sing" }} title="Your voice" line={`Warm up, then train how you sound. ${total} drills.`} />
      </div>

      {/* The warm-up, first, as the band to start on (the tile carried over from Today, decision 141) */}
      <div data-wide className="mt-5 md:mt-7">
        <NextUpBand scene="warm-up" ariaLabel="Warm-up" label="Warm up first · 1 min" name="A one-minute routine" line="Breath, face and mouth. Nothing is recorded." href="/voice/warmup" go="Warm up" />
      </div>

      {/* Every drill, by mode: the folds in columns across the page */}
      <section aria-labelledby="drills" data-wide className="mt-8">
        {/* Heading */}
        <h2 id="drills" className={SECTION_HEADING}>Drills</h2>
        {/* The modes */}
        <div className="mt-3 grid items-start gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {/* Clear sounds, volume, pitch and stress, tone */}
          {(["clear", "volume", "pitch", "tone"] as const).map((kind) => {
            // The mode's drills
            const drills = VOICE_DRILLS.filter((drill) => drill.kind === kind);
            // Clear sounds holds the tricky-word lists too: one row on Practice and one fold here (decision 108)
            const lists = kind === "clear" ? TRICKY_WORDS : [];
            // One fold
            return (
              <FoldCard key={kind} id={kind} name={VOICE_MODE_NAMES[kind]} detail={MODE_LINES[kind]} count={drills.length + lists.length} art={tile(MODE_TILES[kind])}>
                {/* The drills, then any word lists */}
                <ul className="divide-y divide-rule">
                  {/* Each drill */}
                  {drills.map((drill) => <li key={drill.id}><RowLink href={`/voice/drill?id=${drill.id}`} meta={`${drill.sets ? `${drill.sets.length} sentences` : `${drill.takes.length} ${drill.takes.length === 1 ? "take" : "takes"}`}${doneText(counts.get(drill.id) ?? 0)}`}><span className="font-bold">{drill.title}</span></RowLink></li>)}
                  {/* Each word list, read aloud and checked word by word (once its own "Tricky words" fold; decision 80) */}
                  {lists.map((list) => <li key={list.id}><RowLink href={`/session?mode=read&prompt=${list.id}`} meta={`word list, 1 min${doneText(counts.get(list.id) ?? 0)}`}><span className="font-bold">{list.title}</span></RowLink></li>)}
                </ul>
              </FoldCard>
            );
          })}
          {/* Pausing: the pause drills */}
          <FoldCard id="pausing" name="Pausing" detail="Pause for effect, after a question, between points" count={PAUSE_DRILLS.length} art={tile(MODE_TILES.pausing)}>
            {/* The drills */}
            <ul className="divide-y divide-rule">
              {/* Each drill */}
              {PAUSE_DRILLS.map((drill) => <li key={drill.id}><RowLink href={`/session?mode=pause&prompt=${drill.id}`} meta={`1 min${doneText(counts.get(drill.id) ?? 0)}`}><span className="font-bold">{drill.title}</span></RowLink></li>)}
            </ul>
          </FoldCard>
          {/* Shadowing */}
          <FoldCard id="shadowing" name={VOICE_MODE_NAMES.shadow} detail="Hear a phrase, say it back the same way" count={SHADOW_PASSAGES.length} art={tile(MODE_TILES.shadowing)}>
            {/* The passages */}
            <ul className="divide-y divide-rule">
              {/* Each passage */}
              {SHADOW_PASSAGES.map((passage) => <li key={passage.id}><RowLink href={`/voice/shadow?id=${passage.id}`} meta={`${passage.phrases.length} phrases${doneText(counts.get(passage.id) ?? 0)}`}><span className="block font-bold">{passage.title}</span><span className="block text-footnote text-ink-muted">{passage.source}</span></RowLink></li>)}
            </ul>
          </FoldCard>
        </div>
      </section>
    </main>
  );
}
