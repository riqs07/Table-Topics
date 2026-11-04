// The commercial's cast, drawn as on the design canvases: you (the apricot blob), Sage (the pine coach with a sprout), the friend (a teal egg with a curl, the other person in conversations) and Wobbly (the pink boss)
// The shapes come from the agreed cast (the "Storyboard" artifact); every body has the same shading: a dark copy behind, the front copy nudged up and left, a cream highlight from the upper left

// The shapes, in units around the character's middle (its base at y = 94)
const SHAPES = {
  // The uneven round (the app's BLOB)
  round: "M0 -100C58.8 -100 106 -53.2 106 0C106 50.4 61.6 94 0 94C-58.8 94 -103 53.2 -103 0C-103 -56 -56 -100 0 -100Z",
  // The friend's egg
  egg: "M0 -114C52 -114 92 -42 92 10C92 62 52 94 0 94C-52 94 -92 62 -92 10C-92 -42 -52 -114 0 -114Z",
  // Wobbly's lumpy outline
  wobbly: "M4 -104C50 -110 74 -76 98 -50C124 -22 118 30 96 58C72 90 30 96 -6 94C-52 92 -96 74 -108 34C-120 -8 -100 -44 -72 -72C-50 -94 -26 -102 4 -104Z",
} as const;

// The ink of the faces on light bodies, and on Sage
const INK = "#2a2420";
// (Sage's face)
const WHITE = "#fcfcfb";

// Who can appear
export type Who = "you" | "sage" | "friend" | "wobbly";
// The faces (each character uses the ones that suit it)
export type Face = "ready" | "happy" | "hmm" | "sing" | "wow" | "focus" | "listen" | "flat" | "worried" | "calm" | "encouraging" | "proud";

// One shaded body
function Body({ shape, light, dark, highlight = 0.5 }: { shape: keyof typeof SHAPES; light: string; dark: string; highlight?: number }) {
  // The dark copy, the front copy and the highlight
  return (
    <>
      <path fill={dark} d={SHAPES[shape]} />
      <path fill={light} transform="translate(-9 -8) scale(0.93)" d={SHAPES[shape]} />
      <ellipse fill="#fff6e6" opacity={highlight} cx="-48" cy="-56" rx="18" ry="11" transform="rotate(-35 -48 -56)" />
    </>
  );
}

// A light-bodied face (you, the friend, Wobbly), its eye line at y, eyes gap apart; talk (0 to 1) opens the mouth with the voice; blink shuts the eyes
function LightFace({ face, y, gap, talk, blink }: { face: Face; y: number; gap: number; talk: number; blink: boolean }) {
  // A stroke in the face ink
  const line = { fill: "none", stroke: INK, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  // Shut eyes for a blink: short arcs
  const shut = <path {...line} strokeWidth={6.5} d={`M${-gap - 11} ${y}q11 6 22 0M${gap - 11} ${y}q11 6 22 0`} />;
  // Open oval eyes with a white glint
  const open = blink ? shut : (
    <>
      <ellipse fill={INK} cx={-gap} cy={y} rx="10" ry="14.5" />
      <ellipse fill={INK} cx={gap} cy={y} rx="10" ry="14.5" />
      <circle fill="#fff" cx={-gap + 4} cy={y - 6} r="3.4" />
      <circle fill="#fff" cx={gap + 4} cy={y - 6} r="3.4" />
    </>
  );
  // Happy arches for eyes
  const arches = <path {...line} strokeWidth={7.5} d={`M${-gap - 14} ${y + 5}L${-gap} ${y - 9} ${-gap + 14} ${y + 5}M${gap - 14} ${y + 5}L${gap} ${y - 9} ${gap + 14} ${y + 5}`} />;
  // A talking mouth: an oval that opens with the voice
  const talking = talk > 0.05 ? <ellipse fill={INK} cx="0" cy={y + 34} rx={13 - talk * 2} ry={4 + talk * 14} /> : null;
  // Each face
  switch (face) {
    // Happy: arches and an open smile
    case "happy": return <>{arches}{talking ?? <path fill={INK} d={`M-23 ${y + 22}h46q0 23-23 23t-23-23z`} />}</>;
    // Singing along: arches and a round mouth
    case "sing": return <>{arches}{talking ?? <ellipse fill={INK} cx="0" cy={y + 36} rx="12" ry="13" />}</>;
    // Wow: round eyes and a small round mouth
    case "wow": return <><circle fill={INK} cx={-gap} cy={y - 2} r="12" /><circle fill={INK} cx={gap} cy={y - 2} r="12" /><circle fill="#fff" cx={-gap + 4} cy={y - 7} r="3.5" /><circle fill="#fff" cx={gap + 4} cy={y - 7} r="3.5" />{talking ?? <ellipse fill={INK} cx="0" cy={y + 36} rx="8" ry="10" />}</>;
    // Hmm: eyes looking up and aside, puzzled brows, a flat mouth (never cross)
    case "hmm": return <><circle fill={INK} cx={-gap + 8} cy={y - 8} r="9.5" /><circle fill={INK} cx={gap + 8} cy={y - 8} r="9.5" /><path {...line} strokeWidth={6} d={`M${-gap - 12} ${y - 30}L${-gap + 10} ${y - 36}M${gap - 10} ${y - 36}L${gap + 12} ${y - 30}`} />{talking ?? <path {...line} strokeWidth={7} d={`M-8 ${y + 34}h18`} />}</>;
    // Worried: open eyes, brows up in the middle, a wavy mouth
    case "worried": return <>{open}<path {...line} strokeWidth={6} d={`M${-gap - 14} ${y - 26}L${-gap + 8} ${y - 34}M${gap - 8} ${y - 34}L${gap + 14} ${y - 26}`} />{talking ?? <path {...line} strokeWidth={6} d={`M-16 ${y + 32}q4-6 8 0t8 0 8 0 8 0`} />}</>;
    // Focus: half-shut eyes, a straight mouth
    case "focus": return <><path fill={INK} d={`M${-gap - 11} ${y - 2}h22v6a11 9 0 0 1-22 0z`} /><path fill={INK} d={`M${gap - 11} ${y - 2}h22v6a11 9 0 0 1-22 0z`} />{talking ?? <path {...line} strokeWidth={6} d={`M-9 ${y + 30}h18`} />}</>;
    // Listening: soft shut eyes, a small smile
    case "listen": return <><path {...line} strokeWidth={6.5} d={`M${-gap - 11} ${y}q11 8 22 0M${gap - 11} ${y}q11 8 22 0`} />{talking ?? <path {...line} strokeWidth={7} d={`M-13 ${y + 28}q13 10 26 0`} />}</>;
    // Deflated: flat eyes, a small flat mouth
    case "flat": return <><rect fill={INK} x={-gap - 9} y={y - 4} width="18" height="8" rx="4" /><rect fill={INK} x={gap - 9} y={y - 4} width="18" height="8" rx="4" />{talking ?? <path {...line} strokeWidth={6} d={`M-10 ${y + 26}q10 4 20 0`} />}</>;
    // Ready: open eyes and a smile
    default: return <>{open}{talking ?? <path {...line} strokeWidth={7.5} d={`M-15 ${y + 30}q15 13 30 0`} />}</>;
  }
}

// Sage's face: brows always, white face lines, cheeks when pleased
function SageFace({ face, blink }: { face: Face; blink: boolean }) {
  // A white stroke
  const line = { fill: "none", stroke: WHITE, strokeLinecap: "round" as const };
  // Proud: happy eyes, raised brows, a laugh with cheeks
  if (face === "proud") return (
    <g transform="translate(0 8)">
      <g fill="#f59a86" opacity={0.6}><ellipse cx="-46" cy="-6" rx="13" ry="8" /><ellipse cx="46" cy="-6" rx="13" ry="8" /></g>
      <path {...line} strokeWidth={5.5} d="M-12 -58Q-24 -63 -36 -58M12 -58Q24 -63 36 -58" />
      <path {...line} strokeWidth={6} d="M-35 -24Q-24 -38 -13 -24M13 -24Q24 -38 35 -24" />
      <path fill="#10261a" stroke={WHITE} strokeWidth={4.5} d="M-18 -3H18Q16 16 0 16Q-16 16-18 -3Z" />
      <ellipse fill="#ec6a55" cx="0" cy="11" rx="8" ry="4" />
    </g>
  );
  // Encouraging: open eyes, lifted brows, a big smile, cheeks
  if (face === "encouraging") return (
    <g transform="translate(0 8)">
      <g fill="#f59a86" opacity={0.6}><ellipse cx="-46" cy="-6" rx="13" ry="8" /><ellipse cx="46" cy="-6" rx="13" ry="8" /></g>
      <path {...line} strokeWidth={5.5} d="M-12 -62Q-24 -65 -36 -59.4M12 -62Q24 -65 36 -59.4" />
      {blink ? <path {...line} strokeWidth={6} d="M-35 -28Q-24 -22 -13 -28M13 -28Q24 -22 35 -28" /> : <><ellipse fill={WHITE} cx="-24" cy="-30" rx="10" ry="14" /><ellipse fill={WHITE} cx="24" cy="-30" rx="10" ry="14" /></>}
      <path {...line} strokeWidth={6.5} d="M-20 -4Q0 14 20 -4" />
    </g>
  );
  // Calm (and anything else): settled brows, lidded eyes, a small smile
  return (
    <g transform="translate(0 8)">
      <path {...line} strokeWidth={5.5} d="M-12 -52Q-24 -57 -36 -52M12 -52Q24 -57 36 -52" />
      {blink ? <path {...line} strokeWidth={6} d="M-33 -28Q-24 -22 -15 -28M15 -28Q24 -22 33 -28" /> : <><ellipse fill={WHITE} cx="-24" cy="-30" rx="9" ry="12" /><ellipse fill={WHITE} cx="24" cy="-30" rx="9" ry="12" /></>}
      <path {...line} strokeWidth={6.5} d="M-15 -2Q0 9 15 -2" />
    </g>
  );
}

// Draw a character at a size in pixels; squash (around 1) squashes and stretches from the base, tilt leans it, talk opens the mouth, blink shuts the eyes
export function Cast({ who, face = "ready", size, squash = 1, tilt = 0, talk = 0, blink = false }: { who: Who; face?: Face; size: number; squash?: number; tilt?: number; talk?: number; blink?: boolean }) {
  // Squash and stretch from the base, keeping the volume roughly the same
  const body = `translate(0 94) rotate(${tilt}) scale(${1 / Math.sqrt(squash)} ${squash}) translate(0 -94)`;
  // The drawing
  return (
    <svg width={size} height={size} viewBox="-140 -160 280 270" style={{ overflow: "visible", display: "block" }}>
      <g transform={body}>
        {who === "you" && <><Body shape="round" light={"#e8935c"} dark="#cf7440" /><LightFace face={face} y={-34} gap={24} talk={talk} blink={blink} /></>}
        {who === "friend" && <><Body shape="egg" light="#2fb3a4" dark="#1f8d80" highlight={0.45} /><path fill="none" stroke="#1f8d80" strokeWidth={9} strokeLinecap="round" d="M2 -112q-4 -22 14 -26q14 -2 10 12" /><LightFace face={face} y={-28} gap={22} talk={talk} blink={blink} /></>}
        {who === "wobbly" && <><Body shape="wobbly" light="#f08cc0" dark="#d06fa2" highlight={0.45} /><LightFace face={face} y={-28} gap={24} talk={talk} blink={blink} /></>}
        {who === "sage" && (
          <g transform="translate(0 94) scale(1.02 0.95) translate(0 -94)">
            {/* The sprout */}
            <g transform="translate(0 -94)">
              <path fill="none" stroke="#4f8a43" strokeWidth={6} strokeLinecap="round" d="M0 0Q-3 -16 3 -30" />
              <ellipse fill="#5ea34e" cx="16" cy="-38" rx="16" ry="8" transform="rotate(-30 16 -38)" />
              <ellipse fill="#7cc46a" cx="-10" cy="-36" rx="15" ry="8" transform="rotate(28 -10 -36)" />
            </g>
            {/* The body */}
            <path fill="#20432c" d={SHAPES.round} />
            <path fill="#2d5a3d" transform="translate(-9 -8) scale(0.93)" d={SHAPES.round} />
            <ellipse fill="#fff6e6" opacity={0.28} cx="-60" cy="-64" rx="16" ry="9" transform="rotate(-35 -60 -64)" />
            <SageFace face={face} blink={blink} />
          </g>
        )}
      </g>
    </svg>
  );
}

// Whether a character is mid-blink at a frame: a short blink every few seconds, out of step per character (seed)
export function blinking(frame: number, seed = 0): boolean {
  // A blink of 4 frames every 138 frames (4.6 seconds)
  return (frame + seed * 37) % 138 < 4;
}
