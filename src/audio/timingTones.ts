// Play a timing cue without looking: a soft tone through the speaker, and a short buzz where the phone allows (Android; iPhones ignore it) (decision 77)

// Load the cue type
import type { TimingCue } from "@/core/recordingRules";

// How a cue is played
export interface CuePlayer {
  // Get sound ready during a tap (browsers only allow sound to start from one)
  prime(): void;
  // Play one tone or two
  play(cue: TimingCue): void;
  // Let the sound go
  close(): void;
}

// The pitch of a tone, in hertz (a soft A, well above speech)
const PITCH = 880;
// How long one tone lasts, in seconds
const LENGTH = 0.18;
// The gap from one tone's start to the next, in seconds
const GAP = 0.3;
// How loud, from 0 to 1 (quiet, so it does not startle or drown the voice)
const LOUDNESS = 0.12;

// The browser's sound maker (Safari's older name too)
type AudioContextMaker = new () => AudioContext;

// A player using the browser's sound and vibration, or a silent one where neither exists
export function createCuePlayer(maker: AudioContextMaker | undefined = typeof window !== "undefined" ? (window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioContextMaker }).webkitAudioContext) : undefined, vibrate: ((pattern: number[]) => boolean) | undefined = typeof navigator !== "undefined" && typeof navigator.vibrate === "function" ? (pattern) => navigator.vibrate(pattern) : undefined): CuePlayer {
  // The sound maker, made on the first tap
  let context: AudioContext | null = null;
  // The player
  return {
    // Make or wake the sound maker during a tap
    prime() {
      // No sound in this browser
      if (!maker) return;
      // Sound can be refused; the visual light still works
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
    // Play the cue
    play(cue) {
      // How many tones
      const count = cue === "two" ? 2 : 1;
      // A short buzz per tone, where the phone allows
      vibrate?.(count === 2 ? [120, 120, 120] : [120]);
      // No sound maker: the buzz (if any) is all
      if (!context) return;
      // Now, in the sound maker's time
      const now = context.currentTime;
      // Each tone
      for (let index = 0; index < count; index += 1) {
        // When this tone starts
        const start = now + index * GAP;
        // The tone
        const tone = context.createOscillator();
        // Its volume
        const volume = context.createGain();
        // A pure, soft sound
        tone.type = "sine";
        // At the set pitch
        tone.frequency.value = PITCH;
        // Fade in quickly and out gently, so it never clicks
        volume.gain.setValueAtTime(0, start);
        // Up
        volume.gain.linearRampToValueAtTime(LOUDNESS, start + 0.02);
        // Down
        volume.gain.exponentialRampToValueAtTime(0.0001, start + LENGTH);
        // Tone into volume into the speaker
        tone.connect(volume).connect(context.destination);
        // Play it
        tone.start(start);
        // And stop it
        tone.stop(start + LENGTH + 0.02);
      }
    },
    // Close the sound maker
    close() {
      // Let it go, if there is one
      void context?.close().catch(() => {});
      // Forget it
      context = null;
    },
  };
}
