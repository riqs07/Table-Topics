"use client";
// Talk with someone: Quick play picks a situation and starts it, or a situation is chosen from a list; the person who answers is picked for you (decisions 83, 84 and 127). Laid out in the UI rewrite's second pass from Desktop Screens "Practice": "‹ Practice", the title with the two of you, Quick play as the sky band, then the situations as tile cards grouped by skill

// Load the page fade round a glide (decision 141)
import { PageFade } from "@/components/scenes/SharedScene";
// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the list page's title and the next-up band
import { HubTitle } from "@/components/script/HubTitle";
import { NextUpBand } from "@/components/script/NextUpBand";
// Load the card with a tile
import { TileRow } from "@/components/script/TileRow";
// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load each skill's tile
import { skillTile } from "@/components/scenes/skillTileFor";
// Load the shared heading and label looks
import { LAB, SECTION_HEADING } from "@/components/script/textStyles";
// Load the page shell
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the people, the situations, the goal for each and the quick pick
import { PERSONAS, SCENARIOS, conversationAddress, goalFor, personaFor, quickPick, type Scenario } from "@/content/conversations";
// Load the small-talk skills, to group the situations
import { UNITS } from "@/content/smallTalk";
// Load the saved passphrase, which means the coach can write lines for any situation
import { readPassphrase } from "@/data/passphrase";

// Whether the coach passphrase is saved (one function, so the reading effect runs once)
const passphraseSaved = () => readPassphrase() !== "";

// Draw the page
export function ConversationsScreen({ coachReady = passphraseSaved, ...props }: ScreenProps & { coachReady?: () => boolean }) {
  // The repository
  const { repo } = useScreenBasics(props);
  // The conversations so far, by situation (null until read)
  const [done, setDone] = useState<ReadonlyArray<{ scenarioId?: string | undefined }> | null>(null);
  // Whether the coach writes lines, so every situation can be played (read in the browser)
  const [written, setWritten] = useState(false);

  // Read once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    void repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // The coach, read here because the passphrase lives in the browser
      setWritten(coachReady());
      // Each conversation's situation
      setDone(sessions.filter((session) => session.mode === "conversation").map((session) => ({ scenarioId: session.conversation?.scenarioId })));
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, coachReady]);

  // The situations that can be played: all with the coach, otherwise those with recorded lines
  const playable = written ? SCENARIOS : SCENARIOS.filter((scenario) => PERSONAS.some((persona) => persona.home === scenario.id));
  // Quick play's pick, once the sessions are read
  const quick = done ? quickPick(done, written) : null;
  // Who answers a situation: whoever lives there, otherwise the next person in turn
  const answerer = (scenario: Scenario) => PERSONAS.find((persona) => persona.home === scenario.id) ?? personaFor(done?.length ?? 0);

  // Draw it
  return (
    <PageFade>
      <main id="main" className={PAGE}>
        {/* Heading and navigation */}
        <Masthead title="VoiceLab" section="practice" />
        {/* The way back, the page's name, and the two of you */}
        <HubTitle title="Talk with someone" line="A few exchanges out loud, about a minute. Then see how you did on one goal." figure={<span className="flex items-end gap-1"><Cast who="you" face="ready" className="size-18" /><Cast who="friend" face="happy" className="size-16" /></span>} />
        {/* Quick play: the situation picked, on the sky (the tile carried over from the Practice card, decision 141) */}
        <div data-wide className="mt-5 md:mt-7">
          <NextUpBand scene="conversation" look={quick ? skillTile(quick.scenario.unit) : undefined} ariaLabel="Quick play" label="Quick play · we pick, it starts" name={quick ? <span data-quick-pick>{quick.scenario.title}</span> : null} line={quick ? `With ${quick.persona.name}. Goal: ${goalFor(quick.scenario).text}` : undefined} href={quick ? conversationAddress(quick.persona, quick.scenario) : null} go="Quick play" />
        </div>
        {/* Or choose a situation, grouped by skill */}
        {done && (
          <section aria-labelledby="situations" data-wide className="mt-8">
            {/* The heading */}
            <h2 id="situations" className={SECTION_HEADING}>Or choose a situation</h2>
            {/* Without the coach, only some situations have lines */}
            {!written && <p className="mt-1 text-footnote font-bold text-ink-muted">Save the coach passphrase in Settings to unlock every situation.</p>}
            {/* The skills, two across on a computer */}
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {/* Each skill with situations */}
              {UNITS.filter((unit) => playable.some((scenario) => scenario.unit === unit.id)).map((unit) => (
                <section key={unit.id} aria-labelledby={`skill-${unit.id}`} data-skill={unit.id}>
                  {/* The skill */}
                  <h3 id={`skill-${unit.id}`} className={LAB}>{unit.name}</h3>
                  {/* Its situations, as tile cards */}
                  <ul className="mt-2.5 flex flex-col gap-3">
                    {/* Each situation, starting at once with whoever answers it */}
                    {playable.filter((scenario) => scenario.unit === unit.id).map((scenario, index) => {
                      // Its tile
                      const look = skillTile(scenario.unit);
                      // Who answers it
                      const persona = answerer(scenario);
                      // Its card
                      return <li key={scenario.id}><TileRow href={conversationAddress(persona, scenario)} label={`With ${persona.name}`} title={scenario.title} detail={`Goal: ${goalFor(scenario).text}`} ground={look.ground} prop={look.prop} face={look.face} tilt={index % 2 ? 4 : -4} /></li>;
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        )}
        {/* Where the voices come from, and where your words go (decision 97) */}
        <p className="mt-8 text-footnote font-bold text-ink-muted">Their voices are AI recordings by ElevenLabs. Your browser’s speech recognition, usually Apple’s or Google’s, turns what you say into text; with the coach, those words go to VoiceLab’s server to write their replies. No audio is kept.</p>
      </main>
    </PageFade>
  );
}
