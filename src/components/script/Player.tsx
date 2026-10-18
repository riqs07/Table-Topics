"use client";
// A player for a saved recording: one large play button, a bar to move through it, and the time

// Load React's state and reference tools
import { useRef, useState } from "react";
// Load the play and pause icons
import { PauseIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";

// What the player needs
interface PlayerProps {
  // Address of the audio
  src: string;
  // Name of the audio element, such as "Your recording"
  label: string;
  // What the button plays, such as "your recording"
  name: string;
  // Length of the recording in seconds (recorded audio often cannot report its own length)
  durationSec: number;
  // Hands the audio element to a parent that plays it itself (as "Play both" does)
  onAudio?: (element: HTMLAudioElement | null) => void;
  // Told the position as it plays, and whether it is playing (for following the transcript)
  onTime?: (seconds: number, playing: boolean) => void;
  // Offer a button to play at 1.5 times the speed
  speeds?: boolean;
}

// Draw the player
export function Player({ src, label, name, durationSec, onAudio, onTime, speeds = false }: PlayerProps) {
  // The audio element, for playing and moving through it
  const audio = useRef<HTMLAudioElement | null>(null);
  // Whether it is playing
  const [playing, setPlaying] = useState(false);
  // How far through it is, in seconds
  const [position, setPosition] = useState(0);
  // Whether it plays faster than normal
  const [fast, setFast] = useState(false);

  // Switch between normal speed and 1.5 times
  function toggleSpeed() {
    // The new setting
    const next = !fast;
    // Apply it, if drawn
    if (audio.current) audio.current.playbackRate = next ? 1.5 : 1;
    // Show it
    setFast(next);
  }

  // Play or pause
  function toggle() {
    // The element
    const element = audio.current;
    // Nothing to do before it is drawn
    if (!element) return;
    // Pause if playing
    if (playing) element.pause();
    // Otherwise play (the browser may refuse, which is fine)
    else void element.play().catch(() => setPlaying(false));
    // Show the new state at once
    setPlaying(!playing);
  }

  // Move to a point in the recording
  function seek(seconds: number) {
    // The element
    const element = audio.current;
    // Move it, if drawn
    if (element) element.currentTime = seconds;
    // Show the new position
    setPosition(seconds);
  }

  // The button's words, read by screen readers
  const action = `${playing ? "Pause" : "Play"} ${name}`;
  // Draw the button, the bar, and the time
  return (
    <div className="flex items-center gap-4">
      {/* The hidden audio element that does the playing */}
      <audio
        ref={(element) => {
          // Keep it for playing and moving through it
          audio.current = element;
          // And hand it to the parent, if asked
          onAudio?.(element);
        }}
        src={src}
        aria-label={label}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          // Where it is now
          const seconds = event.currentTarget.currentTime;
          // Show it
          setPosition(seconds);
          // Tell the parent, with whether it is playing
          onTime?.(seconds, !event.currentTarget.paused);
        }}
      />
      {/* Play or pause, a large square button in the accent */}
      <button type="button" onClick={toggle} aria-label={action} className="flex size-12 flex-none items-center justify-center bg-fill text-fill-ink">
        {/* The icon for what a press does */}
        {playing ? <PauseIcon size={24} weight="fill" aria-hidden /> : <PlayIcon size={24} weight="fill" aria-hidden />}
      </button>
      {/* The bar and the time */}
      <div className="min-w-0 flex-1">
        {/* A bar to move through the recording */}
        <input type="range" min={0} max={Math.max(1, Math.round(durationSec))} step={1} value={Math.min(position, durationSec)} onChange={(event) => seek(Number(event.target.value))} aria-label={`Position in ${name}`} className="h-11 w-full accent-accent" />
        {/* Time so far and the length */}
        <p className="text-footnote text-ink-muted">{`${formatClock(position)} / ${formatClock(durationSec)}`}</p>
      </div>
      {/* Faster or normal speed, when offered */}
      {speeds && (
        <button type="button" onClick={toggleSpeed} aria-pressed={fast} aria-label="Play at 1.5 times the speed" className="min-h-11 flex-none border border-rule px-3 text-footnote">
          {/* The speed */}
          {fast ? "1.5×" : "1×"}
        </button>
      )}
    </div>
  );
}
