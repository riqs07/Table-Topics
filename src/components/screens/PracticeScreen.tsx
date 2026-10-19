"use client";
// Practice: every kind of practice in one place, grouped, each row leading to its own screen (today's steps live on Today; decision 48; your talks hidden for now, decision 49; Q&A practice removed, decision 61)

// Load Next.js's link component
import Link from "next/link";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared page title
import { PageTitle } from "@/components/script/PageTitle";
// Load an icon for each kind of practice
import { BookOpenTextIcon, ListNumbersIcon, MegaphoneSimpleIcon, MicrophoneStageIcon, CaretRightIcon, ChatTeardropTextIcon, EarIcon, GraduationCapIcon, LightningIcon, NotePencilIcon, PauseIcon, QuestionIcon, QuotesIcon, SunHorizonIcon, TextAaIcon } from "@phosphor-icons/react/dist/ssr";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load this week's challenge
import { WeeklyChallenge } from "@/components/screens/WeeklyChallenge";
// Load the day's pickers, and the drills
import { PAUSE_DRILLS, TRICKY_WORDS, promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the lessons
import { LESSONS } from "@/content/lessons";
// Load the rule for which comes next
import { nextToPractise } from "@/core/skillNext";
// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the moment note's prompt
import { MOMENT_PROMPT } from "@/content/smallTalk";
// Load the shared heading look
import { SECTION_HEADING, CARD_LIST } from "@/components/script/textStyles";
// Load the shared link look
import { TEXT_LINK } from "@/components/script/Buttons";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

// One kind of practice on the page
interface Way {
  // Its name
  name: string;
  // What it is, in a few words, with its length
  detail: string;
  // Where it starts (none while it cannot start yet)
  href: string | null;
  // Its icon
  icon: Icon;
}

// One row: icon, name and detail, the whole row a link (quiet and not a link while it cannot start)
function WayRow({ way }: { way: Way }) {
  // The words, shared by both forms
  const words = (
    <>
      {/* The icon on a faint tile, as on the course cards */}
      <span aria-hidden="true" className={`flex size-11 flex-none items-center justify-center rounded-[14px] ${way.href ? "bg-warm-tint text-warm-ink" : "bg-paper text-ink-muted"}`}>
        {/* The icon */}
        <way.icon className="size-6" />
      </span>
      {/* Name and detail */}
      <span className="min-w-0 flex-1">
        {/* The name */}
        <span className="block font-display text-xl font-semibold leading-tight tracking-tight">{way.name}</span>
        {/* What it is */}
        <span className="block text-footnote text-ink-muted">{way.detail}</span>
      </span>
    </>
  );
  // A row that starts it, or a quiet row
  return way.href ? (
    <Link href={way.href} className="flex min-h-16 items-center gap-4 py-3 hover:text-accent">
      {/* Icon and words */}
      {words}
      {/* The chevron */}
      <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
    </Link>
  ) : (
    <div className="flex min-h-16 items-center gap-4 py-3 text-ink-muted">{words}</div>
  );
}

// A group of rows under a run-in heading
function Group({ id, title, ways, more }: { id: string; title: string; ways: ReadonlyArray<Way>; more?: { href: string; label: string } }) {
  // The heading (with a link to everything, when there is one), then the rows between rules
  return (
    <section aria-labelledby={id} className="mt-8">
      {/* Heading, and the link to everything */}
      <div className="flex items-baseline justify-between gap-4">
        {/* Run-in heading */}
        <h2 id={id} className={SECTION_HEADING}>{title}</h2>
        {/* Everything in this group */}
        {more && <Link href={more.href} className={`${TEXT_LINK} text-footnote`}>{more.label}</Link>}
      </div>
      {/* The rows */}
      <ul className={`mt-2 ${CARD_LIST}`}>
        {/* Each kind of practice */}
        {ways.map((way) => <li key={way.name}><WayRow way={way} /></li>)}
      </ul>
    </section>
  );
}

// The page
export function PracticeScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);

  // How often each lesson and drill was practised, once read (empty until then, so the rows first lead to the lists)
  const [counts, setCounts] = useState<ReadonlyMap<string, number> | null>(null);

  // Count the lessons, readings and drills practised
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // Count by prompt
      const next = new Map<string, number>();
      // Each lesson, reading or drill adds one
      for (const session of sessions) if (session.mode === "lesson" || session.mode === "read" || session.mode === "pause") next.set(session.promptId, (next.get(session.promptId) ?? 0) + 1);
      // Keep them
      setCounts(next);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // The next lesson, pause drill and tricky-words text (once counted)
  const nextLesson = counts ? LESSONS.find((lesson) => lesson.id === nextToPractise(LESSONS.map((item) => item.id), counts)) : undefined;
  // The next pause drill
  const nextPause = counts ? PAUSE_DRILLS.find((drill) => drill.id === nextToPractise(PAUSE_DRILLS.map((item) => item.id), counts)) : undefined;
  // The next tricky-words text
  const nextTricky = counts ? TRICKY_WORDS.find((drill) => drill.id === nextToPractise(TRICKY_WORDS.map((item) => item.id), counts)) : undefined;

  // Today's Table Topic and prepared-speech task (one along from today's practice, so they differ from its steps)
  const topic = today ? tableTopicForDay(today, 1) : null;
  // The task
  const prompt = today ? promptForDay(today, 1) : null;

  // Draw the page
  return (
    <main className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="practice" />
      {/* The page's name, and how it relates to Today */}
      <PageTitle title="Practice">Anything, in any order. Your steps for the day are on Today.</PageTitle>

      {/* Speaking on the spot */}
      <Group
        id="on-the-spot"
        title="Speak on the spot"
        ways={[
          // A Table Topic
          { name: "Table Topic", detail: "A surprise question, 1 to 2 minutes", href: topic ? `/session?mode=talk&prompt=${topic.id}` : null, icon: LightningIcon },
          // A prepared speech
          { name: "Prepared speech", detail: "Plan for 2 minutes, speak for 2 to 4", href: prompt ? `/session?mode=response&prompt=${prompt.id}` : null, icon: NotePencilIcon },
          // Openings and closings
          { name: "Openings and closings", detail: "The first or last 45 seconds, 1 min", href: "/bookends", icon: QuotesIcon },
          // Free talk: anything, as long as you like (decision 73)
          { name: "Free talk", detail: "Talk about anything, as long as you like", href: "/session?mode=free&prompt=free", icon: MicrophoneStageIcon },
          // A short speech the user plans: topic and points (decision 73)
          { name: "Short speech", detail: "Your topic and a few points, then speak", href: "/practice/outline", icon: ListNumbersIcon },
        ]}
      />

      {/* Everyday conversation */}
      <Group
        id="conversation"
        title="Everyday conversation"
        ways={[
          // Answering
          { name: "Answering", detail: "“How was your weekend?” with a short story", href: "/small-talk/unit?id=answering", icon: ChatTeardropTextIcon },
          // Asking
          { name: "Asking", detail: "Hear something, ask one good follow-up", href: "/small-talk/unit?id=asking", icon: QuestionIcon },
          // Listening
          { name: "Listening", detail: "Hear a short story, respond so they feel heard", href: "/small-talk/unit?id=listening", icon: EarIcon },
          // Responding to news
          { name: "Responding to news", detail: "Good or bad news: react, ask, no buts", href: "/small-talk/unit?id=news", icon: MegaphoneSimpleIcon },
          // One moment a day
          { name: "One moment a day", detail: "A private note of something worth telling", href: `/session?mode=moment&prompt=${MOMENT_PROMPT.id}`, icon: SunHorizonIcon },
        ]}
      />

      {/* Building one skill */}
      <Group
        id="skills"
        title="Build a skill"
        more={{ href: "/skills", label: "See all" }}
        ways={[
          // Lessons: straight into the next one (decision 67)
          { name: "Lessons", detail: nextLesson ? `Next: ${nextLesson.title}` : "One practical tip each, 2 to 3 min", href: nextLesson ? `/session?mode=lesson&prompt=${nextLesson.id}` : "/skills#lessons", icon: GraduationCapIcon },
          // Readings
          { name: "Read aloud", detail: "Famous speeches and passages", href: "/skills#readings", icon: BookOpenTextIcon },
          // Pause drills: straight into the next one
          { name: "Pause drills", detail: nextPause ? `Next: ${nextPause.title}` : "Pause where the text is marked, 1 min", href: nextPause ? `/session?mode=pause&prompt=${nextPause.id}` : "/skills#pause-drills", icon: PauseIcon },
          // Tricky words: straight into the next one
          { name: "Tricky words", detail: nextTricky ? `Next: ${nextTricky.title}` : "Crisp consonants, 1 min", href: nextTricky ? `/session?mode=read&prompt=${nextTricky.id}` : "/skills#tricky-words", icon: TextAaIcon },
        ]}
      />

      {/* This week's challenge off the page */}
      {today && <WeeklyChallenge repo={repo} today={today} />}
    </main>
  );
}
