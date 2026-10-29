"use client";
// Talk with someone: Quick play picks a situation and starts it, or a situation is chosen from a list; the person who answers is picked for you (decisions 83, 84 and 127)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the page title
import { PageTitle } from "@/components/script/PageTitle";
// Load the main and second button links
import { PrimaryLink, SecondaryLink } from "@/components/script/Buttons";
// Load the card look and the small label look
import { CARD, LABEL } from "@/components/script/textStyles";
// Load the page shell
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the people, the situations, the goal for each and the quick pick
import { PERSONAS, SCENARIOS, conversationAddress, goalFor, personaFor, quickPick } from "@/content/conversations";
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
  // The situation chosen in the list
  const [chosen, setChosen] = useState("");

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
  // The situation chosen in the list, if it can be played
  const picked = playable.find((scenario) => scenario.id === chosen);
  // Who answers it: whoever lives there, otherwise the next person in turn
  const pickedPersona = picked ? (PERSONAS.find((persona) => persona.home === picked.id) ?? personaFor(done?.length ?? 0)) : null;

  // Draw it
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Practice" section="practice" />
      {/* The page's name */}
      <PageTitle title="Talk with someone">A few exchanges out loud, about a minute. Then see how you did on one goal.</PageTitle>
      {/* Quick play */}
      <section aria-label="Quick play" className={`mt-6 p-5 ${CARD}`}>
        {/* What it does */}
        <p className={LABEL}>We pick the situation and it starts.</p>
        {/* The pick, once known */}
        {quick && (
          <p data-quick-pick className="mt-1 text-footnote text-ink-muted">
            Next up: {quick.scenario.title}. Goal: {goalFor(quick.scenario).text}
          </p>
        )}
        {/* Go */}
        <div className="mt-4">{quick ? <PrimaryLink href={conversationAddress(quick.persona, quick.scenario)}>Quick play</PrimaryLink> : <span className="text-footnote text-ink-muted">Getting ready…</span>}</div>
      </section>
      {/* Choose a situation */}
      <section aria-label="Choose a situation" className={`mt-4 p-5 ${CARD}`}>
        {/* The list's label */}
        <label htmlFor="situation" className={LABEL}>
          Or choose a situation
        </label>
        {/* The situations, grouped by skill */}
        <select id="situation" value={chosen} onChange={(event) => setChosen(event.target.value)} className="mt-1 block min-h-11 w-full max-w-full border-b border-ink bg-transparent">
          {/* Nothing chosen yet */}
          <option value="">Pick one…</option>
          {/* Each skill with situations */}
          {UNITS.filter((unit) => playable.some((scenario) => scenario.unit === unit.id)).map((unit) => (
            <optgroup key={unit.id} label={unit.name}>
              {/* Each situation */}
              {playable
                .filter((scenario) => scenario.unit === unit.id)
                .map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        {/* The chosen situation's goal, and its start */}
        {picked && pickedPersona && (
          <div className="mt-3">
            {/* The goal */}
            <p data-picked-goal className="text-footnote text-ink-muted">
              Goal: {goalFor(picked).text}
            </p>
            {/* Start */}
            <div className="mt-3">
              <SecondaryLink href={conversationAddress(pickedPersona, picked)}>Start this one</SecondaryLink>
            </div>
          </div>
        )}
        {/* Without the coach, only some situations have lines */}
        {!written && <p className="mt-3 text-footnote text-ink-muted">Save the coach passphrase in Settings to unlock every situation.</p>}
      </section>
      {/* Where the voices come from, and where your words go (decision 97) */}
      <p className="mt-4 text-footnote text-ink-muted">Their voices are AI recordings by ElevenLabs. Your browser’s speech recognition, usually Apple’s or Google’s, turns what you say into text; with the coach, those words go to VoiceLab’s server to write their replies. No audio is kept.</p>
    </main>
  );
}
