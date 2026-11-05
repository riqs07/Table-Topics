"use client";
// Read aloud (once "Build a skill"): every text to read aloud, the next part to read first, then one folded row per group (decision 79); the lessons moved to Learn's Speaking skills set (decision 107), so this page keeps the readings only, at its old /skills address. Second design pass, extrapolated from Desktop Screens "Courses" and "ReadAloud": "‹ Speak on the spot" and the reading tile in a header card, the next part as a "Keep going" card with a chunky button, then each group as a folded card with its own tile

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the page fade round a glide (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
// Load Next.js's link component
import Link from "next/link";
// Load the page heading with the main navigation, the list page's header and Sage's line
import { Masthead } from "@/components/script/Masthead";
import { HubHeader } from "@/components/script/HubHeader";
import { SageSays } from "@/components/script/SageSays";
// Load the mode tile, each kind's tile and the tile look type
import { ModeTile } from "@/components/scenes/ModeTile";
import { SCENE_TILES, type ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the whole-row link, the press effect and the chunky button look
import { PRESS, PRIMARY, RowLink } from "@/components/script/Buttons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the full speeches
import { FULL_SPEECHES, type FullSpeech } from "@/content/speeches";
// Load the part id maker
import { partId } from "@/content/readings";
// Load the reading-length helpers
import { lengthLabel, readingTime } from "@/core/readingLength";
// Load the texts
import { PASSAGES, type Passage } from "@/content/prompts";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";
// Load the shared card list look
import { CARD, CARD_LIST, LAB, SECTION_HEADING } from "@/components/script/textStyles";
// Load the folded group card
import { FoldCard, useOpenFoldFromAddress } from "@/components/script/FoldCard";

// Each group's tile: a book on leaf for whole speeches (the reading tile), a flag on sun for graduation, a microphone on sky for famous moments, a book on plum for plain passages
const GROUP_TILES: Readonly<Record<string, ModeTileLook>> = {
  // Whole speeches
  readings: SCENE_TILES["read-aloud"],
  // Commencement speeches
  commencement: { ground: "sun", prop: "flag", face: "happy" },
  // Short readings
  "short-readings": { ground: "sky", prop: "mic", face: "sing" },
  // Practice passages
  passages: { ground: "plum", prop: "book", face: "ready" },
};

// A list of texts to read, each a link that starts it
function TextList({ items, sessionMode, heading }: { items: ReadonlyArray<Passage>; sessionMode: "read" | "pause"; heading?: string }) {
  // The list
  return (
    <>
      {/* An optional small heading */}
      {heading && <h3 className="mt-4 text-footnote text-ink-muted">{heading}</h3>}
      {/* The texts */}
      <ul className={`mt-2 ${CARD_LIST}`}>
        {/* One row per text */}
        {items.map((item) => (
          // One text
          <li key={item.id}>
            {/* The whole row starts it; speeches show who gave them */}
            <RowLink href={`/session?mode=${sessionMode}&prompt=${item.id}`} meta={lengthLabel(readingTime(item.body))}>{item.title}</RowLink>
          </li>
        ))}
      </ul>
    </>
  );
}

// The full speeches as cards: title, speaker and year, parts and length, and how far along
function FullSpeechList({ heading, speeches, counts }: { heading: string; speeches: ReadonlyArray<FullSpeech>; counts: ReadonlyMap<string, number> }) {
  // The cards
  return (
    <>
      {/* One card per speech, two across on a wider screen (the group's row names it) */}
      <ul aria-label={heading} className="mt-2 grid gap-3 sm:grid-cols-2">
        {/* Each speech */}
        {speeches.map((speech) => {
          // Parts read at least once
          const done = speech.parts.filter((_, index) => (counts.get(partId(speech, index + 1)) ?? 0) > 0).length;
          // One card
          return (
            <li key={speech.id}>
              {/* The whole card opens the speech's page */}
              <Link href={`/speech?id=${speech.id}`} className={`flex h-full min-h-16 flex-col justify-between gap-1 px-4 py-3 hover:bg-paper ${CARD} ${PRESS}`}>
                {/* The title */}
                <span className="font-display text-lede font-semibold leading-tight">{speech.title}</span>
                {/* Who gave it, and when */}
                <span className="text-footnote text-ink-muted">{speech.speaker}, {speech.year}</span>
                {/* How many parts, how long, and how far along */}
                <span className="text-footnote text-ink-muted">{speech.parts.length === 1 ? "One part" : `${speech.parts.length} parts`}, {lengthLabel(readingTime(speech.parts.join(" ")))}{done > 0 ? ` · ${done === speech.parts.length ? "all read" : `${done} read`}` : ""}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// The short highlights from famous speeches as a grid of cards: title, who gave it and when, and how long
function SpeechCards({ items }: { items: ReadonlyArray<Passage> }) {
  // The cards
  return (
    <>
      {/* One card per speech, two across on a wider screen (the group's row names it) */}
      <ul aria-label="Short readings" className="mt-2 grid gap-3 sm:grid-cols-2">
        {/* Each speech */}
        {items.map((item) => (
          // One card
          <li key={item.id}>
            {/* The whole card starts the reading */}
            <Link href={`/session?mode=read&prompt=${item.id}`} className={`flex h-full min-h-16 flex-col justify-between gap-1 px-4 py-3 hover:bg-paper ${CARD} ${PRESS}`}>
              {/* The title */}
              <span className="font-display text-lede font-semibold leading-tight">{item.title}</span>
              {/* Who gave it, when, and how long */}
              <span className="text-footnote text-ink-muted">{item.source} · {lengthLabel(readingTime(item.body))}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

// The page
export function SkillsScreen(props: ScreenProps) {
  // The repository
  const { repo } = useScreenBasics(props);
  // How many times each text has been read, by id
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(new Map());

  // Count readings once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // Count sessions per text
      const next = new Map<string, number>();
      // Each reading adds one
      for (const session of sessions) if (session.mode === "read") next.set(session.promptId, (next.get(session.promptId) ?? 0) + 1);
      // Show the counts
      setCounts(next);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // Open the group a link points at (such as /skills#readings), and bring it into view
  useOpenFoldFromAddress();

  // The next part to read: the first part not yet read of the first whole speech not finished
  const nextReading = FULL_SPEECHES.filter((speech) => !speech.commencement).flatMap((speech) => speech.parts.map((_, index) => ({ speech, part: index + 1 }))).find((item) => (counts.get(partId(item.speech, item.part)) ?? 0) === 0);
  // The groups, each a row that opens its own list (decision 79)
  const groups: ReadonlyArray<{ id: string; name: string; detail: string; count: number; list: React.ReactNode }> = [
    // Whole speeches
    { id: "readings", name: "Whole speeches", detail: "a part at a time, about a minute each", count: FULL_SPEECHES.filter((speech) => !speech.commencement).length, list: <FullSpeechList heading="Whole speeches, a part at a time" speeches={FULL_SPEECHES.filter((speech) => !speech.commencement)} counts={counts} /> },
    // Commencement speeches
    { id: "commencement", name: "Commencement speeches", detail: "graduation addresses, a part at a time", count: FULL_SPEECHES.filter((speech) => speech.commencement).length, list: <FullSpeechList heading="Commencement speeches" speeches={FULL_SPEECHES.filter((speech) => speech.commencement)} counts={counts} /> },
    // Short readings
    { id: "short-readings", name: "Short readings", detail: "famous moments, under two minutes", count: PASSAGES.filter((passage) => passage.kind === "speech").length, list: <SpeechCards items={PASSAGES.filter((passage) => passage.kind === "speech")} /> },
    // Practice passages
    { id: "passages", name: "Practice passages", detail: "plain texts for steady reading", count: PASSAGES.filter((passage) => passage.kind === "practice").length, list: <TextList items={PASSAGES.filter((passage) => passage.kind === "practice")} sessionMode="read" /> },
  ];
  // Draw the page
  return (
    <PageFade>
      <main id="main" className={PAGE}>
        {/* Heading and navigation */}
        <Masthead title="VoiceLab" section="skills" />
        {/* The way back, then the reading tile (carried over from the Practice card, decision 141) with the page's name */}
        <HubHeader back={{ href: "/practice/ways?job=on-the-spot", label: "Speak on the spot" }} look={SCENE_TILES["read-aloud"]} scene="read-aloud" title="Read aloud" line="Famous speeches and plain passages, at your own pace. A part at a time, about a minute each." />

        {/* Up next: the next part to read (decision 79), as Courses' "Keep going": the whole card is the link, with a chunky button drawn on it */}
        <section aria-labelledby="up-next" className="mt-7">
          {/* Heading */}
          <h2 id="up-next" className={SECTION_HEADING}>Up next</h2>
          {/* The next part to read */}
          {nextReading ? (
            <Link href={`/session?mode=read&prompt=${partId(nextReading.speech, nextReading.part)}`} className={`mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 p-4 md:p-5 ${CARD} ${PRESS} hover:-translate-y-0.5`}>
              {/* The words (first, so the link is named by them) */}
              <span className="order-2 flex min-w-0 flex-[1_1_12rem] flex-col gap-0.5">
                {/* The speech */}
                <span className="font-display text-xl leading-tight font-semibold">{nextReading.speech.title}</span>
                {/* Which part, above it */}
                <span className={`${LAB} order-first`}>Read aloud · part {nextReading.part} of {nextReading.speech.parts.length}</span>
                {/* Who gave it */}
                <span className="text-footnote font-bold text-ink-muted">{nextReading.speech.speaker} · about 1 min</span>
              </span>
              {/* The tile */}
              <span className="order-1 flex flex-none"><ModeTile ground={SCENE_TILES["read-aloud"].ground} prop={SCENE_TILES["read-aloud"].prop} face={SCENE_TILES["read-aloud"].face} tilt={4} className="size-16 md:size-18" /></span>
              {/* The button drawn on the card */}
              <span aria-hidden="true" className={`${PRIMARY} order-3 w-full md:w-auto`}>Read part {nextReading.part}</span>
            </Link>
          ) : (
            <SageSays mood="proud" className="mt-3 max-w-xl"><p>You have read every whole speech. Pick any one below to read again.</p></SageSays>
          )}
        </section>

        {/* Every text, one row per group that opens its own list */}
        <section aria-labelledby="everything" className="mt-8">
          {/* Heading */}
          <h2 id="everything" className={SECTION_HEADING}>Everything</h2>
          {/* The groups, each with its tile */}
          <div className="mt-3 flex flex-col gap-2.5">
            {/* Each group */}
            {groups.map((group) => (
              // A folded group: its row, then its list once opened
              <FoldCard key={group.id} id={group.id} name={group.name} detail={group.detail} count={group.count} look={GROUP_TILES[group.id]}>{group.list}</FoldCard>
            ))}
          </div>
        </section>
      </main>
    </PageFade>
  );
}
