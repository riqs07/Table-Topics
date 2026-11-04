// The end card (43.4 to 48 s), the call to action: the opening's small stage again, now warm and lit, the blob at ease beside Sage, then "VoiceLab", "See how you sound." and "Join the waitlist"
// It fills the whole frame (1920 by 1080); Mira's last line plays over it and Commercial fades the music out at the end

// Load Remotion's frame tools
import { useCurrentFrame } from "remotion";
// Load the kit, the cast and the colours
import { Backdrop, CHUNKY, ease, round, s, usePop, type Cue } from "../kit";
import { Cast } from "../Cast";
import { B, TEXT, mix } from "../palette";

// When things happen (frames from the scene's start)
const T = {
  // The blob crouches, leaves the ground and lands
  crouch: 2, jump: s(0.3), land: s(0.3) + 13,
  // The words: the name, the line, the button and the small print
  wordmark: s(0.4), line: s(1.2), button: s(2.2), small: s(2.7),
} as const;

// This beat's sounds: a chime with the hop, a pop as the button lands
export const END_CARD_SOUNDS: Cue[] = [
  { at: 0.3, sound: "chime" },
  { at: 2.2, sound: "pop" },
];

// The stage step's middle and top (the characters stand on it)
const STEP = { x: 600, y: 790, w: 560 } as const;
// The text column's middle
const COLUMN = 1310;

// The lit stage: drapes pulled open at the sides in warm tints, a valance, a spotlight, and the front row's heads in soft colours
function LitStage() {
  // The two shades of the drapes' folds
  const [fold, deep] = [mix(B.apricot, 34, B.bg), mix(B.apricot, 52, B.bg)];
  // The heads' soft colours
  const heads = [B.sky, B.leaf, B.plum, B.sun, B.bloom, B.teal];
  // The stage
  return (
    <>
      {/* The spotlight: a warm glow on the step */}
      <div style={{ position: "absolute", left: STEP.x - 560, top: STEP.y - 640, width: 1120, height: 860, borderRadius: "50%", background: `radial-gradient(closest-side, ${mix(B.sun, 34, "transparent")}, transparent)` }} />
      {/* The left and right drapes, gathered towards the edges */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 150, height: 1080, background: `repeating-linear-gradient(90deg, ${deep} 0px, ${fold} 38px, ${deep} 76px)`, borderBottomRightRadius: 140 }} />
      <div style={{ position: "absolute", right: 0, top: 0, width: 150, height: 1080, background: `repeating-linear-gradient(90deg, ${deep} 0px, ${fold} 38px, ${deep} 76px)`, borderBottomLeftRadius: 140 }} />
      {/* The valance: a band along the top with scalloped edges */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 44, background: deep }} />
      {Array.from({ length: 13 }, (_, i) => <div key={i} style={{ position: "absolute", left: i * 160 - 20, top: 12, width: 160, height: 60, borderRadius: "50%", background: deep }} />)}
      {/* The step: a round platform, its front a little darker */}
      <div style={{ position: "absolute", left: STEP.x - STEP.w / 2, top: STEP.y, width: STEP.w, height: 70, borderRadius: `0 0 ${STEP.w / 2}px ${STEP.w / 2}px / 0 0 46px 46px`, background: mix(B.apricot, 46, B.card) }} />
      <div style={{ position: "absolute", left: STEP.x - STEP.w / 2, top: STEP.y - 40, width: STEP.w, height: 80, borderRadius: "50%", background: mix(B.sun, 26, B.card), boxShadow: `inset 0 -4px 0 ${mix(B.apricot, 30, B.card)}` }} />
      {/* The front row: the backs of six heads in soft colours */}
      {[{ x: 210, k: 1.0, y: 6 }, { x: 520, k: 0.9, y: 22 }, { x: 830, k: 1.04, y: 10 }, { x: 1150, k: 0.94, y: 20 }, { x: 1460, k: 1.0, y: 8 }, { x: 1760, k: 0.92, y: 18 }].map(({ x, k, y }, i) => (
        <div key={x} style={{ position: "absolute", left: x, top: 950 + y, transform: `scale(${k})`, transformOrigin: "50% 0" }}>
          <div style={{ position: "absolute", left: -58, top: 0, width: 116, height: 124, borderRadius: "50%", background: mix(heads[i % heads.length] ?? B.sun, 42, B.bg) }} />
          <div style={{ position: "absolute", left: -130, top: 98, width: 260, height: 150, borderRadius: "130px 130px 0 0", background: mix(heads[i % heads.length] ?? B.sun, 52, B.bg) }} />
        </div>
      ))}
    </>
  );
}

// The end card
export function EndCard() {
  // The frame
  const frame = useCurrentFrame();

  // The hop: in the air between the jump and the landing (0 on the ground, 1 at the top)
  const air = frame > T.jump && frame < T.land ? Math.sin((Math.PI * (frame - T.jump)) / (T.land - T.jump)) : 0;
  // Squash and stretch: crouching before, stretched in the air, squashed on landing and settling
  const squash = frame <= T.jump ? ease(frame, T.crouch, T.jump, 1, 0.86) : frame < T.land ? 1 + 0.08 * air : 1 - 0.14 * Math.exp(-(frame - T.land) / 4) * Math.cos((frame - T.land) * 0.6);
  // The blob's size and base
  const blob = { size: 250, x: STEP.x - 125, base: STEP.y - 4 - air * 80 };
  // Sage's size and place
  const sage = { size: 270, x: STEP.x + 135 };

  // The words' pop-ins
  const word = usePop(T.wordmark);
  const line = usePop(T.line);
  const button = usePop(T.button);
  // The small print fading up
  const small = ease(frame, T.small, T.small + 12, 0, 1);

  // The frame
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* The cream page and the lit stage */}
      <Backdrop tint={B.sun} />
      <LitStage />

      {/* The characters' ordinary shadows on the step (the blob's shrinks as it leaves the ground) */}
      <div style={{ position: "absolute", left: blob.x - 90 * (1 - air * 0.35), top: STEP.y - 14, width: 180 * (1 - air * 0.35), height: 26, borderRadius: "50%", background: mix(B.ink, 14, "transparent") }} />
      <div style={{ position: "absolute", left: sage.x - 98, top: STEP.y - 14, width: 196, height: 26, borderRadius: "50%", background: mix(B.ink, 14, "transparent") }} />
      {/* The blob, happy, hopping once */}
      <div style={{ position: "absolute", left: blob.x - blob.size / 2, top: blob.base - blob.size * 0.925 }}>
        <Cast who="you" face="happy" size={blob.size} squash={squash} />
      </div>
      {/* Sage beside it, proud */}
      <div style={{ position: "absolute", left: sage.x - sage.size / 2, top: STEP.y - 4 - sage.size * 0.925 }}>
        <Cast who="sage" face="proud" size={sage.size} />
      </div>

      {/* The words, in a column on the right */}
      <div style={{ position: "absolute", left: COLUMN - 420, width: 840, top: 280, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {/* The name */}
        <div style={{ ...round(156), color: B.ink, letterSpacing: "-0.01em", transform: `translateY(${(1 - word) * 40}px) scale(${0.7 + 0.3 * word})`, opacity: Math.min(1, word * 1.6) }}>VoiceLab</div>
        {/* The line */}
        <div style={{ ...round(54, 500), color: B.ink, marginTop: 18, transform: `translateY(${(1 - line) * 24}px)`, opacity: Math.min(1, line * 1.6) }}>See how you sound.</div>
        {/* The button: direction B's chunky green pill */}
        <div style={{ ...CHUNKY, marginTop: 56, minHeight: 92, padding: "0 56px", borderRadius: 999, fontSize: 36, boxShadow: `0 5px 0 ${B.accentD}`, transform: `scale(${button})`, opacity: Math.min(1, button * 2) }}>Join the waitlist</div>
      </div>
      {/* The small print at the bottom of the column */}
      <div style={{ position: "absolute", left: COLUMN - 420, width: 840, top: 770, textAlign: "center", fontFamily: TEXT, fontWeight: 700, fontSize: 24, color: B.muted, opacity: small }}>A first look at the new VoiceLab</div>
    </div>
  );
}
