// The Chart Kit's tiny fingerprint for a History row (second design pass): the take's ribbon from the 32 numbers kept on its session (decision 115), small and still, with a dot under it for each pause word. Decoration beside words that already say what the take was, unless given a label

// Load the ribbon from the tiny copy
import { ribbonFromMini } from "@/core/chartKit";
// Load the tiny copy's type
import type { MiniFingerprint } from "@/core/miniFingerprint";
// Load the ribbon
import { VoiceRibbon } from "@/components/charts/VoiceRibbon";

// What the tiny fingerprint needs
export interface TakeFingerprintProps {
  // The tiny copy kept on the session
  mini: MiniFingerprint;
  // The take's length in seconds, for where the pause words sit (only its shape matters, so any length draws)
  duration?: number;
  // A day-1 or older take drawn as a grey ghost
  ghost?: boolean;
  // Whether pause words are shown (decision 79)
  pauseWords?: boolean;
  // Read out when given; otherwise hidden from screen readers
  label?: string | null;
  // The width it is drawn at, in pixels
  width?: number;
}

// The tiny ribbon
export function TakeFingerprint({ mini, duration = 32, ghost = false, pauseWords = true, label = null, width = 112 }: TakeFingerprintProps) {
  // The ribbon, at the row's size, still and with no values to point at
  return (
    <span data-mini-fingerprint className="block flex-none" style={{ width }}>
      <VoiceRibbon ribbon={ribbonFromMini(mini, duration)} width={width} height={16} tone={ghost ? "ghost" : "voice"} pauseWords={pauseWords} label={label} marks={false} draw={false} />
    </span>
  );
}
