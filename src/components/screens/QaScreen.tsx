"use client";
// Q&A practice: likely audience questions for a rehearsal or a response, each with a way to answer it (plan step B3)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the shared button style
import { PRIMARY, SecondaryLink, TEXT_LINK } from "@/components/script/Buttons";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the passphrase saved in this browser
import { readPassphrase } from "@/data/passphrase";
// Load the questions client
import { requestQuestions, saveOwnQuestions, type QuestionsOutcome } from "@/data/questionsClient";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// What the page needs from storage
interface Loaded {
  // The session the questions are for, or null if it is not on this device
  source: SessionRecord | null;
  // Answers already recorded to its questions
  answers: SessionRecord[];
}

// What to tell the user when asking the coach did not work
function failureNote(outcome: QuestionsOutcome, reason: string | null): string {
  // The server's own words, when it gave some
  const because = reason ? ` (${reason})` : "";
  // One sentence per outcome
  switch (outcome) {
    // No passphrase, or the wrong one
    case "needs-passphrase":
      return `Add the passphrase in Settings to get suggested questions, or write your own below${because}.`;
    // The server is missing a setting
    case "not-set-up":
      return `The server is not set up for suggestions yet${because}. Write your own below.`;
    // A safety decline
    case "declined":
      return "The coach could not write questions for this one. Write your own below.";
    // The session is gone
    case "invalid":
      return "This session could not be found on this device.";
    // Anything that can be tried again
    default:
      return `The coach could not be reached${because}. Try again later, or write your own below.`;
  }
}

// How many answers a question has, in words
function answeredText(count: number): string {
  // None, once, or a number of times
  return count === 0 ? "not answered yet" : count === 1 ? "answered once" : `answered ${count} times`;
}

// The page
export function QaScreen({ fromId, passphrase, fetchFn, ...props }: ScreenProps & { fromId: string; passphrase?: string; fetchFn?: typeof fetch }) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // The session and its answers, once loaded
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // The questions typed by the user
  const [ownText, setOwnText] = useState("");
  // Whether the coach is being asked
  const [asking, setAsking] = useState(false);
  // A note when asking failed
  const [note, setNote] = useState("");

  // Load the session and its answers
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read both
    Promise.all([repo.getSession(fromId), repo.listSessions()]).then(([source, sessions]) => {
      // Keep them if still open
      if (!cancelled) setLoaded({ source: source ?? null, answers: sessions.filter((session) => session.mode === "qa" && session.promptId === fromId) });
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, fromId]);

  // Ask the coach for three questions
  async function suggest() {
    // Show that it is working
    setAsking(true);
    // Clear any old note
    setNote("");
    // Ask
    const result = await requestQuestions(repo, fromId, { passphrase: passphrase ?? readPassphrase(), ...(fetchFn ? { fetchFn } : {}) });
    // Done asking
    setAsking(false);
    // Show the questions, or say why not
    if (result.outcome === "done" && loaded?.source) setLoaded({ ...loaded, source: { ...loaded.source, questions: result.questions } });
    // Otherwise the note
    else setNote(failureNote(result.outcome, result.reason));
  }

  // Use the questions the user typed
  async function applyOwn() {
    // Save them
    const questions = await saveOwnQuestions(repo, fromId, ownText);
    // Nothing typed
    if (questions.length === 0) return setNote("Type at least one question, one per line.");
    // Show them
    if (loaded?.source) setLoaded({ ...loaded, source: { ...loaded.source, questions } });
    // Clear the field and any note
    setOwnText("");
    // (and the note)
    setNote("");
  }

  // Still loading
  if (!loaded || !today) return <main className="mx-auto min-h-dvh max-w-5xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10"><Masthead title="Q&A practice" section="practice" /></main>;

  // The session is not here
  if (!loaded.source) {
    // Say so
    return (
      <main className="mx-auto min-h-dvh max-w-5xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
        {/* Heading and navigation */}
        <Masthead title="Q&A practice" section="practice" />
        {/* The note */}
        <p className="mt-6 text-lede">This session is not on this device.</p>
      </main>
    );
  }

  // The questions so far
  const questions = loaded.source.questions ?? [];

  // Draw the page
  return (
    <main className="mx-auto min-h-dvh max-w-5xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Heading and navigation */}
      <Masthead title="Q&A practice" section="practice" />

      {/* What this is */}
      <p className="mt-6 max-w-[52ch] text-lede">After a talk come the questions. Answer each one in about a minute: answer it directly, give one reason or example, then stop.</p>

      {/* The questions */}
      {questions.length > 0 && (
        <ol aria-label="Questions" className="mt-8 divide-y divide-rule border-y border-ink">
          {/* Each question */}
          {questions.map((question, index) => (
            // One question
            <li key={index} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
              {/* The question */}
              <span className="min-w-0 basis-full font-display text-cue md:basis-0 md:flex-1">{question}</span>
              {/* How often it was answered */}
              <span className="text-footnote text-ink-muted">{answeredText(loaded.answers.filter((answer) => answer.question === question).length)}</span>
              {/* Answer it */}
              <SecondaryLink href={`/session?mode=qa&prompt=${fromId}&question=${index}`} label={`Answer “${question}”`}>Answer</SecondaryLink>
            </li>
          ))}
        </ol>
      )}

      {/* Ask the coach */}
      <section className="mt-8">
        {/* The button */}
        <button type="button" disabled={asking} onClick={() => void suggest()} className={PRIMARY}>{asking ? "Asking…" : questions.length ? "Suggest three new questions" : "Suggest three questions"}</button>
        {/* What is sent */}
        <p className="mt-2 max-w-[52ch] text-footnote text-ink-muted">Sends what you said in this run to the coach. A rehearsal’s script never leaves this device.</p>
        {/* Why it did not work */}
        {note && <p role="status" className="mt-3 max-w-[52ch]">{note}</p>}
      </section>

      {/* Write your own */}
      <section className="mt-8 flex flex-col gap-2">
        {/* The field */}
        <label className="flex flex-col gap-1">
          {/* Its name */}
          <span>Or write your own, one per line</span>
          {/* The text */}
          <textarea value={ownText} onChange={(event) => setOwnText(event.target.value)} rows={4} maxLength={1500} className="border border-rule bg-paper p-3" />
        </label>
        {/* Use them */}
        <button type="button" onClick={() => void applyOwn()} className={`${TEXT_LINK} self-start`}>Use these</button>
      </section>
    </main>
  );
}
