"use client";
// Talk with someone: the four people to have a short spoken conversation with, one per small-talk skill (decision 83)

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
// Load the characters
import { CHARACTERS } from "@/content/conversations";
// Load the small-talk units, for each skill's name
import { findUnit } from "@/content/smallTalk";

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
    <main className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="Practice" section="practice" />
      {/* The page's name */}
      <PageTitle title="Talk with someone">About 3 minutes, out loud. They talk, you answer, then tap Done.</PageTitle>
      {/* The people */}
      <ul aria-label="People to talk with" className={`mt-6 ${CARD_LIST}`}>
        {/* Each person */}
        {CHARACTERS.map((character) => {
          // How often
          const count = counts.get(character.id) ?? 0;
          // One row
          return (
            <li key={character.id}>
              <RowLink href={`/conversations/talk?id=${character.id}`} meta={`${findUnit(character.unit).name}${count === 0 ? "" : count === 1 ? " · once" : ` · ${count} times`}`}>
                {/* Who */}
                <span className="block font-semibold">{character.name}</span>
                {/* Who they are to you */}
                <span className="block text-footnote text-ink-muted">{character.role}</span>
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
