// The Quick look beat (35.0 s, 4.4 s long): a soft "Practice" page where four small cards pop in on Mira's words ("Scenes. Drills. Courses. Even a boss to beat."), each playing its own short live moment

// Load React's types and Remotion's frame
import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
// Load the kit, the cast, the tile and the colours
import { AppWindow, Backdrop, CARD, LAB, push, round, s, ease, usePop, type Cue } from "../kit";
import { Cast, blinking } from "../Cast";
import { Tile } from "../Tile";
import { B, TEXT, mix } from "../palette";

// When each card pops in: on Mira's words
const AT = { scenes: s(0.38), drills: s(1.2), courses: s(1.91), boss: s(2.78) } as const;

// This beat's sounds: a pop as each card arrives
export const QUICK_LOOK_SOUNDS: Cue[] = [{ at: 0.38, sound: "pop" }, { at: 1.2, sound: "pop" }, { at: 1.91, sound: "pop" }, { at: 2.78, sound: "pop" }];

// The cards' size and places on the screen
const CARD_W = 704;
const CARD_H = 322;
const COL = [64, 792] as const;
const ROW = [118, 464] as const;

// One card: a rounded mini screen that pops in at its moment, with its small label
function Card({ at, x, y, label, dark = false, children }: { at: number; x: number; y: number; label: string; dark?: boolean; children: ReactNode }) {
  // The pop
  const pop = usePop(at);
  // The card's look, light or the dark stage
  const look: CSSProperties = dark ? { background: B.night, border: `2px solid ${B.nightCard}`, boxShadow: `0 4px 0 ${mix(B.night, 70, B.ink)}` } : {};
  // The card, growing from its middle
  return (
    <div style={{ ...CARD, ...look, position: "absolute", left: x, top: y, width: CARD_W, height: CARD_H, boxSizing: "border-box", overflow: "hidden", opacity: Math.min(1, pop * 1.6), transform: `translateY(${(1 - pop) * 24}px) scale(${0.86 + 0.14 * pop})` }}>
      <span style={{ ...LAB, position: "absolute", left: 26, top: 20, zIndex: 2, color: dark ? mix(B.nightInk, 62, B.night) : B.muted }}>{label}</span>
      {children}
    </div>
  );
}

// A pretend voice's loudness (0 to 1) between two frames, for a talking mouth
function voice(frame: number, from: number, to: number): number {
  // Silent outside the phrase
  if (frame < from || frame > to) return 0;
  // Two out-of-step waves, never quite shut
  return Math.min(1, Math.max(0.18, 0.5 + 0.32 * Math.sin(frame * 1.9) + 0.22 * Math.sin(frame * 0.71 + 2)));
}

// Scenes: Priya's good news, three replies, the best one swinging out
function ScenesMoment() {
  // The frame
  const frame = useCurrentFrame();
  // The bubble and the replies arriving, then the best one swinging out
  const bubble = usePop(AT.scenes + 4);
  const replies = usePop(AT.scenes + 9);
  const swing = usePop(AT.scenes + 20);
  // The replies (the middle one is best)
  const REPLIES = ["“Congrats! I moved abroad once. The first year was brutal.”", "“No way, Lisbon! When did you find out?”", "“Nice one, well done.”"];
  // The moment
  return (
    <>
      {/* Priya's line */}
      <div style={{ position: "absolute", left: 26, top: 56, width: 236, transformOrigin: "20% 100%", transform: `scale(${0.6 + 0.4 * bubble})`, opacity: Math.min(1, bubble * 1.6) }}>
        <div style={{ position: "relative", background: B.card, border: `2px solid ${B.line}`, borderRadius: 22, padding: "14px 18px", boxShadow: `0 4px 0 ${B.line}`, ...round(25, 600), lineHeight: 1.15 }}>
          I got the job in Lisbon!
          <span style={{ position: "absolute", left: 40, bottom: -11, width: 18, height: 18, background: B.card, borderRight: `2px solid ${B.line}`, borderBottom: `2px solid ${B.line}`, transform: "rotate(45deg)" }} />
        </div>
      </div>
      {/* Priya, delighted */}
      <div style={{ position: "absolute", left: 30, top: 172, display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${Math.sin(frame / 16) * 3}px)` }}>
        <Cast who="friend" face="happy" size={112} talk={voice(frame, AT.scenes + 4, AT.scenes + 26)} />
        <span style={round(20)}>Priya</span>
      </div>
      {/* The three replies, the best swinging out with a green edge */}
      <div style={{ position: "absolute", left: 290, top: 52, width: 384, display: "flex", flexDirection: "column", gap: 12, opacity: Math.min(1, replies * 1.6), transform: `translateX(${(1 - replies) * 30}px)` }}>
        {REPLIES.map((text, i) => {
          // The best one
          const best = i === 1;
          // How far the best one has swung out
          const out = best ? swing : 0;
          // The reply card
          return (
            <div key={i} style={{ position: "relative", boxSizing: "border-box", borderRadius: 18, padding: "12px 16px", fontWeight: 700, fontSize: 16, lineHeight: 1.3, color: best || swing < 0.3 ? B.ink : B.muted, background: best || swing < 0.3 ? B.card : B.soft, border: `2px solid ${best && swing > 0.3 ? B.accent : B.line}`, boxShadow: best && swing > 0.3 ? `0 5px 0 ${B.accentD}` : `0 3px 0 ${B.line}`, transformOrigin: "0% 50%", transform: `rotate(${-1.5 * out}deg) translateX(${10 * out}px)` }}>
              {text}
              {best && <span style={{ position: "absolute", right: 12, top: -11, fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", background: B.greenSoft, color: B.greenInk, padding: "3px 9px", borderRadius: 999, opacity: Math.min(1, swing * 1.5), transform: `scale(${swing})` }}>Best</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}

// Drills: the sentence, and your pitch drawing itself up to a peak on "she" inside the target
function DrillsMoment() {
  // The frame
  const frame = useCurrentFrame();
  // The target ring arriving, then the line drawing across
  const ring = usePop(AT.drills + 4);
  const drawn = ease(frame, AT.drills + 7, AT.drills + 30, 0, 1);
  // The peak's dot, once the line has reached it
  const peak = usePop(AT.drills + 15);
  // The moment
  return (
    <>
      {/* The sentence, the key word underlined */}
      <div style={{ position: "absolute", left: 26, top: 50, ...round(30) }}>I didn’t say <span style={{ color: B.accentD, fontWeight: 700, textDecoration: "underline dotted", textDecorationColor: B.roughInk, textDecorationThickness: 3, textUnderlineOffset: 7 }}>she</span> took the money.</div>
      {/* The pitch over the sentence */}
      <svg viewBox="0 10 640 210" width={600} height={197} style={{ position: "absolute", left: 40, top: 104, overflow: "visible" }}>
        {/* Your usual pitch */}
        <line x1={10} y1={110} x2={630} y2={110} stroke={B.muted} strokeWidth={2} strokeDasharray="6 7" opacity={0.7} />
        {/* The target round "she" */}
        <circle cx={275} cy={40} r={30} fill="none" stroke={B.roughInk} strokeWidth={3} strokeDasharray="7 6" style={{ transformBox: "fill-box", transformOrigin: "center", transform: `scale(${ring})` }} opacity={Math.min(1, ring)} />
        {/* Your pitch, drawing itself */}
        <path d="M14 112C40 110 70 100 100 102S160 112 190 106S250 40 276 38S330 86 360 98S420 120 440 124S520 138 600 150" fill="none" stroke={B.accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - drawn} />
        {/* Your highest point */}
        <circle cx={278} cy={38} r={9} fill={B.accent} stroke={B.card} strokeWidth={3} style={{ transformBox: "fill-box", transformOrigin: "center", transform: `scale(${peak})` }} />
        {/* The words */}
        <g fontFamily="Fredoka, Nunito, sans-serif" fontSize={24} fontWeight={600} textAnchor="middle" fill={B.ink}>
          {([[30, "I"], [100, "didn’t"], [190, "say"], [275, "she"], [360, "took"], [440, "the"], [540, "money."]] as Array<[number, string]>).map(([x, word]) => <text key={word} x={x} y={200} fill={word === "she" ? B.accentD : B.ink} fontWeight={word === "she" ? 700 : 600}>{word}</text>)}
        </g>
      </svg>
    </>
  );
}

// Courses: the Stop freezing course, its six lessons lighting up along a dotted path
function CoursesMoment() {
  // The frame
  const frame = useCurrentFrame();
  // The six stops, left to right, zigzagging
  const STOPS = [[60, 236], [176, 196], [292, 236], [408, 196], [524, 236], [640, 196]] as const;
  // The dotted path drawing between them
  const drawn = ease(frame, AT.courses + 3, AT.courses + 20, 0, 1);
  // The moment
  return (
    <>
      {/* The course: its tile, name and line */}
      <div style={{ position: "absolute", left: 22, top: 44, display: "flex", alignItems: "center", gap: 16 }}>
        <Tile ground={B.sky} prop="bolt" face="wow" size={112} tilt={-5} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ ...LAB, color: B.sky }}>Course · 6 lessons</span>
          <span style={round(34)}>Stop freezing</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: B.muted }}>Answer a surprise question without the long “um”.</span>
        </div>
      </div>
      {/* The path */}
      <svg width={CARD_W} height={CARD_H} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M${STOPS.map(([x, y]) => `${x} ${y}`).join(" L")}`} stroke={B.pathOff} strokeWidth={8} strokeDasharray="2 16" strokeLinecap="round" fill="none" opacity={drawn > 0 ? 1 : 0} style={{ clipPath: `inset(0 ${100 - drawn * 100}% 0 0)` }} />
      </svg>
      {/* The stops, popping in one after another, then the first done and the second up next */}
      {STOPS.map(([x, y], i) => <Stop key={i} x={x} y={y} index={i} />)}
    </>
  );
}

// One stop on the course path
function Stop({ x, y, index }: { x: number; y: number; index: number }) {
  // The frame
  const frame = useCurrentFrame();
  // Arriving in turn
  const pop = usePop(AT.courses + 5 + index * 3);
  // Lighting up: the first done, then the second up next
  const litAt = AT.courses + 25 + index * 6;
  const litPop = usePop(litAt);
  // Only the first two light up
  const lights = index < 2 && frame >= litAt;
  // Its colours: done green, now sun, the rest not reached yet
  const on = lights && litPop > 0.3;
  const fill = !on ? B.pathOff : index === 0 ? B.accent : B.sun;
  const edge = !on ? mix(B.pathOff, 70, B.ink) : index === 0 ? B.accentD : mix(B.sun, 70, B.ink);
  // A soft ring round the one up next
  const ring = index === 1 && on ? ((frame - litAt) % 40) / 40 : -1;
  // The disc
  return (
    <div style={{ position: "absolute", left: x - 29, top: y - 27, width: 58, height: 54, transform: `scale(${pop * (lights ? 0.85 + 0.15 * litPop : 1)})` }}>
      {ring >= 0 && <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: `3px solid ${B.sun}`, opacity: 0.8 * (1 - ring), transform: `scale(${1 + ring * 0.4})` }} />}
      <div style={{ width: 58, height: 54, borderRadius: "50%", background: fill, boxShadow: `0 5px 0 ${edge}`, display: "grid", placeItems: "center", color: index === 0 && on ? B.onAccent : B.ink }}>
        {index === 0 && on && <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
        {index === 1 && on && <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
        {!on && <b style={round(20)}>{index + 1}</b>}
      </div>
    </div>
  );
}

// Boss: the dark stage, Wobbly under a warm spotlight, ON AIR flicking on, question 3 of 5
function BossMoment() {
  // The frame
  const frame = useCurrentFrame();
  // How long since the card arrived
  const since = frame - AT.boss;
  // The spotlight warming up
  const light = ease(frame, AT.boss + 3, AT.boss + 14, 0, 1);
  // ON AIR flicking on: on, off, on for good
  const air = since >= 8 && !(since >= 10 && since < 13);
  // The question arriving
  const q = usePop(AT.boss + 12);
  // The moment
  return (
    <>
      {/* The warm spotlight: a soft beam and a pool on the floor */}
      <div style={{ position: "absolute", left: 40, top: -20, width: 240, height: 340, opacity: light, background: `linear-gradient(180deg, ${mix(B.sun, 46, "transparent")}, ${mix(B.sun, 10, "transparent")})`, clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", left: 50, top: 268, width: 220, height: 44, borderRadius: "50%", opacity: light, background: `radial-gradient(closest-side, ${mix(B.sun, 50, "transparent")}, transparent)` }} />
      {/* Wobbly, the host */}
      <div style={{ position: "absolute", left: 78, top: 120, transform: `translateY(${Math.sin(frame / 16) * 3}px)` }}><Cast who="wobbly" face="happy" size={166} blink={blinking(frame, 4)} /></div>
      {/* ON AIR, live on air */}
      <div style={{ position: "absolute", left: 300, top: 52, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 34, padding: "0 14px", borderRadius: 999, background: air ? B.sun : B.nightCard, color: air ? B.ink : mix(B.nightInk, 40, B.night), fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: "0.1em", boxShadow: air ? `0 0 0 5px ${mix(B.sun, 25, "transparent")}, 0 0 26px ${mix(B.sun, 45, "transparent")}` : "none" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: air ? B.ink : mix(B.nightInk, 30, B.night), opacity: air ? 0.6 + 0.4 * Math.cos(since / 4) : 1 }} />ON AIR
        </span>
        <span style={{ ...round(20), color: B.nightInk }}>with Wobbly</span>
      </div>
      {/* The question, and the show's five dots */}
      <div style={{ position: "absolute", left: 300, top: 106, width: 370, display: "flex", flexDirection: "column", gap: 8, opacity: Math.min(1, q * 1.5), transform: `translateY(${(1 - q) * 14}px)` }}>
        <span style={{ ...LAB, color: mix(B.nightInk, 62, B.night) }}>Question 3 of 5</span>
        <span style={{ ...round(27), lineHeight: 1.15, color: B.nightInk }}>What’s the best advice you’ve ever been given?</span>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ width: i === 2 ? 26 : 20, height: i === 2 ? 26 : 20, borderRadius: "50%", boxSizing: "border-box", background: i < 2 ? B.accent : i === 2 ? B.sun : "transparent", border: i > 2 ? `3px solid ${mix(B.nightInk, 28, B.night)}` : "none", boxShadow: i === 2 ? `0 0 0 5px ${mix(B.sun, 25, "transparent")}` : "none" }} />)}
        </div>
      </div>
    </>
  );
}

// The beat
export function QuickLook() {
  // The frame
  const frame = useCurrentFrame();
  // The camera: barely drifting in
  const camera = push(frame, 0, 132, { scale: 1.03, x: 780, y: 420 });
  // The beat's frame
  return (
    <>
      <Backdrop tint={B.plum} />
      <AppWindow camera={camera}>
        <div style={{ position: "absolute", inset: 0, background: B.bg, fontFamily: TEXT, color: B.ink }}>
          {/* The soft Practice heading */}
          <div style={{ position: "absolute", left: 66, top: 30, display: "flex", alignItems: "baseline", gap: 18 }}>
            <span style={round(42)}>Practice</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: B.muted }}>Short, real, out loud. Pick one.</span>
          </div>
          {/* The four cards */}
          <Card at={AT.scenes} x={COL[0]} y={ROW[0]} label="Scenes"><ScenesMoment /></Card>
          <Card at={AT.drills} x={COL[1]} y={ROW[0]} label="Drills"><DrillsMoment /></Card>
          <Card at={AT.courses} x={COL[0]} y={ROW[1]} label="Courses"><CoursesMoment /></Card>
          <Card at={AT.boss} x={COL[1]} y={ROW[1]} label="Boss level" dark><BossMoment /></Card>
        </div>
      </AppWindow>
    </>
  );
}
