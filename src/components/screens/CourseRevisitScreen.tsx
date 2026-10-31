"use client";
// A course part's prompt, answered again days later (decision 131): the same question, both answers to play, their first sentences, and what changed on the part's measure

// Load React's effect and reference tools
import { useEffect, useRef } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { ActionBand } from "@/components/script/ActionBand";
import { Player } from "@/components/script/Player";
import { Skeleton } from "@/components/script/Skeleton";
import { CourseLoadFailed } from "@/components/script/CourseLoadFailed";
// Load the shared looks
import { CARD, LABEL } from "@/components/script/textStyles";
import { TEXT_LINK } from "@/components/script/Buttons";
import { PAGE } from "@/components/script/layout";
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

// One answer: play it, when to, and its first sentence
function Answer({ repo, take, label }: { repo: Repository; take: SessionRecord; label: string }) {
  // Its audio, when still kept
  const audio = useAudioUrl(repo, take.audioKey);
  // The row
  return (
    <div className="py-4">
      {/* When */}
      <p className={LABEL}>{label}</p>
      {/* Its first sentence */}
      <p className="mt-1 font-display text-cue">“{firstSentence(take.transcript) || "…"}”</p>
      {/* The player, or why there is none */}
      {audio.url ? <div className="mt-2"><Player src={audio.url} label={label} name={label.toLowerCase()} durationSec={take.durationSec} /></div> : <p className="mt-2 text-footnote text-ink-muted">{audio.missing || !take.audioKey ? "This recording is no longer kept." : "Loading…"}</p>}
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

  // Draw the page
  return (
    <main id="main" className={`${PAGE} flex flex-col`}>
      {/* Title and a way back to Today */}
      <Masthead title="Back again" nav={false} close={{ href: "/", label: "Close, back to Today" }} />
      {/* The page's heading for screen readers and the keyboard, since this state draws no visible one (the masthead carries the title) */}
      {!(data.status === "ready" && place?.part.practice && now && before) && <h1 className="sr-only">Back again</h1>}
      {/* Loading, failed, missing, or the comparison */}
      {data.status === "loading" && <Skeleton blocks={["h-24", "h-56"]} />}
      {data.status === "failed" && <CourseLoadFailed retry={data.retry} />}
      {data.status === "ready" && (!place?.part.practice || !now || !before) && <p className="mt-8 text-lede">These answers could not be found. <Link href="/" className="underline underline-offset-4">Back to Today</Link></p>}
      {data.status === "ready" && place?.part.practice && now && before && (
        <div className="flex flex-1 flex-col">
          {/* Where it comes from */}
          <p className="mt-6 text-footnote text-ink-muted">From {place.course.title}, lesson {place.lessonNumber}: {place.lesson.title}</p>
          {/* The question */}
          <h1 className="mt-1 max-w-[30ch] font-display text-statement tracking-tight">{question ? `“${question}”` : place.part.title}</h1>
          {/* What changed */}
          <p data-revisit-line className="mt-3 max-w-[48ch] font-display text-cue text-accent">{compareLine(place.part.practice.measure, before, now) ?? "Hear both answers side by side."}</p>
          {/* Both answers */}
          <section aria-label="Both answers" className={`mt-5 max-w-2xl divide-y divide-rule px-5 ${CARD}`}>
            {/* The first time */}
            <Answer repo={repo} take={before} label="The first time" />
            {/* Today */}
            <Answer repo={repo} take={now} label="This time" />
          </section>
          {/* The goal it was about */}
          <p className="mt-4 max-w-[52ch] text-footnote text-ink-muted">The goal was: {place.part.practice.goal}</p>
          {/* Push the way on down */}
          <div className="flex-1" />
          {/* Done */}
          <div className="mt-8"><ActionBand action="Done" aside="back to Today" href="/" /></div>
          {/* Or once more */}
          <p className="mt-3 text-center"><Link href={takeHref(place.part, 1, true)!} className={TEXT_LINK}>Answer it once more</Link></p>
        </div>
      )}
    </main>
  );
}
