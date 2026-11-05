// Which mode tile stands for each small-talk skill on the role-play list pages (UI rewrite, second pass): a situation or a scene shows its skill's tile, so neighbouring cards differ and the same skill always looks the same

// Load the tile's look
import type { ModeTileLook } from "@/components/scenes/modeTileFor";

// Each skill's tile
const SKILL_TILES: Readonly<Record<string, ModeTileLook>> = {
  // Answering: they ask about your life
  answering: { ground: "bloom", prop: "chat", face: "ready" },
  // Asking: you keep it going with questions
  asking: { ground: "sky", prop: "q", face: "wonder" },
  // Listening: they have something on their mind
  listening: { ground: "leaf", prop: "ear", face: "ready" },
  // News: they have something to share
  news: { ground: "sun", prop: "star", face: "happy" },
};

// A skill's tile, or the conversation's for any other
export function skillTile(skill: string): ModeTileLook {
  // Its own, or the chat bubble on bloom
  return SKILL_TILES[skill] ?? { ground: "bloom", prop: "chat", face: "ready" };
}
