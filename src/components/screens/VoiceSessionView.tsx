// A saved voice drill or shadowing session, opened from History (decision 80): its headline and a line per take (the takes' audio is not kept)

// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the action band
import { ActionBand } from "@/components/script/ActionBand";
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
  // Draw it
  return (
    <>
      {/* Title and the day */}
      <Masthead title={voice ? VOICE_MODE_NAMES[voice.kind] : "Voice drill"} section={home.section}>{plan ? `Step ${plan.step} of ${plan.total}` : dayLabel(new Date(session.createdAt), now)}</Masthead>
      {/* The findings */}
      <section aria-labelledby="voice-heading" className="mt-8 md:max-w-2xl">
        {/* Which drill */}
        <p className="text-footnote font-semibold text-accent">{name ?? "Voice drill"}</p>
        {/* The headline */}
        <h1 id="voice-heading" className="mt-1 font-display text-statement font-semibold tracking-tight">{voice?.headline ?? "Done."}</h1>
        {/* A line per take */}
        {voice && voice.takes.length > 0 && (
          <ol aria-label="Your takes" className="mt-6 flex flex-col gap-3">
            {/* Each take */}
            {voice.takes.map((take, index) => (
              <li key={`${take.label}-${index}`} className="rounded-2xl bg-card p-4">
                {/* Its name */}
                <p className="font-semibold">{take.label}</p>
                {/* What it showed */}
                <p className="mt-0.5 text-footnote text-ink-muted">{take.line}</p>
              </li>
            ))}
          </ol>
        )}
        {/* Why there is nothing to play */}
        <p className="mt-4 text-footnote text-ink-muted">Voice drill takes are not kept, only these lines.</p>
      </section>
      {/* Push the band down */}
      <div className="flex-1" />
      {/* Today's next step, or the drill again */}
      {plan ? (plan.next ? <ActionBand action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <ActionBand action="Finish today’s practice" aside="back to Today" href="/" />) : <ActionBand action="Do it again" aside={name ?? "this drill"} href={again} />}
    </>
  );
}
