"use client";
// A short speech: the user types what it’s about, a few points and a length, then speaks with the points in view (decision 73). Second design pass, extrapolated from Desktop Screens "StoryTell": focus mode with the bar, two columns on a computer (the heading, the short speech’s tile and Sage’s tip; the plan in a card with round point markers and the lengths as choice cards), then the chunky band

// Load React's state tools, and the reader for browser-only values
import { useState, useSyncExternalStore } from "react";
// Load the plan type
import type { Outline } from "@/core/outline";
// Load the script-page building blocks
import { ActionBand, ActionButton } from "@/components/script/ActionBand";
import { PRACTICE_BODY, PRACTICE_MAIN, PracticeBar } from "@/components/script/PracticeBar";
// Load the short speech’s tile panel, Sage’s line and the card and label looks
import { ScenePanel } from "@/components/scenes/ScenePanel";
import { SageSays } from "@/components/script/SageSays";
import { CARD, LAB } from "@/components/script/textStyles";
// Load the shared button looks
import { PRESS, QUIET } from "@/components/script/Buttons";
// Load the plan rules
import { MAX_POINTS, MAX_TEXT, OUTLINE_LENGTHS, cleanOutline, outlineQuery } from "@/core/outline";
// Load the last plan, kept in this browser
import { parseOutlineDraft, readOutlineDraftText, saveOutlineDraft } from "@/data/outlineDraft";

// The look of a text field
const FIELD = "min-h-12 w-full rounded-xl border-2 border-rule bg-paper px-3 py-2";

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
    <main id="main" className={PRACTICE_MAIN}>
      {/* Title, with a way back to Practice */}
      <PracticeBar close={{ href: "/practice", label: "Close, back to Practice" }} label="Short speech" />
      {/* Two columns on a computer, as the story set-up: the speech's tile and Sage on the left, the plan on the right */}
      <div className={`${PRACTICE_BODY} grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10`}>
        {/* The heading, the tile and Sage's tip */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* The heading */}
          <h1 className="font-display text-statement leading-tight font-semibold">Plan a short speech.</h1>
          {/* The short speech's tile */}
          <ScenePanel scene="short-speech" name="Short speech" line="Your points stay in view while you speak." className="" />
          {/* How much to write */}
          <SageSays mood="encouraging">A few words each. You’ll see them while you speak.</SageSays>
        </div>
        {/* The plan, in a card, then the band */}
        <div className="flex min-w-0 flex-col">
          <div className={`flex flex-col gap-6 p-5 md:p-6 ${CARD}`}>
            {/* What it is about */}
            <label className="block">
              {/* Label */}
              <span className={`${LAB} block`}>What’s it about?</span>
              {/* The field */}
              <input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={MAX_TEXT} placeholder="Why I started running" className={`mt-2 ${FIELD}`} />
            </label>
            {/* The points */}
            <fieldset>
              {/* Label */}
              <legend className={LAB}>Your points</legend>
              {/* Each point */}
              <ol className="mt-2 flex flex-col gap-2.5">
                {points.map((point, index) => (
                  // One point with its number
                  <li key={index} className="flex items-center gap-3">
                    {/* The number, on a round marker as on a path */}
                    <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-full bg-paper font-display text-lg font-semibold text-ink-muted shadow-ledge">{index + 1}</span>
                    {/* The field */}
                    <input value={point} onChange={(event) => setPoint(index, event.target.value)} maxLength={MAX_TEXT} aria-label={`Point ${index + 1}`} className={FIELD} />
                  </li>
                ))}
              </ol>
              {/* Room for one more, up to four */}
              {points.length < MAX_POINTS && <p className="mt-3"><button type="button" onClick={() => setPoints([...points, ""])} className={QUIET}>Add a point</button></p>}
            </fieldset>
            {/* How long */}
            <div role="group" aria-label="How long">
              {/* Label */}
              <p className={LAB}>How long?</p>
              {/* The lengths, as the set-up's choice cards */}
              <div className="mt-2.5 grid max-w-md grid-cols-4 gap-2.5">
                {OUTLINE_LENGTHS.map((minutes) => (
                  // One length, edged in the accent when chosen
                  <button key={minutes} type="button" aria-pressed={goal === minutes} onClick={() => setGoal(minutes)} className={`min-h-12 rounded-[14px] border-2 bg-card font-display text-lg font-semibold ${PRESS} ${goal === minutes ? "border-accent shadow-picked" : "border-rule shadow-card hover:border-ink-muted"}`}>{minutes} min</button>
                ))}
              </div>
            </div>
          </div>
          {/* Start, once there is a topic and a point (the plan is kept for next time) */}
          {outline ? (
            <div onClickCapture={() => saveOutlineDraft(outline)}><ActionBand action="Start speaking" aside={`${outline.points.length} point${outline.points.length === 1 ? "" : "s"} · ${outline.goalMinutes} min`} href={`/session?mode=outline&${outlineQuery(outline)}`} /></div>
          ) : (
            <ActionButton action="Start speaking" aside="add a topic and a point" onClick={() => {}} disabled />
          )}
        </div>
      </div>
    </main>
  );
}
