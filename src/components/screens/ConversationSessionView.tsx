// A saved conversation with a persona (decisions 83 and 84): who and where, the share of the talking and the questions, one change (the coach's, or from the numbers until it arrives), one of your lines and how it could sound, and the whole conversation as text (no audio is kept)

// Load Next.js's lazy loader, for the timeline only a conversation shows (decision 115)
import dynamic from "next/dynamic";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the action band
import { ActionBand } from "@/components/script/ActionBand";
// Load the shared card look
import { CARD } from "@/components/script/textStyles";
// Load the personas and situations
import { findPersona, findScenario } from "@/content/conversations";
// Load the conversation measures and the note from them
import { conversationHeadline, localConversationNote, measureConversation } from "@/core/conversationMeasures";
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
  // Where the session belongs
  const home = sessionHome(session.mode, session.promptId, plan !== null);
  // Draw it
  return (
    <>
      {/* Title and the day */}
      <Masthead title="Conversation" section={home.section}>{plan ? `Step ${plan.step} of ${plan.total}` : dayLabel(new Date(session.createdAt), now)}</Masthead>
      {/* The results */}
      <section aria-labelledby="conversation-heading" className="mt-8 md:max-w-2xl">
        {/* Who, and how long */}
        <p className="text-footnote font-semibold text-accent">With {name}{scenario ? ` · ${scenario.title}` : ""} · {formatClock(session.durationSec)}</p>
        {/* The share and the questions */}
        <h1 id="conversation-heading" className="mt-1 font-display text-3xl font-semibold tracking-tight">{conversationHeadline(measures)}</h1>
        {/* The one change */}
        <div className={`mt-5 p-5 motion-safe:animate-rise ${CARD}`}>
          {/* The pill, and where it comes from until the coach's note arrives */}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="inline-flex rounded-full bg-warm-tint px-2.5 py-1 text-footnote font-semibold text-warm-ink">One change</span>{!session.feedback && <span className="text-footnote text-ink-muted">From your numbers</span>}</p>
          {/* The change */}
          <p className="mt-3 text-lede">{shown.change}</p>
          {/* Small heading for the cue */}
          <p className="mt-4 text-footnote text-ink-muted">Before you talk again</p>
          {/* The cue */}
          <p className="mt-1 font-display text-cue font-semibold tracking-tight">{shown.retryCue}</p>
          {/* One of your lines, and how it could sound */}
          {session.feedback?.conversation && (
            <>
              {/* Small heading */}
              <p className="mt-4 text-footnote text-ink-muted">You said</p>
              {/* Your line */}
              <p className="mt-1 text-lede">“{session.feedback.conversation.yours}”</p>
              {/* Small heading */}
              <p className="mt-3 text-footnote text-ink-muted">It could sound like</p>
              {/* The better version */}
              <p className="mt-1 text-lede">{session.feedback.conversation.better}</p>
            </>
          )}
        </div>
        {/* While the coach's note is on its way, or why it will not come */}
        {!session.feedback && (note || session.feedbackStatus === "failed") && <p className="mt-2 text-footnote text-ink-muted">{note || "The coach could not review this conversation."}</p>}
        {/* What worked, once the coach has looked */}
        {session.feedback && <p className="mt-5 text-lede"><em>What to keep.</em> <span>{session.feedback.keep}</span></p>}
        {/* The turns in two lanes, its own view (decision 115) */}
        <ConversationTimeline turns={turns} name={name} />
        {/* The whole conversation */}
        <h2 className="mt-8 font-display text-xl font-semibold tracking-tight">The conversation</h2>
        {/* Each turn */}
        <ol aria-label="The conversation" className="mt-3 flex flex-col gap-2">
          {turns.map((turn, index) => (
            <li key={index} className={`max-w-[85%] rounded-2xl px-3 py-2 ${turn.who === "you" ? "self-end bg-warm-tint text-warm-ink" : "self-start bg-card"}`}>
              {/* Who */}
              <span className="block text-footnote font-semibold">{turn.who === "you" ? "You" : name}</span>
              {/* What was said */}
              <span>{turn.text}</span>
            </li>
          ))}
        </ol>
        {/* Why there is nothing to play */}
        <p className="mt-4 text-footnote text-ink-muted">Your words are as the phone heard them. The audio is not kept.</p>
      </section>
      {/* Push the band down */}
      <div className="flex-1" />
      {/* Today's next step, or talk again */}
      {plan ? (plan.next ? <ActionBand action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <ActionBand action="Finish today’s practice" aside="back to Today" href="/" />) : <ActionBand action="Talk again" aside={`with ${name}`} href={`/conversations/talk?id=${session.promptId}`} />}
    </>
  );
}
