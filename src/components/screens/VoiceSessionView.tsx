// A saved voice drill or shadowing session, opened from History (decision 80): its headline and a line per take (the takes' audio is not kept). Second design pass, after Desktop Screens "Result": the label and headline, each take's line on a card, and beside them the verdict panel with your blob and the one chunky next step

// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the step label
import { STEP_LABEL } from "@/components/script/PracticeBar";
// Load the card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the verdict panel and the next step
import { NextLink, VerdictPanel } from "@/components/script/VoiceTakeStage";
// Load the voice content
import { VOICE_MODE_NAMES, findShadowPassage, findVoiceDrill } from "@/content/voice";
// Load the day label
import { dayLabel } from "@/core/copy";
// Load where a session belongs
import { sessionHome } from "@/core/sessionHome";
// Load the plan position type
import type { PlanNav } from "@/components/screens/planNav";
// Load the session type
import type { SessionRecord } from "@/data/records";

// Draw a saved voice session
export function VoiceSessionView({ session, now, plan }: { session: SessionRecord; now: Date; plan: PlanNav | null }) {
  // What was saved
  const voice = session.voice;
  // The drill's or passage's name
  const name = voice?.kind === "shadow" ? findShadowPassage(session.promptId)?.title : findVoiceDrill(session.promptId)?.title;
  // Where the session belongs
  const home = sessionHome(session.mode, session.promptId, plan !== null);
  // Where to do it again
  const again = voice?.kind === "shadow" ? `/voice/shadow?id=${session.promptId}` : `/voice/drill?id=${session.promptId}`;
  // How many takes were kept
  const count = voice?.takes.length ?? 0;
  // Draw it
  return (
    <>
      {/* Title and the day */}
      <Masthead title={voice ? VOICE_MODE_NAMES[voice.kind] : "Voice drill"} section={home.section}>{plan ? `Step ${plan.step} of ${plan.total}` : dayLabel(new Date(session.createdAt), now)}</Masthead>
      {/* The findings */}
      <div className="mt-6 md:mt-8">
        {/* Which drill */}
        <p className={STEP_LABEL}>{voice ? VOICE_MODE_NAMES[voice.kind] : "Voice drill"} · {name ?? "Voice drill"}</p>
        {/* The headline */}
        <h1 id="voice-heading" className="mt-2 max-w-[28ch] font-display text-statement leading-tight font-semibold">{voice?.headline ?? "Done."}</h1>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10">
          <section aria-labelledby="voice-heading" className="flex min-w-0 flex-col">
            {/* A line per take */}
            {voice && voice.takes.length > 0 && (
              <ol aria-label="Your takes" className="flex flex-col gap-3">
                {/* Each take */}
                {voice.takes.map((take, index) => (
                  <li key={`${take.label}-${index}`} className={`p-5 ${CARD}`}>
                    {/* Its name */}
                    <p className={LAB}>Take {index + 1} · {take.label}</p>
                    {/* What it showed */}
                    <p className="mt-1 font-display text-lg font-semibold">{take.line}</p>
                  </li>
                ))}
              </ol>
            )}
            {/* Why there is nothing to play */}
            <p className="mt-3 text-footnote text-ink-muted">Voice drill takes are not kept, only these lines.</p>
          </section>
          {/* What it was, and what next (first on a phone) */}
          <div className="max-lg:order-first">
            <VerdictPanel tone="good" face="happy" headingId="voice-done-panel" heading={count === 1 ? "1 take done." : `${count} takes done.`}>
              {/* Which drill */}
              <p className="font-bold text-ink">{name ?? "This drill"} · {dayLabel(new Date(session.createdAt), now)}</p>
              {/* Today's next step, or the drill again */}
              {plan ? (plan.next ? <NextLink action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <NextLink action="Finish today’s practice" aside="back to Today" href="/" />) : <NextLink action="Do it again" aside={name ?? "this drill"} href={again} />}
            </VerdictPanel>
          </div>
        </div>
      </div>
    </>
  );
}
