"use client";
// Listen back first: play the recording with the transcript following along, write your own notes, then the feedback opens

// Load React's state and reference tools
import { useRef, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the plan navigation type
import type { PlanNav } from "@/components/screens/planNav";
// Load the shared action band button
import { ActionButton } from "@/components/script/ActionBand";
// Load the player
import { Player } from "@/components/script/Player";
// Load the saved-audio loader
import { useAudioUrl } from "@/components/screens/useAudioUrl";
// Load the listening tools and the quick tags
import { CHANGE_TAGS, LONG_RECORDING, WORKED_TAGS, listenWords, listenedEnough, markHeard, nothingHeard, playFrom, wordsSaidBy, type ReviewTag } from "@/core/selfReview";
// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the small-talk beats, the listen-for questions for an everyday answer
import { beatsFor, unitOf } from "@/content/smallTalk";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the record types
import type { SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// Recordings longer than this offer a faster playback button
const OFFER_SPEED_AFTER = 60;

// A row of quick tags that can each be switched on or off
function TagRow({ tags, chosen, onToggle, label }: { tags: ReadonlyArray<ReviewTag>; chosen: ReadonlySet<string>; onToggle: (id: string) => void; label: string }) {
  // The buttons, wrapping onto more lines on a phone
  return (
    <div role="group" aria-label={label} className="mt-2 flex flex-wrap gap-2">
      {/* Each tag */}
      {tags.map((tag) => (
        // One tag, filled in the accent when chosen
        <button key={tag.id} type="button" aria-pressed={chosen.has(tag.id)} onClick={() => onToggle(tag.id)} className={`min-h-11 border px-3 text-footnote ${chosen.has(tag.id) ? "border-accent bg-accent text-accent-ink" : "border-rule"}`}>
          {/* Its words */}
          {tag.label}
        </button>
      ))}
    </div>
  );
}

// The transcript, lighting up word by word as the recording plays; tapping a word plays from there
function FollowingTranscript({ session, position, onPick }: { session: SessionRecord; position: number; onPick: (seconds: number) => void }) {
  // The words, with fillers marked
  const words = listenWords(session.transcript);
  // When each word was heard, if saved for every word
  const times = session.spokenTimes && session.spokenTimes.length === words.length ? session.spokenTimes : null;
  // How many words have been said by now
  const said = times ? wordsSaidBy(times, position) : words.length;
  // Draw them
  return (
    <p className="text-running">
      {/* Each word */}
      {words.map((word, index) => {
        // Its look: fillers highlighted, words not yet reached dimmed
        const look = `${word.filler ? "bg-filler/15 text-filler" : index < said ? "" : "text-ink-muted"}`;
        // Without times, plain words
        if (!times) return <span key={index} className={look}>{`${word.text} `}</span>;
        // With times, each word plays from where it was said
        return (
          <span key={index}>
            {/* The word as a button */}
            <button type="button" data-inline onClick={() => onPick(playFrom(times[index] ?? 0))} className={`${look} hover:underline`}>{word.text}</button>
            {/* The space after it */}
            {" "}
          </span>
        );
      })}
    </p>
  );
}

// The review step: listen, write, then continue
export function ReviewStep({ repo, session, onSaved, plan = null, retryHref = null, navigate }: { repo: Repository; session: SessionRecord; onSaved: (updated: SessionRecord) => void; plan?: PlanNav | null; retryHref?: string | null; navigate?: (path: string) => void }) {
  // The recording's address
  const audio = useAudioUrl(repo, session.audioKey);
  // The audio element, for jumping to a word
  const element = useRef<HTMLAudioElement | null>(null);
  // Which seconds have been heard
  const [heard, setHeard] = useState(() => nothingHeard(session.durationSec));
  // Where the playback is
  const [position, setPosition] = useState(0);
  // What worked, in their words
  const [worked, setWorked] = useState("");
  // What to change, in their words
  const [change, setChange] = useState("");
  // Tags chosen
  const [tags, setTags] = useState<ReadonlySet<string>>(new Set());
  // A problem saving, if any
  const [problem, setProblem] = useState("");
  // Whether to keep the recording to compare with later tries (the first recording is always kept)
  const [keep, setKeep] = useState(false);
  // Whether enough has been heard (or there is nothing to hear)
  const listened = audio.missing || listenedEnough(heard, session.durationSec);
  // Whether this is a long recording
  const long = session.durationSec > LONG_RECORDING;
  // Whether this is a small-talk answer (the four beats replace the usual tags)
  const smallTalk = session.mode === "smalltalk";

  // Note the position, and mark it heard while playing
  function follow(seconds: number, playing: boolean) {
    // Show the position
    setPosition(seconds);
    // Count it only while actually playing
    if (playing) setHeard((previous) => markHeard(previous, seconds));
  }

  // Jump to a moment
  function jump(seconds: number) {
    // Move the audio, if drawn
    if (element.current) element.current.currentTime = seconds;
    // Show the new position
    setPosition(seconds);
  }

  // Switch a tag on or off
  function toggle(id: string) {
    // A copy with the tag flipped
    const next = new Set(tags);
    // Remove it if there, add it if not
    if (!next.delete(id)) next.add(id);
    // Keep it
    setTags(next);
  }

  // Save the notes (or a skip) on the session as it is now, then hand it back
  async function save(skipped: boolean): Promise<boolean> {
    // Try to save
    try {
      // The session as it is now (feedback may have arrived meanwhile)
      const latest = (await repo.getSession(session.id)) ?? session;
      // With the notes
      const reviewed: SessionRecord = { ...latest, selfReview: { worked: skipped ? "" : worked.trim(), change: skipped ? "" : change.trim(), tags: skipped ? [] : [...tags], skipped, savedAt: new Date().toISOString() } };
      // The audio to discard: unless kept, or the first recording, which is always kept
      const discard = !keep && !latest.isBaseline ? latest.audioKey : null;
      // Without its audio, if discarded
      const updated: SessionRecord = discard ? { ...reviewed, audioKey: null } : reviewed;
      // Save it first, so the session never points at missing audio
      await repo.saveSession(updated);
      // Then delete the recording
      if (discard) await repo.deleteAudio(discard);
      // Open the feedback
      onSaved(updated);
      // From the top of the page
      window.scrollTo?.({ top: 0 });
      // Saved
      return true;
    } catch (error) {
      // Say what went wrong; the notes stay on screen
      setProblem(`Your notes could not be saved (${error instanceof Error ? error.message : String(error)}). Try again.`);
      // Not saved
      return false;
    }
  }

  // Inside today's practice: save any notes (or note a skip when there are none and nothing was heard), then go to the next step
  async function moveOn(current: PlanNav) {
    // Nothing written, tagged or heard counts as a skip
    const nothing = !listened && worked.trim() === "" && change.trim() === "" && tags.size === 0;
    // Save, and move on only if that worked
    if (await save(nothing)) navigate?.(current.next ? current.next.href : "/");
  }

  // Draw the step
  return (
    <section aria-label="Listen back first" className="flex flex-1 flex-col md:max-w-2xl md:pt-8">
      {/* The ask */}
      <h1 className="mt-6 font-display text-statement tracking-tight md:mt-0">Listen back first.</h1>
      {/* Why */}
      <p className="mt-3 max-w-[52ch] text-lede">{smallTalk ? "Hear it the way they would. Listen for the four beats, and tick the ones you heard yourself do. Then the notes open." : plan ? "Hear it the way your audience did, and note one thing that worked and one thing you would change. Move on whenever you are ready." : "Hear it the way your audience did. Then write one thing that worked and one thing you would change. The numbers and the coach’s notes open after."}</p>
      {/* The player, or why there is none */}
      {audio.url ? (
        <div className="mt-6">
          {/* Play, move through it, and (for longer takes) play faster */}
          <Player src={audio.url} label="Your recording" name="your recording" durationSec={session.durationSec} speeds={session.durationSec > OFFER_SPEED_AFTER} onAudio={(found) => { element.current = found; }} onTime={follow} />
          {/* How much is left to hear */}
          <p role="status" className="mt-2 text-footnote italic text-ink-muted">
            {listened ? "Heard. Now your notes." : `Heard ${formatClock(heard.filter(Boolean).length)} of ${formatClock(session.durationSec)}.${plan ? "" : ` ${long ? "Listen to all of it, or to its first and last 45 seconds." : "Listen to all of it to open the feedback."}`}`}
          </p>
        </div>
      ) : (
        // No audio on this device
        audio.missing && <p className="mt-6 text-lede text-ink-muted">This recording is not on this device, so there is nothing to play. Write your notes from memory, or skip.</p>
      )}
      {/* The transcript, following the playback */}
      <div className="mt-6 max-w-[52ch]">
        {/* Small heading */}
        <p className="text-footnote italic text-ink-muted">What you said (tap a word to hear it)</p>
        {/* The words */}
        <div className="mt-2"><FollowingTranscript session={session} position={position} onPick={jump} /></div>
      </div>
      {/* For small talk: the four things to listen for, ticked by the user, and one box */}
      {smallTalk && (
        <div className="mt-8 max-w-[52ch]">
          {/* Heading */}
          <p className="font-display text-cue">What did you hear yourself do?</p>
          {/* The beats, each a switch */}
          <ul aria-label="Listen for" className="mt-2 divide-y divide-rule border-y border-rule">
            {/* Each beat */}
            {beatsFor(unitOf(session.promptId)).map((beat) => (
              // One beat, ticked when heard
              <li key={beat.id}>
                {/* The switch */}
                <button type="button" aria-pressed={tags.has(beat.id)} onClick={() => toggle(beat.id)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
                  {/* The box */}
                  <span aria-hidden="true" className={`flex size-6 flex-none items-center justify-center border-2 ${tags.has(beat.id) ? "border-accent bg-accent text-accent-ink" : "border-rule"}`}>{tags.has(beat.id) && <CheckIcon weight="bold" className="size-4" />}</span>
                  {/* The beat and its question */}
                  <span><strong className="font-display font-normal">{beat.name}.</strong> <span className="text-ink-muted">{beat.question}</span></span>
                </button>
              </li>
            ))}
          </ul>
          {/* One box for anything else */}
          <label htmlFor="review-change" className="mt-6 block font-display text-cue">Anything you would say differently?</label>
          {/* The box */}
          <textarea id="review-change" value={change} onChange={(event) => setChange(event.target.value)} rows={3} className="mt-2 w-full border border-rule bg-paper p-3 text-lede" />
        </div>
      )}
      {/* The notes */}
      {!smallTalk && <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* What worked */}
        <div>
          {/* Label and box */}
          <label htmlFor="review-worked" className="block font-display text-cue">What worked?</label>
          {/* The box */}
          <textarea id="review-worked" value={worked} onChange={(event) => setWorked(event.target.value)} rows={3} className="mt-2 w-full border border-rule bg-paper p-3 text-lede" />
          {/* Quick tags */}
          <TagRow tags={WORKED_TAGS} chosen={tags} onToggle={toggle} label="What worked, quick tags" />
        </div>
        {/* What to change */}
        <div>
          {/* Label and box */}
          <label htmlFor="review-change" className="block font-display text-cue">What would you change?</label>
          {/* The box */}
          <textarea id="review-change" value={change} onChange={(event) => setChange(event.target.value)} rows={3} className="mt-2 w-full border border-rule bg-paper p-3 text-lede" />
          {/* Quick tags */}
          <TagRow tags={CHANGE_TAGS} chosen={tags} onToggle={toggle} label="What to change, quick tags" />
        </div>
      </div>}
      {/* A saving problem */}
      {problem && <p role="alert" className="mt-4 text-lede">{problem}</p>}
      {/* Keep the recording to compare later, or let it go once the notes are saved */}
      {session.audioKey && (session.isBaseline ? (
        // The first recording stays, as the one progress is measured against
        <p className="mt-6 text-footnote italic text-ink-muted">This is your first recording, so it is kept to compare with later.</p>
      ) : (
        <label className="mt-6 flex min-h-11 items-start gap-3">
          {/* The choice */}
          <input type="checkbox" checked={keep} onChange={(event) => setKeep(event.target.checked)} className="mt-1 size-5 flex-none accent-accent" />
          {/* What it does */}
          <span>
            {/* The choice in words */}
            Keep this recording to compare with later tries.
            {/* What happens otherwise */}
            <span className="block text-footnote text-ink-muted">Otherwise it is deleted from this device when you save your notes. The transcript, numbers and notes stay.</span>
          </span>
        </label>
      ))}
      {/* Inside today's practice: try again, or see the feedback, both optional */}
      {plan ? (
        <p className="mt-6 mb-6 flex flex-wrap gap-x-4">
          {/* Try again, staying in the plan */}
          {retryHref && <Link href={retryHref} className="inline-flex min-h-11 items-center underline underline-offset-4">Try it again</Link>}
          {/* Save the notes and see this step's feedback */}
          <button type="button" onClick={() => void save(false)} className="inline-flex min-h-11 items-center italic text-ink-muted underline underline-offset-4">Save and see the feedback</button>
        </p>
      ) : (
        // Skipping, kept small
        <p className="mt-6 mb-6">
          {/* Skip this time */}
          <button type="button" onClick={() => void save(true)} className="inline-flex min-h-11 items-center italic text-ink-muted underline underline-offset-4">Skip this time</button>
        </p>
      )}
      {/* Push the action down */}
      <div className="flex-1" />
      {/* Inside today's practice the next step is always open, saving any notes; otherwise saving opens once listened */}
      {plan ? (
        <ActionButton action={plan.next ? `Next: step ${plan.step + 1}` : "Finish today’s practice"} aside={plan.next ? plan.next.label : "back to Today"} onClick={() => void moveOn(plan)} />
      ) : (
        <ActionButton action="Save my notes" aside={listened ? "then see the feedback" : "listen first"} disabled={!listened} onClick={() => void save(false)} />
      )}
    </section>
  );
}
