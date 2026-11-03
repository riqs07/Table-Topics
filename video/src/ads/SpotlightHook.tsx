// The spotlight version of the "quiet in meetings" hook (a trial of the look): one dark stage, one spotlight standing for attention and credit. It lights you and your idea, then swings to the other person when they say it, and your bulb goes out in the dark. Silent, timed to the script's first two lines

// Load React's node type
import type { ReactNode } from "react";
// Load Remotion's building blocks
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
// Load the characters and props shared with the storyboard
import { Bulb, Other, Tag, Talk, You } from "../hooks/HookStoryboard";
// Load the headline and caption from the ad
import { Caption, Headline } from "./QuietInMeetings";
// Load the theme as CSS, and the helpers for inline colours
import { THEME_CSS, role } from "../theme";

// The clip's length in frames (5 seconds)
export const SPOTLIGHT_HOOK_FRAMES = 150;

// The two lines and when each is said, in seconds (stand-ins until the voice is in)
const LINES = [
  // The idea
  { text: "You had the idea.", start: 0.1, words: [0.1, 0.35, 0.6, 0.85] },
  // Taken
  { text: "Then someone else said it.", start: 1.9, words: [1.9, 2.15, 2.5, 2.8, 3.0] },
];
// The moments the story turns on, in seconds: your bulb lights, they start talking, the light swings, your bulb dies, the praise lands
export const [BULB_ON, THEY_TALK, SWING, BULB_OUT, PRAISE] = [0.25, 2.0, 2.45, 2.7, 3.15];

// Where things stand: you, them, the floor and the lamp
export const [YOU_X, THEM_X, FLOOR_Y, LAMP] = [320, 770, 1150, { x: 540, y: 360 }];

// The lamp hanging from the top, turned to aim at a point on the floor
export function Lamp({ aim }: { aim: number }) {
  // The angle from straight down to the point it aims at
  const angle = (Math.atan2(aim - LAMP.x, FLOOR_Y - LAMP.y) * -180) / Math.PI;
  // The rod and the turning lamp
  return (
    <g>
      {/* The rod it hangs from */}
      <rect className="fill-on-warm opacity-60" x={LAMP.x - 7} y={280} width="14" height={LAMP.y - 280} rx="7" />
      {/* The lamp, turning on its pivot */}
      <g transform={`rotate(${angle} ${LAMP.x} ${LAMP.y})`}>
        {/* Its body */}
        <path className="fill-on-warm" d={`M${LAMP.x - 46} ${LAMP.y - 30}h92l18 70h-128z`} />
        {/* A highlight on its side */}
        <path className="fill-art-cream opacity-20" d={`M${LAMP.x - 34} ${LAMP.y - 22}h18l-8 54h-22z`} />
        {/* Its glowing mouth */}
        <rect className="fill-art-cream" x={LAMP.x - 62} y={LAMP.y + 36} width="124" height="12" rx="6" />
      </g>
    </g>
  );
}

// The cone of light from the lamp to a pool on the floor around a point, as a shape (used both to light the stage and to cut the darkness)
export function Cone({ aim, className, opacity }: { aim: number; className?: string; opacity?: number }) {
  // The beam and the pool where it lands
  return (
    <g className={className} opacity={opacity}>
      {/* The beam, widening to the floor */}
      <path d={`M${LAMP.x - 58} ${LAMP.y + 44}L${LAMP.x + 58} ${LAMP.y + 44}L${aim + 250} ${FLOOR_Y}L${aim - 250} ${FLOOR_Y}z`} />
      {/* The pool on the floor */}
      <ellipse cx={aim} cy={FLOOR_Y} rx="250" ry="62" />
    </g>
  );
}

// A small hop: how high, in pixels, a blob is a moment after it starts to hop (0 before and after)
export function hop(seconds: number, from: number, height = 34): number {
  // How far through a third of a second
  const through = (seconds - from) / 0.34;
  // Up and down once
  return through > 0 && through < 1 ? -Math.sin(through * Math.PI) * height : 0;
}

// The clip
export function SpotlightHook(): ReactNode {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The time in seconds
  const t = frame / fps;
  // A spring from a moment, for things popping in and the swing
  const springFrom = (at: number, damping = 12) => spring({ frame: frame - Math.round(at * fps), fps, config: { damping } });
  // Where the light aims: on you, then swinging to them with a little overshoot, then a slow drift as it settles
  const aim = YOU_X + (THEM_X - YOU_X) * springFrom(SWING, 9) + Math.sin(t * 1.3) * 6;
  // Whether your bulb is lit: on after it pops in, flickering as the light leaves, then out
  const lit = t < BULB_OUT || (t < BULB_OUT + 0.3 && Math.floor(t * 18) % 2 === 0);
  // Whether the light has left you
  const left = t > SWING + 0.15;
  // The line being said, and its word
  const index = t >= LINES[1]!.start ? 1 : 0;
  // (the word: the last that has started)
  const said = Math.max(0, LINES[index]!.words.filter((start) => start <= t).length - 1);
  // The layers, back to front
  return (
    <AbsoluteFill>
      {/* The theme's colours */}
      <style>{THEME_CSS}</style>
      {/* The stage: plum */}
      <AbsoluteFill style={{ background: role("art-plum") }} />
      {/* The drawing */}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          {/* Soft edges for the light */}
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16" /></filter>
          {/* The beam's glow, brighter near the lamp */}
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-art-cream)" stopOpacity="0.42" /><stop offset="1" stopColor="var(--color-art-cream)" stopOpacity="0.16" /></linearGradient>
          {/* The darkness everywhere but the light */}
          <mask id="dark"><rect width="1080" height="1920" fill="white" /><g fill="black" filter="url(#soft)"><Cone aim={aim} /></g></mask>
        </defs>
        {/* One big soft circle behind the stage, as on the tiles */}
        <circle className="fill-art-cream opacity-10" cx={880 + Math.sin(t * 0.5) * 20} cy={560} r={420} />
        {/* The stage floor */}
        <ellipse className="fill-on-warm opacity-20" cx="540" cy={FLOOR_Y + 30} rx="560" ry="120" />
        {/* The light's glow, behind everyone so whoever stands in it keeps their colour */}
        <path fill="url(#beam)" d={`M${LAMP.x - 58} ${LAMP.y + 44}L${LAMP.x + 58} ${LAMP.y + 44}L${aim + 250} ${FLOOR_Y}L${aim - 250} ${FLOOR_Y}z`} filter="url(#soft)" />
        {/* The pool's glow on the floor */}
        <ellipse className="fill-art-cream" cx={aim} cy={FLOOR_Y} rx="230" ry="54" opacity="0.22" filter="url(#soft)" />
        {/* Your idea over you */}
        <Bulb x={YOU_X} y={700} s={1.25 * springFrom(BULB_ON)} lit={lit} t={t} />
        {/* Their bubble with your idea in it, while they say it */}
        {t > THEY_TALK && t < PRAISE && <g transform={`translate(${THEM_X} 820) scale(${springFrom(THEY_TALK)}) translate(${-THEM_X} -820)`}><Talk x={THEM_X - 150} y={560} w={300} h={220} tailX={THEM_X}><Bulb x={THEM_X} y={662} s={0.62} lit /></Talk></g>}
        {/* The praise they get */}
        {t > PRAISE && <g transform={`translate(${THEM_X} 700) rotate(${(1 - Math.min(1, springFrom(PRAISE))) * -16}) scale(${springFrom(PRAISE)}) translate(${-THEM_X} -700)`}><Tag x={THEM_X} y={700} text="Great idea!" size={54} /></g>}
        {/* Your shadow on the floor */}
        <ellipse className="fill-on-warm opacity-20" cx={YOU_X} cy={FLOOR_Y + 8} rx="150" ry="26" />
        {/* Their shadow */}
        <ellipse className="fill-on-warm opacity-20" cx={THEM_X} cy={FLOOR_Y + 8} rx="140" ry="24" />
        {/* You: happy in the light, surprised as they speak, deflated once it has gone */}
        <You x={YOU_X} y={FLOOR_Y - 150 + hop(t, BULB_ON)} r={170} mood={left ? "worried" : t > THEY_TALK ? "wow" : "up"} open={!left && t > THEY_TALK ? 0.3 : 0} t={t} blink={(frame + 60) % 113 < 4} breath={1 + Math.sin(t * 2.4) * 0.012} />
        {/* Them: quiet in the dark, talking, then pleased in the light with a hop as it lands */}
        <Other x={THEM_X} y={FLOOR_Y - 140 + hop(t, SWING + 0.25)} r={155} mood={t > PRAISE ? "happy" : t > THEY_TALK ? "talk" : "ready"} t={t} />
        {/* The darkness over everything outside the light */}
        <rect className="fill-on-warm" width="1080" height="1920" opacity="0.55" mask="url(#dark)" />
        {/* The lamp */}
        <Lamp aim={aim} />
      </svg>
      {/* The headline */}
      <Headline shown={1} />
      {/* The caption (the first one already in on the first frame) */}
      <Caption text={LINES[index]!.text} said={said} pop={interpolate(t, [LINES[index]!.start, LINES[index]!.start + 0.15], [index === 0 ? 1 : 0.6, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
}
