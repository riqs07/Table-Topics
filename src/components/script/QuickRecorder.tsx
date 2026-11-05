"use client";
// A small recorder for cards: say something, then see your words and hear it back (nothing is saved)

// Load React's tools
import { useEffect, useRef, useState } from "react";
// Load the player
import { Player } from "@/components/script/Player";
// Load the shared press effect (decision 79)
import { PRESS, PRIMARY, SECONDARY } from "@/components/script/Buttons";
// Load the blob singing in rings, for while you speak (Desktop Screens "Recording")
import { SingingBlob } from "@/components/script/PracticeBar";
// Load the icons for the round look: the microphone, stop, and again
import { ArrowCounterClockwiseIcon, MicrophoneIcon, StopIcon } from "@phosphor-icons/react/dist/ssr";
// Load the recording contracts
import type { AudioCapture, LiveTranscriber, RecordingServices } from "@/audio/services";

// What the recorder needs
interface QuickRecorderProps {
  // The microphone, speech-to-text and audio capture (fakes in tests)
  services: RecordingServices;
  // The button's words before recording
  action: string;
  // The longest it runs, in seconds
  maxSec?: number;
  // The button's look: the small one by default, or the references' big round microphone with its name under it (Desktop Screens "Listening", the answer out loud)
  look?: "small" | "round";
  // Whether it is the screen's second action (the white button until it records), so it never competes with the chunky one
  quiet?: boolean;
  // Called with what was said once it stops
  onDone?: (said: string) => void;
}

// What the recorder is doing
type Stage = "ready" | "recording" | "done" | "blocked";

// Draw the recorder
export function QuickRecorder({ services, action, maxSec = 30, onDone, look = "small", quiet = false }: QuickRecorderProps) {
  // Where it is
  const [stage, setStage] = useState<Stage>("ready");
  // The words heard so far
  const [said, setSaid] = useState("");
  // The recording's address, for playing it back
  const [url, setUrl] = useState<string | null>(null);
  // How long it ran
  const [seconds, setSeconds] = useState(0);
  // The running pieces
  const live = useRef<{ transcriber: LiveTranscriber; capture: AudioCapture; timer: ReturnType<typeof setTimeout>; startedAt: number } | null>(null);

  // Stop and clean up if the card closes while recording, and let go of the audio address
  useEffect(() => () => {
    // Anything still running
    const current = live.current;
    // Stop it quietly
    if (current) {
      // Forget it
      live.current = null;
      // Stop the timer
      clearTimeout(current.timer);
      // Stop listening and recording
      void current.transcriber.stop().catch(() => undefined);
      // And the audio
      void current.capture.stop().catch(() => undefined);
    }
  }, []);

  // Let go of an old recording's address when a new one replaces it
  useEffect(() => () => {
    // Free it
    if (url && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url);
  }, [url]);

  // Start recording
  async function start() {
    // Clear the last attempt
    setSaid("");
    // And its audio
    setUrl(null);
    // The microphone may be refused
    let stream: MediaStream;
    // Ask for it
    try {
      // Open it
      stream = await services.openMicrophone();
    } catch {
      // Say so
      setStage("blocked");
      // Stop here
      return;
    }
    // Record the audio
    const capture = services.createCapture(stream);
    // Turn speech into text
    const transcriber = services.createTranscriber();
    // Stop by itself at the limit
    const timer = setTimeout(() => void stop(), maxSec * 1000);
    // Keep the pieces
    live.current = { transcriber, capture, timer, startedAt: Date.now() };
    // Show the words as they come
    transcriber.start((text) => setSaid(`${text.final} ${text.interim}`.trim()), () => void stop());
    // Now recording
    setStage("recording");
  }

  // Stop, then show the words and the audio
  async function stop() {
    // The running pieces
    const current = live.current;
    // Nothing to stop
    if (!current) return;
    // Forget them, so nothing stops twice
    live.current = null;
    // Stop the timer
    clearTimeout(current.timer);
    // Stop both together
    const [text, audio] = await Promise.all([current.transcriber.stop(), current.capture.stop()]);
    // The words
    setSaid(text);
    // How long it ran
    setSeconds(Math.max(1, Math.round((Date.now() - current.startedAt) / 1000)));
    // An address to play it back from, where the browser can make one
    if (typeof URL.createObjectURL === "function") setUrl(URL.createObjectURL(audio));
    // Done
    setStage("done");
    // Tell the card
    onDone?.(text);
  }

  // Draw it
  return (
    <div className={look === "round" ? "mt-2 flex flex-col items-center text-center" : "mt-4"}>
      {/* The button: start, stop, or again (round: a big circle with its name under it, green to start, dark while recording, white to try again) */}
      {look === "round" ? (
        <button type="button" onClick={() => void (stage === "recording" ? stop() : start())} className={`group flex flex-col items-center gap-2.5 rounded-3xl px-4 py-1 ${PRESS}`}>
          {/* The circle */}
          <span aria-hidden="true" className={`grid size-24 place-items-center rounded-full transition-[transform,box-shadow] duration-100 motion-safe:group-active:translate-y-[3px] ${stage === "recording" ? "bg-ink text-paper-raised shadow-chunky" : stage === "done" ? "border-2 border-rule bg-card text-ink shadow-ledge" : "bg-fill text-fill-ink shadow-chunky group-active:shadow-chunky-pressed"}`}>
            {/* Its icon */}
            {stage === "recording" ? <StopIcon weight="fill" className="size-9" /> : stage === "done" ? <ArrowCounterClockwiseIcon weight="bold" className="size-8" /> : <MicrophoneIcon weight="bold" className="size-10" />}
          </span>
          {/* Its name */}
          <span className="font-display text-xl font-semibold">{stage === "recording" ? "Stop" : stage === "done" ? "Try again" : action}</span>
        </button>
      ) : (
        <span className="flex flex-wrap items-center gap-4">
          {/* While recording: you, singing in rings */}
          {stage === "recording" && <SingingBlob className="size-16" />}
          {/* The button: chunky green to start, dark and chunky to stop, white to try again */}
          <button type="button" onClick={() => void (stage === "recording" ? stop() : start())} className={stage === "recording" ? `inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-ink px-6 font-display text-button font-semibold uppercase tracking-[.03em] text-paper-raised shadow-chunky ${PRESS}` : stage === "done" || quiet ? SECONDARY : PRIMARY}>
            {/* Its icon */}
            {stage === "recording" ? <StopIcon aria-hidden="true" weight="fill" className="size-5" /> : stage === "done" ? <ArrowCounterClockwiseIcon aria-hidden="true" weight="bold" className="size-5" /> : <MicrophoneIcon aria-hidden="true" weight="bold" className="size-5" />}
            {/* Its words */}
            {stage === "recording" ? "Stop" : stage === "done" ? "Try again" : action}
          </button>
        </span>
      )}
      {/* A refused microphone */}
      {stage === "blocked" && <p role="alert" className="mt-2 text-footnote">The microphone is blocked. Allow it for this site, then try again.</p>}
      {/* The words, while and after speaking (not a live region: read out while recording, a screen reader would speak your own words back into the microphone) */}
      {(stage === "recording" || stage === "done") && <p data-testid="quick-words" className="mt-3 text-lede">{said || (stage === "recording" ? "Listening…" : "No words were caught.")}</p>}
      {/* For screen readers: the final words, said once when the take is done */}
      <p role="status" className="sr-only">{stage === "done" ? (said ? `You said: ${said}` : "No words were caught.") : ""}</p>
      {/* Play it back */}
      {stage === "done" && url && <div className="mt-3"><Player src={url} label="Your take" name="your take" durationSec={seconds} /></div>}
    </div>
  );
}
