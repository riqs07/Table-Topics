// The How it went beat (31.0 s, 4.0 s long): the result of the talk with Maya; the camera leans in as "45%" counts up and lands, "2 questions" pops, the two-lane talk timeline draws left to right, then the "One change" card flips to show how the line could sound

// Load React's types and Remotion's frame
import type { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
// Load the kit, the cast and the colours
import { AppWindow, Backdrop, CARD, CHUNKY, LAB, round, s, ease, usePop, type Camera, type Cue, SCREEN } from "../kit";
import { Cast, blinking } from "../Cast";
import { B, TEXT, mix } from "../palette";

// This beat's sounds: a pop as 45% lands, a soft chime as the better line turns over
export const HOW_IT_WENT_SOUNDS: Cue[] = [{ at: 1.3, sound: "pop" }, { at: 2.4, sound: "chime" }];

// When things happen (frames from the beat's start)
const T = {
  // The share counts up and lands
  countFrom: s(0.3), lands: s(1.3),
  // "2 questions" pops after it
  questions: s(1.6),
  // The timeline draws across
  drawFrom: s(0.6), drawTo: s(2.4),
  // The camera leans in, then eases back
  inFrom: s(0.05), inTo: s(1.3), backFrom: s(1.6), backTo: s(2.5),
  // The better line turns over
  reveal: s(2.4),
} as const;

// Who talked when: each turn's start and length in the timeline's 712 units (Maya on top, you below); the sun one is the line in One change
const MAYA_TURNS: Array<[number, number]> = [[0, 24], [72, 36], [148, 12], [188, 24], [276, 56], [372, 64], [488, 36], [604, 40]];
const YOUR_TURNS: Array<[number, number]> = [[32, 32], [120, 20], [172, 8], [224, 40], [344, 20], [448, 32], [536, 56], [660, 32]];
// The line in One change (your third turn)
const CHANGE_TURN = 2;

// A stretch of the conversation (Maya's lines with her face, and yours)
const CONVERSATION: Array<{ maya: boolean; text: string; change?: boolean }> = [
  { maya: true, text: "I moved here from Denver about a month ago, so everything’s still new. So how was your weekend?" },
  { maya: false, text: "Pretty good. I tried a pottery class on Saturday, for the first time." },
  { maya: true, text: "Ooh. And how was it?" },
  { maya: false, text: "It was good. Yeah.", change: true },
  { maya: true, text: "Come on, there must be one good bit. What was the best part?" },
  { maya: false, text: "Okay, the best part was my bowl. It came out totally lopsided, but I’m keeping it." },
];

// A small four-pointed sparkle
function Sparkle({ x, y, size, at }: { x: number; y: number; size: number; at: number }) {
  // The frame
  const frame = useCurrentFrame();
  // Popping out, then fading away
  const pop = usePop(at);
  // Gone a little after
  const fade = ease(frame, at + 12, at + 26, 1, 0);
  // The star
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20" style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity: fade * Math.min(1, pop), transform: `scale(${pop}) rotate(${(frame - at) * 2}deg)` }}>
      <path d="M0 -10L2.4 -2.4 10 0 2.4 2.4 0 10 -2.4 2.4 -10 0 -2.4 -2.4Z" fill={B.sun} />
    </svg>
  );
}

// A highlighter swipe behind a word, drawn left to right
function Swipe({ progress, children }: { progress: number; children: ReactNode }) {
  // The word over a soft marker
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ position: "absolute", left: -6, right: -6, bottom: 4, height: "42%", borderRadius: 10, background: B.hilite, transformOrigin: "0 50%", transform: `scaleX(${progress})` }} />
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
}

// The beat
export function HowItWent() {
  // The frame
  const frame = useCurrentFrame();
  // The share of the talking, counting up
  const share = Math.round(ease(frame, T.countFrom, T.lands, 0, 45));
  // The bounce as it lands
  const landPop = usePop(T.lands);
  // The number's size: a little punch as it lands, settling back
  const punch = frame < T.lands ? 1 : 1 + 0.22 * (1 - landPop);
  // "2 questions" popping in
  const qPop = usePop(T.questions);
  // The pair's happy hop as the number lands
  const since = frame - T.lands;
  const hop = since >= 0 ? Math.sin(since / 2.6) * Math.exp(-since / 9) : 0;
  // The timeline's sweep, in its 712 units
  const sweep = interpolate(frame, [T.drawFrom, T.drawTo], [0, 712], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The better line turning over
  const flip = usePop(T.reveal);
  // The camera: in towards the headline, then back to the whole result
  const lean = ease(frame, T.inFrom, T.inTo, 0, 1) - ease(frame, T.backFrom, T.backTo, 0, 1);
  const target: Camera = { scale: 1.22, x: 640, y: 339 };
  const camera: Camera = { scale: 1 + (target.scale - 1) * lean, x: SCREEN.w / 2 + (target.x - SCREEN.w / 2) * lean, y: SCREEN.h / 2 + (target.y - SCREEN.h / 2) * lean };
  // A slow bob for the pair
  const bob = Math.sin(frame / 16) * 3;
  // The marked line's glow once the better line shows
  const glow = ease(frame, T.reveal, T.reveal + 8, 0, 1) * ease(frame, T.reveal + 30, T.reveal + 50, 1, 0.45);
  // The beat's frame
  return (
    <>
      <Backdrop tint={B.apricot} />
      <AppWindow camera={camera}>
        <div style={{ position: "absolute", inset: 0, background: B.bg, fontFamily: TEXT, color: B.ink }}>
          {/* The header: close, a full progress bar, the mode */}
          <div style={{ position: "absolute", left: 56, right: 64, top: 0, height: 80, display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", fontSize: 24, fontWeight: 800, color: B.muted }}>✕</span>
            <div style={{ flex: 1, maxWidth: 720, height: 14, borderRadius: 999, background: B.accent }} />
            <span style={{ ...LAB, color: B.greenInk }}>Talk with someone</span>
          </div>

          {/* The main column */}
          <div style={{ position: "absolute", left: 64, top: 88, width: 940, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* The headline, with the two of you pleased beside it */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ ...LAB, color: B.greenInk }}>With Maya · At the office party · 2:58</span>
                <div style={{ ...round(52), position: "relative" }}>
                  You did{" "}
                  <span style={{ position: "relative", display: "inline-block" }}>
                    <Swipe progress={ease(frame, T.lands, T.lands + 9, 0, 1)}>
                      <span style={{ display: "inline-block", minWidth: "2.35ch", textAlign: "right", fontVariantNumeric: "tabular-nums", color: frame >= T.lands ? B.accentD : B.ink, transform: `scale(${punch})`, transformOrigin: "50% 70%" }}>{share}%</span>
                    </Swipe>
                    {/* Sparkles as it lands */}
                    <Sparkle x={-14} y={2} size={24} at={T.lands} />
                    <Sparkle x={104} y={-8} size={30} at={T.lands + 2} />
                    <Sparkle x={112} y={50} size={18} at={T.lands + 4} />
                  </span>{" "}
                  of the talking<br />and asked{" "}
                  <span style={{ display: "inline-block", opacity: Math.min(1, qPop * 1.5), transform: `scale(${0.6 + 0.4 * qPop})`, transformOrigin: "30% 70%" }}>
                    <Swipe progress={ease(frame, T.questions + 4, T.questions + 13, 0, 1)}><span style={{ color: frame >= T.questions ? B.accentD : B.ink }}>2 questions</span></Swipe>.
                  </span>
                </div>
              </div>
              <div style={{ flex: "none", display: "flex", alignItems: "flex-end", gap: 4, paddingBottom: 4 }}>
                <div style={{ transform: `translateY(${bob - Math.max(0, hop) * 14}px)` }}><Cast who="you" face="happy" size={124} squash={1 + hop * 0.07} /></div>
                <div style={{ transform: `translateY(${-bob - Math.max(0, hop) * 10}px)` }}><Cast who="friend" face="happy" size={100} squash={1 + hop * 0.07} blink={blinking(frame, 3)} /></div>
              </div>
            </div>

            {/* Who talked when: two lanes drawing across */}
            <div style={{ ...CARD, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <span style={LAB}>Who talked when</span>
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: B.muted }}><span style={{ width: 18, height: 10, borderRadius: 5, background: B.sun }} />the line in One change</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "52px 1fr", columnGap: 12, alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", height: "100%", fontSize: 15, fontWeight: 800 }}><span>Maya</span><span>You</span></div>
                <svg viewBox="0 0 712 68" width={828} height={79} style={{ display: "block", overflow: "visible" }}>
                  {/* The empty lanes */}
                  <rect x={0} y={4} width={712} height={24} rx={12} fill={B.soft} />
                  <rect x={0} y={40} width={712} height={24} rx={12} fill={B.soft} />
                  {/* Maya's turns, each growing as the sweep passes */}
                  {MAYA_TURNS.map(([x, w], i) => { const shown = Math.min(w, Math.max(0, sweep - x)); return shown > 0 ? <rect key={`m${i}`} x={x} y={4} width={shown} height={24} rx={Math.min(8, shown / 2)} fill={B.teal} /> : null; })}
                  {/* Your turns, the marked one in sun */}
                  {YOUR_TURNS.map(([x, w], i) => { const shown = Math.min(w, Math.max(0, sweep - x)); return shown > 0 ? <rect key={`y${i}`} x={x} y={40} width={shown} height={24} rx={Math.min(8, shown / 2)} fill={i === CHANGE_TURN ? B.sun : B.apricot} /> : null; })}
                  {/* A ring round the marked turn as the better line shows */}
                  <rect x={166} y={34} width={20} height={36} rx={9} fill="none" stroke={B.sun} strokeWidth={3} opacity={glow} />
                  {/* The sweep's playhead, gone once it reaches the end */}
                  <line x1={sweep} y1={-2} x2={sweep} y2={70} stroke={B.ink} strokeWidth={3} strokeLinecap="round" opacity={0.35 * ease(frame, T.drawTo - 4, T.drawTo + 4, 1, 0) * ease(frame, T.drawFrom, T.drawFrom + 3, 0, 1)} />
                </svg>
                <span />
                <div style={{ position: "relative", height: 20, marginTop: 4, fontSize: 13, fontWeight: 700, color: B.muted, fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ position: "absolute", left: 0 }}>0:00</span>
                  <span style={{ position: "absolute", left: "33.7%", transform: "translateX(-50%)" }}>1:00</span>
                  <span style={{ position: "absolute", left: "67.4%", transform: "translateX(-50%)" }}>2:00</span>
                  <span style={{ position: "absolute", right: 0 }}>2:58</span>
                </div>
              </div>
              <span style={{ fontWeight: 600, fontSize: 16, color: B.muted }}>Short turns, back and forth. Your longest ran 14 seconds.</span>
            </div>

            {/* One change: what you said, then how it could sound, turning over */}
            <div style={{ ...CARD, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={LAB}>One change</span>
              <span style={round(28)}>Give her one moment to ask about</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, perspective: 1100 }}>
                <div style={{ background: B.soft, borderRadius: 16, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6, boxShadow: `inset 5px 0 0 ${B.sun}` }}>
                  <span style={LAB}>You said</span>
                  <span style={{ fontWeight: 700, fontSize: 21, color: frame >= T.reveal + 6 ? B.muted : B.ink }}>“It was good. Yeah.”</span>
                </div>
                <div style={{ position: "relative" }}>
                  {/* The empty place it lands in */}
                  <div style={{ position: "absolute", inset: 0, borderRadius: 16, border: `2px dashed ${B.line}`, opacity: 1 - Math.min(1, flip * 2) }} />
                  {/* The better line, turning over */}
                  <div style={{ position: "relative", background: B.greenSoft, color: B.greenInk, borderRadius: 16, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6, transformOrigin: "0% 50%", transform: `rotateY(${(1 - flip) * -88}deg)`, opacity: frame < T.reveal ? 0 : Math.min(1, flip * 3) }}>
                    <span style={{ ...LAB, color: B.greenInk }}>It could sound like</span>
                    <span style={{ fontWeight: 700, fontSize: 21 }}>“It was so fun. My bowl came out totally lopsided…”</span>
                  </div>
                </div>
              </div>
              <span style={{ fontWeight: 600, fontSize: 16, color: B.muted, opacity: ease(frame, T.reveal + 10, T.reveal + 22, 0, 1) }}>A moment and a detail give her something to follow up, and the question hands the talk back.</span>
            </div>

            {/* What to do next */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 2 }}>
              <span style={CHUNKY}>Talk again</span>
              <span style={{ minHeight: 50, display: "inline-flex", alignItems: "center", padding: "0 18px", borderRadius: 14, border: `2px solid ${B.line}`, background: B.card, fontWeight: 800, fontSize: 15, color: B.muted, boxShadow: `0 3px 0 ${B.line}` }}>Back to Practice</span>
            </div>
          </div>

          {/* The conversation on the side, the line in One change marked */}
          <div style={{ ...CARD, position: "absolute", left: 1040, top: 100, width: 456, boxSizing: "border-box", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "baseline" }}><span style={LAB}>The conversation</span><span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: B.muted }}>16 turns</span></div>
            {CONVERSATION.map((turn, i) => turn.maya ? (
              <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 10, maxWidth: "92%" }}>
                <div style={{ flex: "none", width: 38 }}><Cast who="friend" face={i === 4 ? "flat" : "ready"} size={38} /></div>
                <div style={{ background: B.card, border: `2px solid ${B.line}`, borderRadius: 18, padding: "10px 14px", fontSize: 15, fontWeight: 700, display: "flex", flexDirection: "column" }}><b style={{ fontSize: 13, fontWeight: 800 }}>Maya</b>{turn.text}</div>
              </div>
            ) : (
              <div key={i} style={{ alignSelf: "flex-end", maxWidth: "84%", background: mix(B.sun, 28), borderRadius: 18, padding: "10px 14px", fontSize: 15, fontWeight: 700, display: "flex", flexDirection: "column", gap: 2, boxShadow: turn.change ? `0 0 0 ${3 + 3 * glow}px ${mix(B.sun, 40 + 60 * glow, B.card)}` : "none" }}>
                <b style={{ fontSize: 13, fontWeight: 800 }}>You</b>{turn.text}
                {turn.change && <span style={{ ...LAB, color: B.ink, fontSize: 11 }}>One change is about this line</span>}
              </div>
            ))}
          </div>
        </div>
      </AppWindow>
    </>
  );
}
