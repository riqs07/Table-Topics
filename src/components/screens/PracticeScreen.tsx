"use client";
// Practice: every kind of practice in one place, grouped, each row leading to its own screen (today's steps live on Today; decision 48; your talks hidden for now, decision 49)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load an icon for each kind of practice
import { BookOpenTextIcon, MegaphoneSimpleIcon, CaretRightIcon, ChatTeardropTextIcon, ChatsCircleIcon, EarIcon, GraduationCapIcon, LightningIcon, NotePencilIcon, PauseIcon, QuestionIcon, QuotesIcon, SunHorizonIcon, TextAaIcon } from "@phosphor-icons/react/dist/ssr";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load this week's challenge
import { WeeklyChallenge } from "@/components/screens/WeeklyChallenge";
// Load the day's pickers
import { promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the moment note's prompt
import { MOMENT_PROMPT } from "@/content/smallTalk";

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
      {/* The icon */}
      <way.icon aria-hidden="true" className={`size-7 flex-none ${way.href ? "text-accent" : "text-ink-muted"}`} />
      {/* Name and detail */}
      <span className="min-w-0 flex-1">
        {/* The name */}
        <span className="block font-display text-cue leading-tight">{way.name}</span>
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
function Group({ id, title, ways }: { id: string; title: string; ways: ReadonlyArray<Way> }) {
  // The heading, then the rows between rules
  return (
    <section aria-labelledby={id} className="mt-8">
      {/* Run-in heading */}
      <h2 id={id} className="italic">{title}</h2>
      {/* The rows */}
      <ul className="mt-2 divide-y divide-rule border-y border-rule">
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
  // The newest rehearsal or prepared speech, for Q&A (undefined while loading)
  const [qaFrom, setQaFrom] = useState<string | null | undefined>(undefined);

  // Find the newest rehearsal or prepared speech
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions (newest first)
    repo.listSessions().then((sessions) => {
      // Keep the newest that Q&A can follow
      if (!cancelled) setQaFrom(sessions.find((session) => session.mode === "rehearse" || session.mode === "response")?.id ?? null);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // Today's Table Topic and prepared-speech task (one along from today's practice, so they differ from its steps)
  const topic = today ? tableTopicForDay(today, 1) : null;
  // The task
  const prompt = today ? promptForDay(today, 1) : null;

  // Draw the page
  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Practice" section="practice" />
      {/* What this page is */}
      <h1 className="mt-6 font-display text-statement tracking-tight">Pick anything to practise.</h1>
      {/* How it relates to Today */}
      <p className="mt-2 max-w-[52ch] text-lede text-ink-muted">Today has your steps for the day. Everything here is open, in any order, as often as you like.</p>

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
          // Q&A, once there is something to ask about
          { name: "Q&A practice", detail: qaFrom === null ? "Opens after a prepared speech" : "Answer the questions your latest run would get", href: qaFrom ? `/qa?from=${qaFrom}` : null, icon: ChatsCircleIcon },
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
        ways={[
          // Lessons
          { name: "Lessons", detail: "One practical tip each, 2 to 3 min", href: "/skills#lessons", icon: GraduationCapIcon },
          // Readings
          { name: "Read aloud", detail: "Famous speeches and passages", href: "/skills#readings", icon: BookOpenTextIcon },
          // Pause drills
          { name: "Pause drills", detail: "Pause where the text is marked, 1 min", href: "/skills#pause-drills", icon: PauseIcon },
          // Tricky words
          { name: "Tricky words", detail: "Crisp consonants, 1 min", href: "/skills#tricky-words", icon: TextAaIcon },
        ]}
      />

      {/* This week's challenge off the page */}
      {today && <WeeklyChallenge repo={repo} today={today} />}
    </main>
  );
}
