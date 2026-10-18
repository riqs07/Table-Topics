"use client";
// The Small talk page: three units (answering, asking, listening), each with its recipe, lessons and practice, plus moments and your recent answers (kept apart from the speech practice)

// Load React's state, effect and external-store tools
import { useEffect, useState, useSyncExternalStore } from "react";
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
import { ASKING_DRILLS, MOMENT_PROMPT, QUESTION_GROUPS, SMALL_TALK_LESSONS, SMALL_TALK_QUESTIONS, UNITS, drillForDay, findSmallTalk, lessonsFor, type UnitId } from "@/content/smallTalk";
// Load the beat counter
import { beatCount } from "@/core/smallTalk";
// Load the done and next marks for a path of lessons
import { lessonPath } from "@/core/lessonPath";
// Load the day label
import { dayLabel } from "@/core/copy";
// Load the calendar-day key
import { dayKey } from "@/core/dates";
// Load the record type
import type { SessionRecord } from "@/data/records";

// How many recent answers to list
const RECENT_ANSWERS = 10;
// How many recent moments to list
const RECENT_MOMENTS = 5;

// The address that starts an answer to a prompt (an everyday question or a lesson's turn)
const answerHref = (promptId: string) => `/session?mode=smalltalk&prompt=${promptId}`;

// Listen for the address's # changing
function subscribeToHash(changed: () => void): () => void {
  // Listen
  window.addEventListener("hashchange", changed);
  // Stop listening
  return () => window.removeEventListener("hashchange", changed);
}

// Draw the Small talk page
export function SmallTalkScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // The user's small-talk answers, newest first (null while loading)
  const [answers, setAnswers] = useState<SessionRecord[] | null>(null);
  // The user's moment notes, newest first
  const [moments, setMoments] = useState<SessionRecord[]>([]);
  // How many drills along from today's ("another" adds one)
  const [offset, setOffset] = useState(0);
  // The unit chosen (null until the user picks one: then the one in the address, or the unit of the next lesson)
  const [picked, setPicked] = useState<UnitId | null>(null);

  // A unit named in the address (such as /small-talk#asking), read in the browser
  const named = useSyncExternalStore(subscribeToHash, () => window.location.hash.slice(1), () => "");

  // Load the answers once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions and keep the small-talk ones
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // The answers
      setAnswers(sessions.filter((session) => session.mode === "smalltalk"));
      // The moments
      setMoments(sessions.filter((session) => session.mode === "moment"));
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
  // The first lesson not yet done, across the units in order (none once all are)
  const firstOpen = SMALL_TALK_LESSONS.find((lesson) => !counts.has(lesson.id));
  // The unit showing: the one picked, or the one in the address, or the first open lesson's
  const unit = UNITS.find((item) => item.id === picked) ?? UNITS.find((item) => item.id === named) ?? UNITS.find((item) => item.id === (firstOpen?.unit ?? "answering")) ?? UNITS[0]!;
  // The showing unit's next lesson (none once its lessons are done)
  const nextLesson = lessonsFor(unit.id).find((lesson) => !counts.has(lesson.id));
  // Its lessons
  const lessons = lessonsFor(unit.id);
  // Their done and next marks, in order
  const marks = lessonPath(lessons.map((lesson) => lesson.id), counts);
  // Today's drill in this unit
  const question = today ? drillForDay(unit.id, today, offset) : null;

  // Draw the page
  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Small talk" section="smalltalk" />
      {/* What this is for */}
      <h1 className="mt-8 font-display text-prompt tracking-tight md:text-prompt-xl">Say more than &ldquo;good.&rdquo;</h1>
      {/* How it works */}
      <p className="mt-3 max-w-[52ch] text-lede">Practise everyday conversation out loud: answering with one short story, asking a good follow-up, and listening so people feel heard. A voice speaks, you reply, then you hear yourself back.</p>

      {/* The units, one showing at a time */}
      <div role="group" aria-label="Units" className="mt-6 grid grid-cols-3 border-y border-ink">
        {/* Each unit */}
        {UNITS.map((item) => (
          // One unit's switch
          <button key={item.id} type="button" aria-pressed={item.id === unit.id} onClick={() => { setPicked(item.id); setOffset(0); }} className={`min-h-12 px-1 py-2 font-display text-lede md:text-cue ${item.id === unit.id ? "bg-ink text-paper" : "hover:text-accent"}`}>
            {item.name}
          </button>
        ))}
      </div>
      {/* When this unit is for */}
      <p className="mt-3 italic text-ink-muted">{unit.when}</p>

      {/* Today's question, with a way to get another */}
      {question && (
        <section aria-label={unit.id === "answering" ? "Answer a question" : unit.id === "asking" ? "Ask a follow-up" : "Listen to a story"} className="mt-4 border-y border-ink py-4">
          {/* Small heading */}
          <p className="text-footnote italic text-ink-muted">{unit.id === "answering" ? "A question for you" : unit.id === "asking" ? "Someone says" : "A short story, heard and not read"}</p>
          {/* What is said (a story stays hidden until afterwards) */}
          <p className="mt-1 font-display text-cue">{unit.id === "listening" ? "Someone tells you about their day." : question.text}</p>
          {/* Reply, or move along */}
          <p className="mt-2 flex flex-wrap gap-x-4">
            {/* Reply */}
            <Link href={answerHref(question.id)} className="inline-flex min-h-11 items-center underline underline-offset-4">{unit.id === "answering" ? "Answer it" : unit.id === "asking" ? "Ask a follow-up" : "Listen and respond"}</Link>
            {/* Another */}
            <button type="button" onClick={() => setOffset(offset + 1)} className="inline-flex min-h-11 items-center italic text-ink-muted underline underline-offset-4">{unit.id === "answering" ? "or another question" : unit.id === "asking" ? "or something else" : "or another story"}</button>
          </p>
        </section>
      )}

      {/* One moment a day: material for the next time someone asks */}
      {today && unit.id === "answering" && (
        <section id="moments" aria-labelledby="moments-heading" className="mt-10 scroll-mt-6">
          {/* Run-in heading */}
          <h2 id="moments-heading" className="italic">One moment a day</h2>
          {/* What it is for */}
          <p className="mt-2 max-w-[52ch] text-lede">{moments.some((moment) => dayKey(new Date(moment.createdAt)) === dayKey(today)) ? "Today\u2019s moment is saved. When someone asks what you have been up to, it will be there." : "What\u2019s one thing from today worth telling? Saying it now means you will have it when someone asks. It stays on this phone."}</p>
          {/* Record one */}
          <p className="mt-2"><Link href={`/session?mode=moment&prompt=${MOMENT_PROMPT.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{moments.some((moment) => dayKey(new Date(moment.createdAt)) === dayKey(today)) ? "Add another moment" : "Record today\u2019s moment"}</Link></p>
          {/* The latest few, in the words they were said */}
          {moments.length > 0 && (
            <ul aria-label="Your moments" className="mt-2 divide-y divide-rule border-y border-rule">
              {/* Each moment */}
              {moments.slice(0, RECENT_MOMENTS).map((moment) => (
                // One moment: the day, then what was said
                <li key={moment.id} className="py-3">
                  {/* The day */}
                  <span className="block text-footnote italic text-ink-muted">{dayLabel(new Date(moment.createdAt), today)}</span>
                  {/* The words */}
                  <span className="block text-lede">{moment.transcript || "(no words were caught)"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* The recipe, taught on the page itself */}
      <section aria-labelledby="recipe" className="mt-10">
        {/* Run-in heading */}
        <h2 id="recipe" className="italic">{unit.id === "answering" ? "A good answer" : unit.id === "asking" ? "A good follow-up" : "A good response"}, in four beats</h2>
        {/* The beats */}
        <ol className="mt-3 divide-y divide-rule border-y border-rule">
          {/* Each beat */}
          {unit.beats.map((beat, index) => (
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
        <h2 id="lessons" className="italic">{unit.name} lessons</h2>
        {/* The path */}
        <ol className="mt-2">
          {/* One row per lesson */}
          {lessons.map((lesson, index) => (
            // One lesson, joined to the next by a line down the path
            <li key={lesson.id} className="relative">
              {/* The line to the next lesson (not after the last) */}
              {index < lessons.length - 1 && <span aria-hidden="true" className="absolute top-14 bottom-0 left-[17px] w-0.5 bg-rule" />}
              {/* The whole row starts the lesson */}
              <Link href={answerHref(lesson.id)} aria-label={`${unit.name} lesson ${lesson.number}: ${lesson.title}`} className="relative flex items-start gap-x-4 py-3 hover:text-accent">
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
      {unit.id === "answering" && (
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
      )}
      {/* Everything people say in the asking drills */}
      {unit.id === "asking" && (
        <section aria-labelledby="remarks" className="mt-10">
          {/* Run-in heading */}
          <h2 id="remarks" className="italic">Things people say</h2>
          {/* Each one, followed up by tapping it */}
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {/* One remark */}
            {ASKING_DRILLS.map((item) => <li key={item.id}><RowLink href={answerHref(item.id)}>{item.text}</RowLink></li>)}
          </ul>
        </section>
      )}

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
              <li key={answer.id}><RowLink href={`/sessions?id=${answer.id}`} meta={`${beatCount(answer)} of 4`}>{answerLabel(answer.promptId)} <span className="block text-footnote italic text-ink-muted">{dayLabel(new Date(answer.createdAt), today)}</span></RowLink></li>
            ))}
          </ul>
        </section>
      )}

      {/* The main action: this unit's next lesson, or its drill once the lessons are done */}
      {nextLesson ? (
        <ActionBand action={`${UNITS.find((item) => item.id === nextLesson.unit)?.name} lesson ${nextLesson.number}`} aside={nextLesson.title} href={answerHref(nextLesson.id)} />
      ) : (
        question && <ActionBand action={unit.id === "answering" ? "Answer a question" : unit.id === "asking" ? "Ask a follow-up" : "Hear a story"} aside={unit.id === "listening" ? "then respond" : question.text} href={answerHref(question.id)} />
      )}
    </main>
  );
}

// One line for a recent response: the question or remark, or a story's first words
function answerLabel(promptId: string): string {
  // What was said
  const found = findSmallTalk(promptId);
  // Unknown
  if (!found) return "A question";
  // A story, cut short
  if (found.unit === "listening") return `Story: ${found.question.split(/\s+/).slice(0, 8).join(" ")}…`;
  // A remark
  if (found.unit === "asking") return `Follow-up: ${found.question}`;
  // A question
  return found.question;
}
