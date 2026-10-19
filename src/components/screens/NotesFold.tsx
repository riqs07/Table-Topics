"use client";
// Your own notes on a take, folded under the results: quick tags and one optional line, never required (replaces the listen-back step, decision 67)

// Load React's state tool
import { useState } from "react";
// Load the tick for a heard beat
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the quick tags
import { CHANGE_TAGS, WORKED_TAGS, type ReviewTag } from "@/core/selfReview";
// Load the beats a small-talk answer is listened for
import { beatsFor, unitOf } from "@/content/smallTalk";
// Load the record and repository types
import type { SessionRecord } from "@/data/records";
import type { Repository } from "@/data/repository";
// Load the shared button looks
import { QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";

// A row of quick tags that can each be switched on or off
function TagRow({ tags, chosen, onToggle, label }: { tags: ReadonlyArray<ReviewTag>; chosen: ReadonlySet<string>; onToggle: (id: string) => void; label: string }) {
  // The buttons, wrapping onto more lines on a phone
  return (
    <div role="group" aria-label={label} className="mt-2 flex flex-wrap gap-2">
      {/* Each tag */}
      {tags.map((tag) => (
        // One tag, filled when chosen
        <button key={tag.id} type="button" aria-pressed={chosen.has(tag.id)} onClick={() => onToggle(tag.id)} className={`min-h-11 border px-3 text-footnote ${chosen.has(tag.id) ? "border-fill bg-fill text-fill-ink" : "border-rule"}`}>
          {/* Its words */}
          {tag.label}
        </button>
      ))}
    </div>
  );
}

// What the fold needs
interface NotesFoldProps {
  // Where the notes are saved
  repo: Repository;
  // The take
  session: SessionRecord;
  // Called with the session once the notes are saved
  onSaved: (updated: SessionRecord) => void;
  // Whether the coach is waiting for the notes before it replies (open the fold and offer to go on without)
  coachWaiting?: boolean;
}

// Draw the fold
export function NotesFold({ repo, session, onSaved, coachWaiting = false }: NotesFoldProps) {
  // Tags chosen
  const [tags, setTags] = useState<ReadonlySet<string>>(new Set());
  // One line, in their words
  const [change, setChange] = useState("");
  // A problem saving, if any
  const [problem, setProblem] = useState("");
  // Whether this is a small-talk answer (the beats replace the usual tags)
  const smallTalk = session.mode === "smalltalk";

  // Switch a tag on or off
  function toggle(id: string) {
    // A copy with the tag flipped
    const next = new Set(tags);
    // Remove it if there, add it if not
    if (!next.delete(id)) next.add(id);
    // Keep it
    setTags(next);
  }

  // Save the notes (or note that there are none), then hand the session back
  async function save(skipped: boolean) {
    // Try to save
    try {
      // The session as it is now (feedback may have arrived meanwhile)
      const latest = (await repo.getSession(session.id)) ?? session;
      // With the notes
      const updated: SessionRecord = { ...latest, selfReview: { worked: "", change: skipped ? "" : change.trim(), tags: skipped ? [] : [...tags], skipped, savedAt: new Date().toISOString() } };
      // Save it
      await repo.saveSession(updated);
      // Show it
      onSaved(updated);
    } catch (error) {
      // Say what went wrong; the notes stay on screen
      setProblem(`Your notes could not be saved (${error instanceof Error ? error.message : String(error)}). Try again.`);
    }
  }

  // The fold
  return (
    <details open={coachWaiting} className="mt-6 rounded-[22px] bg-card px-4 py-2 shadow-card">
      {/* Open it */}
      <summary className={`${TEXT_LINK} cursor-pointer`}>{smallTalk ? "Which beats did you hear yourself do?" : "Add your notes"}</summary>
      {/* For small talk, the beats to tick */}
      {smallTalk ? (
        <ul aria-label="Listen for" className="mt-2 divide-y divide-rule">
          {/* Each beat */}
          {beatsFor(unitOf(session.promptId)).map((beat) => (
            // One beat, ticked when heard
            <li key={beat.id}>
              {/* The switch */}
              <button type="button" aria-pressed={tags.has(beat.id)} onClick={() => toggle(beat.id)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
                {/* The box */}
                <span aria-hidden="true" className={`flex size-6 flex-none items-center justify-center border-2 ${tags.has(beat.id) ? "border-fill bg-fill text-fill-ink" : "border-rule"}`}>{tags.has(beat.id) && <CheckIcon weight="bold" className="size-4" />}</span>
                {/* The beat and its question */}
                <span><strong className="font-display font-normal">{beat.name}.</strong> <span className="text-ink-muted">{beat.question}</span></span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {/* What worked */}
          <p className="mt-3 text-footnote text-ink-muted">Worked</p>
          {/* Its tags */}
          <TagRow tags={WORKED_TAGS} chosen={tags} onToggle={toggle} label="What worked, quick tags" />
          {/* What to change */}
          <p className="mt-3 text-footnote text-ink-muted">To change</p>
          {/* Its tags */}
          <TagRow tags={CHANGE_TAGS} chosen={tags} onToggle={toggle} label="What to change, quick tags" />
        </>
      )}
      {/* One optional line */}
      <label htmlFor="notes-change" className="mt-4 block text-footnote text-ink-muted">Anything else? (optional)</label>
      {/* The box */}
      <textarea id="notes-change" value={change} onChange={(event) => setChange(event.target.value)} rows={2} className="mt-1 w-full border border-rule bg-paper p-3 text-lede" />
      {/* A saving problem */}
      {problem && <p role="alert" className="mt-2">{problem}</p>}
      {/* Save, or go on without notes when the coach is waiting for them */}
      <p className="mt-3 mb-2 flex flex-wrap gap-3">
        {/* Save */}
        <button type="button" onClick={() => void save(false)} className={SECONDARY}>Save my notes</button>
        {/* Without notes */}
        {coachWaiting && <button type="button" onClick={() => void save(true)} className={QUIET}>Get feedback without notes</button>}
      </p>
    </details>
  );
}
