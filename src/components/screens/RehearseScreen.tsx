"use client";
// Rehearse my talk: save your own talks or notes, then rehearse any of them with the timer. Second design pass, extrapolated from Desktop Screens "Practice" and "CoursePath": "‹ Speak on the spot" and the talk's tile in a header card, the saved talks as rows with their tiles, Sage pointing at the first step for a new user, and the form in a card with a chunky Save

// Load React's state and effect tools
import { useEffect, useState, type FormEvent } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the shared button looks
import { PRESS, PRIMARY, PrimaryLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the page heading with the main navigation, the list page's header and Sage's line
import { Masthead } from "@/components/script/Masthead";
import { HubHeader } from "@/components/script/HubHeader";
import { SageSays } from "@/components/script/SageSays";
// Load the mode tile and each kind's tile
import { ModeTile } from "@/components/scenes/ModeTile";
import { SCENE_TILES } from "@/components/scenes/modeTileFor";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the reading-time estimate
import { readingSeconds } from "@/core/recordingRules";
// Load the days-to-go counter
import { daysAway, daysUntil } from "@/core/eventPrep";
// Load the talk record type
import type { TalkRecord } from "@/data/records";
// Load the shared heading look
import { CARD, CARD_LIST, LAB, SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

// The longest talk that can be saved, in characters (about an hour of speech)
const MAX_LENGTH = 50_000;

// The look of a short field: rounded, on the soft cream inside the card
const FIELD = "min-h-12 rounded-xl border-2 border-rule bg-paper px-3 py-1";

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
    <main id="main" className={PAGE}>
      {/* Title and a way back */}
      <Masthead title="Your talks" section="practice" />
      {/* The way back, the talk's tile, the page's name and what it is for */}
      <HubHeader back={{ href: "/practice/ways?job=on-the-spot", label: "Speak on the spot" }} look={SCENE_TILES["your-talk"]} title="Your talks" line="Paste a talk you are preparing, or your notes for it. Rehearse it with the timer, then compare runs from different days. Your talks stay on this device." />

      {/* Saved talks */}
      {/* Two columns on a computer: the saved talks, then the form beside them */}
      <div data-wide className="mt-8 grid items-start gap-8 lg:grid-cols-2">
      <section>
        {/* Small heading */}
        <h2 className={SECTION_HEADING}>Saved talks</h2>
        {/* Nothing yet: Sage points at the first step */}
        {talks && talks.length === 0 && <SageSays mood="encouraging" className="mt-3 max-w-xl"><p>None saved yet. Add your first talk below, and rehearse it from here.</p></SageSays>}
        {/* One row per talk */}
        {talks && talks.length > 0 && <ul className={`mt-3 ${CARD_LIST}`}>
          {/* Each talk */}
          {talks.map((talk) => (
            // One row
            <li key={talk.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              {/* Its tile */}
              <ModeTile ground={SCENE_TILES["your-talk"].ground} prop={SCENE_TILES["your-talk"].prop} face={SCENE_TILES["your-talk"].face} still className="size-12 flex-none max-sm:hidden" />
              {/* Title and length */}
              <span className="min-w-0 flex-[1_1_14rem]">
                {/* Title, leading to the talk's page and plan */}
                <Link href={`/talk?id=${talk.id}`} className="inline-flex min-h-11 items-center font-display text-xl leading-tight font-semibold underline-offset-4 hover:underline">{talk.title}</Link>
                {/* Length */}
                <span className="block text-footnote font-bold text-ink-muted">about {Math.round(readingSeconds(talk.body) / 60)} min{talk.goalMinutes ? ` · goal ${talk.goalMinutes} min` : ""}{today && talk.eventDate ? ` · ${daysAway(daysUntil(talk.eventDate, today))}` : ""}</span>
              </span>
              {/* Rehearse it */}
              <PrimaryLink href={`/session?mode=rehearse&prompt=${talk.id}`} label={`“${talk.title}”`}>Rehearse</PrimaryLink>
              {/* Delete, with a confirmation step */}
              {confirming === talk.id ? (
                <span className="flex items-center gap-3">
                  {/* Confirm, in ink so it never reads as the main green action */}
                  <button type="button" onClick={() => void remove(talk.id)} className={`inline-flex min-h-11 items-center rounded-[14px] bg-ink px-4 font-extrabold text-paper-raised shadow-ledge ${PRESS}`}>Yes, delete it</button>
                  {/* Keep */}
                  <button type="button" onClick={() => setConfirming(null)} className={TEXT_LINK}>Keep it</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirming(talk.id)} aria-label={`Delete “${talk.title}”`} className={`${TEXT_LINK} px-2 text-ink-muted`}>Delete</button>
              )}
            </li>
          ))}
        </ul>}
      </section>

      {/* Add a talk, in a card */}
      <form onSubmit={(event) => void save(event)} className={`flex flex-col gap-4 p-5 md:p-6 ${CARD}`}>
        {/* Small heading */}
        <h2 className={SECTION_HEADING}>Add a talk</h2>
        {/* Title */}
        <label className="flex flex-col gap-1.5">
          {/* Label text */}
          <span className={LAB}>Title</span>
          {/* Field */}
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className={FIELD} />
        </label>
        {/* The words */}
        <label className="flex flex-col gap-1.5">
          {/* Label text */}
          <span className={LAB}>Your talk or notes</span>
          {/* Field */}
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={10} maxLength={MAX_LENGTH} className="rounded-xl border-2 border-rule bg-paper p-3 text-running" />
        </label>
        {/* The goal and the date, side by side where there is room */}
        <div className="flex flex-wrap gap-4">
          {/* Goal */}
          <label className="flex flex-col gap-1.5">
            {/* Label text */}
            <span className={LAB}>Goal in minutes (optional)</span>
            {/* Field */}
            <input type="number" min={1} max={60} value={goal} onChange={(event) => setGoal(event.target.value)} className={`${FIELD} w-28`} />
          </label>
          {/* The date of the talk, for a countdown plan */}
          <label className="flex flex-col gap-1.5">
            {/* Its name */}
            <span className={LAB}>Date of the talk (optional)</span>
            {/* The field */}
            <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className={FIELD} />
          </label>
        </div>
        {/* Save: the chunky one for a new user, a second choice once a saved talk has its own Rehearse */}
        <button type="submit" className={`${talks && talks.length > 0 ? SECONDARY : PRIMARY} mt-1 w-full md:w-auto md:self-start`}>Save talk</button>
        {/* Message */}
        {message && <p role="status" className="text-ink-muted">{message}</p>}
      </form>
      </div>
    </main>
  );
}
