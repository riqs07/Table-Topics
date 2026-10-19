// The voice shape in its forms (decisions 69, 74, 75 and 77): live while recording (the stop button), still before (the start button), faded while waiting, and the pause and discard controls under it; shared by the recording screen and the voice drills (decision 80)

// Load the microphone icon
import { MicrophoneIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared press effect and quiet button style
import { PRESS, QUIET } from "@/components/script/Buttons";
// Load the timing light type
import type { TimeSignal } from "@/core/recordingRules";

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

// Where a shape sits: large in the column (centred on a phone, lined up with the text on a computer; decision 79), or (on screens with text to read) small in the bottom corner, beside a clear lane the text never enters on a phone (decisions 75 and 77)
function shapePlace(compact: boolean, size: string): string {
  // Floating in the corner, or centred in the column
  return compact ? "fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-20 size-20 drop-shadow-lg md:right-10 md:size-28" : `relative mx-auto my-6 md:mx-0 ${size}`;
}

// The live voice: a soft shape that breathes, grows with how loud you are, and takes the timing light's colour, with the clock inside (decision 69); it is the stop button (decisions 74 and 75)
export function VoiceBlob({ levels, signal, clock, onStop, compact, paused = false }: { levels: number[]; signal: TimeSignal; clock: string; onStop: () => void; compact: boolean; paused?: boolean }) {
  // The latest few readings, averaged so the shape does not jitter
  const recent = levels.slice(-4);
  // How loud, from 0 to 1
  const level = Math.min(1, (recent.reduce((sum, value) => sum + value, 0) / Math.max(1, recent.length)) * 4);
  // The shape's size: bigger as the voice gets louder
  const scale = 0.82 + level * 0.3;
  // A round button holding the halo, the shape, the clock and "Stop" (the level stays named for screen readers)
  return (
    <button type="button" onClick={onStop} aria-label="Stop" data-variant="stop" className={`flex items-center justify-center rounded-full ${PRESS} ${shapePlace(compact, "size-72")}`}>
      {/* The level, named for screen readers */}
      <span role="img" aria-label="Microphone level" className="absolute inset-0" />
      {/* The dashed halo, turning slowly */}
      <span aria-hidden="true" className={`absolute inset-0 rounded-full border-2 border-dashed opacity-60 motion-safe:animate-spin-slow ${HALO_EDGE[signal]}`} />
      {/* The shape, growing with the voice and changing colour with the light */}
      <span aria-hidden="true" className={`absolute ${compact ? "inset-2" : "inset-6"} rounded-full transition-[transform,background-color,opacity] duration-150 ease-out ${paused ? "opacity-60" : "motion-safe:animate-morph"} ${BLOB_FILL[signal]}`} style={{ transform: `scale(${paused ? 0.82 : scale})` }} />
      {/* The clock, and the action */}
      <span className="relative flex flex-col items-center text-on-warm">
        {/* The clock (the button is named "Stop" alone) */}
        <span aria-hidden="true" className={`font-display font-semibold tabular-nums tracking-tight ${compact ? "text-xl" : "text-prompt-xl"}`}>{clock}</span>
        {/* The action */}
        <span className="text-footnote font-semibold">Stop</span>
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

// Before recording, or to start early: the same shape, still, as a round start button, with what it does and a short detail (decisions 74 and 75)
export function StartBlob({ label, detail, onStart, compact }: { label: string; detail: string; onStart: () => void; compact: boolean }) {
  // A round button with a quiet halo, the warm shape, a microphone and the words
  return (
    <button type="button" onClick={onStart} data-variant="start" className={`flex items-center justify-center rounded-full ${PRESS} ${shapePlace(compact, "size-56")}`}>
      {/* The dashed halo, still */}
      <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-dashed border-warm opacity-60" />
      {/* The shape, breathing slowly when motion is welcome */}
      <span aria-hidden="true" className={`absolute ${compact ? "inset-2" : "inset-4"} rounded-full bg-warm shadow-card motion-safe:animate-morph`} />
      {/* The microphone and the words */}
      <span className="relative flex max-w-[80%] flex-col items-center gap-0.5 text-center text-on-warm">
        {/* The microphone */}
        <MicrophoneIcon aria-hidden="true" weight="fill" className={compact ? "size-5 md:size-6" : "size-9"} />
        {/* What it does */}
        <span className={`font-semibold leading-tight ${compact ? "text-tab" : "font-display text-xl"}`}>{label}</span>
        {/* The detail (left out of the small corner shape) */}
        <span className={compact ? "sr-only" : "text-footnote leading-tight"}>{detail}</span>
      </span>
    </button>
  );
}

// While waiting (a countdown, a question being said, the microphone starting, saving): the still shape with what is happening, not a button
export function StatusBlob({ label, detail, compact }: { label: string; detail: string; compact: boolean }) {
  // The shape, quieter, with the words announced politely
  return (
    <div role="status" className={`flex items-center justify-center rounded-full ${shapePlace(compact, "size-56")}`}>
      {/* The dashed halo, turning slowly */}
      <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-dashed border-warm opacity-60 motion-safe:animate-spin-slow" />
      {/* The shape, faded */}
      <span aria-hidden="true" className={`absolute ${compact ? "inset-2" : "inset-4"} rounded-full bg-warm opacity-70 motion-safe:animate-morph`} />
      {/* The words */}
      <span className="relative flex max-w-[80%] flex-col items-center text-center text-on-warm">
        {/* What is happening */}
        <span className={`font-semibold leading-tight ${compact ? "text-tab" : "font-display text-xl"}`}>{label}</span>
        {/* The detail */}
        <span className={compact ? "sr-only" : "text-footnote leading-tight"}>{detail}</span>
      </span>
    </div>
  );
}
