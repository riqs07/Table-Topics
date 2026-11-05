"use client";
// One Connect unit's page: today's practice, the recipe, the lessons as a path, the unit's own extras (moments, things people say), and your recent answers in it (decision 57). Second design pass, extrapolated from a job's list of ways on Practice and a course's page: "‹ Everyday conversation", the unit's tile on its tint, today's drill on a white card with the friend saying it in a bubble, the person to talk with beside the friend, the recipe's beats and the lessons as numbered rows (the sun next, a green tick done), and the chunky band for the next lesson

// Load React's state, effect and external-store tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the chevrons for the way back and the rows, and the tick for a tried mission
import { CaretLeftIcon, CaretRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { PRESS, PRIMARY, QUIET, RowLink, TEXT_LINK } from "@/components/script/Buttons";
// Load the folded group card
import { FoldCard } from "@/components/script/FoldCard";
// Load the loading placeholder
import { Skeleton } from "@/components/script/Skeleton";
import { Masthead } from "@/components/script/Masthead";
import { PathMark } from "@/components/script/PathMark";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the small-talk content
import { MOMENT_PROMPT, QUESTION_GROUPS, SMALL_TALK_QUESTIONS, drillBank, drillForDay, findSmallTalk, findUnit, lessonsFor, responseLabel, unitOf, type UnitId } from "@/content/smallTalk";
// Load the units' tiles, the mode tile and its tints, and the cast (second design pass)
import { UNIT_TILES } from "@/components/scenes/groundLooks";
import { GROUND_TINT, ModeTile } from "@/components/scenes/ModeTile";
import { Cast } from "@/components/scenes/Cast";
// Load the conversation personas and situations, for this unit's person to talk with (decisions 83 and 84)
import { PERSONAS, findScenario } from "@/content/conversations";
// Load the beat counter
import { beatCount } from "@/core/smallTalk";
// Load the done and next marks for a path of lessons
import { lessonPath } from "@/core/lessonPath";
// Load the day label
import { dayLabel } from "@/core/copy";
// Load the calendar-day key
import { dayKey } from "@/core/dates";
// Load the record types
import type { MissionRecord, SessionRecord } from "@/data/records";
// Load the mission tries (decision 95)
import { loadMissions } from "@/data/missions";
// Load the unit's missions, marked tried or not, and the words for each step's size
import { missionsInUnit } from "@/core/missions";
import { LEVEL_WORDS } from "@/content/missions";
// Load the shared heading look
import { BUBBLE, CARD, CARD_LIST, CHIP, CHIP_GOOD, LAB, LAB_ON_TINT, SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

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
  // The mission tries, oldest first (null while loading)
  const [missions, setMissions] = useState<MissionRecord[] | null>(null);

  // Load the mission tries once today is known, for this unit's missions (decision 95)
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read them; a failure just shows the missions as untried
    loadMissions(repo, today).then((records) => {
      // Keep them if still open
      if (!cancelled) setMissions(records);
    }, () => {
      // Shown as untried
      if (!cancelled) setMissions([]);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

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
  // The person to practise this skill with in a whole conversation
  const partner = PERSONAS.find((persona) => findScenario(persona.home)?.unit === unitId);
  // The showing unit's next lesson (none once its lessons are done)
  const nextLesson = lessonsFor(unit.id).find((lesson) => !counts.has(lesson.id));
  // Its lessons
  const lessons = lessonsFor(unit.id);
  // Their done and next marks, in order
  const marks = lessonPath(lessons.map((lesson) => lesson.id), counts);
  // Today's drill in this unit
  const question = today ? drillForDay(unit.id, today, offset) : null;
  // The unit's tile
  const tile = UNIT_TILES[unit.id];

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Practice" section="practice" />
      {/* Back to every unit */}
      <p className="mt-1 md:-mt-12"><Link href="/small-talk" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote text-ink-muted`}><CaretLeftIcon aria-hidden="true" weight="bold" className="size-4" />Everyday conversation</Link></p>
      {/* The unit's band on its tile's tint: the tile, how many lessons and the name (as a job's list of ways on Practice) */}
      <div className={`mt-3 flex items-center gap-4 rounded-[22px] p-4 md:gap-5 md:p-5 ${GROUND_TINT[tile.ground]}`}>
        {/* The unit's tile */}
        <ModeTile ground={tile.ground} prop={tile.prop} face={tile.face} tilt={-4} motion="loop" className="size-20 md:size-24" />
        {/* The words */}
        <div className="flex min-w-0 flex-col gap-0.5">
          {/* What it is, and how many lessons */}
          <p className={LAB_ON_TINT}>Everyday conversation · {lessons.length} lessons</p>
          {/* Its name (the page's heading is the drill below) */}
          <p className="font-display text-statement leading-tight font-semibold">{unit.name}</p>
        </div>
      </div>

      {/* Until today's date and the answers are read, a quiet placeholder, so the page appears in one piece (decision 76) */}
      {!(today && answers && missions) && <Skeleton blocks={["h-40", "h-28", "h-56"]} />}
      {/* Everything that depends on them, at once */}
      {today && answers && missions && (<>
      {/* Today's question, with a way to get another */}
      {question && (
        <section aria-label={unit.words.practice} className={`mt-5 p-5 md:p-6 ${CARD}`}>
          {/* Small heading */}
          <p className={LAB}>{unit.words.kicker}</p>
          {/* What is said, by the friend in a bubble (a story stays hidden until afterwards; a described moment or situation on the warm tint, a size smaller, decision 95) */}
          {unit.drill === "situation" ? (
            <h1 className="mt-2 rounded-[18px] bg-warm-tint px-5 py-4 font-display text-cue leading-snug font-semibold text-warm-ink">{question.text}</h1>
          ) : (
            <div className="mt-3 flex items-end gap-3 md:gap-4">
              {/* The friend */}
              <Cast who="friend" face="happy" className="size-16 flex-none md:size-20" />
              {/* What they say */}
              <h1 className={`${BUBBLE} mb-2 min-w-0 flex-1 rounded-[24px] px-5 py-4 font-display text-cue leading-tight font-semibold md:text-statement`}>{unit.id === "listening" ? "Someone tells you about their day." : question.text}</h1>
            </div>
          )}
          {/* Reply, or move along */}
          <p className="mt-5 flex flex-wrap gap-3">
            {/* Reply, the main choice */}
            <Link href={answerHref(question.id)} className={PRIMARY}>{unit.words.start}</Link>
            {/* Another */}
            <button type="button" onClick={() => setOffset(offset + 1)} className={QUIET}>{unit.words.another}</button>
          </p>
        </section>
      )}

      {/* The same skill in a whole conversation with someone (decision 83) */}
      {partner && (
        <section aria-labelledby="partner-heading" className="mt-10">
          {/* Run-in heading */}
          <h2 id="partner-heading" className={SECTION_HEADING}>Try it in a conversation</h2>
          {/* The person */}
          <ul className="mt-3">
            {/* One card: the friend, who they are, how long, and a chevron */}
            <li>
              <Link href={`/conversations/talk?id=${partner.id}&skill=${unitId}`} className={`flex min-h-18 items-center gap-3.5 px-4 py-3 ${CARD} ${PRESS} hover:-translate-y-0.5`}>
                {/* The friend */}
                <Cast who="friend" face="happy" className="size-14 flex-none" />
                {/* Who */}
                <span className="min-w-0 flex-1"><span className="block font-display text-lg leading-tight font-semibold">Talk with {partner.name}</span><span className="block text-footnote font-bold text-ink-muted">{partner.tagline}</span></span>
                {/* How long */}
                <span className={CHIP}>1 min</span>
                {/* The chevron */}
                <CaretRightIcon aria-hidden="true" weight="bold" className="size-5 flex-none text-ink-muted" />
              </Link>
            </li>
          </ul>
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
            <ul aria-label="Your moments" className={`mt-2 ${CARD_LIST}`}>
              {/* Each moment */}
              {moments.slice(0, RECENT_MOMENTS).map((moment) => (
                // One moment: the day, then what was said
                <li key={moment.id} className="py-3">
                  {/* The day */}
                  <span className="block text-footnote text-ink-muted">{dayLabel(new Date(moment.createdAt), today)}</span>
                  {/* The words */}
                  <span className="block text-lede">{moment.transcript || "(no words were caught)"}</span>
                  {/* Tell it properly, as a story (decision 92) */}
                  {moment.transcript.trim() !== "" && <Link href={`/stories/tell?moment=${encodeURIComponent(moment.id)}`} className={`${TEXT_LINK} text-footnote`}>Tell it properly</Link>}
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
        <ol className={`mt-3 ${CARD_LIST}`}>
          {/* Each beat */}
          {unit.beats.map((beat, index) => (
            // One beat: its name and what it means (why it works is in the lessons, decision 63)
            <li key={beat.id} className="flex items-center gap-3.5 py-3">
              {/* Its number, on the soft green */}
              <span aria-hidden="true" className="flex size-9 flex-none items-center justify-center rounded-xl bg-accent-tint font-display font-semibold text-accent-tint-ink">{index + 1}</span>
              {/* Its words */}
              <span>
                {/* Name and reminder */}
                <span className="block font-bold"><strong className="font-display text-lg font-semibold">{beat.name}.</strong> {beat.reminder}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* The lessons, as a path */}
      <section aria-labelledby="lessons" className="mt-10">
        {/* Run-in heading */}
        <h2 id="lessons" className={SECTION_HEADING}>{unit.name} lessons</h2>
        {/* The path, as rows in one card (the old connecting line is gone; decision 79) */}
        <ol className={`mt-2 ${CARD_LIST}`}>
          {/* One row per lesson */}
          {lessons.map((lesson, index) => (
            // One lesson
            <li key={lesson.id}>
              {/* The whole row starts the lesson */}
              <Link href={answerHref(lesson.id)} className={`flex min-h-14 items-center gap-x-3 py-2.5 hover:text-accent ${PRESS}`}>
                {/* Its mark on the path */}
                <PathMark mark={marks[index] ?? "open"} number={lesson.number} />
                {/* Title (the idea is in the lesson itself, decision 63) */}
                <span className="min-w-0 flex-1">
                  {/* "Next" above the lesson to do next */}
                  {marks[index] === "next" && <span className={`mb-1 ${CHIP_GOOD}`}>Next</span>}
                  {/* Title, with the unit and number read before it (the visible words stay in the name; WCAG 2.5.3) */}
                  <span className="block font-extrabold leading-snug"><span className="sr-only">{unit.name} lesson {lesson.number}: </span>{lesson.title}</span>
                </span>
                {/* The chevron */}
                <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
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
          {/* Each group, folded, as rounded cards (decision 79) */}
          <div className="mt-2 flex flex-col gap-2">
            {QUESTION_GROUPS.map((group) => {
              // Its questions
              const questions = SMALL_TALK_QUESTIONS.filter((item) => item.group === group.id);
              // One group
              return (
                <FoldCard key={group.id} name={group.name} detail={`${questions.length} questions`}>
                  {/* Its questions */}
                  <ul className="divide-y divide-rule">
                    {/* Each question, answered by tapping it */}
                    {questions.map((item) => <li key={item.id}><RowLink href={answerHref(item.id)}>{item.text}</RowLink></li>)}
                  </ul>
                </FoldCard>
              );
            })}
          </div>
        </section>
      )}
      {/* Every drill in the unit, when its page lists them: things people say, news, moments, situations or flat questions */}
      {unit.words.list && (
        <section aria-labelledby="remarks" className="mt-10">
          {/* Run-in heading */}
          <h2 id="remarks" className={SECTION_HEADING}>{unit.words.list}</h2>
          {/* Each one, practised by tapping it */}
          <ul className={`mt-2 ${CARD_LIST}`}>
            {/* One drill */}
            {drillBank(unit.id).map((item) => <li key={item.id}><RowLink href={answerHref(item.id)}>{item.text}</RowLink></li>)}
          </ul>
        </section>
      )}

      {/* This unit's missions: the real-world tries, easiest first, marked once tried (decision 95) */}
      {missionsInUnit(unit.id, missions).length > 0 && (
        <section aria-labelledby="unit-missions" className="mt-10">
          {/* Run-in heading, and where today's mission is */}
          <div className="flex items-baseline justify-between gap-4">
            {/* Run-in heading */}
            <h2 id="unit-missions" className={SECTION_HEADING}>Try it for real</h2>
            {/* Today's mission lives on Learn */}
            <Link href="/learn#missions" className={`${TEXT_LINK} text-footnote`}>Today’s mission</Link>
          </div>
          {/* The missions */}
          <ul aria-label="This unit's missions" className={`mt-2 ${CARD_LIST}`}>
            {/* One mission: its mark, then what to try */}
            {missionsInUnit(unit.id, missions).map((item) => (
              // One mission
              <li key={item.mission.id} data-tried={item.tried} className="flex gap-3 py-3">
                {/* Its mark: filled once tried */}
                <span aria-hidden="true" className={`flex size-8 flex-none items-center justify-center rounded-[10px] ${item.tried ? "bg-fill text-fill-ink" : "bg-rule"}`}>{item.tried && <CheckIcon weight="bold" className="size-4" />}</span>
                {/* What to try, and whether it is done */}
                <span><span className="block font-bold">{item.mission.task}</span><span className="block text-footnote font-bold text-ink-muted">{item.tried ? "Tried" : LEVEL_WORDS[item.mission.level]}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The user's recent answers */}
      {answers && answers.length > 0 && today && (
        <section aria-labelledby="your-answers" className="mt-10 mb-6">
          {/* Run-in heading */}
          <h2 id="your-answers" className={SECTION_HEADING}>Your answers</h2>
          {/* The most recent */}
          <ul className={`mt-2 ${CARD_LIST}`}>
            {/* Each answer */}
            {answers.slice(0, RECENT_ANSWERS).map((answer) => (
              // One answer: its question, day, and beats
              <li key={answer.id}><RowLink href={`/sessions?id=${answer.id}`} meta={`${beatCount(answer)} of 4`}>{answerLabel(answer.promptId)} <span className="block text-footnote text-ink-muted">{dayLabel(new Date(answer.createdAt), today)}</span></RowLink></li>
            ))}
          </ul>
        </section>
      )}

      </>)}

      {/* The main action: this unit's next lesson (named by number, as the page names the unit, so a long unit name never squeezes the title), or its drill once the lessons are done */}
      {nextLesson ? (
        <ActionBand action={`Lesson ${nextLesson.number}`} aside={nextLesson.title} href={answerHref(nextLesson.id)} />
      ) : (
        question && <ActionBand action={unit.words.band} aside={unit.id === "listening" ? unit.words.then : question.text} href={answerHref(question.id)} />
      )}
    </main>
  );
}

// One line for a recent response: the question, or the unit's word and what was said, a long one cut short
function answerLabel(promptId: string): string {
  // An everyday question as it is (this is the Answering page); otherwise the shared label, or a plain one when the prompt is unknown
  return unitOf(promptId) === "answering" ? (findSmallTalk(promptId)?.question ?? "A question") : (responseLabel(promptId) ?? "A question");
}
