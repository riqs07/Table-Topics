// The voice shape in its forms (decisions 69, 74, 75 and 77): live while recording (the stop button), still before (the start button), faded while waiting, and the pause and discard controls under it; shared by the recording screen and the voice drills (decision 80)

"use client";
// Load React's effect and reference tools, for focusing the stop shape as recording starts
import { useEffect, useRef } from "react";
// Load the microphone icon
import { MicrophoneIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared press effect and quiet button style
import { PRESS, QUIET } from "@/components/script/Buttons";
// Load the timing light type
import type { TimeSignal } from "@/core/recordingRules";
// Load the blob's face and its moods (decision 134)
import { BlobFace, type BlobMood } from "@/components/script/BlobFace";

// The voice shape's colour at each timing state: warm until the window opens, then the light's own colour
const BLOB_FILL: Record<TimeSignal, string> = {
  // Before the window: the warm accent
  none: "bg-warm",
  // Green
  green: "bg-light-green",
  // Yellow
  yellow: "bg-light-yellow",
  // Red
  red: "bg-light-red",
  // Past the limit
  overtime: "bg-light-red",
};

// The halo's colour at each timing state, matching the shape
const HALO_EDGE: Record<TimeSignal, string> = {
  // Before the window
  none: "border-warm",
  // Green
  green: "border-light-green",
  // Yellow
  yellow: "border-light-yellow",
  // Red
  red: "border-light-red",
  // Past the limit
  overtime: "border-light-red",
};

// Where a shape sits: large in the column (centred on a phone, lined up with the text on a computer; decision 79), or (on screens with text to read) small, inside the place the screen gives it: a bar at the bottom centre of a phone, the margin on a computer (decision 89)
function shapePlace(compact: boolean, size: string): string {
  // Small in its own place, or centred in the column
  return compact ? "relative size-20 drop-shadow-lg md:size-28" : `relative mx-auto my-6 md:mx-0 ${size}`;
}

// The live voice: a soft shape that breathes, grows with how loud you are, and takes the timing light's colour, with the clock inside (decision 69); it is the stop button (decisions 74 and 75), or in a conversation the "Done" button that ends your turn (decision 83)
export function VoiceBlob({ levels, signal, clock, onStop, compact, paused = false, action = "Stop", focusOnMount = false }: { levels: number[]; signal: TimeSignal; clock: string; onStop: () => void; compact: boolean; paused?: boolean; action?: "Stop" | "Done"; focusOnMount?: boolean }) {
  // The button, for moving focus to it
  const button = useRef<HTMLButtonElement>(null);
  // When asked, focus it as it appears (recording has just started), so the keyboard and screen readers land on the way to stop
  useEffect(() => {
    // Only when asked
    if (focusOnMount) button.current?.focus({ preventScroll: true });
  }, [focusOnMount]);
  // The latest few readings, averaged so the shape does not jitter
  const recent = levels.slice(-4);
  // How loud, from 0 to 1
  const level = Math.min(1, (recent.reduce((sum, value) => sum + value, 0) / Math.max(1, recent.length)) * 4);
  // The shape's size: bigger as the voice gets louder
  const scale = 0.82 + level * 0.3;
  // A round button holding the halo, the shape, the clock and its action (the level stays named for screen readers)
  return (
    <button ref={button} type="button" onClick={onStop} aria-label={action} data-variant="stop" className={`flex items-center justify-center rounded-full ${PRESS} ${shapePlace(compact, "size-72")}`}>
      {/* The level, named for screen readers */}
      <span role="img" aria-label="Microphone level" className="absolute inset-0" />
      {/* The dashed halo, turning slowly */}
      <span aria-hidden="true" className={`absolute inset-0 rounded-full border-2 border-dashed opacity-60 motion-safe:animate-spin-slow ${HALO_EDGE[signal]}`} />
      {/* The shape, growing with the voice and changing colour with the light */}
      <span aria-hidden="true" className={`absolute ${compact ? "inset-2" : "inset-6"} rounded-full transition-[transform,background-color,opacity] duration-150 ease-out ${paused ? "opacity-60" : "motion-safe:animate-morph"} ${BLOB_FILL[signal]}`} style={{ transform: `scale(${paused ? 0.82 : scale})` }} />
      {/* The clock, and the action */}
      <span className="relative flex flex-col items-center text-on-warm">
        {/* The face, listening (asleep while paused), on the large shape only (decision 134) */}
        {!compact && <BlobFace mood={paused ? "sleepy" : "listening"} className="mb-2 w-12" />}
        {/* The clock (the button is named by its action alone) */}
        <span aria-hidden="true" className={`font-display font-semibold tabular-nums tracking-tight ${compact ? "text-xl" : "text-prompt-xl"}`}>{clock}</span>
        {/* The action */}
        <span className="text-footnote font-semibold">{action}</span>
      </span>
    </button>
  );
}

// Pause or resume, and discard, as two quiet buttons (decision 77)
export function TakeControls({ paused, onPause, onResume, onDiscard }: { paused: boolean; onPause: () => void; onResume: () => void; onDiscard: () => void }) {
  // Side by side, centred under the shape
  return (
    <p className="mt-1 flex flex-wrap justify-center gap-3 md:justify-start">
      {/* Pause or carry on */}
      <button type="button" onClick={paused ? onResume : onPause} className={QUIET}>{paused ? "Resume" : "Pause"}</button>
      {/* Throw this take away (it can be undone for a few seconds) */}
      <button type="button" onClick={onDiscard} className={QUIET}>Discard</button>
    </p>
  );
}

// Before recording, or to start early: the same shape, still, as a round start button, with what it does and a short detail (decisions 74 and 75); on the large shape a face in place of the microphone, ready, or puzzled when trying again (decision 134)
export function StartBlob({ label, detail, onStart, compact, ariaLabel, mood = "ready" }: { label: string; detail: string; onStart: () => void; compact: boolean; ariaLabel?: string; mood?: BlobMood }) {
  // A round button with a quiet halo, the warm shape, a microphone and the words (named in full when the words alone would not say what it does)
  return (
    <button type="button" onClick={onStart} aria-label={ariaLabel} data-variant="start" className={`flex items-center justify-center rounded-full ${PRESS} ${shapePlace(compact, "size-56")}`}>
      {/* The dashed halo, still */}
      <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-dashed border-warm opacity-60" />
      {/* The shape, breathing slowly when motion is welcome */}
      <span aria-hidden="true" className={`absolute ${compact ? "inset-2" : "inset-4"} rounded-full bg-warm shadow-card motion-safe:animate-morph`} />
      {/* The microphone and the words */}
      <span className="relative flex max-w-[80%] flex-col items-center gap-0.5 text-center text-on-warm">
        {/* The microphone on the small shape, the face on the large one */}
        {compact ? <MicrophoneIcon aria-hidden="true" weight="fill" className="size-5 md:size-6" /> : <BlobFace mood={mood} className="mb-1.5 w-11" />}
        {/* What it does */}
        <span className={`font-semibold leading-tight ${compact ? "text-tab" : "font-display text-xl"}`}>{label}</span>
        {/* The detail (left out of the small corner shape) */}
        <span className={compact ? "sr-only" : "text-footnote leading-tight"}>{detail}</span>
      </span>
    </button>
  );
}

// While waiting (a countdown, a question being said, the microphone starting, saving): the still shape with what is happening, not a button; on the large shape a face, thinking unless told otherwise (decision 134)
export function StatusBlob({ label, detail, compact, live = true, mood = "thinking" }: { label: string; detail: string; compact: boolean; live?: boolean; mood?: BlobMood }) {
  // The shape, quieter, with the words announced politely (unless they change too often to read out, like a countdown, which announces itself separately)
  return (
    <div role={live ? "status" : undefined} className={`flex items-center justify-center rounded-full ${shapePlace(compact, "size-56")}`}>
      {/* The dashed halo, turning slowly */}
      <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-dashed border-warm opacity-60 motion-safe:animate-spin-slow" />
      {/* The shape, faded */}
      <span aria-hidden="true" className={`absolute ${compact ? "inset-2" : "inset-4"} rounded-full bg-warm opacity-70 motion-safe:animate-morph`} />
      {/* The words */}
      <span className="relative flex max-w-[80%] flex-col items-center text-center text-on-warm">
        {/* The face, on the large shape only */}
        {!compact && <BlobFace mood={mood} className="mb-1.5 w-11" />}
        {/* What is happening */}
        <span className={`font-semibold leading-tight ${compact ? "text-tab" : "font-display text-xl"}`}>{label}</span>
        {/* The detail */}
        <span className={compact ? "sr-only" : "text-footnote leading-tight"}>{detail}</span>
      </span>
    </div>
  );
}
