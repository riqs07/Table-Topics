// The parts the commercial's focus-mode screens share (the Recording and Story beats): the top bar, the singing rings, the level bars, the clock and the record buttons, all driven by the frame

// Load React's types and Remotion's frame
import type { ReactNode } from "react";
// Load the kit, the colours and the faces
import { LAB, round } from "../kit";
import { B, TEXT, mix } from "../palette";

// The voice's loudness at a frame (0 to 1): a few sines out of step, so it sounds like speech rather than a pulse
export function voiceLevel(frame: number): number {
  // The sum of three sines around the middle
  const wave = 0.55 + 0.22 * Math.sin(frame * 0.9) + 0.16 * Math.sin(frame * 0.37 + 1) + 0.12 * Math.sin(frame * 1.7 + 2);
  // Kept between quiet and loud
  return Math.min(1, Math.max(0.08, wave));
}

// Seconds as the app's clock shows them (0:07, 1:24)
export function clockText(seconds: number): string {
  // Whole seconds
  const whole = Math.max(0, Math.floor(seconds));
  // Minutes and two-digit seconds
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

// A keyboard key in the hint
function Kbd({ children }: { children: ReactNode }) {
  // The key
  return <span style={{ fontWeight: 800, fontSize: 13, padding: "2px 8px", borderRadius: 7, border: `2px solid ${B.line}`, background: B.card, color: B.ink }}>{children}</span>;
}

// The focus screen's top bar: the close cross, the session's progress, its step, and (while recording) the key hints
export function TopBar({ progress, step, keys = true }: { progress: number; step: string; keys?: boolean }) {
  // The bar across the top of the screen
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 88, boxSizing: "border-box", padding: "0 56px", display: "flex", alignItems: "center", gap: 20, fontFamily: TEXT }}>
      {/* The close cross */}
      <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", color: B.muted, fontSize: 26, fontWeight: 800 }}>✕</span>
      {/* The progress bar */}
      <div style={{ flex: "1 1 240px", maxWidth: 720, height: 14, borderRadius: 999, background: B.line, overflow: "hidden" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 999, background: B.accent, boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.12)" }} />
      </div>
      {/* The step */}
      <span style={{ ...LAB, color: B.greenInk }}>{step}</span>
      {/* The key hints */}
      {keys && <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontSize: 14, fontWeight: 700, color: B.muted }}><Kbd>Space</Kbd> to stop <Kbd>Esc</Kbd> to discard</span>}
    </div>
  );
}

// Two apricot rings breathing out from behind the blob while it speaks (on: 0 to 1 fades them in)
export function Rings({ frame, size, on }: { frame: number; size: number; on: number }) {
  // Each ring's progress through its two-second swell, the second a second behind the first
  const rings = [0, 30].map((delay) => ((frame + 60 - delay) % 60) / 60);
  // The rings
  return (
    <svg width={size} height={size} viewBox="0 0 300 300" style={{ position: "absolute", left: "50%", top: 0, marginLeft: -size / 2, overflow: "visible" }}>
      {rings.map((t, i) => <circle key={i} cx={150} cy={160} r={104} fill="none" stroke={B.apricot} strokeWidth={5} opacity={(0.7 - 0.7 * t) * on} transform={`translate(150 160) scale(${0.85 + 0.45 * t}) translate(-150 -160)`} />)}
    </svg>
  );
}

// Five green level bars rising and falling with the voice (level 0 to 1)
export function LevelBars({ frame, level }: { frame: number; level: number }) {
  // The bars
  return (
    <svg width={60} height={44} viewBox="0 0 52 38" style={{ display: "block" }}>
      {[0, 1, 2, 3, 4].map((i) => {
        // Each bar a little out of step with the others
        const h = 38 * Math.max(0.18, Math.min(1, level * (0.55 + 0.45 * Math.abs(Math.sin(frame * 0.55 + i * 1.3)))));
        // The bar, standing on the base
        return <rect key={i} x={i * 11} y={38 - h} width={7} height={h} rx={3.5} fill={B.accent} />;
      })}
    </svg>
  );
}

// The big clock
export function Clock({ seconds }: { seconds: number }) {
  // The time in the heading face, digits of even width
  return <b style={{ ...round(52), lineHeight: 1, color: B.ink, fontVariantNumeric: "tabular-nums", minWidth: 104, textAlign: "center" }}>{clockText(seconds)}</b>;
}

// The record screen's buttons: a quiet one each side of the round dark stop button (right: the right-hand quiet button's words, or none)
export function RecordButtons({ right }: { right?: string }) {
  // A quiet button's look
  const quiet = { minHeight: 50, boxSizing: "border-box" as const, padding: "0 20px", display: "flex", alignItems: "center", borderRadius: 14, border: `2px solid ${B.line}`, background: B.card, fontFamily: TEXT, fontWeight: 800, fontSize: 16, color: B.muted, boxShadow: `0 3px 0 ${B.line}` };
  // The row
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
      <span style={quiet}>Start over</span>
      {/* The stop button */}
      <span style={{ width: 92, height: 92, borderRadius: "50%", background: B.ink, display: "grid", placeItems: "center", boxShadow: `0 6px 0 ${mix(B.ink, 60, "black")}` }}><span style={{ width: 30, height: 30, borderRadius: 8, background: B.bg }} /></span>
      {right ? <span style={quiet}>{right}</span> : <span style={{ width: 120 }} />}
    </div>
  );
}
