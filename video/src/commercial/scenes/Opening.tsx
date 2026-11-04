// The opening (0 to 12.6 s), the hook: a small blob on a dark stage with a giant spiky shadow behind it, the ums piling up around it, then the lights come up on VoiceLab and Sage steps in
// Three parts: "The shadow" (0 to 4.8 s), "Um." (4.8 to 8.2 s) and "Meet VoiceLab." (8.2 to 12.6 s); Mira's voice and the captions are laid over it by Commercial
// It fills the whole frame (1920 by 1080) instead of sitting in the app window

// Load Remotion's frame tools
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
// Load the kit, the cast and the colours
import { Backdrop, Speech, ease, round, s, usePop, type Cue } from "../kit";
import { Cast, blinking, type Face } from "../Cast";
import { B, ROUND, mix } from "../palette";

// The stage floor's line on the frame (the blob stands on it)
const FLOOR = 780;
// The blob's size on the dark stage
const SMALL = 160;

// When things happen (frames from the scene's start)
const T = {
  // The off-stage question pops in
  question: s(0.5),
  // The blob starts looking puzzled at its own ums
  hmm: s(6.4),
  // The ums start bursting, one every 3 frames
  burst: s(8.3),
  // The dark stage fades away
  lightsFrom: s(8.4), lightsTo: s(9.0),
  // The wordmark lands and the blob smiles
  wordmark: s(9.0),
  // Sage steps in and the blob makes room
  sageFrom: s(9.5), sageTo: s(10.4),
  // The gentle push into the next scene
  pushFrom: s(11.4), pushTo: s(12.8),
} as const;

// A filler word: its text, where it sits around the blob's middle, its type size and lean
interface FillerWord { text: string; dx: number; dy: number; size: number; tilt: number }
// The filler words; one pops in every 0.4 s from 5.0 s
const FILLERS: FillerWord[] = [
  { text: "um", dx: -195, dy: -135, size: 84, tilt: -8 },
  { text: "so", dx: 185, dy: -150, size: 74, tilt: 7 },
  { text: "like", dx: -235, dy: 10, size: 70, tilt: 5 },
  { text: "uh", dx: 115, dy: -15, size: 76, tilt: -6 },
  { text: "um…", dx: -15, dy: -255, size: 86, tilt: 3 },
  { text: "you know", dx: 25, dy: 42, size: 60, tilt: -4 },
  { text: "so…", dx: -105, dy: -60, size: 66, tilt: -10 },
];
// The frame each filler pops in
const fillerAt = (index: number): number => s(5.0 + index * 0.4);
// The frame each filler bursts
const burstAt = (index: number): number => T.burst + index * 3;

// This beat's sounds: a pop for each um, a few pops as they burst, a chime as the name lands
export const OPENING_SOUNDS: Cue[] = [
  ...FILLERS.map((_, index) => ({ at: 5.0 + index * 0.4, sound: "pop" as const })),
  { at: 8.3, sound: "pop" }, { at: 8.5, sound: "pop" }, { at: 8.7, sound: "pop" }, { at: 8.9, sound: "pop" },
  { at: 9.0, sound: "chime" },
];

// The giant shadow's outline: the blob's round with spikes over its top, its base at y = 0, about 100 units tall (built once)
const SPIKY = ((): string => {
  // Points round the top, alternating spike tips and dips, from low on the left over the top to low on the right
  const points: string[] = [];
  // How many spikes
  const spikes = 11;
  // Each tip and dip
  for (let i = 0; i <= spikes * 2; i += 1) {
    // The angle along the arc (below the middle on the left, over the top, below the middle on the right)
    const angle = Math.PI - 0.35 + (i / (spikes * 2)) * (Math.PI + 0.7);
    // Tips stick out by uneven amounts, dips sit on the body
    const reach = i % 2 === 1 ? 1.24 + 0.1 * ((i * 7) % 3) : 0.98;
    // The point, round a middle 52 units up
    points.push(`${(Math.cos(angle) * 50 * reach).toFixed(1)} ${(-52 + Math.sin(angle) * 52 * reach).toFixed(1)}`);
  }
  // The outline: the spiky top, then curving down to a flat base and back up
  return `M${points[0]} L${points.slice(1).join(" L")} Q46 -2 30 0 L-30 0 Q-46 -2 ${points[0]} Z`;
})();

// The dark stage: the curtain in soft folds, a valance, a warm pool of light, the floor and the front row's heads as silhouettes
function DarkStage() {
  // The frame, for the curtain's slow sway
  const frame = useCurrentFrame();
  // The darker shade of the heads
  const head = mix(B.night, 55, "black");
  // The stage
  return (
    <div style={{ position: "absolute", inset: 0, background: B.night, overflow: "hidden" }}>
      {/* The curtain: soft vertical folds, swaying a few pixels */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: FLOOR, background: `repeating-linear-gradient(90deg, ${B.night} 0px, ${B.nightCard} 70px, ${B.night} 140px)`, backgroundPosition: `${Math.sin(frame / 60) * 6}px 0` }} />
      {/* The warm light on the curtain behind the blob */}
      <div style={{ position: "absolute", left: 960 - 520, top: FLOOR - 640, width: 1040, height: 760, borderRadius: "50%", background: `radial-gradient(closest-side, ${mix(B.sun, 26, "transparent")}, transparent)` }} />
      {/* A faint lamp glow high on the left */}
      <div style={{ position: "absolute", left: -200, top: -260, width: 760, height: 620, borderRadius: "50%", background: `radial-gradient(closest-side, ${mix(B.sun, 10, "transparent")}, transparent)` }} />
      {/* The valance: a band along the top with scalloped edges */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 56, background: B.nightCard }} />
      {Array.from({ length: 13 }, (_, i) => <div key={i} style={{ position: "absolute", left: i * 160 - 20, top: 20, width: 160, height: 72, borderRadius: "50%", background: B.nightCard }} />)}
      {/* The floor, lit warmly near the front */}
      <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR, bottom: 0, background: `linear-gradient(${mix(B.sun, 12, B.night)}, ${B.night})`, borderTop: `4px solid ${mix(B.sun, 20, B.night)}` }} />
      {/* The pool of light the blob stands in */}
      <div style={{ position: "absolute", left: 960 - 280, top: FLOOR - 40, width: 560, height: 110, borderRadius: "50%", background: `radial-gradient(closest-side, ${mix(B.sun, 32, "transparent")}, transparent)` }} />
      {/* The front row: the backs of five heads and shoulders, as dark silhouettes */}
      {[{ x: 170, k: 1.0, y: 0 }, { x: 540, k: 0.9, y: 18 }, { x: 960, k: 1.06, y: 8 }, { x: 1370, k: 0.94, y: 14 }, { x: 1740, k: 1.02, y: 4 }].map(({ x, k, y }) => (
        <div key={x} style={{ position: "absolute", left: x, top: 900 + y, transform: `scale(${k})`, transformOrigin: "50% 0" }}>
          <div style={{ position: "absolute", left: -62, top: 0, width: 124, height: 132, borderRadius: "50%", background: head }} />
          <div style={{ position: "absolute", left: -140, top: 104, width: 280, height: 160, borderRadius: "140px 140px 0 0", background: head }} />
        </div>
      ))}
    </div>
  );
}

// One filler word: a cream bubble that pops in, then bursts
function Filler({ word, index, x, y }: { word: FillerWord; index: number; x: number; y: number }) {
  // The frame
  const frame = useCurrentFrame();
  // The word and its place
  const { text, dx, dy, size, tilt } = word;
  // Its pop-in
  const pop = usePop(fillerAt(index));
  // Its burst: a quick swell and fade
  const burst = ease(frame, burstAt(index), burstAt(index) + 5, 0, 1);
  // Gone once burst
  if (burst >= 1 || frame < fillerAt(index)) return null;
  // The bubble, centred on its place, with a small tail pointing back at the blob
  return (
    <div style={{ position: "absolute", left: x + dx, top: y + dy, transform: `translate(-50%, -50%) rotate(${tilt}deg) scale(${pop * (1 + burst * 0.35)})`, opacity: 1 - burst, zIndex: 10 + index }}>
      <div style={{ position: "relative", padding: `${size * 0.1}px ${size * 0.42}px ${size * 0.16}px`, borderRadius: size * 0.6, background: B.hl, boxShadow: `0 6px 0 ${mix(B.ink, 35, "transparent")}`, ...round(size), color: B.ink, whiteSpace: "nowrap" }}>
        {text}
        <span style={{ position: "absolute", left: dx < 0 ? "62%" : "30%", bottom: -9, width: 20, height: 20, background: B.hl, transform: "rotate(45deg)", borderRadius: 4 }} />
      </div>
    </div>
  );
}

// The opening
export function Opening() {
  // The frame and rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];

  // How far the lights have come up (0 dark stage, 1 cream page)
  const lights = ease(frame, T.lightsFrom, T.lightsTo, 0, 1);
  // How far Sage's entrance has got
  const enter = ease(frame, T.sageFrom, T.sageTo, 0, 1);

  // The blob's shiver: fast and tiny, stopping as the ums burst
  const shiver = ease(frame, T.burst, T.burst + 9, 1, 0);
  // Its gentle bob once at ease
  const bob = Math.sin(frame / 16) * 3 * ease(frame, T.wordmark, T.wordmark + 20, 0, 1);
  // Its size: small on the dark stage, a little bigger beside Sage
  const blobSize = SMALL + 90 * enter;
  // Where its base sits: centre stage, then moving left to make room
  const blobX = 960 - 135 * enter + Math.sin(frame * 2.7) * 1.5 * shiver;
  const blobBase = FLOOR + 20 * enter + Math.sin(frame * 3.9 + 1) * 0.8 * shiver + bob;
  // Its face: worried, puzzled at the ums, ready as they burst, happy as the name lands
  const face: Face = frame >= T.wordmark ? "happy" : frame >= T.burst ? "ready" : frame >= T.hmm ? "hmm" : "worried";
  // A little squash as it cheers up
  const cheer = spring({ frame: frame - T.wordmark, fps, config: { damping: 9, stiffness: 160 } });
  const blobSquash = frame >= T.wordmark ? 0.9 + 0.1 * cheer : 1;
  // The blob's middle on the frame on the dark stage (for the ums around it)
  const middle = { x: 960, y: FLOOR - SMALL * 0.36 };

  // The giant shadow: breathing slowly (1.0 to 1.07 over 2.6 s), then shrinking away as the lights come up
  const breathe = 1 + 0.035 * (1 - Math.cos((Math.PI * frame) / s(2.6)));
  const shrink = ease(frame, T.lightsFrom - 3, T.lightsTo, 1, 0.12);
  const shadowOpacity = ease(frame, T.lightsFrom + 4, T.lightsTo + 4, 0.92, 0);

  // Sage: from off the right edge, three small hops on the way, a squash as it lands
  const sageX = 2200 + (1105 - 2200) * enter;
  const hops = enter > 0 && enter < 1 ? -Math.abs(Math.sin(enter * Math.PI * 3)) * 18 : 0;
  const land = spring({ frame: frame - T.sageTo + 4, fps, config: { damping: 8, stiffness: 180 } });
  const sageSquash = frame >= T.sageTo - 4 ? 0.88 + 0.12 * land : 1;
  // Sage's base, matching the blob's
  const sageBase = FLOOR + 20;

  // The question bubble's pop-in
  const ask = usePop(T.question);
  // The wordmark's spring
  const word = usePop(T.wordmark);
  // The closing push: everything grows slightly and fades a little, so the cut to the app feels natural
  const pushScale = ease(frame, T.pushFrom, T.pushTo, 1, 1.12);
  const pushFade = ease(frame, T.pushFrom, T.pushTo, 1, 0.8);

  // The frame
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#f6eadb" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${pushScale})`, transformOrigin: "960px 560px", opacity: pushFade }}>
        {/* The cream page the lights come up on */}
        <Backdrop tint={B.sun} />
        {/* A warm glow behind the pair once the lights are up */}
        <div style={{ position: "absolute", left: 960 - 620, top: FLOOR - 520, width: 1240, height: 760, borderRadius: "50%", background: `radial-gradient(closest-side, ${mix(B.sun, 30, "transparent")}, transparent)`, opacity: lights }} />
        {/* The dark stage, fading away as the lights come up */}
        {lights < 1 && <div style={{ position: "absolute", inset: 0, opacity: 1 - lights }}><DarkStage /></div>}

        {/* The giant spiky shadow on the curtain, its base at the blob's feet */}
        {shadowOpacity > 0 && (
          <svg width={620} height={660} viewBox="-60 -125 120 128" style={{ position: "absolute", left: 960 - 310, top: FLOOR - 640, opacity: shadowOpacity, overflow: "visible" }}>
            <g transform={`scale(${breathe * shrink})`}>
              <path d={SPIKY} fill={mix(B.night, 70, "black")} stroke={mix(B.night, 70, "black")} strokeWidth={1.5} strokeLinejoin="round" />
            </g>
          </svg>
        )}
        {/* The blob's ordinary small shadow once the lights are up */}
        <div style={{ position: "absolute", left: blobX - blobSize * 0.36, top: FLOOR + 20 * enter - 12, width: blobSize * 0.72, height: 24, borderRadius: "50%", background: mix(B.ink, 14, "transparent"), opacity: ease(frame, T.lightsFrom + 6, T.lightsTo + 6, 0, 1) }} />
        {/* Sage's small shadow */}
        {enter > 0 && <div style={{ position: "absolute", left: sageX - 95, top: sageBase - 12, width: 190, height: 24, borderRadius: "50%", background: mix(B.ink, 14, "transparent"), opacity: enter }} />}

        {/* The blob: small and worried, shivering; then at ease */}
        <div style={{ position: "absolute", left: blobX - blobSize / 2, top: blobBase - blobSize * 0.925 }}>
          <Cast who="you" face={face} size={blobSize} squash={blobSquash} blink={blinking(frame, 0)} />
        </div>

        {/* The ums, piling up round the blob, then bursting */}
        {FILLERS.map((word, index) => <Filler key={index} word={word} index={index} x={middle.x} y={middle.y} />)}

        {/* Sage stepping in from the right */}
        {enter > 0 && (
          <div style={{ position: "absolute", left: sageX - 135, top: sageBase - 270 * 0.925 + hops }}>
            <Cast who="sage" face="encouraging" size={270} squash={sageSquash} blink={blinking(frame, 2)} />
          </div>
        )}

        {/* The question from off-stage, top left, fading with the dark */}
        <div style={{ position: "absolute", left: 110, top: 130, transform: `scale(${ask})`, transformOrigin: "0 100%", opacity: 1 - lights }}>
          <Speech side="left" style={{ fontFamily: ROUND, fontWeight: 600, fontSize: 44, padding: "22px 36px", borderRadius: 30, border: "none", boxShadow: `0 6px 0 ${mix(B.ink, 35, "transparent")}` }}>So… what do you think?</Speech>
        </div>

        {/* The wordmark, landing with a spring above them */}
        {frame >= T.wordmark && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", transform: `translateY(${(1 - word) * -60}px) scale(${0.7 + 0.3 * word})`, opacity: Math.min(1, word * 1.6) }}>
            <span style={{ ...round(124), color: B.ink, letterSpacing: "-0.01em" }}>VoiceLab</span>
          </div>
        )}
      </div>
    </div>
  );
}
