// The pieces every VoiceLab video is built from (decisions 143 and 145): the fonts, the app's animations kept in step with the frame, placing things on the frame, and the cream bubble and label

// Load React's tools
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
// Load Remotion's frame tools
import { useCurrentFrame, useVideoConfig } from "remotion";
// Load the helpers for theme colours
import { role, tint } from "./theme";

// The display face and the body face
export const DISPLAY = "'Fraunces Variable', Georgia, serif";
// (body)
export const BODY = "Atkinson, system-ui, sans-serif";

// Keep the app's CSS animations (the tiles' loops) in step with the frame being drawn: pause them and set their time from the frame, so every render is the same
export function Synced({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  // This stretch's frame, and the frame rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The wrapper
  const ref = useRef<HTMLDivElement>(null);
  // On every frame, before it is drawn
  useLayoutEffect(() => {
    // Each animation inside
    for (const animation of ref.current?.getAnimations({ subtree: true }) ?? []) {
      // Held still
      animation.pause();
      // At this frame's time
      animation.currentTime = (frame / fps) * 1000;
    }
  }, [frame, fps]);
  // The wrapper around the drawing
  return <div ref={ref} style={style}>{children}</div>;
}

// Something placed by its middle at x, y on the 1080 by 1920 frame, scaled and turned
export function Place({ x, y, scale = 1, rotate = 0, children }: { x: number; y: number; scale?: number; rotate?: number; children: ReactNode }) {
  // Absolutely placed, centred on its point
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)` }}>{children}</div>;
}

// A cream speech bubble holding a word or sign
export function Bubble({ children, color, size = 220 }: { children: ReactNode; color: string; size?: number }) {
  // The rounded bubble with a little tail, and its content in the display face
  return (
    <div style={{ position: "relative", minWidth: size, height: size * 0.8, padding: "0 40px", borderRadius: size * 0.3, background: role("art-cream"), color, fontFamily: DISPLAY, fontWeight: 700, fontSize: size * 0.42, display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", boxShadow: `0 12px 0 ${tint("on-warm", 8)}` }}>
      {/* The content */}
      {children}
      {/* The tail */}
      <div style={{ position: "absolute", bottom: -size * 0.12, left: "28%", width: size * 0.22, height: size * 0.22, background: role("art-cream"), transform: "rotate(45deg)", borderRadius: 8 }} />
    </div>
  );
}

// A small cream label, such as "sounds sure"
export function Chip({ children }: { children: ReactNode }) {
  // Rounded, in the body face
  return <div style={{ padding: "14px 34px", borderRadius: 999, background: role("art-cream"), color: role("on-warm"), fontFamily: BODY, fontWeight: 700, fontSize: 44, whiteSpace: "nowrap" }}>{children}</div>;
}
