// Each weekly check-in part's mode tile (storyboard "Weekly check-in"): the passage on leaf with a book, the pitch on sun with a target, the story on coral with a fire, the surprise question on sky with a bolt

// Load the tile's look type
import type { ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the part type
import type { CheckInPart } from "@/data/records";

// The four parts' tiles
export const CHECK_IN_TILES: Readonly<Record<CheckInPart, ModeTileLook>> = {
  // The same passage, read aloud
  read: { ground: "leaf", prop: "book", face: "sing" },
  // The elevator pitch
  pitch: { ground: "sun", prop: "target", face: "ready" },
  // A story
  story: { ground: "coral", prop: "fire", face: "happy" },
  // The surprise question
  surprise: { ground: "sky", prop: "bolt", face: "wow" },
};

// The check-in as a whole: a calendar on sun
export const CHECK_IN_TILE: ModeTileLook = { ground: "sun", prop: "cal", face: "ready" };
