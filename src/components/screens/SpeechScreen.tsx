"use client";
// One full speech: its parts in order, each about a minute, marked done or next, with the next one to read (second design pass, extrapolated from Desktop Screens "CoursePath" and "ReadAloud": "‹ Read aloud", the reading tile in a header card with how far along as a chunky bar, the parts as rows in one card with their marks, the next one marked "Up next", and the chunky band to read it)

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
// Load the shared page shell
import { PAGE } from "@/components/script/layout";
// Load the list page's header and Sage's line
import { BackLink, HubHeader } from "@/components/script/HubHeader";
import { NotFound } from "@/components/script/SageSays";
// Load the reading tile
import { SCENE_TILES } from "@/components/scenes/modeTileFor";
// Load the shared looks
import { CARD_LIST, CHIP, CHIP_GOOD, PBAR, PBAR_FILL } from "@/components/script/textStyles";
import { PRESS, TEXT_LINK } from "@/components/script/Buttons";

// The way back to the readings
const BACK = { href: "/skills#readings", label: "Read aloud" };

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
      <main id="main" className={PAGE}>
        {/* Heading and navigation */}
        <Masthead title="VoiceLab" section="skills" />
        {/* The way back */}
        <BackLink {...BACK} />
        {/* Sage says what happened, with the way back as the one action */}
        <NotFound title="This speech is not in the library." back={{ href: BACK.href, label: "Back to the readings" }} className="mt-4" />
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
    <main id="main" className={`${PAGE} flex flex-col`}>
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="skills" />
      {/* The way back, the reading tile, the speech's name, who gave it and where, and how far along */}
      <HubHeader back={BACK} look={SCENE_TILES["read-aloud"]} title={speech.title} line={`${speech.speaker}. ${speech.occasion}.`}>
        {/* How long, in how many parts, and how far along: a chunky bar counted in parts once one is read */}
        <div className="flex basis-full flex-col gap-2">
          {/* The bar, only once there is something on it (never a row of zeros) */}
          {done > 0 && <span role="progressbar" aria-label="Parts read" aria-valuemin={0} aria-valuemax={speech.parts.length} aria-valuenow={done} className={`${PBAR} max-w-md`}><span className={PBAR_FILL} style={{ width: `${(done / speech.parts.length) * 100}%` }} /></span>}
          {/* The words */}
          <p className="text-footnote font-bold text-ink">{speech.parts.length === 1 ? `One part, ${total}` : `${speech.parts.length} parts, ${total}`}{done === 0 ? "" : done === speech.parts.length ? " · all read" : ` · ${done} read`}</p>
        </div>
      </HubHeader>
      {/* The parts, as rows in one card */}
      <ol aria-label="Parts" className={`mt-5 ${CARD_LIST}`}>
        {/* Each part */}
        {speech.parts.map((part, index) => (
          // One part
          <li key={index}>
            {/* The whole row starts the reading */}
            <Link href={`/session?mode=read&prompt=${ids[index]}`} className={`flex min-h-18 items-center gap-x-4 py-3 hover:text-accent ${PRESS}`}>
              {/* Its mark on the path */}
              <PathMark mark={marks[index] ?? "open"} number={index + 1} />
              {/* Its opening words */}
              <span className="min-w-0 flex-1">
                {/* "Up next" above the part to read next */}
                {marks[index] === "next" && <span className={`${CHIP_GOOD} mb-1`}>Up next</span>}
                {/* The opening words, with what the row does read before them (the visible words stay in the name; WCAG 2.5.3) */}
                <span className={`block leading-snug ${marks[index] === "done" ? "font-semibold text-ink-muted" : "font-bold"}`}><span className="sr-only">Read part {index + 1}: </span>{opening(part)}</span>
              </span>
              {/* How long, as a pill */}
              <span className={`${CHIP} flex-none max-sm:hidden`}>{lengthLabel(readingTime(part))}</span>
            </Link>
          </li>
        ))}
      </ol>
      {/* The short highlight, and where the text comes from */}
      <p className="mt-5 text-footnote font-semibold text-ink-muted">
        {/* The highlight */}
        {highlight && <><Link data-inline href={`/session?mode=read&prompt=${highlight.id}`} className={TEXT_LINK}>Read the short highlight</Link> ({lengthLabel(readingTime(highlight.body))}). </>}
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
