"use client";
// Skills: the lessons and every text to read aloud, in one place (UX round, 2026-10-15; replaces the separate Lessons and Library pages); the next lesson and reading first, then one folded row per group (decision 79)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared page title
import { PageTitle } from "@/components/script/PageTitle";
// Load the whole-row link
import { PRESS, RowLink } from "@/components/script/Buttons";
// Load the chevron that marks a row as tappable
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
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
import { CARD, CARD_LIST, SECTION_HEADING } from "@/components/script/textStyles";
// Load the folded group card
import { FoldCard } from "@/components/script/FoldCard";

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

  // Open the group a link points at (such as /skills#pause-drills), and bring it into view
  useEffect(() => {
    // Open the group named in the address, if any
    const openFromAddress = () => {
      // The group
      const group = document.getElementById(window.location.hash.slice(1));
      // Only a group
      if (!(group instanceof HTMLDetailsElement)) return;
      // Open it
      group.open = true;
      // Into view
      group.scrollIntoView?.({ block: "start" });
    };
    // Now
    openFromAddress();
    // And when the address changes
    window.addEventListener("hashchange", openFromAddress);
    // Stop listening when leaving
    return () => window.removeEventListener("hashchange", openFromAddress);
  }, []);

  // The done and next marks, in lesson order
  const marks = lessonPath(LESSONS.map((lesson) => lesson.id), counts);
  // The lesson to try next (the first not practised, or the first)
  const nextLesson = LESSONS[Math.max(0, marks.indexOf("next"))] ?? LESSONS[0];
  // The next part to read: the first part not yet read of the first whole speech not finished
  const nextReading = FULL_SPEECHES.filter((speech) => !speech.commencement).flatMap((speech) => speech.parts.map((_, index) => ({ speech, part: index + 1 }))).find((item) => (counts.get(partId(item.speech, item.part)) ?? 0) === 0);
  // The groups, each a row that opens its own list (decision 79)
  const groups: ReadonlyArray<{ id: string; name: string; detail: string; count: number; list: React.ReactNode }> = [
    // The lessons as a path
    { id: "lessons", name: "Lessons", detail: `${mode("lessons").subtitle} · ${mode("lessons").length}`, count: LESSONS.length, list: (
      <ol aria-label="Lessons" className={`mt-2 ${CARD_LIST}`}>
        {/* One row per lesson */}
        {LESSONS.map((lesson, index) => (
          // One lesson
          <li key={lesson.id}>
            {/* The whole row starts the lesson */}
            <Link href={`/session?mode=lesson&prompt=${lesson.id}`} aria-label={`Practise ${lesson.title}`} className={`flex min-h-14 items-center gap-x-3 py-2.5 hover:text-accent ${PRESS}`}>
              {/* Its mark */}
              <PathMark mark={marks[index] ?? "open"} number={lesson.number} />
              {/* Title, and how often practised */}
              <span className="min-w-0 flex-1">
                {/* "Next" above the lesson to try next */}
                {marks[index] === "next" && <span className="block text-footnote font-semibold text-accent">Next</span>}
                {/* Title */}
                <span className="block font-semibold leading-snug">{lesson.title}</span>
                {/* How often practised, once it has been */}
                {(counts.get(lesson.id) ?? 0) > 0 && <span className="block text-footnote text-ink-muted">{practisedText(counts.get(lesson.id) ?? 0)}</span>}
              </span>
              {/* The chevron */}
              <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
            </Link>
          </li>
        ))}
      </ol>
    ) },
    // Whole speeches
    { id: "readings", name: "Whole speeches", detail: "a part at a time, about a minute each", count: FULL_SPEECHES.filter((speech) => !speech.commencement).length, list: <FullSpeechList heading="Whole speeches, a part at a time" speeches={FULL_SPEECHES.filter((speech) => !speech.commencement)} counts={counts} /> },
    // Commencement speeches
    { id: "commencement", name: "Commencement speeches", detail: "graduation addresses, a part at a time", count: FULL_SPEECHES.filter((speech) => speech.commencement).length, list: <FullSpeechList heading="Commencement speeches" speeches={FULL_SPEECHES.filter((speech) => speech.commencement)} counts={counts} /> },
    // Short readings
    { id: "short-readings", name: "Short readings", detail: "famous moments, under two minutes", count: PASSAGES.filter((passage) => passage.kind === "speech").length, list: <SpeechCards items={PASSAGES.filter((passage) => passage.kind === "speech")} /> },
    // Practice passages
    { id: "passages", name: "Practice passages", detail: "plain texts for steady reading", count: PASSAGES.filter((passage) => passage.kind === "practice").length, list: <TextList items={PASSAGES.filter((passage) => passage.kind === "practice")} sessionMode="read" /> },
    // Pause drills
    { id: "pause-drills", name: "Pause drills", detail: `${mode("pause-drills").subtitle} · ${mode("pause-drills").length}`, count: PAUSE_DRILLS.length, list: <TextList items={PAUSE_DRILLS} sessionMode="pause" /> },
    // Tricky words
    { id: "tricky-words", name: "Tricky words", detail: `${mode("tricky-words").subtitle} · ${mode("tricky-words").length}`, count: TRICKY_WORDS.length, list: <TextList items={TRICKY_WORDS} sessionMode="read" /> },
  ];
  // Draw the page
  return (
    <main className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Practice" section="skills" />
      {/* The page's name */}
      <PageTitle title="Build a skill" />

      {/* Up next: the next lesson and the next part to read (decision 79) */}
      <section aria-labelledby="up-next" className="mt-6">
        {/* Heading */}
        <h2 id="up-next" className={SECTION_HEADING}>Up next</h2>
        {/* The two */}
        <ul className={`mt-2 ${CARD_LIST}`}>
          {/* The next lesson */}
          {nextLesson && <li><RowLink href={`/session?mode=lesson&prompt=${nextLesson.id}`} meta={mode("lessons").length}><span className="block text-footnote text-ink-muted">Lesson {nextLesson.number}</span><span className="block font-semibold">{nextLesson.title}</span></RowLink></li>}
          {/* The next part to read */}
          {nextReading && <li><RowLink href={`/session?mode=read&prompt=${partId(nextReading.speech, nextReading.part)}`} meta="about 1 min"><span className="block text-footnote text-ink-muted">Read aloud · part {nextReading.part} of {nextReading.speech.parts.length}</span><span className="block font-semibold">{nextReading.speech.title}</span></RowLink></li>}
        </ul>
      </section>

      {/* Everything else, one row per group that opens its own list */}
      <section aria-labelledby="everything" className="mt-8">
        {/* Heading */}
        <h2 id="everything" className={SECTION_HEADING}>Everything</h2>
        {/* The groups */}
        <div className="mt-2 flex flex-col gap-2">
          {/* Each group */}
          {groups.map((group) => (
            // A folded group: its row, then its list once opened
            <FoldCard key={group.id} id={group.id} name={group.name} detail={group.detail} count={group.count}>{group.list}</FoldCard>
          ))}
        </div>
      </section>
    </main>
  );
}
