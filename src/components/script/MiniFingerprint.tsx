// A take's tiny fingerprint in a History row (decision 115), drawn as the Chart Kit's ribbon (second design pass): its speech as thin bars (taller where louder), gaps where it paused and dots under it where pause words were said, from the 32 numbers kept on the session, so History never reads the readings (decision 99). Decoration beside words that already say what the take was

// Load the tiny fingerprint's check
import { isMiniFingerprint } from "@/core/miniFingerprint";
// Load the kit's tiny ribbon
import { TakeFingerprint } from "@/components/charts/TakeFingerprint";

// Draw a take's tiny fingerprint, or nothing when it has none (a day-1 take can be drawn grey, the ghost; pause words can be hidden, decision 79)
export function MiniFingerprint({ value, duration, ghost = false, pauseWords = true }: { value: unknown; duration?: number; ghost?: boolean; pauseWords?: boolean }) {
  // A copy this version can draw
  if (!isMiniFingerprint(value)) return null;
  // The ribbon
  return <TakeFingerprint mini={value} duration={duration} ghost={ghost} pauseWords={pauseWords} />;
}
