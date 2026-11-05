"use client";
// One part of a guided course lesson (decision 131), one step at a time: learn the idea, see it done when there is something to see (a video or a model answer), try it (once or twice, on a mode the app already has), and wrap up with what changed and the way on. Second design pass: focus mode (the cross, the chunky bar and the step's label, Desktop Screens row "In use"), Sage saying the idea in a filled bubble and your blob giving its own example (storyboard 21), the goal on the soft green as on Recording, and the wrap-up's green panel as on Result; on a computer the part's card (its tile, where it sits, its steps) is the side column

// Load React's effect and reference tools, and the node type
import { useEffect, useRef, type ReactNode } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the tick for a done step
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Skeleton } from "@/components/script/Skeleton";
import { CourseLoadFailed } from "@/components/script/CourseLoadFailed";
// Load the shared not-found card
import { NotFound } from "@/components/script/SageSays";
// Load the focus-mode bar and its page layouts (second design pass)
import { PRACTICE_BODY, PRACTICE_COLUMNS, PRACTICE_MAIN, PracticeBar } from "@/components/script/PracticeBar";
// Load the shared looks
import { BUBBLE, CARD, LAB } from "@/components/script/textStyles";
import { PRIMARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the cast (you and Sage) and the lesson tiles (decision 142)
import { Cast, type SageMood } from "@/components/scenes/Cast";
import { CourseTile } from "@/components/scenes/CourseTile";
import { lessonTile } from "@/components/scenes/tileFor";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the course data and the tab title helper
import { useCourseData } from "@/components/screens/useCourseData";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the course rules
import { MEASURE_NAMES, compareLine, coursePlaces, findPart, measureText, measureValue, partHref, partMinutes, partSteps, takeHref, type PartPlace, type PartStep } from "@/core/courses";
// Load progress saving
import { markPartDone } from "@/data/courses";
// Load the Learn card finder, for the research behind an idea
import { findCard } from "@/content/learn";
// Load the record type
import type { SessionRecord } from "@/data/records";

// Each step's name in the step list and the bar's label
const STEP_NAMES: Readonly<Record<PartStep, string>> = { learn: "Learn", see: "See it", try: "Try it", wrap: "Wrap up" };

// The steps as a short list, each marked done (a green tick), now (the sun) or still to come (cream), like a lesson's parts on the course page
function StepBar({ steps, current }: { steps: ReadonlyArray<PartStep>; current: PartStep }) {
  // Where the current step sits
  const at = steps.indexOf(current);
  // The list
  return (
    <ol aria-label={`Step ${at + 1} of ${steps.length}: ${STEP_NAMES[current]}`} className="flex flex-col gap-2">
      {/* Each step */}
      {steps.map((step, index) => (
        // One step: its mark and its name
        <li key={step} aria-current={step === current ? "step" : undefined} className={`flex min-h-9 items-center gap-3 font-extrabold ${index > at ? "text-ink-muted" : ""}`}>
          {/* The mark: a tick once done, the sun now, cream still to come */}
          <span aria-hidden="true" className={`flex size-8 flex-none items-center justify-center rounded-[10px] font-display font-semibold ${index < at ? "bg-fill text-fill-ink" : index === at ? "bg-art-sun text-on-warm" : "bg-rule text-ink"}`}>{index < at ? <CheckIcon weight="bold" className="size-4" /> : index + 1}</span>
          {/* The name */}
          {STEP_NAMES[step]}
        </li>
      ))}
    </ol>
  );
}

// The side card: the lesson's tile, where this part sits, its steps, and anything more to read or try
function PartCard({ place, step, more }: { place: PartPlace; step: PartStep; more?: ReactNode }) {
  // The part and its place
  const { part, lesson, lessonNumber, partNumber, course } = place;
  // The lesson's tile, if it has one
  const tile = lessonTile(course.id, lesson.id);
  // The card
  return (
    <section aria-label="This part" className={`flex flex-col gap-4 p-5 ${CARD}`}>
      {/* The tile and where this part sits */}
      <div className="flex items-center gap-4">
        {/* The tile */}
        {tile && <CourseTile name={tile} motion="still" className="size-18 flex-none" />}
        {/* The words */}
        <div className="flex min-w-0 flex-col gap-0.5">
          {/* The course and the lesson's number */}
          <span className={LAB}>Lesson {lessonNumber} · part {partNumber} of {lesson.parts.length}</span>
          {/* The lesson */}
          <span className="font-display text-xl leading-tight font-semibold">{lesson.title}</span>
          {/* Where it sits, and its length */}
          <span className="text-footnote font-bold text-ink-muted">{course.title} · {part.title} · about {partMinutes(part)} min</span>
        </div>
      </div>
      {/* Its steps */}
      <div className="border-t-2 border-rule pt-4"><StepBar steps={partSteps(part)} current={step} /></div>
      {/* Anything more */}
      {more}
    </section>
  );
}

// Sage saying something: the coach, then the bubble (filled for the lesson's idea, white for a reaction)
function SageSays({ children, filled = false, mood = "calm" }: { children: ReactNode; filled?: boolean; mood?: SageMood }) {
  // Sage on the left, the bubble beside
  return (
    <div className="flex items-end gap-3 md:gap-4">
      {/* Sage */}
      <Cast who="sage" mood={mood} className="size-16 flex-none md:size-20" />
      {/* The bubble */}
      <div className={filled ? "vl-bubble vl-bubble-fill relative mb-1 min-w-0 flex-1 rounded-[24px] bg-fill px-5 py-4 text-fill-ink md:px-6 md:py-5" : `${BUBBLE} mb-2 min-w-0 flex-1`}>{children}</div>
    </div>
  );
}

// The model answer as your blob giving its own example, then Sage pointing out what to notice (storyboard 21)
function ModelAnswer({ model }: { model: NonNullable<NonNullable<PartPlace["part"]["see"]>["model"]> }) {
  // Where the highlight sits in the answer
  const at = model.answer.indexOf(model.highlight);
  // The two lines
  return (
    <section aria-label="Model answer" className="flex flex-col gap-5">
      {/* Your blob, on the right, with the answer */}
      <div className="flex items-end justify-end gap-3 md:gap-4">
        {/* The bubble */}
        <div className={`${BUBBLE} vl-bubble-right mb-2 min-w-0 flex-1`}>
          {/* The question */}
          <p className={LAB}>Model answer · “{model.question}”</p>
          {/* The answer, the highlight marked */}
          <p className="mt-1.5 text-lede font-bold">{at < 0 ? model.answer : <>{model.answer.slice(0, at)}<mark className="rounded-md bg-accent-tint px-1 font-extrabold text-accent-tint-ink">{model.highlight}</mark>{model.answer.slice(at + model.highlight.length)}</>}</p>
        </div>
        {/* You */}
        <Cast who="you" face="happy" className="size-14 flex-none md:size-16" />
      </div>
      {/* Sage, on what to notice */}
      <SageSays mood="proud"><p>Notice: {model.notice}</p></SageSays>
    </section>
  );
}

// This run's tries of a part: the latest first try, and a second try made after it
function runTakes(takes: ReadonlyArray<SessionRecord>, partId: string): { first?: SessionRecord; second?: SessionRecord } {
  // The part's tries, not comebacks, oldest first
  const own = takes.filter((take) => take.course?.part === partId && !take.course.revisit);
  // The latest first try
  const first = own.filter((take) => take.course!.attempt === 1).at(-1);
  // A second try after it
  const second = first ? own.filter((take) => take.course!.attempt === 2 && take.createdAt >= first.createdAt).at(-1) : undefined;
  // Both
  return { first, second };
}

// The wrap-up: marks the part done (once its practice has a take), then what changed and the way on
function WrapUp({ place, takes, onDone }: { place: PartPlace; takes: ReadonlyArray<SessionRecord>; onDone: (takeId: string | null) => Promise<void> }) {
  // The part and its practice
  const { part } = place;
  // This run's tries
  const { first, second } = runTakes(takes, part.id);
  // The take that counts: the second try, else the first
  const last = second ?? first;
  // Whether the part can be marked done: no practice, or a take
  const finished = !part.practice || !!last;
  // Marked once
  const marked = useRef(false);
  // Mark it done when it can be
  useEffect(() => {
    // Not yet, or already
    if (!finished || marked.current) return;
    // Once
    marked.current = true;
    // Saved (a failure leaves the part open; the wrap-up still shows)
    void onDone(last?.id ?? null).catch(() => {});
  }, [finished, last, onDone]);
  // The part after this one in the course
  const places = coursePlaces(place.course);
  // (found by position)
  const after = places[places.findIndex((item) => item.part.id === part.id) + 1];
  // A practice part with no take yet: send to the try
  if (part.practice && !last) {
    // The message and the way to try, beside the part's card
    return (
      <div className={PRACTICE_COLUMNS}>
        {/* The message */}
        <section aria-label="No take yet" className={`flex flex-col items-center gap-4 px-5 py-8 text-center ${CARD}`}>
          {/* The page's heading for screen readers and the keyboard (the bar carries the step visibly) */}
          <h1 className="sr-only">Wrap-up</h1>
          {/* Your blob, wondering */}
          <Cast who="you" face="wonder" className="size-28" />
          {/* What is missing */}
          <p className="font-display text-2xl font-semibold">No take for this part yet.</p>
          {/* What it needs */}
          <p className="max-w-[40ch] font-bold text-ink-muted">One try first, then the wrap-up shows how it went.</p>
          {/* The way to try */}
          <div className="w-full max-w-md text-left"><ActionBand action="Try it" aside={part.practice.goal} href={takeHref(part, 1)!} /></div>
        </section>
        {/* The part's card */}
        <PartCard place={place} step="wrap" />
      </div>
    );
  }
  // Whether it went the other way: more pause words on the second try than the first
  const rough = !!part.practice && part.practice.measure === "fillers" && !!first && !!second && second.fillersPerMinute > first.fillersPerMinute;
  // What changed between the tries, or the one try's value
  const line = part.practice && first && second ? compareLine(part.practice.measure, first, second) : part.practice && last ? (() => {
    // The value
    const value = measureValue(part.practice.measure, last);
    // In words
    return value === null ? null : `${MEASURE_NAMES[part.practice.measure]}: ${measureText(part.practice.measure, value)}.`;
  })() : null;
  // The wrap-up: the green panel (done, what changed, the way on) and beside it the goal, the results and the comeback
  return (
    <div className={PRACTICE_COLUMNS}>
      {/* The part's goal, its results and when it comes back */}
      <div className="flex min-w-0 flex-col gap-5">
        {/* The part (the bar above already says the course, lesson and part) */}
        <p className="font-display text-3xl leading-tight font-semibold">{part.title}</p>
        {/* The goal it was about */}
        {part.practice && (
          <div className="rounded-[22px] bg-accent-tint px-5 py-4 text-accent-tint-ink">
            {/* Heading */}
            <p className="text-xs font-extrabold tracking-[.07em] uppercase">Your one goal</p>
            {/* The goal */}
            <p className="mt-1 max-w-[52ch] font-bold">You were working on: {part.practice.goal}</p>
          </div>
        )}
        {/* The full results */}
        {last && <p><Link href={`/sessions?id=${last.id}`} className={TEXT_LINK}>See the full results</Link></p>}
        {/* It comes back later, said by Sage */}
        {part.practice && (
          <div data-comes-back>
            <SageSays mood="encouraging">
              {/* The heading */}
              <span className="block font-extrabold">This topic comes back in a few days</span>
              {/* What happens then */}
              <span className="block text-footnote font-bold text-ink-muted">Same question, a fresh answer. Then you hear both side by side.</span>
            </SageSays>
          </div>
        )}
      </div>
      {/* The panel: done, what changed and the way on (first on a phone), green when it went well and warm with Sage when the pause words went up (the result's verdict colours) */}
      <section aria-label="Part done" className={`order-first flex flex-col gap-3 rounded-[28px] p-6 lg:order-none ${rough ? "bg-warm-tint text-warm-ink" : "bg-accent-tint text-accent-tint-ink"}`}>
        {/* Your blob, pleased, or Sage, encouraging */}
        {rough ? <Cast who="sage" mood="encouraging" className="size-20" /> : <Cast who="you" face="happy" className="size-20" />}
        {/* Done */}
        <p className="text-xs font-extrabold tracking-[.07em] uppercase">Part {place.partNumber} of {place.lesson.parts.length} done</p>
        {/* What changed, or a plain finish */}
        <h1 className="font-display text-3xl leading-tight font-semibold">{line ?? part.title}</h1>
        {/* The next part, or back to the course: the chunky button inside the panel, as Result's Continue */}
        {after ? <Link href={partHref(after.part.id)} className={`${PRIMARY} mt-2 w-full`}>Next part<span className="sr-only">: lesson {after.lessonNumber}, part {after.partNumber}, {after.part.title}</span></Link> : <Link href={`/courses/course?id=${place.course.id}`} className={`${PRIMARY} mt-2 w-full`}>Back to the course</Link>}
        {/* What comes next, said small */}
        {after && <p className="text-center text-footnote font-bold">Next: lesson {after.lessonNumber}, part {after.partNumber} · {after.part.title}</p>}
        {/* Or back to Today */}
        <p className="text-center"><Link href="/" className={TEXT_LINK}>Back to today’s practice</Link></p>
      </section>
    </div>
  );
}

// Draw a part at a step
export function CoursePartScreen({ partId, step: askedStep = "learn", attempt = 1, ...props }: ScreenProps & { partId: string; step?: PartStep; attempt?: number }) {
  // The repository and today
  const { repo, today } = useScreenBasics(props);
  // The part and its place
  const place = findPart(partId);
  // Name the tab after it
  usePageTitle(place?.part.title);
  // Progress and takes (the wrap-up and a second try read them)
  const data = useCourseData(repo, today);

  // No such part
  if (!place) {
    // Say so, with a way back
    return (
      <main id="main" className={PRACTICE_MAIN}>
        {/* The bar, with the way back to Courses */}
        <PracticeBar close={{ href: "/courses", label: "Close, back to Courses" }} label="Lesson" />
        {/* Sage, puzzled, says so as the page's heading, then the way back (the shared not-found pattern) */}
        <div className={PRACTICE_BODY}><NotFound title="This lesson could not be found." back={{ href: "/courses", label: "Back to Courses" }} className="mt-6" /></div>
      </main>
    );
  }

  // The part
  const { part, lessonNumber } = place;
  // Its steps
  const steps = partSteps(part);
  // The step shown: the one asked for if the part has it, else the first
  const step = steps.includes(askedStep) ? askedStep : "learn";
  // The step after this one
  const following = steps[steps.indexOf(step) + 1];
  // The address of the step after this one
  const nextHref = following ? partHref(part.id, following) : partHref(part.id, "wrap");
  // The Learn card behind the idea, when it names one that exists
  const card = part.learn.card ? findCard(part.learn.card) : undefined;
  // The way out: back to the course
  const close = { href: `/courses/course?id=${place.course.id}`, label: `Close, back to ${place.course.title}` };
  // How far through the part's steps
  const progress = (steps.indexOf(step) + 1) / steps.length;
  // The research behind the idea, and a practice the course cannot record itself, when the part has them (shown with the idea)
  const more = step === "learn" && (card || part.learn.link) ? (
    <ul aria-label="More on this" className="flex flex-col border-t-2 border-rule pt-2">
      {/* The Learn card */}
      {card && <li><Link data-course-card={card.id} href={`/learn/card?id=${card.id}`} className={TEXT_LINK}>Why it works: {card.keyLine}</Link></li>}
      {/* The practice elsewhere */}
      {part.learn.link && <li><Link data-course-link href={part.learn.link.href} className={TEXT_LINK}>{part.learn.link.label}</Link></li>}
    </ul>
  ) : undefined;
  // A clip or video, when the part has one
  const media = step === "see" && part.see && (part.see.clip || part.see.video) ? (
    <div className="flex flex-col gap-3">
      {/* Our own lesson clip (decision 146): 4:5, tap to play, its words burned in and readable below instead */}
      {part.see.clip && (
        <figure data-lesson-clip className="w-full">
          {/* The clip: nothing loads until it is played */}
          <video src={part.see.clip.src} poster={part.see.clip.poster} controls playsInline preload="none" aria-label={part.see.clip.title} className="aspect-[4/5] w-full rounded-[22px] border-2 border-rule bg-ink object-cover shadow-card" />
          {/* Its words, for anyone who would rather read */}
          <details className="mt-3 text-footnote">
            {/* The toggle */}
            <summary className="min-h-11 cursor-pointer content-center font-extrabold text-accent-tint-ink">Read it instead</summary>
            {/* The words */}
            <p className="mt-2 max-w-[52ch] text-lede">{part.see.clip.transcript}</p>
          </details>
        </figure>
      )}
      {/* The video, in YouTube's privacy-enhanced player */}
      {part.see.video && (
        <div className="aspect-video w-full overflow-hidden rounded-[22px] border-2 border-rule bg-ink shadow-card">
          {/* The player */}
          <iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(part.see.video.youtubeId)}?rel=0${part.see.video.start ? `&start=${part.see.video.start}` : ""}${part.see.video.end ? `&end=${part.see.video.end}` : ""}`} title={part.see.video.title} className="size-full" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="lazy" />
        </div>
      )}
    </div>
  ) : null;

  // Draw the page
  return (
    <main id="main" className={PRACTICE_MAIN}>
      {/* The bar: the way back to the course, how far through the part, and the step */}
      <PracticeBar close={close} progress={progress} label={`${place.course.title} · Lesson ${lessonNumber} · Part ${place.partNumber} · ${step === "try" && part.practice && part.practice.tries > 1 ? `Try ${Math.min(attempt, part.practice.tries)} of ${part.practice.tries}` : STEP_NAMES[step]}`} />

      {/* Learn: Sage says the idea, then the weaker way against the better one */}
      {step === "learn" && (
        <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
          <div className="flex min-w-0 flex-col gap-6">
            {/* Sage with the idea, large, and a few sentences */}
            <SageSays filled mood="encouraging">
              {/* The idea */}
              <h1 className="font-display text-3xl leading-tight font-semibold md:text-statement">{part.learn.headline}</h1>
              {/* A few sentences */}
              <p className="mt-2 max-w-[56ch] font-bold">{part.learn.body}</p>
            </SageSays>
            {/* Instead of, and try */}
            {(part.learn.instead || part.learn.tryThis) && (
              <section aria-label="An example" className="flex flex-col gap-3 md:ml-24">
                {/* The weaker way, quiet */}
                {part.learn.instead && <div className="rounded-[18px] bg-paper px-5 py-3.5 text-ink-muted"><p className={LAB}>Instead of</p><p className="mt-1 text-lg font-bold">{part.learn.instead}</p></div>}
                {/* The better way, picked out */}
                {part.learn.tryThis && <div className="-rotate-[0.6deg] rounded-[18px] border-2 border-accent bg-card px-5 py-3.5 shadow-picked"><p className="text-xs font-extrabold tracking-[.07em] text-accent-tint-ink uppercase">Try</p><p className="mt-1 font-display text-cue font-semibold">{part.learn.tryThis}</p></div>}
              </section>
            )}
            {/* On */}
            <ActionBand action="Next" aside={following ? STEP_NAMES[following] : "Wrap up"} href={nextHref} />
          </div>
          {/* The part's card, with the research behind it */}
          <PartCard place={place} step={step} more={more} />
        </div>
      )}

      {/* See it: a video and a model answer, whichever the part has */}
      {step === "see" && part.see && (
        <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
          <div className="flex min-w-0 flex-col gap-6">
            {/* Heading */}
            <h1 className="font-display text-statement leading-tight font-semibold">{part.see.clip ? "Watch it" : "See it done"}</h1>
            {/* Sage says the idea again, short */}
            <SageSays filled mood="calm"><p className="font-display text-cue leading-tight font-semibold">{part.learn.headline}</p></SageSays>
            {/* With no model answer, the clip or video here */}
            {!part.see.model && <div className="w-full max-w-sm">{media}</div>}
            {/* The model answer */}
            {part.see.model && <ModelAnswer model={part.see.model} />}
            {/* On */}
            <ActionBand action={following === "try" ? "Your turn" : "Next"} aside={following ? STEP_NAMES[following] : "Wrap up"} href={nextHref} />
          </div>
          {/* The clip beside the model answer, then the part's card */}
          <div className="flex min-w-0 flex-col gap-5">
            {part.see.model && media}
            <PartCard place={place} step={step} />
          </div>
        </div>
      )}

      {/* Try it: your blob waiting, the goal on the soft green, then the recording page */}
      {step === "try" && part.practice && (
        <div className={`${PRACTICE_BODY} ${PRACTICE_COLUMNS}`}>
          <div className="flex min-w-0 flex-col items-center gap-4 text-center">
            {/* The page's heading */}
            <h1 className="font-display text-statement leading-tight font-semibold">Your turn</h1>
            {/* Your blob, waiting where it will sing, in a soft ring */}
            <span className="my-2 grid size-44 place-items-center rounded-full border-4 border-warm-tint md:size-52">
              <Cast who="you" face="ready" className="size-32 md:size-40" />
            </span>
            {/* On a second try, how the first went */}
            {attempt > 1 && data.status === "ready" && (() => {
              // The first try
              const { first } = runTakes(data.takes, part.id);
              // Its value
              const value = first ? measureValue(part.practice.measure, first) : null;
              // Said, when there is one
              return value !== null ? <p className={`max-w-[48ch] px-5 py-3 text-lede font-bold ${CARD}`}>Try 1 · {MEASURE_NAMES[part.practice.measure]}: {measureText(part.practice.measure, value)}. Same topic, one more go.</p> : null;
            })()}
            {/* Start the take */}
            <div className="w-full max-w-md text-left"><ActionBand action={attempt > 1 ? "Try again" : "Start"} aside="opens the recorder" href={takeHref(part, Math.min(attempt, part.practice.tries))!} /></div>
            {/* A second try can be left out */}
            {attempt > 1 && <p><Link href={partHref(part.id, "wrap")} className={TEXT_LINK}>Skip the second try</Link></p>}
          </div>
          {/* The goal, then the part's card */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* The goal */}
            <section aria-label="Your one goal" className="rounded-[22px] bg-accent-tint px-5 py-4.5 text-accent-tint-ink">
              {/* Heading */}
              <p className="text-xs font-extrabold tracking-[.07em] uppercase">Your one goal</p>
              {/* The goal */}
              <p className="mt-1.5 font-display text-2xl leading-tight font-semibold">{part.practice.goal}</p>
            </section>
            {/* The part's card */}
            <PartCard place={place} step={step} />
          </div>
        </div>
      )}

      {/* Wrap up: once the takes are read */}
      {step === "wrap" && (
        <div className={PRACTICE_BODY}>
          {/* The page's heading for screen readers, until the takes are read */}
          {data.status !== "ready" && <h1 className="sr-only">Lesson {lessonNumber}: wrap-up</h1>}
          {/* Loading the takes */}
          {data.status === "loading" && <Skeleton blocks={["h-24", "h-40"]} />}
          {/* They could not be read */}
          {data.status === "failed" && <CourseLoadFailed retry={data.retry} />}
          {/* The wrap-up */}
          {data.status === "ready" && today && <WrapUp place={place} takes={data.takes} onDone={async (takeId) => void (await markPartDone(repo, part.id, takeId, new Date()))} />}
        </div>
      )}
    </main>
  );
}
