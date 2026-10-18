"use client";
// One Connect unit's page: today's practice, the recipe, the lessons as a path, the unit's own extras (moments, things people say), and your recent answers in it (decision 57)

// Load React's state, effect and external-store tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the chevron for lesson rows
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { QUIET, RowLink, TEXT_LINK } from "@/components/script/Buttons";
import { Masthead } from "@/components/script/Masthead";
import { PathMark } from "@/components/script/PathMark";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the small-talk content
import { ASKING_DRILLS, MOMENT_PROMPT, QUESTION_GROUPS, SMALL_TALK_QUESTIONS, UNITS, drillForDay, findSmallTalk, findUnit, lessonsFor, unitOf, type UnitId } from "@/content/smallTalk";
// Load the units' icons
import { UNIT_ICONS } from "@/components/script/unitIcons";
// Load the beat counter
import { beatCount } from "@/core/smallTalk";
// Load the done and next marks for a path of lessons
import { lessonPath } from "@/core/lessonPath";
// Load the day label
import { dayLabel } from "@/core/copy";
// Load the calendar-day key
import { dayKey } from "@/core/dates";
// Load the record types
import type { SessionRecord } from "@/data/records";
// Load the shared heading look
import { SECTION_HEADING } from "@/components/script/textStyles";

// How many recent answers to list
const RECENT_ANSWERS = 10;
// How many recent moments to list
const RECENT_MOMENTS = 5;

// The address that starts an answer to a prompt (an everyday question or a lesson's turn)
const answerHref = (promptId: string) => `/session?mode=smalltalk&prompt=${promptId}`;

// Draw one Connect unit's page (decision 57)
export function SmallTalkScreen({ unitId, ...props }: ScreenProps & { unitId: UnitId }) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // The user's small-talk answers, newest first (null while loading)
  const [answers, setAnswers] = useState<SessionRecord[] | null>(null);
  // The user's moment notes, newest first
  const [moments, setMoments] = useState<SessionRecord[]>([]);
  // How many drills along from today's ("another" adds one)
  const [offset, setOffset] = useState(0);

  // Load the answers once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions and keep the small-talk ones
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // The answers
      setAnswers(sessions.filter((session) => session.mode === "smalltalk" && unitOf(session.promptId) === unitId));
      // The moments
      setMoments(sessions.filter((session) => session.mode === "moment"));
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, unitId]);

  // How often each lesson has been answered
  const counts = new Map<string, number>();
  // Count each answer to a lesson
  for (const answer of answers ?? []) counts.set(answer.promptId, (counts.get(answer.promptId) ?? 0) + 1);
  // The unit
  const unit = findUnit(unitId);
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
    <main className="mx-auto min-h-dvh max-w-5xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Connect" section="smalltalk" />
      {/* Back to Connect */}
      <p className="mt-2"><Link href="/small-talk" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" className="size-4" />Connect</Link></p>
      {/* Icon, name, and when it is for */}
      <div className="mt-2 flex items-center gap-4">
        {/* The icon on an accent tile */}
        <span aria-hidden="true" className="flex size-16 flex-none items-center justify-center bg-accent/10 text-accent">{(() => { const IconShape = UNIT_ICONS[unit.id]; return <IconShape className="size-9" />; })()}</span>
        {/* Name (when it is for is on its card on Connect, decision 63) */}
        <p className="min-w-0 flex-1 font-display text-statement tracking-tight">{unit.name}</p>
      </div>

      {/* Today's question, with a way to get another */}
      {question && (
        <section aria-label={unit.words.practice} className="mt-4">
          {/* Small heading */}
          <p className="text-footnote text-ink-muted">{unit.words.kicker}</p>
          {/* What is said (a story stays hidden until afterwards) */}
          <h1 className="mt-1 font-display text-statement tracking-tight">{unit.id === "listening" ? "Someone tells you about their day." : question.text}</h1>
          {/* Reply, or move along */}
          <p className="mt-2 flex flex-wrap gap-x-4">
            {/* Reply */}
            <Link href={answerHref(question.id)} className={TEXT_LINK}>{unit.words.start}</Link>
            {/* Another */}
            <button type="button" onClick={() => setOffset(offset + 1)} className={QUIET}>{unit.words.another}</button>
          </p>
        </section>
      )}

      {/* One moment a day: material for the next time someone asks */}
      {today && unit.id === "answering" && (
        <section id="moments" aria-labelledby="moments-heading" className="mt-10 scroll-mt-6">
          {/* Run-in heading */}
          <h2 id="moments-heading" className={SECTION_HEADING}>One moment a day</h2>
          {/* Today's state, in a few words */}
          <p className="mt-2 text-ink-muted">{moments.some((moment) => dayKey(new Date(moment.createdAt)) === dayKey(today)) ? "Today\u2019s moment is saved." : "One thing from today worth telling."}</p>
          {/* Record one */}
          <p className="mt-2"><Link href={`/session?mode=moment&prompt=${MOMENT_PROMPT.id}`} className={TEXT_LINK}>{moments.some((moment) => dayKey(new Date(moment.createdAt)) === dayKey(today)) ? "Add another moment" : "Record today\u2019s moment"}</Link></p>
          {/* The latest few, in the words they were said */}
          {moments.length > 0 && (
            <ul aria-label="Your moments" className="mt-2 divide-y divide-rule border-y border-rule">
              {/* Each moment */}
              {moments.slice(0, RECENT_MOMENTS).map((moment) => (
                // One moment: the day, then what was said
                <li key={moment.id} className="py-3">
                  {/* The day */}
                  <span className="block text-footnote text-ink-muted">{dayLabel(new Date(moment.createdAt), today)}</span>
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
        <h2 id="recipe" className={SECTION_HEADING}>{unit.words.recipe}, in four beats</h2>
        {/* The beats */}
        <ol className="mt-3 divide-y divide-rule border-y border-rule">
          {/* Each beat */}
          {unit.beats.map((beat, index) => (
            // One beat: its name and what it means (why it works is in the lessons, decision 63)
            <li key={beat.id} className="flex gap-4 py-3">
              {/* Its number */}
              <span aria-hidden="true" className="w-5 flex-none font-display text-cue text-accent">{index + 1}</span>
              {/* Its words */}
              <span>
                {/* Name and reminder */}
                <span className="block"><strong className="font-display text-xl font-normal">{beat.name}.</strong> {beat.reminder}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* The lessons, as a path */}
      <section aria-labelledby="lessons" className="mt-10">
        {/* Run-in heading */}
        <h2 id="lessons" className={SECTION_HEADING}>{unit.name} lessons</h2>
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
                {/* Title (the idea is in the lesson itself, decision 63) */}
                <span className="min-w-0 flex-1">
                  {/* "Next" above the lesson to do next */}
                  {marks[index] === "next" && <span className="block text-footnote font-medium text-accent">Next</span>}
                  {/* Title */}
                  <span className="block font-display text-xl leading-tight">{lesson.title}</span>
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
          <h2 id="questions" className={SECTION_HEADING}>Everyday questions</h2>
          {/* Each group, folded */}
          {QUESTION_GROUPS.map((group) => (
            // One group
            <details key={group.id} className="border-b border-rule">
              {/* Its name and size */}
              <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 font-display text-cue">
                {/* Name */}
                {group.name}
                {/* How many */}
                <span className="font-body text-footnote text-ink-muted">{SMALL_TALK_QUESTIONS.filter((item) => item.group === group.id).length} questions</span>
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
          <h2 id="remarks" className={SECTION_HEADING}>Things people say</h2>
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
          <h2 id="your-answers" className={SECTION_HEADING}>Your answers</h2>
          {/* The most recent */}
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {/* Each answer */}
            {answers.slice(0, RECENT_ANSWERS).map((answer) => (
              // One answer: its question, day, and beats
              <li key={answer.id}><RowLink href={`/sessions?id=${answer.id}`} meta={`${beatCount(answer)} of 4`}>{answerLabel(answer.promptId)} <span className="block text-footnote text-ink-muted">{dayLabel(new Date(answer.createdAt), today)}</span></RowLink></li>
            ))}
          </ul>
        </section>
      )}

      {/* The main action: this unit's next lesson, or its drill once the lessons are done */}
      {nextLesson ? (
        <ActionBand action={`${UNITS.find((item) => item.id === nextLesson.unit)?.name} lesson ${nextLesson.number}`} aside={nextLesson.title} href={answerHref(nextLesson.id)} />
      ) : (
        question && <ActionBand action={unit.words.band} aside={unit.id === "listening" ? unit.words.then : question.text} href={answerHref(question.id)} />
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
  // A question as it is; anything else with its unit's word
  return found.unit === "answering" ? found.question : `${findUnit(found.unit).words.history}: ${found.question}`;
}
