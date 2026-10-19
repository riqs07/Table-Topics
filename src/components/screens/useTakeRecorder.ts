"use client";
// Records one take at a time for the voice drills and shadowing: the audio, loudness and pitch ten times a second, and (when asked) the words (decision 80)

// Load React's state, ref and effect tools
import { useCallback, useEffect, useRef, useState } from "react";
// Load the recording contracts
import type { AudioCapture, LiveTranscriber, RecordingProblem, RecordingServices } from "@/audio/services";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the screen hold, so the phone does not lock mid-take
import { holdScreenAwake } from "@/audio/wakeLock";
// Load the take type
import type { TakeRecording } from "@/core/voiceFindings";

// A finished take, with its audio
export interface TakeResult extends TakeRecording {
  // The recorded audio
  audio: Blob;
}

// What the recorder needs
interface TakeRecorderOptions {
  // The browser's microphone, transcriber and capture
  services: RecordingServices;
  // The clock
  clock: () => Date;
  // Turn off the browser's automatic levelling, so loud and soft stay different (volume and pitch)
  raw: boolean;
  // Listen for words too (clear sounds and shadowing)
  words: boolean;
}

// What the recorder hands the screen
export interface TakeRecorder {
  // Whether a take is under way
  recording: boolean;
  // Whether a take is being stopped (the speech service can take a moment to hand back the words)
  stopping: boolean;
  // The latest loudness readings, for the voice shape
  levels: number[];
  // Seconds into the take
  elapsed: number;
  // A problem that stopped it, if any
  problem: RecordingProblem | null;
  // Start a take (false if it could not start)
  start: () => Promise<boolean>;
  // Stop the take and hand it back (null if none was under way)
  stop: () => Promise<TakeResult | null>;
}

// The recorder
export function useTakeRecorder({ services, clock, raw, words }: TakeRecorderOptions): TakeRecorder {
  // Whether a take is under way
  const [recording, setRecording] = useState(false);
  // Whether a take is being stopped
  const [stopping, setStopping] = useState(false);
  // The latest readings, for the shape
  const [levels, setLevels] = useState<number[]>([]);
  // Seconds into the take
  const [elapsed, setElapsed] = useState(0);
  // A problem, if any
  const [problem, setProblem] = useState<RecordingProblem | null>(null);
  // The pieces of the take under way
  const live = useRef<{ capture: AudioCapture; transcriber: LiveTranscriber | null; startedAt: Date; timer: ReturnType<typeof setInterval>; levels: number[]; pitches: (number | null)[] } | null>(null);

  // Start a take
  const start = useCallback(async () => {
    // Already under way
    if (live.current) return false;
    // Clear any earlier problem
    setProblem(null);
    // The microphone
    let stream: MediaStream;
    // Ask for it
    try {
      // Raw for volume and pitch
      stream = await services.openMicrophone(raw ? { raw: true } : undefined);
    } catch (error) {
      // A missing microphone, or a refusal
      setProblem((error as DOMException).name === "NotFoundError" ? "no-microphone" : "microphone-blocked");
      // Not started
      return false;
    }
    // Record the audio
    const capture = services.createCapture(stream);
    // Listen for words, when asked and possible
    const transcriber = words && services.speechSupported() ? services.createTranscriber() : null;
    // Start listening (problems with the speech service show, but the take goes on)
    transcriber?.start(() => {}, (trouble) => setProblem(trouble));
    // The readings so far
    const readings = { levels: [] as number[], pitches: [] as (number | null)[] };
    // When it began
    const startedAt = clock();
    // Read loudness and pitch ten times a second
    const timer = setInterval(() => {
      // Loudness
      readings.levels.push(capture.level());
      // Pitch, where the capture can tell
      readings.pitches.push(capture.pitch?.() ?? null);
      // The latest few, for the shape
      setLevels(readings.levels.slice(-8));
      // Time so far
      setElapsed((clock().getTime() - startedAt.getTime()) / 1000);
    }, LOUDNESS_TICK_MS);
    // Keep the pieces
    live.current = { capture, transcriber, startedAt, timer, ...readings };
    // Fresh shape and clock
    setLevels([]);
    // From zero
    setElapsed(0);
    // Under way
    setRecording(true);
    // Started
    return true;
  }, [clock, raw, services, words]);

  // Stop the take and hand it back
  const stop = useCallback(async () => {
    // The take under way
    const current = live.current;
    // None
    if (!current) return null;
    // Forget it, so nothing stops twice
    live.current = null;
    // Stop reading
    clearInterval(current.timer);
    // How long it ran
    const durationSec = Math.round(((clock().getTime() - current.startedAt.getTime()) / 1000) * 10) / 10;
    // No longer recording
    setRecording(false);
    // But still stopping
    setStopping(true);
    // Stop listening and recording together
    const [transcript, audio] = await Promise.all([current.transcriber ? current.transcriber.stop() : Promise.resolve(""), current.capture.stop()]);
    // Stopped
    setStopping(false);
    // The take
    return { durationSec, levels: current.levels.map((level) => Math.round(level * 1000) / 1000), pitches: current.pitches, transcript, audio };
  }, [clock]);

  // Keep the screen on during a take
  useEffect(() => (recording ? holdScreenAwake() : undefined), [recording]);
  // Let the microphone go if the screen closes mid-take
  useEffect(() => () => {
    // The take under way, if any
    const current = live.current;
    // Nothing to stop
    if (!current) return;
    // Stop reading
    clearInterval(current.timer);
    // Stop listening and recording, keeping nothing
    void current.transcriber?.stop();
    // And the audio
    void current.capture.stop();
  }, []);

  // Hand it all back
  return { recording, stopping, levels, elapsed, problem, start, stop };
}
