// Play the reading metronome: a short, soft tick on every beat through the speaker (decision 128)

// Load the beat rules
import { DEFAULT_TEMPO, beatSeconds, beatsDue } from "@/core/metronome";

// How the metronome is played
export interface Metronome {
  // Get sound ready during a tap (browsers only allow sound to start from one)
  prime(): void;
  // Start ticking at a tempo, or change the tempo while ticking
  start(tempo: number): void;
  // Stop ticking
  stop(): void;
  // Let the sound go
  close(): void;
}

// The pitch of a tick, in hertz (high and short, so it reads as a click and not a note)
const PITCH = 1500;
// How long one tick lasts, in seconds
const LENGTH = 0.04;
// How loud, from 0 to 1 (quiet, so it guides without drowning the voice)
const LOUDNESS = 0.15;
// How often the beats ahead are checked, in milliseconds
const CHECK_MS = 25;
// How far ahead beats are booked with the sound maker, in seconds (so a late check never makes a late tick)
const LOOK_AHEAD = 0.1;

// The browser's sound maker (Safari's older name too)
type AudioContextMaker = new () => AudioContext;

// The timers the metronome uses (the browser's own by default; fakes in tests)
interface Timers {
  // Run a check again and again
  every(run: () => void, ms: number): unknown;
  // Stop the checks
  cancel(handle: unknown): void;
}

// The browser's timers
const BROWSER_TIMERS: Timers = {
  // Repeat
  every: (run, ms) => setInterval(run, ms),
  // Stop repeating
  cancel: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

// A metronome using the browser's sound, or a silent one where there is none
export function createMetronome(maker: AudioContextMaker | undefined = typeof window !== "undefined" ? (window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioContextMaker }).webkitAudioContext) : undefined, timers: Timers = BROWSER_TIMERS): Metronome {
  // The sound maker, made on the first tap
  let context: AudioContext | null = null;
  // The repeating check, while ticking
  let checker: unknown = null;
  // Seconds between beats
  let gap = beatSeconds(DEFAULT_TEMPO);
  // When the next beat falls, in the sound maker's time
  let nextBeat = 0;

  // Book one tick with the sound maker
  const tick = (sound: AudioContext, at: number) => {
    // The tone
    const tone = sound.createOscillator();
    // Its volume
    const volume = sound.createGain();
    // A rounder click than a square wave
    tone.type = "triangle";
    // At the set pitch
    tone.frequency.value = PITCH;
    // Start silent
    volume.gain.setValueAtTime(0, at);
    // Up quickly
    volume.gain.linearRampToValueAtTime(LOUDNESS, at + 0.003);
    // And straight down, so it is a click
    volume.gain.exponentialRampToValueAtTime(0.0001, at + LENGTH);
    // Tone into volume into the speaker
    tone.connect(volume).connect(sound.destination);
    // Play it
    tone.start(at);
    // And stop it
    tone.stop(at + LENGTH + 0.01);
  };

  // Book every beat that falls inside the look-ahead
  const check = () => {
    // No sound: nothing to book
    if (!context) return;
    // Now, in the sound maker's time
    const now = context.currentTime;
    // A beat left far behind (the tab was asleep): pick up from now rather than playing a burst
    if (nextBeat < now - gap) nextBeat = now;
    // The beats due
    const due = beatsDue(nextBeat, now + LOOK_AHEAD, gap);
    // Book each
    for (const at of due.beats) tick(context, at);
    // Remember the next
    nextBeat = due.next;
  };

  // Stop ticking (beats already booked are a tenth of a second at most)
  const stop = () => {
    // Not ticking: nothing to do
    if (checker === null) return;
    // Stop the checks
    timers.cancel(checker);
    // Forget them
    checker = null;
  };

  // The metronome
  return {
    // Make or wake the sound maker during a tap
    prime() {
      // No sound in this browser
      if (!maker) return;
      // Sound can be refused
      try {
        // Make it once
        context ??= new maker();
        // Wake it if asleep
        if (context.state === "suspended") void context.resume();
      } catch {
        // No sound, then
        context = null;
      }
    },
    // Start, or change the tempo
    start(tempo) {
      // The new gap between beats
      gap = beatSeconds(tempo);
      // Already ticking: the new gap applies from the next beat
      if (checker !== null) return;
      // The first beat straight away
      nextBeat = context ? context.currentTime + 0.05 : 0;
      // Check now, then again and again
      check();
      // Keep checking
      checker = timers.every(check, CHECK_MS);
    },
    // Stop ticking
    stop,
    // Stop and close the sound maker
    close() {
      // Stop ticking first
      stop();
      // Let the sound go, if there is one
      void context?.close().catch(() => {});
      // Forget it
      context = null;
    },
  };
}
