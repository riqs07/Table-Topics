// A saved conversation with a persona (decisions 83 and 84; laid out as Desktop Screens "TalkResult" in the UI rewrite's second pass): who and where, the share of the talking and the questions with the two of you pleased or not, one change (the coach's, or from the numbers until it arrives) with one of your lines and how it could sound, who talked when, then the whole conversation as bubbles beside it (no audio is kept)

// Load Next.js's lazy loader, for the timeline only a conversation shows (decision 115)
import dynamic from "next/dynamic";
// Load Next.js's link component
import Link from "next/link";
// Load the practice bar and the columns
import { PRACTICE_COLUMNS, PracticeBar, STEP_LABEL } from "@/components/script/PracticeBar";
// Load the shared button looks
import { PRIMARY, QUIET } from "@/components/script/Buttons";
// Load the shared card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the personas and situations
import { findPersona, findScenario, goalFor } from "@/content/conversations";
// Load the conversation measures and the note from them
import { conversationHeadline, goalHeadline, goalProgress, localConversationNote, measureConversation } from "@/core/conversationMeasures";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the day label
import { dayLabel } from "@/core/copy";
// Load where a session belongs
import { sessionHome } from "@/core/sessionHome";
// Load the plan position type
import type { PlanNav } from "@/components/screens/planNav";
// Load the session type
import type { SessionRecord } from "@/data/records";

// The conversation's timeline, loaded after the page is up (decision 115)
const ConversationTimeline = dynamic(() => import("@/components/script/ConversationTimeline").then((module) => module.ConversationTimeline), { ssr: false });

// Words reduced to letters and spaces, to find the line the one change is about
function plain(text: string): string {
  // Lower case, no punctuation, single spaces
  return text.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
}

// Draw a saved conversation
export function ConversationSessionView({ session, now, note, plan }: { session: SessionRecord; now: Date; note: string; plan: PlanNav | null }) {
  // Who it was with
  const persona = findPersona(session.promptId);
  // Their name
  const name = persona?.name ?? "them";
  // The situation: the one saved, or their own for conversations from before situations
  const scenario = findScenario(session.conversation?.scenarioId ?? persona?.home ?? "");
  // Every turn
  const turns = session.conversation?.turns ?? [];
  // The numbers
  const measures = measureConversation(turns);
  // The change from the numbers, until the coach's arrives
  const own = localConversationNote(name, scenario?.unit ?? "answering", measures);
  // The change and cue to show
  const shown = session.feedback ?? own;
  // The situation's goal, and how far it got (decision 127)
  const goal = scenario ? goalFor(scenario) : null;
  // Its progress
  const progress = goal ? goalProgress(goal, measures) : null;
  // Where the session belongs
  const home = sessionHome(session.mode, session.promptId, plan !== null);
  // The line the one change is about, when the coach picked one of yours that is in the conversation
  const yours = session.feedback?.conversation ? plain(session.feedback.conversation.yours) : "";
  // Its place among the turns
  const found = yours ? turns.findIndex((turn) => turn.who === "you" && (plain(turn.text).includes(yours) || yours.includes(plain(turn.text)))) : -1;
  // (none when not found)
  const highlight = found >= 0 ? found : null;
  // Whether it went well enough for both to look pleased: the goal met, or (without one) a question asked
  const pleased = progress ? progress.met : measures.questions > 0;
  // Where to talk again
  const againHref = scenario ? `/conversations/talk?id=${session.promptId}&situation=${scenario.id}&start=1` : `/conversations/talk?id=${session.promptId}`;
  // Draw it
  return (
    <>
      {/* The bar: the way out, finished, and what this was */}
      <PracticeBar className="-mt-6 md:-mt-10" close={{ href: home.href, label: home.label }} progress={1} label={plan ? `Talk with someone · step ${plan.step} of ${plan.total}` : `Talk with someone · ${dayLabel(new Date(session.createdAt), now)}`} />
      {/* The results and the conversation side by side on a computer */}
      <div data-wide className={`mx-auto mt-4 w-full max-w-[1240px] md:mt-6 ${PRACTICE_COLUMNS}`}>
        <section aria-labelledby="conversation-heading" className="flex min-w-0 flex-col gap-5">
          {/* Who, how long, the headline, and the two of you */}
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-2">
              {/* Who, and how long */}
              <p className={STEP_LABEL}>With {name}{scenario ? ` · ${scenario.title}` : ""}{session.conversation?.difficulty && session.conversation.difficulty !== "normal" ? ` · ${session.conversation.difficulty === "hard" ? "Hard" : "Easy"}` : ""} · {formatClock(session.durationSec)}</p>
              {/* The goal first, when the situation has one (decision 127); otherwise the share and the questions */}
              <h1 id="conversation-heading" className="font-display text-3xl font-semibold leading-tight md:text-statement">{goal ? goalHeadline(goal, measures) : conversationHeadline(measures)}</h1>
            </div>
            {/* The two of you, pleased when it went well */}
            <div aria-hidden="true" className="flex flex-none items-end gap-1">
              {/* You */}
              <Cast who="you" face={pleased ? "happy" : "ready"} className="size-20 md:size-28" />
              {/* Them */}
              <Cast who="friend" face={pleased ? "happy" : "side-left"} className="size-16 md:size-22" />
            </div>
          </div>
          {/* The goal's dots, its words, and the share and questions underneath */}
          {goal && progress && (
            <div data-goal-result className="-mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {/* One dot per part of the goal, filled when done */}
              <span aria-hidden="true" className="inline-flex gap-1">
                {Array.from({ length: progress.target }, (_, index) => (
                  <span key={index} className={`inline-block size-3 rounded-full ${index < progress.done ? "bg-accent" : "border-2 border-rule"}`} />
                ))}
              </span>
              {/* The goal */}
              <span className="text-footnote font-bold text-ink-muted">Goal: {goal.text}</span>
              {/* The share and questions, now second */}
              {measures.turns > 0 && measures.share !== null && <span className="text-footnote font-bold text-ink-muted">{conversationHeadline(measures)}</span>}
            </div>
          )}
          {/* The one change */}
          <div className={`flex flex-col gap-3.5 p-5 motion-safe:animate-rise md:px-6 ${CARD}`}>
            {/* The label, and where it comes from until the coach's note arrives */}
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className={LAB}>One change</span>{!session.feedback && <span className="text-footnote text-ink-muted">From your numbers</span>}</p>
            {/* The cue, in the display face */}
            <p className="font-display text-cue font-semibold leading-tight">{shown.retryCue}</p>
            {/* One of your lines, and how it could sound */}
            {session.feedback?.conversation && (
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Yours */}
                <div className="flex flex-col gap-1.5 rounded-2xl bg-paper px-4 py-3.5">
                  {/* Small heading */}
                  <span className={LAB}>You said</span>
                  {/* Your line */}
                  <span className="text-lg font-bold">“{session.feedback.conversation.yours}”</span>
                </div>
                {/* How it could sound */}
                <div className="flex flex-col gap-1.5 rounded-2xl bg-accent-tint px-4 py-3.5 text-accent-tint-ink">
                  {/* Small heading */}
                  <span className={STEP_LABEL}>It could sound like</span>
                  {/* The better version */}
                  <span className="text-lg font-bold">{session.feedback.conversation.better}</span>
                </div>
              </div>
            )}
            {/* Why, in plain words */}
            <p className="font-semibold text-ink-muted">{shown.change}</p>
          </div>
          {/* While the coach's note is on its way, or why it will not come */}
          {!session.feedback && (note || session.feedbackStatus === "failed") && <p className="-mt-2 text-footnote text-ink-muted">{note || "The coach could not review this conversation."}</p>}
          {/* What worked, once the coach has looked */}
          {session.feedback && <p className="text-lede"><em className="font-bold not-italic">What to keep.</em> <span>{session.feedback.keep}</span></p>}
          {/* The turns in two lanes, its own view (decision 115), with their times and cut-ins (decision 120; exact when the turns were live) */}
          <ConversationTimeline turns={turns} name={name} live={session.conversation?.turnMode === "live" || session.conversation?.turnMode === "call"} highlight={highlight} />
          {/* Today's next step, or talk again; and the way back */}
          <p className="mt-1 flex flex-wrap items-center gap-3.5">
            {/* The main action */}
            {plan ? (plan.next ? <Link href={plan.next.href} className={PRIMARY}>Next: step {plan.step + 1}<span className="sr-only"> {plan.next.label}</span></Link> : <Link href="/" className={PRIMARY}>Finish today’s practice<span className="sr-only"> back to Today</span></Link>) : <Link href={againHref} className={PRIMARY}>Talk again<span className="sr-only"> {scenario ? scenario.title : `with ${name}`}</span></Link>}
            {/* The way back */}
            {!plan && <Link href={home.href} className={QUIET}>Back to Conversations</Link>}
          </p>
        </section>
        {/* The whole conversation, as bubbles */}
        <aside aria-labelledby="conversation-turns" className={`flex min-w-0 flex-col lg:sticky lg:top-6 lg:max-h-[calc(100dvh-7rem)] ${CARD}`}>
          {/* The heading and the count */}
          <div className="flex items-baseline gap-3 px-5 pt-5">
            {/* The heading */}
            <h2 id="conversation-turns" className={LAB}>The conversation</h2>
            {/* How many turns */}
            <span className="ml-auto text-sm font-bold text-ink-muted">{turns.length} {turns.length === 1 ? "turn" : "turns"}</span>
          </div>
          {/* Each turn, theirs on the left by the friend and yours on the right; scrolls on its own on a computer */}
          <ol aria-label="The conversation" tabIndex={0} className="flex flex-col gap-3 overflow-y-auto px-5 pt-4 pb-5 focus-visible:outline-offset-[-3px]">
            {turns.map((turn, index) => (
              <li key={index} data-said={turn.who} className={`flex items-end gap-2 ${turn.who === "you" ? "justify-end" : ""}`}>
                {/* The friend beside their lines */}
                {turn.who === "them" && <Cast who="friend" face="ready" still className="size-8" />}
                {/* The bubble */}
                <span className={`max-w-[85%] rounded-[18px] border-2 px-4 py-2.5 ${turn.who === "you" ? "border-transparent bg-warm-tint text-warm-ink" : "border-rule bg-card"}`}>
                  {/* Who */}
                  <span className="block text-sm font-extrabold">{turn.who === "you" ? "You" : name}</span>
                  {/* What was said */}
                  <span>{turn.text}</span>
                  {/* The line the one change is about */}
                  {index === highlight && <span className={`mt-1 block ${LAB} text-warm-ink`}><span className="sr-only"> · </span>One change is about this line</span>}
                </span>
              </li>
            ))}
          </ol>
          {/* Why there is nothing to play */}
          <p className="border-t-2 border-rule px-5 py-3 text-sm font-bold text-ink-muted">Your words are as the phone heard them. The audio is not kept.</p>
        </aside>
      </div>
    </>
  );
}
