"use client";
// Practice (second design pass, Desktop Screens "Practice" and storyboard 12): the title with the blob; one quick start, Rapid Fire on the sky with a Go; "What do you want to work on?" as four jobs with pictures (Speak on the spot, Tell stories, Conversations, Your voice; the focus's first and marked, decision 97), each opening its list of ways; the role plays as small tile cards with "All"; then this week's challenge off the page. Today's steps live on Today (decision 48); the weekly check-in comes to Today on its day (decision 100); the courses have their own tab (decision 148)

// Load the page fade round a glide (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
// Load Next.js's link component
import Link from "next/link";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load this week's challenge
import { WeeklyChallenge } from "@/components/screens/WeeklyChallenge";
// Load every way to practise, grouped into jobs
import { jobHref, jobLine, usePracticeWays } from "@/components/screens/usePracticeWays";
// Load the shared heading look
import { SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared link look
import { TEXT_LINK } from "@/components/script/Buttons";
// Load the quick start band and the picture cards
import { PictureCard, QuickStart } from "@/components/script/WayCard";
// Load the tile cards for the role plays
import { TileRow } from "@/components/script/TileRow";
// Load the blob
import { Buddy } from "@/components/scenes/Buddy";
// Load the mode tile's look type
import type { ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the people to talk with, the scenes and the stories to listen to, for their counts
import { PERSONAS } from "@/content/conversations";
import { SCENES } from "@/content/scenes";
import { LISTEN_STORIES } from "@/content/listening";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

// The role plays shown as cards: four of the role-play list's ways, each with its own tile and a short line
const ROLE_CARDS: ReadonlyArray<{ name: string; line: string; look: ModeTileLook }> = [
  // A whole conversation
  { name: "Talk with someone", line: `${PERSONAS.length} people, out loud`, look: { ground: "bloom", prop: "chat", face: "ready" } },
  // Scenes
  { name: "Scenes", line: `${SCENES.length} scenes`, look: { ground: "plum", prop: "door", face: "wonder" } },
  // Listening
  { name: "Active listening", line: `${LISTEN_STORIES.length} stories`, look: { ground: "sky", prop: "ear", face: "ready" } },
  // Quick scenarios
  { name: "Quick scenarios", line: "Choose, then say it", look: { ground: "coral", prop: "q", face: "wonder" } },
];

// The page
export function PracticeScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // Every way to practise, grouped
  const { jobs, rolePlay, quickStart } = usePracticeWays(repo, today);
  // The role-play cards, matched to their ways
  const roleCards = ROLE_CARDS.flatMap((card) => {
    // Its way in the list
    const way = rolePlay.ways.find((item) => item.name === card.name);
    // Shown only when it can start
    return way?.href ? [{ ...card, href: way.href }] : [];
  });

  // Draw the page
  return (
    <PageFade>
      <main id="main" className={PAGE}>
        {/* Heading and navigation */}
        <Masthead title="VoiceLab" section="practice" />
        {/* The page's name and what is here, with the blob beside it on a computer */}
        <div data-wide className="mt-4 flex items-center justify-between gap-4 md:-mt-12">
          {/* The words */}
          <div className="flex flex-col gap-1">
            {/* The page's name */}
            <h1 className="font-display text-statement leading-none font-semibold motion-safe:animate-rise">Practice</h1>
            {/* One short line */}
            <p className="font-bold text-ink-muted">Every way to practise, a tap away.</p>
          </div>
          {/* The blob, ready */}
          <Buddy face="ready" className="hidden size-18 flex-none md:block" />
        </div>

        {/* The quick start: a surprise question */}
        <div data-wide className="mt-5 md:mt-8">
          <QuickStart way={quickStart} label="Quick start · 1–2 min" title="Rapid Fire: a surprise question" line="Your topic stays hidden until you start." />
        </div>

        {/* The four jobs, the focus's first */}
        <section aria-labelledby="jobs" data-wide className="mt-7 md:mt-8">
          {/* Heading */}
          <h2 id="jobs" className={SECTION_HEADING}>What do you want to work on?</h2>
          {/* The cards, two across on a phone and four on a computer */}
          <ul aria-label="Jobs" className="mt-3 grid grid-cols-2 gap-3.5 md:mt-4 md:grid-cols-4 md:gap-5">
            {/* Each job, opening its list of ways */}
            {jobs.map((job, index) => <li key={job.id}><PictureCard href={jobHref(job.id)} name={job.title} line={jobLine(job).count} more={jobLine(job).names} look={job.look} tilt={index % 2 ? 4 : -4} chip={job.focus ? "Your focus" : undefined} delay={index * 70} /></li>)}
          </ul>
        </section>

        {/* The role plays */}
        <section aria-labelledby="role-play" data-wide className="mt-7 md:mt-8">
          {/* Heading, and every role play */}
          <div className="flex items-baseline justify-between gap-4">
            {/* Heading */}
            <h2 id="role-play" className={SECTION_HEADING}>Role play</h2>
            {/* All of them, on their own list */}
            <Link href={jobHref("role-play")} className={`${TEXT_LINK} text-footnote`}>All {rolePlay.ways.length}{" "}<span className="sr-only">role plays</span></Link>
          </div>
          {/* The cards */}
          <ul aria-label="Role plays" className="mt-3 grid grid-cols-2 gap-3.5 md:mt-4 md:gap-4.5 lg:grid-cols-4">
            {/* Each one */}
            {roleCards.map((card, index) => <li key={card.name}><TileRow small href={card.href} label={card.name} title={card.name} detail={card.line} ground={card.look.ground} prop={card.look.prop} face={card.look.face} tilt={index % 2 ? 4 : -4} /></li>)}
          </ul>
        </section>

        {/* This week's challenge off the page */}
        {today && <WeeklyChallenge repo={repo} today={today} />}
      </main>
    </PageFade>
  );
}
