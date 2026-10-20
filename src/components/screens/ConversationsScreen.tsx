"use client";
// Talk with someone: the four personas to have a short spoken conversation with, each in a new situation every time (decisions 83 and 84)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the page title
import { PageTitle } from "@/components/script/PageTitle";
// Load the whole-row link
import { RowLink } from "@/components/script/Buttons";
// Load the card list look
import { CARD_LIST } from "@/components/script/textStyles";
// Load the page shell
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the personas
import { PERSONAS } from "@/content/conversations";

// Draw the page
export function ConversationsScreen(props: ScreenProps) {
  // The repository
  const { repo } = useScreenBasics(props);
  // How many conversations with each person
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(new Map());

  // Count once in the browser
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    void repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // Count by person
      const next = new Map<string, number>();
      // Each conversation adds one
      for (const session of sessions) if (session.mode === "conversation") next.set(session.promptId, (next.get(session.promptId) ?? 0) + 1);
      // Keep them
      setCounts(next);
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo]);

  // Draw it
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Practice" section="practice" />
      {/* The page's name */}
      <PageTitle title="Talk with someone">About 3 minutes, out loud. They talk, you answer, then tap Done.</PageTitle>
      {/* The people */}
      <ul aria-label="People to talk with" className={`mt-6 ${CARD_LIST}`}>
        {/* Each person */}
        {PERSONAS.map((persona) => {
          // How often
          const count = counts.get(persona.id) ?? 0;
          // One row
          return (
            <li key={persona.id}>
              <RowLink href={`/conversations/talk?id=${persona.id}`} meta={count === 0 ? "" : count === 1 ? "once" : `${count} times`}>
                {/* Who */}
                <span className="block font-semibold">{persona.name}</span>
                {/* What they are like */}
                <span className="block text-footnote text-ink-muted">{persona.tagline}</span>
              </RowLink>
            </li>
          );
        })}
      </ul>
      {/* Where the voices come from */}
      <p className="mt-4 text-footnote text-ink-muted">Their voices are AI recordings by ElevenLabs.</p>
    </main>
  );
}
