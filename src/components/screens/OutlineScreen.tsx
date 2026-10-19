"use client";
// A short speech: the user types what it's about, a few points and a length, then speaks with the points in view (decision 73)

// Load React's state tools, and the reader for browser-only values
import { useState, useSyncExternalStore } from "react";
// Load the plan type
import type { Outline } from "@/core/outline";
// Load the script-page building blocks
import { ActionBand, ActionButton } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
// Load the shared button looks
import { PRESS, QUIET } from "@/components/script/Buttons";
// Load the plan rules
import { MAX_POINTS, MAX_TEXT, OUTLINE_LENGTHS, cleanOutline, outlineQuery } from "@/core/outline";
// Load the last plan, kept in this browser
import { parseOutlineDraft, readOutlineDraftText, saveOutlineDraft } from "@/data/outlineDraft";

// The look of a text field
const FIELD = "min-h-12 w-full rounded-xl border-2 border-rule bg-card px-3 py-2";

// Nothing changes the stored draft while the page is open, so there is nothing to listen to
function subscribeToNothing(): () => void {
  // Nothing to stop
  return () => {};
}

// Draw the page: the form, filled with the last plan once the browser can read it
export function OutlineScreen() {
  // The last plan as stored text (none while drawn on the server)
  const stored = useSyncExternalStore(subscribeToNothing, readOutlineDraftText, () => null);
  // The form, started again when the stored plan is read
  return <OutlineForm key={stored ?? "empty"} draft={parseOutlineDraft(stored)} />;
}

// The form itself
function OutlineForm({ draft }: { draft: Outline | null }) {
  // What it is about
  const [topic, setTopic] = useState(draft?.topic ?? "");
  // The points (the last plan's, or three empty ones)
  const [points, setPoints] = useState<string[]>(draft ? [...draft.points, "", "", ""].slice(0, Math.max(3, draft.points.length)) : ["", "", ""]);
  // How long, in minutes
  const [goal, setGoal] = useState(draft?.goalMinutes ?? 2);

  // The plan as it stands (null until there is a topic and a point)
  const outline = cleanOutline(topic, points, goal);

  // Change one point
  function setPoint(index: number, value: string) {
    // A copy with the change
    setPoints((previous) => previous.map((point, place) => (place === index ? value : point)));
  }

  // Draw it
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Title, with a way back to Practice */}
      <Masthead title="Short speech" nav={false} close={{ href: "/practice", label: "Close, back to Practice" }} />
      {/* The heading */}
      <h1 className="mt-6 font-display text-statement font-semibold tracking-tight">Plan a short speech.</h1>
      {/* What it is about */}
      <label className="mt-6 block">
        {/* Label */}
        <span className="block font-semibold">What’s it about?</span>
        {/* The field */}
        <input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={MAX_TEXT} placeholder="Why I started running" className={`mt-2 ${FIELD}`} />
      </label>
      {/* The points */}
      <fieldset className="mt-6">
        {/* Label */}
        <legend className="font-semibold">Your points</legend>
        {/* A line on how much to write */}
        <p className="text-footnote text-ink-muted">A few words each. You’ll see them while you speak.</p>
        {/* Each point */}
        <ol className="mt-2 flex flex-col gap-2">
          {points.map((point, index) => (
            // One point with its number
            <li key={index} className="flex items-center gap-3">
              {/* The number */}
              <span aria-hidden="true" className="flex size-8 flex-none items-center justify-center rounded-lg bg-warm-tint text-footnote font-semibold text-warm-ink">{index + 1}</span>
              {/* The field */}
              <input value={point} onChange={(event) => setPoint(index, event.target.value)} maxLength={MAX_TEXT} aria-label={`Point ${index + 1}`} className={FIELD} />
            </li>
          ))}
        </ol>
        {/* Room for one more, up to four */}
        {points.length < MAX_POINTS && <p className="mt-2"><button type="button" onClick={() => setPoints([...points, ""])} className={QUIET}>Add a point</button></p>}
      </fieldset>
      {/* How long */}
      <div role="group" aria-label="How long" className="mt-6">
        {/* Label */}
        <p className="font-semibold">How long?</p>
        {/* The lengths */}
        <div className="mt-2 grid max-w-md grid-cols-4 gap-2">
          {OUTLINE_LENGTHS.map((minutes) => (
            // One length, filled when chosen
            <button key={minutes} type="button" aria-pressed={goal === minutes} onClick={() => setGoal(minutes)} className={`min-h-11 rounded-xl border-2 ${PRESS} ${goal === minutes ? "border-fill bg-fill text-fill-ink" : "border-rule bg-card"}`}>{minutes} min</button>
          ))}
        </div>
      </div>
      {/* Push the band down */}
      <div className="flex-1" />
      {/* Start, once there is a topic and a point (the plan is kept for next time) */}
      {outline ? (
        <div onClickCapture={() => saveOutlineDraft(outline)}><ActionBand action="Start speaking" aside={`${outline.points.length} point${outline.points.length === 1 ? "" : "s"} · ${outline.goalMinutes} min`} href={`/session?mode=outline&${outlineQuery(outline)}`} /></div>
      ) : (
        <ActionButton action="Start speaking" aside="add a topic and a point" onClick={() => {}} disabled />
      )}
    </main>
  );
}
