"use client";
// The Small talk page: the recipe, the lessons, the everyday questions, and your recent answers (kept apart from the speech practice)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the chevron for lesson rows
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { RowLink } from "@/components/script/Buttons";
import { Masthead } from "@/components/script/Masthead";
import { PathMark } from "@/components/script/PathMark";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the small-talk content
import { BEATS, QUESTION_GROUPS, SMALL_TALK_LESSONS, SMALL_TALK_QUESTIONS, findSmallTalk, smallTalkForDay } from "@/content/smallTalk";
// Load the beat counter
import { beatCount } from "@/core/smallTalk";
// Load the done and next marks for a path of lessons
import { lessonPath } from "@/core/lessonPath";
// Load the day label
import { dayLabel } from "@/core/copy";
// Load the record type
import type { SessionRecord } from "@/data/records";

// How many recent answers to list
const RECENT_ANSWERS = 10;

// The address that starts an answer to a prompt (an everyday question or a lesson's turn)
const answerHref = (promptId: string) => `/session?mode=smalltalk&prompt=${promptId}`;

// Draw the Small talk page
export function SmallTalkScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // The user's small-talk answers, newest first (null while loading)
  const [answers, setAnswers] = useState<SessionRecord[] | null>(null);
  // How many questions along from today's ("another question" adds one)
  const [offset, setOffset] = useState(0);

  // Load the answers once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions and keep the small-talk ones
    repo.listSessions().then((sessions) => {
      // Keep them if still open
      if (!cancelled) setAnswers(sessions.filter((session) => session.mode === "smalltalk"));
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // How often each lesson has been answered
  const counts = new Map<string, number>();
  // Count each answer to a lesson
  for (const answer of answers ?? []) counts.set(answer.promptId, (counts.get(answer.promptId) ?? 0) + 1);
  // The done and next marks, in lesson order
  const marks = lessonPath(SMALL_TALK_LESSONS.map((lesson) => lesson.id), counts);
  // The first lesson not yet done (none once all are)
  const nextLesson = SMALL_TALK_LESSONS[marks.indexOf("next")];
  // Today's everyday question
  const question = today ? smallTalkForDay(today, offset) : null;

  // Draw the page
  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Small talk" section="smalltalk" />
      {/* What this is for */}
      <h1 className="mt-8 font-display text-prompt tracking-tight md:text-prompt-xl">Say more than &ldquo;good.&rdquo;</h1>
      {/* How it works */}
      <p className="mt-3 max-w-[52ch] text-lede">Practise answering everyday questions with one short story. A voice asks, you answer in 20 to 45 seconds, then you hear yourself back.</p>

      {/* Today's question, with a way to get another */}
      {question && (
        <section aria-label="Answer a question" className="mt-6 border-y border-ink py-4">
          {/* Small heading */}
          <p className="text-footnote italic text-ink-muted">A question for you</p>
          {/* The question */}
          <p className="mt-1 font-display text-cue">{question.text}</p>
          {/* Answer it, or move along */}
          <p className="mt-2 flex flex-wrap gap-x-4">
            {/* Answer */}
            <Link href={answerHref(question.id)} className="inline-flex min-h-11 items-center underline underline-offset-4">Answer it</Link>
            {/* Another */}
            <button type="button" onClick={() => setOffset(offset + 1)} className="inline-flex min-h-11 items-center italic text-ink-muted underline underline-offset-4">or another question</button>
          </p>
        </section>
      )}

      {/* The recipe, taught on the page itself */}
      <section aria-labelledby="recipe" className="mt-10">
        {/* Run-in heading */}
        <h2 id="recipe" className="italic">A good answer, in four beats</h2>
        {/* The beats */}
        <ol className="mt-3 divide-y divide-rule border-y border-rule">
          {/* Each beat */}
          {BEATS.map((beat, index) => (
            // One beat: its name, what it means, and why it works
            <li key={beat.id} className="flex gap-4 py-3">
              {/* Its number */}
              <span aria-hidden="true" className="w-5 flex-none font-display text-cue text-accent">{index + 1}</span>
              {/* Its words */}
              <span>
                {/* Name and reminder */}
                <span className="block"><strong className="font-display text-cue font-normal">{beat.name}.</strong> {beat.reminder}</span>
                {/* Why it works */}
                <span className="mt-1 block text-footnote italic text-ink-muted">{beat.why}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* The lessons, as a path */}
      <section aria-labelledby="lessons" className="mt-10">
        {/* Run-in heading */}
        <h2 id="lessons" className="italic">Lessons</h2>
        {/* The path */}
        <ol className="mt-2">
          {/* One row per lesson */}
          {SMALL_TALK_LESSONS.map((lesson, index) => (
            // One lesson, joined to the next by a line down the path
            <li key={lesson.id} className="relative">
              {/* The line to the next lesson (not after the last) */}
              {index < SMALL_TALK_LESSONS.length - 1 && <span aria-hidden="true" className="absolute top-14 bottom-0 left-[17px] w-0.5 bg-rule" />}
              {/* The whole row starts the lesson */}
              <Link href={answerHref(lesson.id)} aria-label={`Lesson ${lesson.number}: ${lesson.title}`} className="relative flex items-start gap-x-4 py-3 hover:text-accent">
                {/* Its mark on the path */}
                <PathMark mark={marks[index] ?? "open"} number={lesson.number} />
                {/* Title and idea */}
                <span className="min-w-0 flex-1">
                  {/* "Next" above the lesson to do next */}
                  {marks[index] === "next" && <span className="block text-footnote italic text-accent">Next</span>}
                  {/* Title */}
                  <span className="block font-display text-cue">{lesson.title}</span>
                  {/* The idea's first sentence */}
                  <span className="block text-footnote text-ink-muted">{lesson.idea.split(". ")[0]?.replace(/\.$/, "")}.</span>
                </span>
                {/* The chevron */}
                <CaretRightIcon aria-hidden="true" className="size-5 flex-none self-center text-ink-muted" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Every everyday question, by group */}
      <section aria-labelledby="questions" className="mt-10">
        {/* Run-in heading */}
        <h2 id="questions" className="italic">Everyday questions</h2>
        {/* Each group, folded */}
        {QUESTION_GROUPS.map((group) => (
          // One group
          <details key={group.id} className="border-b border-rule">
            {/* Its name and size */}
            <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 font-display text-cue">
              {/* Name */}
              {group.name}
              {/* How many */}
              <span className="font-body text-footnote italic text-ink-muted">{SMALL_TALK_QUESTIONS.filter((item) => item.group === group.id).length} questions</span>
            </summary>
            {/* Its questions */}
            <ul className="divide-y divide-rule border-t border-rule">
              {/* Each question */}
              {SMALL_TALK_QUESTIONS.filter((item) => item.group === group.id).map((item) => (
                // One question, answered by tapping it
                <li key={item.id}><RowLink href={answerHref(item.id)}>{item.text}</RowLink></li>
              ))}
            </ul>
          </details>
        ))}
      </section>

      {/* The user's recent answers */}
      {answers && answers.length > 0 && today && (
        <section aria-labelledby="your-answers" className="mt-10 mb-6">
          {/* Run-in heading */}
          <h2 id="your-answers" className="italic">Your answers</h2>
          {/* The most recent */}
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {/* Each answer */}
            {answers.slice(0, RECENT_ANSWERS).map((answer) => (
              // One answer: its question, day, and beats
              <li key={answer.id}><RowLink href={`/sessions?id=${answer.id}`} meta={`${beatCount(answer)} of 4`}>{findSmallTalk(answer.promptId)?.question ?? "A question"} <span className="block text-footnote italic text-ink-muted">{dayLabel(new Date(answer.createdAt), today)}</span></RowLink></li>
            ))}
          </ul>
        </section>
      )}

      {/* The main action: the next lesson, or today's question once the lessons are done */}
      {nextLesson ? (
        <ActionBand action={`Lesson ${nextLesson.number}`} aside={nextLesson.title} href={answerHref(nextLesson.id)} />
      ) : (
        question && <ActionBand action="Answer a question" aside={question.text} href={answerHref(question.id)} />
      )}
    </main>
  );
}
