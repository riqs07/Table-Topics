// How a tile's ground colour dresses the things around it (second design pass): a header band on its colour, a coloured icon square, and which ground each Learn set and small-talk unit takes, so a set or unit keeps one colour on every page

// Load the ground names and the mode tile's look
import type { TileGround } from "@/components/scenes/ModeTile";
import { GROUND_TINT } from "@/components/scenes/ModeTile";
import type { ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the set and unit ids
import { LEARN_SETS, type LearnSetId } from "@/content/learn";
import type { UnitId } from "@/content/smallTalk";

// A header band's colours for each ground: the full colour where its words read clearly on it, else its soft tint with ink words (plum, bloom and coral are too mid-toned for small words in either light or dark)
export const GROUND_BAND: Readonly<Record<TileGround, { band: string; track: string; fill: string }>> = {
  // Blue, light words
  sky: { band: "bg-art-sky text-art-cream shadow-band", track: "bg-art-cream/30", fill: "bg-art-cream" },
  // Yellow, dark words
  sun: { band: "bg-art-sun text-on-warm shadow-band", track: "bg-on-warm/15", fill: "bg-on-warm" },
  // Green, dark words
  leaf: { band: "bg-art-leaf text-on-warm shadow-band", track: "bg-on-warm/15", fill: "bg-on-warm" },
  // Pink, on its tint
  bloom: { band: `${GROUND_TINT.bloom} text-ink shadow-card`, track: "bg-card", fill: "bg-art-bloom" },
  // Purple, on its tint
  plum: { band: `${GROUND_TINT.plum} text-ink shadow-card`, track: "bg-card", fill: "bg-art-plum" },
  // Coral, on its tint
  coral: { band: `${GROUND_TINT.coral} text-ink shadow-card`, track: "bg-card", fill: "bg-art-coral" },
};

// A small icon square on each ground (Courses' "Quick reads"): the full colour with a light or dark icon
export const GROUND_SQUARE: Readonly<Record<TileGround, string>> = {
  // Blue, a light icon
  sky: "bg-art-sky text-art-cream",
  // Yellow, a dark icon
  sun: "bg-art-sun text-on-warm",
  // Green, a dark icon
  leaf: "bg-art-leaf text-on-warm",
  // Pink, a dark icon
  bloom: "bg-art-bloom text-on-warm",
  // Purple, a light icon
  plum: "bg-art-plum text-art-cream",
  // Coral, a dark icon
  coral: "bg-art-coral text-on-warm",
};

// A block of large words on each ground's full colour (a Learn card's claim, storyboard 22): light words on blue and purple, dark words on the rest, each pair at least 3:1 for large bold text in every theme (checked: plum 3.96, sky 4.5, bloom 5.18, coral 4.93, leaf 7.26, sun 8.52 with the light palette)
export const GROUND_SOLID: Readonly<Record<TileGround, string>> = {
  // Blue, light words
  sky: "bg-art-sky text-art-cream",
  // Yellow, dark words
  sun: "bg-art-sun text-on-warm",
  // Green, dark words
  leaf: "bg-art-leaf text-on-warm",
  // Pink, dark words
  bloom: "bg-art-bloom text-on-warm",
  // Purple, light words
  plum: "bg-art-plum text-art-cream",
  // Coral, dark words
  coral: "bg-art-coral text-on-warm",
};

// The grounds in turn, so neighbouring sets differ (plum, bloom and leaf first, as on Courses' "Quick reads")
const TURN: ReadonlyArray<TileGround> = ["plum", "bloom", "leaf", "sky", "sun", "coral"];

// A Learn set's ground, by its place in the list
export function learnSetGround(id: LearnSetId): TileGround {
  // Its place
  const at = LEARN_SETS.findIndex((set) => set.id === id);
  // Its ground in turn (plum for one not in the list)
  return TURN[Math.max(0, at) % TURN.length]!;
}

// Each small-talk unit's tile: a ground, a prop that tells the skill and the blob's face, neighbours differing
export const UNIT_TILES: Readonly<Record<UnitId, ModeTileLook>> = {
  // Answering: a speech bubble
  answering: { ground: "bloom", prop: "chat", face: "happy" },
  // Asking: a question mark
  asking: { ground: "sky", prop: "q", face: "wonder" },
  // Listening: an ear
  listening: { ground: "leaf", prop: "ear", face: "ready" },
  // News: a star
  news: { ground: "sun", prop: "star", face: "wow" },
  // Reading the room: three dots, a pause in the talk
  room: { ground: "plum", prop: "three", face: "wonder" },
  // Starting and ending: a door
  starting: { ground: "coral", prop: "door", face: "happy" },
  // Going deeper: a campfire, the talk that goes on late
  deeper: { ground: "sky", prop: "fire", face: "happy" },
};
