"use client";
// A course part's prompt, answered again days later (decision 131): the same question, both answers to play, their first sentences, and what changed on the part's measure. Second design pass: focus mode (the cross and the step's label), the question and both answers on a card in the main column, and on the right the green panel of a result (your blob pleased, what changed, the goal, Done), as on Desktop Screens "Result"

// Load React's effect and reference tools
import { useEffect, useRef } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Player } from "@/components/script/Player";
import { Skeleton } from "@/components/script/Skeleton";
import { CourseLoadFailed } from "@/components/script/CourseLoadFailed";
// Load the focus-mode bar and its page layouts (second design pass)
import { PRACTICE_BODY, PRACTICE_COLUMNS, PRACTICE_MAIN, PracticeBar } from "@/components/script/PracticeBar";
// Load the shared looks
import { CARD, LAB } from "@/components/script/textStyles";
import { PRIMARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the course data, the audio loader and the tab title helper
import { useCourseData } from "@/components/screens/useCourseData";
import { useAudioUrl } from "@/components/screens/useAudioUrl";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the course rules
import { compareLine, findPart, practicePromptText, takeHref } from "@/core/courses";
// Load progress saving
import { markRevisited } from "@/data/courses";
// Load the record and repository types
import type { SessionRecord } from "@/data/records";
import type { Repository } from "@/data/repository";

// A take's first sentence, for reading side by side
export function firstSentence(transcript: string): string {
  // Up to the first full stop, question or exclamation mark, or the first twenty words
  const sentence = transcript.trim().split(/(?<=[.!?])\s/)[0] ?? "";
  // The words
  const words = sentence.split(/\s+/).filter(Boolean);
  // Cut long ones short
  return words.length > 20 ? `${words.slice(0, 20).join(" ")}…` : sentence;
}

// One answer: when, its first sentence, and the player
function Answer({ repo, take, label }: { repo: Repository; take: SessionRecord; label: string }) {
  // Its audio, when still kept
  const audio = useAudioUrl(repo, take.audioKey);
  // The row
  return (
    <div className="py-4">
      {/* When */}
      <p className={LAB}>{label}</p>
      {/* Its first sentence */}
      <p className="mt-1 font-display text-cue leading-snug font-semibold">“{firstSentence(take.transcript) || "…"}”</p>
      {/* The player, or why there is none */}
      {audio.url ? <div className="mt-2"><Player src={audio.url} label={label} name={label.toLowerCase()} durationSec={take.durationSec} /></div> : <p className="mt-2 text-footnote font-bold text-ink-muted">{audio.missing || !take.audioKey ? "This recording is no longer kept." : "Loading…"}</p>}
    </div>
  );
}

// Draw the comparison
export function CourseRevisitScreen({ partId, takeId, ...props }: ScreenProps & { partId: string; takeId: string }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // The part
  const place = findPart(partId);
  // Name the tab
  usePageTitle("Back again");
  // Progress and takes
  const data = useCourseData(repo, today);
  // The answer made now and the one it is compared with
  const now = data.status === "ready" ? data.takes.find((take) => take.id === takeId) : undefined;
  // The earlier one: the part's take when it was finished
  const before = data.status === "ready" ? data.takes.find((take) => take.id === data.progress[partId]?.takeId) : undefined;
  // Marked once
  const marked = useRef(false);
  // Mark the comeback done once both are found
  useEffect(() => {
    // Not yet, or already
    if (!now || !before || marked.current) return;
    // Once
    marked.current = true;
    // Saved (a failure leaves it due; the comparison still shows)
    void markRevisited(repo, partId, now.id, new Date()).catch(() => {});
  }, [before, now, partId, repo]);
  // The question
  const question = place?.part.practice ? practicePromptText(place.part.practice) : undefined;
  // Whether there is a comparison to show
  const found = data.status === "ready" && !!place?.part.practice && !!now && !!before;

  // Draw the page
  return (
    <main id="main" className={PRACTICE_MAIN}>
      {/* The bar: the way back to Today, and what this is */}
      <PracticeBar close={{ href: "/", label: "Close, back to Today" }} label={place ? `Back again · ${place.course.title}` : "Back again"} />
      {/* The page's heading for screen readers while there is no comparison to head it */}
      {!found && data.status !== "ready" && <h1 className="sr-only">Back again</h1>}
      <div className={PRACTICE_BODY}>
        {/* Loading */}
        {data.status === "loading" && <Skeleton blocks={["h-24", "h-56"]} />}
        {/* Could not be read */}
        {data.status === "failed" && <CourseLoadFailed retry={data.retry} />}
        {/* Missing: your blob puzzled, and the way back */}
        {data.status === "ready" && !found && (
          <section className={`mx-auto mt-6 flex max-w-xl flex-col items-center gap-4 px-6 py-10 text-center ${CARD}`}>
            {/* Your blob, puzzled */}
            <Cast who="you" face="wonder" className="size-28" />
            {/* The page's heading */}
            <h1 className="font-display text-statement leading-tight font-semibold">Back again</h1>
            {/* What happened */}
            <p className="font-bold text-ink-muted">These answers could not be found.</p>
            {/* The way back */}
            <Link href="/" className={PRIMARY}>Back to Today</Link>
          </section>
        )}
        {/* The comparison */}
        {found && place?.part.practice && now && before && (
          <div className={PRACTICE_COLUMNS}>
            {/* The question and both answers */}
            <div className="flex min-w-0 flex-col gap-5">
              {/* Where it comes from */}
              <p className={LAB}>From {place.course.title}, lesson {place.lessonNumber}: {place.lesson.title}</p>
              {/* The question */}
              <h1 className="-mt-3 max-w-[30ch] font-display text-statement leading-tight font-semibold">{question ? `“${question}”` : place.part.title}</h1>
              {/* Both answers */}
              <section aria-label="Both answers" className={`divide-y-2 divide-rule px-5 ${CARD}`}>
                {/* The first time */}
                <Answer repo={repo} take={before} label="The first time" />
                {/* Today */}
                <Answer repo={repo} take={now} label="This time" />
              </section>
            </div>
            {/* The green panel: what changed, the goal and the way on (first on a phone) */}
            <section aria-label="What changed" className="order-first flex flex-col gap-3 rounded-[28px] bg-accent-tint p-6 text-accent-tint-ink lg:order-none">
              {/* Your blob, pleased */}
              <Cast who="you" face="happy" className="size-20" />
              {/* What changed */}
              <p data-revisit-line className="font-display text-2xl leading-tight font-semibold">{compareLine(place.part.practice.measure, before, now) ?? "Hear both answers side by side."}</p>
              {/* The goal it was about */}
              <p className="font-bold">The goal was: {place.part.practice.goal}</p>
              {/* Done */}
              <div className="md:[&>a]:mt-3 md:[&>a]:mb-1"><ActionBand action="Done" aside="back to Today" href="/" /></div>
              {/* Or once more */}
              <p className="text-center"><Link href={takeHref(place.part, 1, true)!} className={TEXT_LINK}>Answer it once more</Link></p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
