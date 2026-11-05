// Which mode tile stands for the practice an address starts (second design pass): a Learn card's "Practise it" row shows the tile of the practice it opens, as in storyboard 22

// Load each kind of practice's tile, and the tile type
import { SCENE_TILES, type ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the scene for a step
import { stepScene } from "@/components/scenes/sceneFor";
// Load the kind-of-session type
import type { SessionMode } from "@/data/records";

// Tiles for the kinds of session without a scene of their own
const MODE_TILES: Partial<Record<SessionMode, ModeTileLook>> = {
  // A pause drill: the pause sign
  pause: { ground: "leaf", prop: "pause", face: "ready" },
  // A lesson: the book
  lesson: { ground: "sun", prop: "book", face: "wonder" },
  // A story: the campfire
  story: SCENE_TILES.story,
};

// Tiles for pages that are not a recording, by where their address starts
const PAGE_TILES: ReadonlyArray<[string, ModeTileLook]> = [
  // Telling a story, and the stories page
  ["/stories", SCENE_TILES.story],
  // A voice drill, and the warm-up
  ["/voice", SCENE_TILES["warm-up"]],
  // Talking with someone, small talk and quick scenarios
  ["/conversations", SCENE_TILES.conversation],
  // (small talk)
  ["/small-talk", SCENE_TILES.conversation],
  // (quick scenarios)
  ["/learn/scenarios", SCENE_TILES.conversation],
  // Today's mission: the flag
  ["/learn", { ground: "bloom", prop: "flag", face: "happy" }],
  // An outline: a prepared speech
  ["/practice/outline", SCENE_TILES["prepared-speech"]],
  // Your speaking profile: the star
  ["/profile", { ground: "sky", prop: "star", face: "happy" }],
];

// The tile for an address: its kind of session's, else its page's, else a microphone
export function tileForHref(href: string): ModeTileLook {
  // The path and the query
  const [path = "", query = ""] = href.split(/[?#]/);
  // A recording: by its kind of session
  if (path === "/session") {
    // The kind
    const mode = new URLSearchParams(query).get("mode") as SessionMode | null;
    // Its scene, when it has one
    const scene = mode ? stepScene({ kind: "session", label: "", mode }) : null;
    // That scene's tile, else this kind's own, else a microphone
    return (scene ? SCENE_TILES[scene] : mode ? MODE_TILES[mode] : undefined) ?? { ground: "sky", prop: "mic", face: "ready" };
  }
  // A page: the first whose address it starts with
  return PAGE_TILES.find(([start]) => path.startsWith(start))?.[1] ?? { ground: "sky", prop: "mic", face: "ready" };
}
