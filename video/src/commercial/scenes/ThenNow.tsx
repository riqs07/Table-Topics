// The Then and now beat (39.4 s, 4.0 s long): the Me page; the cursor plays your first day's take (choppy, pause words marked), then this week's (smoother, with calm green pauses), and 2.3 glows

// Load React's types and Remotion's frame
import type { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
// Load the kit, the cast and the colours
import { AppWindow, Backdrop, CARD, Cursor, Rail, push, round, s, ease, usePop, type Cue } from "../kit";
import { Cast, blinking } from "../Cast";
import { B, TEXT, mix } from "../palette";

// This beat's sounds: the two taps, and a soft chime as 2.3 glows
export const THEN_NOW_SOUNDS: Cue[] = [{ at: 0.4, sound: "tap" }, { at: 1.8, sound: "tap" }, { at: 2.6, sound: "chime" }];

// When things happen (frames from the beat's start)
const T = {
  // Tap "Hear day 1" and it plays
  tapThen: s(0.4), thenEnd: s(1.6),
  // Tap "Hear now" and it plays
  tapNow: s(1.8), nowEnd: s(3.0),
  // 2.3 glows
  glow: s(2.6),
} as const;

// Where things sit on the screen
const MAIN = { x: 300, w: 1164 } as const;
// The card's top, and the two columns' left edges and width
const CARD_TOP = 186;
const COL_W = 506;
const COL_X = [MAIN.x + 32, MAIN.x + 32 + COL_W + 88] as const;
// The play buttons' middles (for the cursor)
const BUTTON_Y = CARD_TOP + 372;
const BUTTON_X = [COL_X[0] + COL_W / 2, COL_X[1] + COL_W / 2] as const;

// The number of bars in each waveform
const BARS = 46;
// A steady pseudo-random number (0 to 1) for a bar
const noise = (i: number, seed: number): number => { const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return v - Math.floor(v); };
// Day 1's take: choppy heights, with pause words (marked) in clusters
const THEN_BARS = Array.from({ length: BARS }, (_, i) => ({ h: 0.25 + 0.75 * noise(i, 1), um: [5, 6, 14, 15, 23, 31, 32, 40].includes(i), gap: false }));
// This week's take: smoother heights, with a few calm pauses
const NOW_BARS = Array.from({ length: BARS }, (_, i) => ({ h: 0.45 + 0.3 * Math.sin(i / 2.2) ** 2 + 0.2 * noise(i, 2), um: false, gap: [11, 12, 26, 27, 38].includes(i) }));

// The small tiles: ground, icon colour, icon, value and label (the sample numbers from the design)
const STATS: Array<[string, string, ReactNode, string, string]> = [
  [B.sky, B.card, <svg key="mic" viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0" /></svg>, "23", "takes"],
  [B.leaf, B.greenInk, <svg key="clock" viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>, "41 min", "spoken"],
  [B.coral, B.card, <svg key="flame" viewBox="0 0 24 24" width={22} height={22} fill="currentColor"><path d="M12 2c3 4 6 7 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-2-1-5 0-7z" /></svg>, "6", "stories told"],
  [B.sun, B.roughInk, <svg key="star" viewBox="0 0 24 24" width={22} height={22} fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>, "5 days", "best run"],
];

// A take's waveform: bars lighting up behind the moving playhead while it plays
function Wave({ bars, color, played, playing }: { bars: Array<{ h: number; um: boolean; gap: boolean }>; color: string; played: number; playing: boolean }) {
  // The frame, for the bars dancing at the playhead
  const frame = useCurrentFrame();
  // The waveform's size
  const W = COL_W - 44;
  const H = 70;
  // Each bar's width and step
  const step = W / BARS;
  // Where the playhead is
  const head = played * W;
  // The waveform
  return (
    <svg width={W} height={H + 8} style={{ display: "block", overflow: "visible" }}>
      {bars.map((bar, i) => {
        // The bar's middle
        const x = i * step + step / 2;
        // A calm pause: a small green dash on the line
        if (bar.gap) return <rect key={i} x={x - step / 2 + 1} y={H / 2 - 4} width={step - 2} height={8} rx={4} fill={B.leaf} opacity={x < head ? 1 : 0.55} />;
        // Bouncing a little as the playhead passes
        const near = playing && Math.abs(x - head) < step * 3 ? 0.75 + 0.25 * Math.sin(frame * 1.4 + i) : 1;
        // Its height
        const h = Math.max(8, bar.h * H * near);
        // Played bars in full colour, the rest faint
        return <rect key={i} x={x - (step - 5) / 2} y={(H - h) / 2} width={step - 5} height={h} rx={(step - 5) / 2} fill={bar.um ? B.sun : color} opacity={x < head ? 1 : 0.38} />;
      })}
      {/* The playhead */}
      {(playing || (played > 0 && played < 1)) && <g><line x1={head} y1={-4} x2={head} y2={H + 4} stroke={B.ink} strokeWidth={3} strokeLinecap="round" /><circle cx={head} cy={-4} r={6} fill={B.ink} /></g>}
    </svg>
  );
}

// A play button: "Hear …", or "Playing" with a pause sign while it plays
function PlayButton({ label, playing, pressed }: { label: string; playing: boolean; pressed: boolean }) {
  // The button
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", minHeight: 52, borderRadius: 14, border: `2px solid ${playing ? B.accent : B.line}`, background: playing ? B.greenSoft : B.card, fontWeight: 800, fontSize: 17, color: playing ? B.greenInk : B.ink, boxShadow: pressed ? `0 1px 0 ${B.line}` : `0 3px 0 ${playing ? B.accentD : B.line}`, transform: `translateY(${pressed ? 2 : 0}px)` }}>
      {playing
        ? <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg>
        : <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
      {playing ? "Playing…" : label}
    </div>
  );
}

// The beat
export function ThenNow() {
  // The frame
  const frame = useCurrentFrame();
  // How far each take has played (0 to 1)
  const thenPlayed = interpolate(frame, [T.tapThen + 2, T.thenEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const nowPlayed = interpolate(frame, [T.tapNow + 2, T.nowEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Whether each is playing
  const thenPlaying = frame > T.tapThen && frame <= T.thenEnd;
  const nowPlaying = frame > T.tapNow && frame <= T.nowEnd;
  // 2.3 glowing: a pop and a soft green halo
  const glowPop = usePop(T.glow);
  const halo = ease(frame, T.glow, T.glow + 6, 0, 1) * ease(frame, T.glow + 20, T.glow + 44, 1, 0.5);
  const punch = frame < T.glow ? 1 : 1 + 0.18 * (1 - glowPop);
  // The cursor: to "Hear day 1", then across to "Hear now"
  const toNow = ease(frame, T.tapThen + 26, T.tapNow - 2, 0, 1);
  const arrive = ease(frame, 0, T.tapThen - 2, 0, 1);
  const cursor = { x: interpolate(arrive, [0, 1], [BUTTON_X[0] + 260, BUTTON_X[0] + 40]) + (BUTTON_X[1] - BUTTON_X[0]) * toNow, y: interpolate(arrive, [0, 1], [BUTTON_Y + 190, BUTTON_Y + 6]) };
  // The camera: a slow push towards the card
  const camera = push(frame, 0, 120, { scale: 1.05, x: 743, y: 400 });
  // The beat's frame
  return (
    <>
      <Backdrop tint={B.leaf} />
      <AppWindow camera={camera}>
        <div style={{ position: "absolute", inset: 0, background: B.bg, fontFamily: TEXT, color: B.ink }}>
          <Rail active="me" />

          {/* You, so far */}
          <div style={{ position: "absolute", left: MAIN.x, top: 54, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ transform: `translateY(${Math.sin(frame / 16) * 3}px)` }}><Cast who="you" face="happy" size={96} blink={blinking(frame, 5)} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={round(42)}>You, so far</span>
              <span style={{ fontWeight: 700, fontSize: 17, color: B.muted }}>Practising since 14 October · 4 of the last 7 days</span>
            </div>
          </div>

          {/* Then and now: the two takes, side by side */}
          <div style={{ ...CARD, position: "absolute", left: MAIN.x, top: CARD_TOP, width: MAIN.w, height: 420, boxSizing: "border-box" }}>
            <span style={{ position: "absolute", left: 32, top: 24, fontFamily: TEXT, fontSize: 13, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: B.muted }}>Then and now · Rapid Fire</span>
            {/* The arrow between them */}
            <span style={{ position: "absolute", left: 32 + COL_W, width: 88, top: 140, textAlign: "center", fontSize: 34, color: B.muted }}>→</span>
          </div>
          {/* Day 1 */}
          <div style={{ position: "absolute", left: COL_X[0], top: CARD_TOP + 60, width: COL_W, height: 270, boxSizing: "border-box", background: B.soft, borderRadius: 20, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: B.muted }}>Day 1</span>
            <b style={round(80)}>6.1</b>
            <span style={{ fontWeight: 700, fontSize: 15, color: B.muted }}>pause words a minute</span>
            <div style={{ marginTop: 22 }}><Wave bars={THEN_BARS} color={mix(B.muted, 70, B.soft)} played={thenPlayed} playing={thenPlaying} /></div>
          </div>
          {/* This week, glowing once heard */}
          <div style={{ position: "absolute", left: COL_X[1], top: CARD_TOP + 60, width: COL_W, height: 270, boxSizing: "border-box", background: B.greenSoft, color: B.greenInk, borderRadius: 20, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 2, boxShadow: `0 0 0 ${4 * halo}px ${mix(B.accent, 55)}, 0 0 ${40 * halo}px ${mix(B.accent, 45, "transparent")}` }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>This week</span>
            <b style={{ ...round(80), display: "inline-block", alignSelf: "flex-start", transform: `scale(${punch})`, transformOrigin: "20% 70%" }}>2.3</b>
            <span style={{ fontWeight: 700, fontSize: 15 }}>pause words a minute</span>
            <div style={{ marginTop: 22 }}><Wave bars={NOW_BARS} color={B.accent} played={nowPlayed} playing={nowPlaying} /></div>
          </div>
          {/* The two play buttons */}
          {(["Hear day 1", "Hear now"] as const).map((label, i) => (
            <div key={label} style={{ position: "absolute", left: COL_X[i] ?? 0, top: BUTTON_Y - 26, width: COL_W }}>
              <PlayButton label={label} playing={i === 0 ? thenPlaying : nowPlaying} pressed={frame >= (i === 0 ? T.tapThen : T.tapNow) && frame < (i === 0 ? T.tapThen : T.tapNow) + 5} />
            </div>
          ))}

          {/* The small tiles, still */}
          <div style={{ position: "absolute", left: MAIN.x, top: CARD_TOP + 448, width: MAIN.w, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {STATS.map(([ground, ink, icon, value, label]) => (
              <div key={label} style={{ ...CARD, padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
                <span style={{ flex: "none", width: 46, height: 46, borderRadius: 14, background: ground, color: ink, display: "grid", placeItems: "center" }}>{icon}</span>
                <span style={{ display: "flex", flexDirection: "column" }}><b style={{ ...round(28), lineHeight: 1 }}>{value}</b><span style={{ fontSize: 14, fontWeight: 700, color: B.muted }}>{label}</span></span>
              </div>
            ))}
          </div>

          {/* The pointer, tapping one take then the other */}
          <Cursor x={cursor.x} y={cursor.y} tapAt={frame >= T.tapNow ? T.tapNow : T.tapThen} />
        </div>
      </AppWindow>
    </>
  );
}
