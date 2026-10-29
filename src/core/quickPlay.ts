// Quick play on Today (decision 128): one of the main kinds of practice at random, with something to practise in it at random too; loaded after Today has shown, like the plan (decision 88)

// Load the Rapid Fire questions, the prepared-speech tasks and the texts to read
import { PASSAGES, PROMPTS, TABLE_TOPICS } from "@/content/prompts";
// Load the story prompts
import { STORY_PROMPTS } from "@/content/stories";
// Load the conversation pick and its address
import { conversationAddress, quickPick } from "@/content/conversations";

// The kinds of practice Quick play picks from: Practice's five main ones (decision 125)
export const QUICK_PLAY_KINDS = ["Rapid Fire", "Prepared speech", "Tell a story", "Talk with someone", "Read aloud"] as const;

// One kind of practice
export type QuickPlayKind = (typeof QUICK_PLAY_KINDS)[number];

// What Quick play starts
export interface QuickPlayPick {
  // The kind of practice
  kind: QuickPlayKind;
  // Where it starts
  href: string;
}

// What the conversation pick needs
export interface QuickPlayInput {
  // The conversations so far, by situation
  conversations: ReadonlyArray<{ scenarioId?: string | undefined }>;
  // Whether the coach writes lines, so any situation can be played
  written: boolean;
}

// One item of a list at random (random gives a number from 0 up to, not including, 1)
function oneOf<T>(items: ReadonlyArray<T>, random: () => number): T {
  // Kept inside the list even if random returns 1
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))]!;
}

// The texts read aloud on their own: speeches and practice passages (pause drills and word lists are drills)
const READINGS = PASSAGES.filter((passage) => passage.kind === "speech" || passage.kind === "practice");

// Pick a kind of practice at random, and what to practise in it
export function quickPlay(input: QuickPlayInput, random: () => number = Math.random): QuickPlayPick {
  // The kind
  const kind = oneOf(QUICK_PLAY_KINDS, random);
  // A surprise question
  if (kind === "Rapid Fire") return { kind, href: `/session?mode=talk&prompt=${oneOf(TABLE_TOPICS, random).id}` };
  // A prepared speech
  if (kind === "Prepared speech") return { kind, href: `/session?mode=response&prompt=${oneOf(PROMPTS, random).id}` };
  // A story
  if (kind === "Tell a story") return { kind, href: `/stories/tell?prompt=${oneOf(STORY_PROMPTS, random).id}` };
  // A text to read aloud
  if (kind === "Read aloud") return { kind, href: `/session?mode=read&prompt=${oneOf(READINGS, random).id}` };
  // A conversation: the same pick as its own Quick play, which starts at once (decision 127)
  const { persona, scenario } = quickPick(input.conversations, input.written);
  // Its address
  return { kind, href: conversationAddress(persona, scenario) };
}
