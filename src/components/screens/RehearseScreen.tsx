"use client";
// Rehearse my talk: save your own talks or notes, then rehearse any of them with the timer

// Load React's state and effect tools
import { useEffect, useState, type FormEvent } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
// Load the shared button style
import { PRIMARY, QUIET, SecondaryLink, TEXT_LINK } from "@/components/script/Buttons";
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the reading-time estimate
import { readingSeconds } from "@/core/recordingRules";
// Load the days-to-go counter
import { daysAway, daysUntil } from "@/core/eventPrep";
// Load the talk record type
import type { TalkRecord } from "@/data/records";
// Load the shared heading look
import { SECTION_HEADING } from "@/components/script/textStyles";

// The longest talk that can be saved, in characters (about an hour of speech)
const MAX_LENGTH = 50_000;

// Draw the page
export function RehearseScreen(props: ScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // Saved talks, newest first (null while loading)
  const [talks, setTalks] = useState<TalkRecord[] | null>(null);
  // The form's title
  const [title, setTitle] = useState("");
  // The form's text
  const [body, setBody] = useState("");
  // The form's goal in minutes, as typed
  const [goal, setGoal] = useState("");
  // The date of the talk, as typed ("2026-10-22"), or empty
  const [eventDate, setEventDate] = useState("");
  // A message about the form, if any
  const [message, setMessage] = useState("");
  // The talk waiting for delete confirmation, if any
  const [confirming, setConfirming] = useState<string | null>(null);

  // Load the saved talks once in the browser
  useEffect(() => {
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read the talks
    repo.listTalks().then((loaded) => {
      // Show them if still open
      if (!cancelled) setTalks(loaded);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // Save the form as a new talk
  async function save(event: FormEvent) {
    // Stay on the page
    event.preventDefault();
    // A talk needs a title and some words
    if (!title.trim() || !body.trim()) return setMessage("Give the talk a title and some words first.");
    // Turn the goal into whole minutes from 1 to 60, or none
    const minutes = Math.round(Number(goal));
    // Build the record
    const talk: TalkRecord = {
      // A new id
      id: crypto.randomUUID(),
      // Trimmed title
      title: title.trim(),
      // The words, capped
      body: body.trim().slice(0, MAX_LENGTH),
      // The goal, if it is sensible
      goalMinutes: minutes >= 1 && minutes <= 60 ? minutes : null,
      // The date, when a valid one was picked
      eventDate: /^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? eventDate : null,
      // When it was saved
      createdAt: (today ?? new Date()).toISOString(),
    };
    // Save it
    await repo.saveTalk(talk);
    // Show it first in the list
    setTalks([talk, ...(talks ?? [])]);
    // Clear the form
    setTitle("");
    // (the text)
    setBody("");
    // (the goal)
    setGoal("");
    // Clear the date
    setEventDate("");
    // Confirm
    setMessage(`Saved “${talk.title}”.`);
  }

  // Delete a talk after confirmation
  async function remove(id: string) {
    // Delete it
    await repo.deleteTalk(id);
    // Drop it from the list
    setTalks((talks ?? []).filter((talk) => talk.id !== id));
    // Close the confirmation
    setConfirming(null);
  }

  // Draw the page
  return (
    // One column, like settings
    <main className="mx-auto min-h-dvh max-w-5xl bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Title and a way back */}
      <Masthead title="Your talks" section="practice" />

      {/* What this is for */}
      <p className="mt-6 max-w-[52ch] text-lede">Paste a talk you are preparing, or your notes for it. Rehearse it with the timer, then compare runs from different days. Your talks stay on this device.</p>

      {/* Saved talks */}
      <section className="mt-8">
        {/* Small heading */}
        <h2 className={SECTION_HEADING}>Saved talks</h2>
        {/* Nothing yet */}
        {talks && talks.length === 0 && <p className="mt-2 text-ink-muted">None saved yet.</p>}
        {/* One row per talk */}
        <ul className="mt-2 divide-y divide-rule border-y border-rule">
          {/* Each talk */}
          {talks?.map((talk) => (
            // One row
            <li key={talk.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
              {/* Title and length */}
              <span className="min-w-0 flex-1">
                {/* Title, leading to the talk's page and plan */}
                <Link href={`/talk?id=${talk.id}`} className="inline-flex min-h-11 items-center font-display text-cue underline-offset-4 hover:underline">{talk.title}</Link>
                {/* Length */}
                <span className="ml-2 text-footnote text-ink-muted">about {Math.round(readingSeconds(talk.body) / 60)} min{talk.goalMinutes ? ` · goal ${talk.goalMinutes} min` : ""}{today && talk.eventDate ? ` · ${daysAway(daysUntil(talk.eventDate, today))}` : ""}</span>
              </span>
              {/* Rehearse it */}
              <SecondaryLink href={`/session?mode=rehearse&prompt=${talk.id}`} label={`Rehearse “${talk.title}”`}>Rehearse</SecondaryLink>
              {/* Delete, with a confirmation step */}
              {confirming === talk.id ? (
                <span className="flex gap-3">
                  {/* Confirm */}
                  <button type="button" onClick={() => void remove(talk.id)} className="min-h-11 bg-ink px-3 text-paper-raised">Yes, delete it</button>
                  {/* Keep */}
                  <button type="button" onClick={() => setConfirming(null)} className={TEXT_LINK}>Keep it</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirming(talk.id)} aria-label={`Delete “${talk.title}”`} className={QUIET}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Add a talk */}
      <form onSubmit={(event) => void save(event)} className="mt-10 flex flex-col gap-4">
        {/* Small heading */}
        <h2 className={SECTION_HEADING}>Add a talk</h2>
        {/* Title */}
        <label className="flex flex-col gap-1">
          {/* Label text */}
          <span>Title</span>
          {/* Field */}
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="min-h-11 border-b border-ink bg-transparent py-1" />
        </label>
        {/* The words */}
        <label className="flex flex-col gap-1">
          {/* Label text */}
          <span>Your talk or notes</span>
          {/* Field */}
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={10} maxLength={MAX_LENGTH} className="border border-rule bg-paper p-3 text-running" />
        </label>
        {/* Goal */}
        <label className="flex items-baseline gap-3">
          {/* Label text */}
          <span>Goal in minutes (optional)</span>
          {/* Field */}
          <input type="number" min={1} max={60} value={goal} onChange={(event) => setGoal(event.target.value)} className="min-h-11 w-20 border-b border-ink bg-transparent py-1" />
        </label>
        {/* Save */}
        {/* The date of the talk, for a countdown plan */}
        <label className="flex items-baseline gap-3">
          {/* Its name */}
          <span>Date of the talk (optional)</span>
          {/* The field */}
          <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="min-h-11 border-b border-ink bg-transparent py-1" />
        </label>
        <button type="submit" className={`${PRIMARY} self-start`}>Save talk</button>
        {/* Message */}
        {message && <p role="status" className="text-ink-muted">{message}</p>}
      </form>
    </main>
  );
}
