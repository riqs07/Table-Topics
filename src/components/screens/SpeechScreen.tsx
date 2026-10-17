"use client";
// One full speech: its parts in order, each about two minutes or less, marked done or next, with the next one to read

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
import { PathMark } from "@/components/script/PathMark";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the speech lookups
import { findSpeech, partId } from "@/content/readings";
// Load the highlight lookup
import { findPassage } from "@/content/prompts";
// Load the done and next marks
import { lessonPath } from "@/core/lessonPath";
// Load the reading-length helpers
import { lengthLabel, readingTime } from "@/core/readingLength";

// The first few words of a part, so each row can be told apart
function opening(part: string): string {
  // The first twelve words
  const words = part.split(/\s+/);
  // With an ellipsis if there are more
  return words.length > 12 ? `${words.slice(0, 12).join(" ")}…` : part;
}

// Draw the speech's page
export function SpeechScreen({ speechId, ...props }: ScreenProps & { speechId: string }) {
  // The repository
  const { repo } = useScreenBasics(props);
  // How many times each part has been read, by part id
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(new Map());
  // The speech
  const speech = findSpeech(speechId);

  // Count the readings of each part once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // Count readings per text
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

  // An unknown speech
  if (!speech) {
    // Say so, with a way back
    return (
      <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
        {/* Heading and navigation */}
        <Masthead title="Speech" section="skills" />
        {/* The explanation */}
        <p data-inline className="mt-6 text-lede text-ink-muted">This speech is not in the library. <Link href="/skills#readings" className="underline underline-offset-4">Back to the readings</Link></p>
      </main>
    );
  }

  // Each part's id
  const ids = speech.parts.map((_, index) => partId(speech, index + 1));
  // Done and next marks
  const marks = lessonPath(ids, counts);
  // How many parts have been read
  const done = marks.filter((mark) => mark === "done").length;
  // The part to read next (the first not yet read, or the first again when all are done)
  const nextIndex = Math.max(0, marks.indexOf("next"));
  // The whole speech's length
  const total = lengthLabel(readingTime(speech.parts.join(" ")));
  // Its short highlight, if any
  const highlight = speech.highlight ? findPassage(speech.highlight) : undefined;

  // Draw the page
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title={speech.title} section="skills" />
      {/* Who, where and when */}
      <p className="mt-6 text-lede">{speech.speaker}. {speech.occasion}.</p>
      {/* How long, in how many parts, and how far along */}
      <p className="mt-2 text-footnote italic text-ink-muted">{speech.parts.length === 1 ? `One part, ${total}.` : `${speech.parts.length} parts, ${total} in all.`} {done === 0 ? "Read a part at a time, in order." : done === speech.parts.length ? "You have read the whole speech." : `You have read ${done} of ${speech.parts.length}.`}</p>
      {/* The parts */}
      <ol aria-label="Parts" className="mt-6">
        {/* Each part */}
        {speech.parts.map((part, index) => (
          // One part, joined to the next by a line
          <li key={index} className="relative">
            {/* The line to the next part (not after the last) */}
            {index < speech.parts.length - 1 && <span aria-hidden="true" className="absolute top-14 bottom-0 left-[17px] w-0.5 bg-rule" />}
            {/* The whole row starts the reading */}
            <Link href={`/session?mode=read&prompt=${ids[index]}`} aria-label={`Read part ${index + 1}`} className="relative flex items-start gap-x-4 py-4 hover:text-accent">
              {/* Its mark on the path */}
              <PathMark mark={marks[index] ?? "open"} number={index + 1} />
              {/* Its opening words and length */}
              <span className="min-w-0 flex-1">
                {/* "Next" above the part to read next */}
                {marks[index] === "next" && <span className="block text-footnote italic text-accent">Next</span>}
                {/* The opening words */}
                <span className="block text-lede">{opening(part)}</span>
                {/* How long */}
                <span className="block text-footnote italic text-ink-muted">{lengthLabel(readingTime(part))}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {/* The short highlight, and where the text comes from */}
      <p className="mt-6 mb-6 border-t border-rule pt-3 text-footnote text-ink-muted">
        {/* The highlight */}
        {highlight && <><Link data-inline href={`/session?mode=read&prompt=${highlight.id}`} className="underline underline-offset-4">Read the short highlight</Link> ({lengthLabel(readingTime(highlight.body))}). </>}
        {/* The source */}
        Text: {speech.textNote}. Public domain.
      </p>
      {/* Push the action down */}
      <div className="flex-1" />
      {/* Read the next part */}
      <ActionBand action={done === speech.parts.length ? "Read it again" : `Read part ${nextIndex + 1}`} aside={lengthLabel(readingTime(speech.parts[nextIndex] ?? ""))} href={`/session?mode=read&prompt=${ids[nextIndex]}`} />
    </main>
  );
}
