"use client";
// Skills: the lessons and every text to read aloud, in one place (UX round, 2026-10-15; replaces the separate Lessons and Library pages)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the whole-row link
import { RowLink } from "@/components/script/Buttons";
// Load the chevron that marks a row as tappable
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load a mode's heading and description
import { ModeHeader } from "@/components/script/ModeHeader";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the lessons
import { LESSONS } from "@/content/lessons";
// Load the done and next marks
import { lessonPath, type LessonMark } from "@/core/lessonPath";
// Load the tick for a done lesson
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the catalogue
import { MODES, type ModeInfo } from "@/content/modes";
// Load the texts
import { PASSAGES, PAUSE_DRILLS, TRICKY_WORDS, type Passage } from "@/content/prompts";

// The catalogue entry for an id (always present for the ids used here)
const mode = (id: string) => MODES.find((item) => item.id === id) as ModeInfo;

// How often a lesson has been practised, in words
function practisedText(count: number): string {
  // Never, once, or several times
  return count === 0 ? "Not practised yet" : count === 1 ? "Practised once" : `Practised ${count} times`;
}

// A list of texts to read, each a link that starts it
function TextList({ items, sessionMode, heading }: { items: ReadonlyArray<Passage>; sessionMode: "read" | "pause"; heading?: string }) {
  // The list
  return (
    <>
      {/* An optional small heading */}
      {heading && <h3 className="mt-4 text-footnote italic text-ink-muted">{heading}</h3>}
      {/* The texts */}
      <ul className="mt-2 divide-y divide-rule border-y border-rule">
        {/* One row per text */}
        {items.map((item) => (
          // One text
          <li key={item.id}>
            {/* The whole row starts it; speeches show who gave them */}
            <RowLink href={`/session?mode=${sessionMode}&prompt=${item.id}`} meta={item.kind === "speech" ? item.source : undefined}>{item.title}</RowLink>
          </li>
        ))}
      </ul>
    </>
  );
}

// The famous speeches as a grid of cards: title, then who gave it and when
function SpeechCards({ items }: { items: ReadonlyArray<Passage> }) {
  // The cards
  return (
    <>
      {/* Small heading */}
      <h3 className="mt-4 text-footnote italic text-ink-muted">Famous speeches</h3>
      {/* One card per speech, two across on a wider screen */}
      <ul aria-label="Famous speeches" className="mt-2 grid gap-3 sm:grid-cols-2">
        {/* Each speech */}
        {items.map((item) => (
          // One card
          <li key={item.id}>
            {/* The whole card starts the reading */}
            <Link href={`/session?mode=read&prompt=${item.id}`} className="flex h-full min-h-16 flex-col justify-between gap-1 border border-rule bg-paper px-4 py-3 hover:border-accent">
              {/* The title */}
              <span className="font-display text-lede leading-tight sm:text-cue">{item.title}</span>
              {/* Who gave it, and when */}
              <span className="text-footnote italic text-ink-muted">{item.source}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

// A lesson's place on the path: a filled tick when done, an accent ring marked "Next", a quiet ring otherwise
function PathMark({ mark, number }: { mark: LessonMark; number: number }) {
  // Done: a filled square with a tick
  if (mark === "done") return (
    <span className="flex size-9 flex-none items-center justify-center bg-accent text-accent-ink">
      {/* The tick */}
      <CheckIcon aria-hidden="true" weight="bold" className="size-5" />
      {/* Said aloud */}
      <span className="sr-only">Done</span>
    </span>
  );
  // Next or still open: the lesson's number in a square outline
  return <span className={`flex size-9 flex-none items-center justify-center border-2 font-display tabular-nums ${mark === "next" ? "border-accent text-accent" : "border-rule text-ink-muted"}`}>{number}</span>;
}

// The page
export function SkillsScreen(props: ScreenProps) {
  // The repository
  const { repo } = useScreenBasics(props);
  // How many times each lesson has been practised, by id
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
      // Each lesson session adds one
      for (const session of sessions) if (session.mode === "lesson") next.set(session.promptId, (next.get(session.promptId) ?? 0) + 1);
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
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Build a skill" section="skills" />
      {/* What this is */}
      <p className="mt-6 max-w-[52ch] text-lede">One skill at a time. Everything here is open, in any order, as often as you like.</p>
      {/* Jump to a part */}
      <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-x-5 text-footnote">
        {/* One link per part */}
        {["lessons", "readings", "pause-drills", "tricky-words"].map((id) => (
          // A jump link
          <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{mode(id).name}</a>
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
                  {marks[index] === "next" && <span className="block text-footnote italic text-accent">Next</span>}
                  {/* Title */}
                  <span className="block font-display text-cue">{lesson.title}</span>
                  {/* The tip's first sentence */}
                  <span className="block text-footnote text-ink-muted">{lesson.tip.split(". ")[0]}.</span>
                  {/* How often practised */}
                  <span className="block text-footnote italic text-ink-muted">{practisedText(counts.get(lesson.id) ?? 0)}</span>
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
