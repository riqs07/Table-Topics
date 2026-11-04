// The commercial's building blocks: timing helpers, the backdrop, the app window the screens sit in, the camera, the cursor, captions, the side rail and the shared card and button styles

// Load React's types and Remotion's frame tools
import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
// Load the colours, faces and cast
import { B, ROUND, TEXT } from "./palette";
import { Cast } from "./Cast";

// A sound a scene asks for, at a time in seconds from the scene's start
export interface Cue { at: number; sound: "pop" | "tap" | "chime" | "tick" }

// Frames a second
export const FPS = 30;
// Seconds to frames
export const s = (seconds: number): number => Math.round(seconds * FPS);

// The app's easing for moves (a quick start, a soft stop)
const SOFT = Easing.bezier(0.2, 0.8, 0.2, 1);
// A value moving from a to b between two frames, eased and held at both ends
export function ease(frame: number, from: number, to: number, a: number, b: number): number {
  // Clamped and eased
  return interpolate(frame, [from, to], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SOFT });
}
// How far a pop-in has got at a frame (0 before it starts, a little bounce past 1, then 1)
export function usePop(at: number): number {
  // The frame and rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // A lively spring
  return spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 170, mass: 0.7 } });
}
// A count from one number to another between two frames, eased
export function count(frame: number, from: number, to: number, a: number, b: number): number {
  // The eased value
  return ease(frame, from, to, a, b);
}

// The shared styles of direction B
export const CARD: CSSProperties = { background: B.card, border: `2px solid ${B.line}`, borderRadius: 22, boxShadow: `0 4px 0 ${B.line}` };
// The small uppercase label
export const LAB: CSSProperties = { fontFamily: TEXT, fontSize: 13, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: B.muted };
// The chunky green button
export const CHUNKY: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 54, padding: "0 30px", borderRadius: 16, background: B.accent, color: B.onAccent, fontFamily: ROUND, fontWeight: 600, fontSize: 20, letterSpacing: "0.03em", textTransform: "uppercase", boxShadow: `0 5px 0 ${B.accentD}` };
// The heading face at a size
export const round = (size: number, weight = 600): CSSProperties => ({ fontFamily: ROUND, fontWeight: weight, fontSize: size, lineHeight: 1.1 });

// The backdrop behind the window: the cream page with two soft circles drifting, in a beat's colour
export function Backdrop({ tint = B.sun, dark = false }: { tint?: string; dark?: boolean }) {
  // The frame, for the drift
  const frame = useCurrentFrame();
  // The page
  return (
    <div style={{ position: "absolute", inset: 0, background: dark ? B.night : "#f6eadb", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", left: -260 + Math.sin(frame / 90) * 30, top: -380, background: tint, opacity: dark ? 0.12 : 0.22 }} />
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", right: -200, bottom: -420 + Math.cos(frame / 80) * 24, background: tint, opacity: dark ? 0.1 : 0.18 }} />
    </div>
  );
}

// The window's size and place on the 1920 by 1080 frame
export const WIN = { w: 1560, h: 870, x: 180, y: 40, bar: 44 } as const;
// The screen area inside the window (below its top bar)
export const SCREEN = { w: WIN.w, h: WIN.h - WIN.bar } as const;

// A camera move: a zoom about a point of the screen (in screen pixels)
export interface Camera { scale: number; x: number; y: number }

// The app window: a plain rounded window (no real browser's look), its screen drawn inside, the camera zooming about a point; enter (0 to 1) slides it up into place
export function AppWindow({ children, camera = { scale: 1, x: SCREEN.w / 2, y: SCREEN.h / 2 }, enter = 1, dark = false }: { children: ReactNode; camera?: Camera; enter?: number; dark?: boolean }) {
  // The zoom about the chosen point, kept inside the window
  const transform = `translate(${SCREEN.w / 2}px, ${SCREEN.h / 2}px) scale(${camera.scale}) translate(${-camera.x}px, ${-camera.y}px)`;
  // The window
  return (
    <div style={{ position: "absolute", left: WIN.x, top: WIN.y + (1 - enter) * 60, width: WIN.w, height: WIN.h, opacity: enter, borderRadius: 26, overflow: "hidden", background: dark ? B.night : B.bg, boxShadow: "0 30px 80px rgba(70, 45, 20, 0.22), 0 0 0 2px rgba(70, 45, 20, 0.06)" }}>
      {/* The top bar: three quiet dots and the app's name */}
      <div style={{ height: WIN.bar, display: "flex", alignItems: "center", gap: 8, padding: "0 18px", background: dark ? "#241f1b" : "#f3e7da", borderBottom: `2px solid ${dark ? "#3a312b" : B.line}` }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: dark ? "#4a3f37" : "#e3d3c3" }} />)}
        <span style={{ marginLeft: "auto", marginRight: "auto", fontFamily: TEXT, fontWeight: 800, fontSize: 14, color: dark ? "#b9a99d" : B.muted, transform: "translateX(-30px)" }}>VoiceLab</span>
      </div>
      {/* The screen, under the camera */}
      <div style={{ position: "relative", width: SCREEN.w, height: SCREEN.h, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN.w, height: SCREEN.h, transformOrigin: "0 0", transform }}>{children}</div>
      </div>
    </div>
  );
}

// A camera that rests, then pushes in towards a point between two frames
export function push(frame: number, from: number, to: number, target: Camera): Camera {
  // How far along the move is
  const t = ease(frame, from, to, 0, 1);
  // From the whole screen to the target
  return { scale: 1 + (target.scale - 1) * t, x: SCREEN.w / 2 + (target.x - SCREEN.w / 2) * t, y: SCREEN.h / 2 + (target.y - SCREEN.h / 2) * t };
}

// The pointer, at screen coordinates inside the window, with a ring when it taps (tapAt: the frame of the tap)
export function Cursor({ x, y, tapAt }: { x: number; y: number; tapAt?: number }) {
  // The frame
  const frame = useCurrentFrame();
  // The tap's progress (a quick press and a fading ring)
  const since = tapAt === undefined ? -1 : frame - tapAt;
  // Pressed for a few frames
  const press = since >= 0 && since < 5 ? 0.85 : 1;
  // The ring
  const ring = since >= 0 && since < 14 ? since / 14 : -1;
  // The pointer and the ring
  return (
    <div style={{ position: "absolute", left: x, top: y, zIndex: 50, pointerEvents: "none" }}>
      {ring >= 0 && <div style={{ position: "absolute", left: -28, top: -28, width: 56, height: 56, borderRadius: "50%", border: `4px solid ${B.accent}`, opacity: 1 - ring, transform: `scale(${0.5 + ring})` }} />}
      <svg width="34" height="40" viewBox="0 0 34 40" style={{ transform: `scale(${press})`, transformOrigin: "4px 4px", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.25))" }}>
        <path d="M4 3 L4 33 L12 25 L18 37 L23 35 L17 23 L29 23 Z" fill="#ffffff" stroke={B.ink} strokeWidth={2.5} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// The caption under the window: one phrase at a time in a cream box, rising in
export function Caption({ text, from, to }: { text: string; from: number; to: number }) {
  // The frame
  const frame = useCurrentFrame();
  // Shown only in its window of time
  if (frame < from || frame > to) return null;
  // Fading and rising in, fading out at the end
  const opacity = Math.min(ease(frame, from, from + 6, 0, 1), ease(frame, to - 5, to, 1, 0));
  // The box
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 940, display: "flex", justifyContent: "center", zIndex: 60, opacity, transform: `translateY(${(1 - opacity) * 12}px)` }}>
      <div style={{ padding: "14px 30px", borderRadius: 24, background: "rgba(255, 246, 230, 0.96)", boxShadow: "0 8px 24px rgba(70, 45, 20, 0.16)", fontFamily: ROUND, fontWeight: 600, fontSize: 46, color: B.ink, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
}

// The side rail of the desktop app, with one tab current
export function Rail({ active }: { active: "today" | "practice" | "courses" | "me" }) {
  // The tabs
  const TABS: Array<[typeof active, string]> = [["today", "Today"], ["practice", "Practice"], ["courses", "Courses"], ["me", "Me"]];
  // The rail
  return (
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 240, boxSizing: "border-box", padding: "28px 18px", background: B.card, borderRight: `2px solid ${B.line}`, display: "flex", flexDirection: "column", gap: 26 }}>
      {/* The name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px" }}><Cast who="you" size={44} /><span style={round(25)}>VoiceLab</span></div>
      {/* The tabs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {TABS.map(([id, label]) => <div key={id} style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 50, padding: "0 16px", borderRadius: 14, fontFamily: TEXT, fontWeight: 800, fontSize: 17, background: id === active ? B.greenSoft : "transparent", color: id === active ? B.greenInk : B.muted }}><span style={{ width: 22, height: 22, borderRadius: 7, border: `2.5px solid currentColor` }} />{label}</div>)}
      </div>
      {/* The week */}
      <div style={{ border: `2px solid ${B.line}`, borderRadius: 18, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontFamily: TEXT, fontWeight: 800, fontSize: 14, color: B.ink }}>4 of the last 7 days</span>
        <div style={{ display: "flex", gap: 5 }}>{[1, 1, 1, 0, 1, 0, 2].map((d, i) => <span key={i} style={{ width: 22, height: 22, borderRadius: 7, boxSizing: "border-box", background: d === 1 ? B.accent : d === 0 ? B.line : "transparent", border: d === 2 ? `2.5px dashed ${B.accent}` : "none" }} />)}</div>
      </div>
    </div>
  );
}

// A speech bubble with a tail on the left or right
export function Speech({ children, side = "left", style }: { children: ReactNode; side?: "left" | "right"; style?: CSSProperties }) {
  // The bubble
  return (
    <div style={{ position: "relative", background: B.card, border: `2px solid ${B.line}`, borderRadius: 22, padding: "16px 22px", fontFamily: TEXT, fontWeight: 700, fontSize: 22, color: B.ink, ...style }}>
      {children}
      <span style={{ position: "absolute", bottom: 20, [side]: -11, width: 18, height: 18, background: B.card, borderLeft: side === "left" ? `2px solid ${B.line}` : "none", borderRight: side === "right" ? `2px solid ${B.line}` : "none", borderBottom: `2px solid ${B.line}`, transform: `rotate(${side === "left" ? 45 : -45}deg)` }} />
    </div>
  );
}
