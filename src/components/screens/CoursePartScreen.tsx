"use client";
// One part of a guided course lesson (decision 131), one step at a time: learn the idea, see it done when there is something to see (a video or a model answer), try it (once or twice, on a mode the app already has), and wrap up with what changed and the way on

// Load React's effect and reference tools
import { useEffect, useRef } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { ActionBand } from "@/components/script/ActionBand";
import { Skeleton } from "@/components/script/Skeleton";
import { CourseLoadFailed } from "@/components/script/CourseLoadFailed";
// Load the shared looks
import { CARD, LABEL } from "@/components/script/textStyles";
import { TEXT_LINK } from "@/components/script/Buttons";
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the course data and the tab title helper
import { useCourseData } from "@/components/screens/useCourseData";
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the course rules
import { MEASURE_NAMES, compareLine, coursePlaces, findPart, measureText, measureValue, partHref, partSteps, takeHref, type PartPlace, type PartStep } from "@/core/courses";
// Load progress saving
import { markPartDone } from "@/data/courses";
// Load the Learn card finder, for the research behind an idea
import { findCard } from "@/content/learn";
// Load the record type
import type { SessionRecord } from "@/data/records";

// Each step's name in the step bar
const STEP_NAMES: Readonly<Record<PartStep, string>> = { learn: "Learn", see: "See it", try: "Try it", wrap: "Wrap up" };

// The step bar: one segment per step, done ones filled, the current one named in the accent
function StepBar({ steps, current }: { steps: ReadonlyArray<PartStep>; current: PartStep }) {
  // Where the current step sits
  const at = steps.indexOf(current);
  // The bar
  return (
    <ol aria-label={`Step ${at + 1} of ${steps.length}: ${STEP_NAMES[current]}`} className="mt-3 grid gap-1.5 text-footnote text-ink-muted" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {/* Each step */}
      {steps.map((step, index) => (
        // One segment and its name
        <li key={step} aria-current={step === current ? "step" : undefined} className={`flex flex-col gap-1 ${step === current ? "font-semibold text-accent" : ""}`}>
          {/* The segment */}
          <span aria-hidden="true" className={`h-1.5 rounded-full ${index <= at ? "bg-fill" : "bg-rule"}`} />
          {/* The name */}
          {STEP_NAMES[step]}
        </li>
      ))}
    </ol>
  );
}

// The model answer with its key words highlighted
function ModelAnswer({ model }: { model: NonNullable<NonNullable<PartPlace["part"]["see"]>["model"]> }) {
  // Where the highlight sits in the answer
  const at = model.answer.indexOf(model.highlight);
  // The card
  return (
    <section aria-label="Model answer" className={`mt-5 max-w-[52ch] p-5 ${CARD}`}>
      {/* The question */}
      <p className={LABEL}>Model answer · “{model.question}”</p>
      {/* The answer, the highlight marked */}
      <p className="mt-2 text-lede">{at < 0 ? model.answer : <>{model.answer.slice(0, at)}<mark className="rounded-md bg-warm-tint px-1 font-semibold text-warm-ink">{model.highlight}</mark>{model.answer.slice(at + model.highlight.length)}</>}</p>
      {/* What to notice */}
      <p className="mt-3 border-t border-rule pt-3 text-footnote text-ink-muted">Notice: {model.notice}</p>
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
    // The message and the way to try
    return (
      <div className="mt-8">
        {/* What is missing */}
        <p className="text-lede">No take for this part yet.</p>
        {/* The way to try */}
        <div className="mt-6"><ActionBand action="Try it" aside={part.practice.goal} href={takeHref(part, 1)!} /></div>
      </div>
    );
  }
  // What changed between the tries, or the one try's value
  const line = part.practice && first && second ? compareLine(part.practice.measure, first, second) : part.practice && last ? (() => {
    // The value
    const value = measureValue(part.practice.measure, last);
    // In words
    return value === null ? null : `${MEASURE_NAMES[part.practice.measure]}: ${measureText(part.practice.measure, value)}.`;
  })() : null;
  // The wrap-up
  return (
    <div className="mt-6 flex flex-1 flex-col">
      {/* Done */}
      <p className="text-footnote font-semibold text-accent">Part {place.partNumber} of {place.lesson.parts.length} done</p>
      {/* What changed, or a plain finish */}
      <h1 className="mt-1 max-w-[30ch] font-display text-statement tracking-tight">{line ?? part.title}</h1>
      {/* The goal it was about */}
      {part.practice && <p className="mt-2 max-w-[52ch] text-lede">You were working on: {part.practice.goal}</p>}
      {/* The full results */}
      {last && <p className="mt-3"><Link href={`/sessions?id=${last.id}`} className={TEXT_LINK}>See the full results</Link></p>}
      {/* It comes back later */}
      {part.practice && <p data-comes-back className="mt-5 max-w-[48ch] rounded-2xl border border-rule p-4"><span className="block font-semibold">This topic comes back in a few days</span><span className="block text-footnote text-ink-muted">Same question, a fresh answer. Then you hear both side by side.</span></p>}
      {/* Push the way on down */}
      <div className="flex-1" />
      {/* The next part, or back to the course */}
      <div className="mt-8">{after ? <ActionBand action="Next part" aside={`Lesson ${after.lessonNumber}, part ${after.partNumber} · ${after.part.title}`} href={partHref(after.part.id)} /> : <ActionBand action="Back to the course" aside="every part done" href={`/courses/course?id=${place.course.id}`} />}</div>
      {/* Or back to Today */}
      <p className="mt-3 text-center"><Link href="/" className={TEXT_LINK}>Back to today’s practice</Link></p>
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
      <main id="main" className={PAGE}>
        {/* Title and close */}
        <Masthead title="Lesson" nav={false} close={{ href: "/courses", label: "Close, back to Courses" }} />
        {/* The message */}
        <p className="mt-8 text-lede">This lesson could not be found. <Link href="/courses" className="underline underline-offset-4">Back to Courses</Link></p>
      </main>
    );
  }

  // The part
  const { part, lesson, lessonNumber, partNumber, course } = place;
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
  const close = { href: `/courses/course?id=${course.id}`, label: `Close, back to ${course.title}` };

  // Draw the page
  return (
    <main id="main" className={`${PAGE} flex flex-col`}>
      {/* Title and a way back to the course */}
      <Masthead title={`Lesson ${lessonNumber}`} nav={false} close={close} />
      {/* Where this part sits */}
      <p className="mt-2 text-footnote text-ink-muted">{course.title} · {lesson.title} · part {partNumber} of {lesson.parts.length}</p>
      {/* The steps */}
      <StepBar steps={steps} current={step} />

      {/* Learn: the idea */}
      {step === "learn" && (
        <div className="mt-6 flex flex-1 flex-col">
          {/* The idea, large */}
          <h1 className="max-w-[24ch] font-display text-statement tracking-tight">{part.learn.headline}</h1>
          {/* A few sentences */}
          <p className="mt-3 max-w-[52ch] text-lede">{part.learn.body}</p>
          {/* Instead of, and try */}
          {(part.learn.instead || part.learn.tryThis) && (
            <section aria-label="An example" className={`mt-5 max-w-[52ch] p-5 ${CARD}`}>
              {/* The weaker way */}
              {part.learn.instead && <><p className="text-footnote font-semibold uppercase tracking-wide text-ink-muted">Instead of</p><p className="mt-1 text-lede text-ink-muted">{part.learn.instead}</p></>}
              {/* The better way */}
              {part.learn.tryThis && <><p className={`text-footnote font-semibold uppercase tracking-wide text-accent ${part.learn.instead ? "mt-3 border-t border-rule pt-3" : ""}`}>Try</p><p className="mt-1 font-display text-cue">{part.learn.tryThis}</p></>}
            </section>
          )}
          {/* The research behind it, and a practice the course cannot record itself, when the part has them */}
          {(card || part.learn.link) && (
            <ul aria-label="More on this" className="mt-5 flex max-w-[52ch] flex-col gap-2">
              {/* The Learn card */}
              {card && <li><Link data-course-card={card.id} href={`/learn/card?id=${card.id}`} className={TEXT_LINK}>Why it works: {card.keyLine}</Link></li>}
              {/* The practice elsewhere */}
              {part.learn.link && <li><Link data-course-link href={part.learn.link.href} className={TEXT_LINK}>{part.learn.link.label}</Link></li>}
            </ul>
          )}
          {/* Push the way on down */}
          <div className="flex-1" />
          {/* On */}
          <div className="mt-8"><ActionBand action="Next" aside={following ? STEP_NAMES[following] : "Wrap up"} href={nextHref} /></div>
        </div>
      )}

      {/* See it: a video and a model answer, whichever the part has */}
      {step === "see" && part.see && (
        <div className="mt-6 flex flex-1 flex-col">
          {/* Heading */}
          <h1 className="font-display text-statement tracking-tight">{part.see.clip ? "Watch it" : "See it done"}</h1>
          {/* Our own lesson clip (decision 146): 4:5, tap to play, its words burned in and readable below instead */}
          {part.see.clip && (
            <figure data-lesson-clip className="mt-5 w-full max-w-sm">
              {/* The clip: nothing loads until it is played */}
              <video src={part.see.clip.src} poster={part.see.clip.poster} controls playsInline preload="none" aria-label={part.see.clip.title} className="aspect-[4/5] w-full rounded-2xl border border-rule bg-ink object-cover" />
              {/* Its words, for anyone who would rather read */}
              <details className="mt-3 text-footnote">
                {/* The toggle */}
                <summary className="cursor-pointer font-semibold">Read it instead</summary>
                {/* The words */}
                <p className="mt-2 max-w-[52ch] text-lede">{part.see.clip.transcript}</p>
              </details>
            </figure>
          )}
          {/* The video, in YouTube's privacy-enhanced player */}
          {part.see.video && (
            <div className="mt-5 aspect-video w-full max-w-2xl overflow-hidden rounded-2xl bg-ink">
              {/* The player */}
              <iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(part.see.video.youtubeId)}?rel=0${part.see.video.start ? `&start=${part.see.video.start}` : ""}${part.see.video.end ? `&end=${part.see.video.end}` : ""}`} title={part.see.video.title} className="size-full" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="lazy" />
            </div>
          )}
          {/* The model answer */}
          {part.see.model && <ModelAnswer model={part.see.model} />}
          {/* Push the way on down */}
          <div className="flex-1" />
          {/* On */}
          <div className="mt-8"><ActionBand action={following === "try" ? "Your turn" : "Next"} aside={following ? STEP_NAMES[following] : "Wrap up"} href={nextHref} /></div>
        </div>
      )}

      {/* Try it: the goal, then the recording page */}
      {step === "try" && part.practice && (
        <div className="mt-6 flex flex-1 flex-col">
          {/* Which try */}
          <p className="text-footnote font-semibold text-accent">{part.practice.tries > 1 ? `Try ${Math.min(attempt, part.practice.tries)} of ${part.practice.tries}` : "Your try"}</p>
          {/* The goal */}
          <section aria-label="Your one goal" className="mt-2 max-w-[48ch] rounded-2xl bg-warm-tint p-5 text-warm-ink">
            {/* Heading */}
            <p className="text-footnote font-semibold">Your one goal</p>
            {/* The goal */}
            <p className="mt-1 font-display text-cue text-ink">{part.practice.goal}</p>
          </section>
          {/* On a second try, how the first went */}
          {attempt > 1 && data.status === "ready" && (() => {
            // The first try
            const { first } = runTakes(data.takes, part.id);
            // Its value
            const value = first ? measureValue(part.practice.measure, first) : null;
            // Said, when there is one
            return value !== null ? <p className="mt-4 text-lede">Try 1 · {MEASURE_NAMES[part.practice.measure]}: {measureText(part.practice.measure, value)}. Same topic, one more go.</p> : null;
          })()}
          {/* Push the way on down */}
          <div className="flex-1" />
          {/* Start the take */}
          <div className="mt-8"><ActionBand action={attempt > 1 ? "Try again" : "Start"} aside="opens the recorder" href={takeHref(part, Math.min(attempt, part.practice.tries))!} /></div>
          {/* A second try can be left out */}
          {attempt > 1 && <p className="mt-3 text-center"><Link href={partHref(part.id, "wrap")} className={TEXT_LINK}>Skip the second try</Link></p>}
        </div>
      )}

      {/* Wrap up: once the takes are read */}
      {step === "wrap" && data.status === "loading" && <Skeleton blocks={["h-24", "h-40"]} />}
      {step === "wrap" && data.status === "failed" && <CourseLoadFailed retry={data.retry} />}
      {step === "wrap" && data.status === "ready" && today && <WrapUp place={place} takes={data.takes} onDone={async (takeId) => void (await markPartDone(repo, part.id, takeId, new Date()))} />}
    </main>
  );
}
