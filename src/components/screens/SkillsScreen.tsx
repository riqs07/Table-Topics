"use client";
// Skills: the lessons and every text to read aloud, in one place (UX round, 2026-10-15; replaces the separate Lessons and Library pages)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared page title
import { PageTitle } from "@/components/script/PageTitle";
// Load the whole-row link
import { RowLink, TEXT_LINK } from "@/components/script/Buttons";
// Load the chevron that marks a row as tappable
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load a mode's heading and description
import { ModeHeader } from "@/components/script/ModeHeader";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the lessons
import { LESSONS } from "@/content/lessons";
// Load the done and next marks
import { lessonPath } from "@/core/lessonPath";
// Load the full speeches
import { FULL_SPEECHES, type FullSpeech } from "@/content/speeches";
// Load the part id maker
import { partId } from "@/content/readings";
// Load the reading-length helpers
import { lengthLabel, readingTime } from "@/core/readingLength";
// Load the done and next marks on a path
import { PathMark } from "@/components/script/PathMark";
// Load the catalogue
import { MODES, type ModeInfo } from "@/content/modes";
// Load the texts
import { PASSAGES, PAUSE_DRILLS, TRICKY_WORDS, type Passage } from "@/content/prompts";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";
// Load the shared card list look
import { CARD_LIST } from "@/components/script/textStyles";

// The catalogue entry for an id (always present for the ids used here)
const mode = (id: string) => MODES.find((item) => item.id === id) as ModeInfo;

// How often a lesson has been practised, in words (only shown once it has been)
function practisedText(count: number): string {
  // Once, or several times
  return count === 1 ? "Practised once" : `Practised ${count} times`;
}

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
      {/* Small heading */}
      <h3 className="mt-6 text-footnote text-ink-muted">{heading}</h3>
      {/* One card per speech, two across on a wider screen */}
      <ul aria-label={heading} className="mt-2 grid gap-3 sm:grid-cols-2">
        {/* Each speech */}
        {speeches.map((speech) => {
          // Parts read at least once
          const done = speech.parts.filter((_, index) => (counts.get(partId(speech, index + 1)) ?? 0) > 0).length;
          // One card
          return (
            <li key={speech.id}>
              {/* The whole card opens the speech's page */}
              <Link href={`/speech?id=${speech.id}`} className="flex h-full min-h-16 flex-col justify-between gap-1 border border-rule bg-paper px-4 py-3 hover:border-accent">
                {/* The title */}
                <span className="font-display text-lede leading-tight sm:text-cue">{speech.title}</span>
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
      {/* Small heading */}
      <h3 className="mt-6 text-footnote text-ink-muted">Short readings</h3>
      {/* One card per speech, two across on a wider screen */}
      <ul aria-label="Short readings" className="mt-2 grid gap-3 sm:grid-cols-2">
        {/* Each speech */}
        {items.map((item) => (
          // One card
          <li key={item.id}>
            {/* The whole card starts the reading */}
            <Link href={`/session?mode=read&prompt=${item.id}`} className="flex h-full min-h-16 flex-col justify-between gap-1 border border-rule bg-paper px-4 py-3 hover:border-accent">
              {/* The title */}
              <span className="font-display text-lede leading-tight sm:text-cue">{item.title}</span>
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
  // How many times each lesson has been practised and each text read, by id
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(new Map());

  // Count lesson sessions once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // Count sessions per lesson
      const next = new Map<string, number>();
      // Each lesson or reading adds one
      for (const session of sessions) if (session.mode === "lesson" || session.mode === "read") next.set(session.promptId, (next.get(session.promptId) ?? 0) + 1);
      // Show the counts
      setCounts(next);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // The done and next marks, in lesson order
  const marks = lessonPath(LESSONS.map((lesson) => lesson.id), counts);
  // Draw the page
  return (
    <main className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Practice" section="skills" />
      {/* The page's name */}
      <PageTitle title="Build a skill" />
      {/* Jump to a part */}
      <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-x-5 text-footnote">
        {/* One link per part */}
        {["lessons", "readings", "pause-drills", "tricky-words"].map((id) => (
          // A jump link
          <a key={id} href={`#${id}`} className={TEXT_LINK}>{mode(id).name}</a>
        ))}
      </nav>

      {/* Lessons */}
      <section className="mt-10">
        {/* What they are */}
        <ModeHeader mode={mode("lessons")} />
        {/* The lessons */}
        <ol className="mt-4">
          {/* One row per lesson */}
          {LESSONS.map((lesson, index) => (
            // One lesson, joined to the next by a line down the path
            <li key={lesson.id} className="relative">
              {/* The line to the next lesson (not after the last) */}
              {index < LESSONS.length - 1 && <span aria-hidden="true" className="absolute top-14 bottom-0 left-[17px] w-0.5 bg-rule" />}
              {/* The whole row starts the lesson */}
              <Link href={`/session?mode=lesson&prompt=${lesson.id}`} aria-label={`Practise ${lesson.title}`} className="relative flex items-start gap-x-4 py-4 hover:text-accent">
                {/* Its mark on the path */}
                <PathMark mark={marks[index] ?? "open"} number={lesson.number} />
                {/* Title and tip */}
                <span className="min-w-0 flex-1">
                  {/* "Next" above the title of the lesson to try next */}
                  {marks[index] === "next" && <span className="block text-footnote font-medium text-accent">Next</span>}
                  {/* Title */}
                  <span className="block font-display text-xl leading-tight">{lesson.title}</span>
                  {/* How often practised, once it has been (the path mark already shows what is new) */}
                  {(counts.get(lesson.id) ?? 0) > 0 && <span className="block text-footnote text-ink-muted">{practisedText(counts.get(lesson.id) ?? 0)}</span>}
                </span>
                {/* The chevron */}
                <CaretRightIcon aria-hidden="true" className="size-5 flex-none self-center text-ink-muted" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Readings */}
      <section className="mt-12">
        {/* What they are */}
        <ModeHeader mode={mode("readings")} />
        {/* Speeches */}
        <FullSpeechList heading="Whole speeches, a part at a time" speeches={FULL_SPEECHES.filter((speech) => !speech.commencement)} counts={counts} />
        {/* Graduation speeches */}
        <FullSpeechList heading="Commencement speeches" speeches={FULL_SPEECHES.filter((speech) => speech.commencement)} counts={counts} />
        {/* Short readings */}
        <SpeechCards items={PASSAGES.filter((passage) => passage.kind === "speech")} />
        {/* Practice passages */}
        <TextList items={PASSAGES.filter((passage) => passage.kind === "practice")} sessionMode="read" heading="Practice passages" />
      </section>

      {/* Pause drills */}
      <section className="mt-12">
        {/* What they are */}
        <ModeHeader mode={mode("pause-drills")} />
        {/* The drills */}
        <TextList items={PAUSE_DRILLS} sessionMode="pause" />
      </section>

      {/* Tricky words */}
      <section className="mt-12">
        {/* What they are */}
        <ModeHeader mode={mode("tricky-words")} />
        {/* The lists */}
        <TextList items={TRICKY_WORDS} sessionMode="read" />
      </section>
    </main>
  );
}
