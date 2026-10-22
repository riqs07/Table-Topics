// A take's tiny fingerprint in a History row (decision 115): its stretches of speech (taller where louder) and ticks where pause words were said, drawn from the 32 numbers kept on the session, so History never reads the readings (decision 99). Decoration beside words that already say what the take was

// Load the tiny fingerprint's rules
import { MINI_BINS, isMiniFingerprint, miniStretches } from "@/core/miniFingerprint";

// The picture's size
const SIZE = { width: 112, height: 22 } as const;

// Draw a take's tiny fingerprint, or nothing when it has none
export function MiniFingerprint({ value }: { value: unknown }) {
  // A copy this version can draw
  if (!isMiniFingerprint(value)) return null;
  // Pixels per part
  const per = SIZE.width / MINI_BINS;
  // The picture
  return (
    <svg data-mini-fingerprint width={SIZE.width} height={SIZE.height} viewBox={`0 0 ${SIZE.width} ${SIZE.height}`} aria-hidden="true" className="block flex-none">
      {/* The stretches of speech */}
      {miniStretches(value).map((run) => {
        // Its height
        const tall = 4 + run.level * 12;
        // The stretch
        return <rect key={run.from} x={run.from * per} y={13 - tall / 2} width={Math.max(2, (run.to - run.from + 1) * per - 1.5)} height={tall} rx="2" className="fill-accent" />;
      })}
      {/* The pause words */}
      {value.ums.map((bin) => <polygon key={bin} points={`${(bin + 0.5) * per},0 ${(bin + 0.5) * per + 2.5},3.5 ${(bin + 0.5) * per - 2.5},3.5`} className="fill-warm" />)}
    </svg>
  );
}
