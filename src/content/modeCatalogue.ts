// Every way to practise in one list, for development (decision 132): the modes on Practice's main list and the extended ones that will later surface inside lessons instead, each with where it opens. Built from the content lists where there are some, so new drills and units appear by themselves

// Load the voice drills, their names and the shadowing passages
import { SHADOW_PASSAGES, VOICE_DRILLS, VOICE_MODE_NAMES } from "@/content/voice";
// Load the small-talk units
import { UNITS } from "@/content/smallTalk";
// Load the pause drills and lessons
import { PAUSE_DRILLS } from "@/content/prompts";
import { LESSONS } from "@/content/lessons";
// Load the courses
import { COURSES } from "@/content/courses";

// One way to practise in the list
export interface CatalogueEntry {
  // Its name, as the app shows it
  name: string;
  // One line on what it is
  what: string;
  // Where it opens
  href: string;
  // Whether it is on Practice's main list (the rest are extended)
  main: boolean;
  // How many items it holds, when it is a bank of drills (optional)
  count?: string;
}

// One group of the list
export interface CatalogueGroup {
  // The group's name
  name: string;
  // Its entries
  entries: ReadonlyArray<CatalogueEntry>;
}

// The voice drill kinds, in the order Practice shows them
const VOICE_KINDS = ["clear", "volume", "pitch", "tone"] as const;

// The list
export const MODE_CATALOGUE: ReadonlyArray<CatalogueGroup> = [
  // Speaking on the spot
  {
    name: "Speak on the spot",
    entries: [
      // The main two
      { name: "Rapid Fire", what: "A surprise question, 10 seconds to think, 1 to 2 minutes", href: "/session?mode=talk&prompt=t001", main: true },
      { name: "Prepared speech", what: "Two minutes to plan, then 2 to 4 minutes", href: "/session?mode=response&prompt=p001", main: true },
      // The extended ones
      { name: "Free talk", what: "Anything, as long as you like", href: "/session?mode=free&prompt=free", main: false },
      { name: "Short speech", what: "Your topic and a few points, then speak", href: "/practice/outline", main: false },
      { name: "4/3/2", what: "The same content three times, shorter each time", href: "/practice/four-three-two", main: false },
      { name: "Your talk", what: "Rehearse a talk you are giving, section by section", href: "/rehearse", main: false },
    ],
  },
  // Stories
  {
    name: "Stories",
    entries: [
      // The main one
      { name: "Tell a story", what: "A true story with a template, told and told again", href: "/stories", main: true },
      // The extended ones
      { name: "Guided stories", what: "You get the facts, you make it a story", href: "/stories#guided-stories", main: false },
      { name: "Tell one again", what: "Your own stories, a little better each time", href: "/stories#your-stories", main: false },
      { name: "From your moments", what: "A one-moment note, told properly", href: "/stories#from-moments", main: false },
    ],
  },
  // Conversation
  {
    name: "Conversation",
    entries: [
      // The main one
      { name: "Talk with someone", what: "A few exchanges in a chosen situation, out loud", href: "/conversations", main: true },
      // The units, each its own entry
      ...UNITS.map((unit) => ({ name: `Small talk: ${unit.name}`, what: unit.when, href: `/small-talk/unit?id=${unit.id}`, main: false })),
      // The rest
      { name: "One moment a day", what: "A private note of something worth telling", href: "/session?mode=moment&prompt=moment", main: false },
      { name: "Quick scenarios", what: "Choose the best reply, then say it aloud", href: "/learn/scenarios", main: false },
    ],
  },
  // Reading and the voice
  {
    name: "Reading and your voice",
    entries: [
      // The main one
      { name: "Read aloud", what: "Famous speeches and passages", href: "/skills", main: true },
      // The extended ones
      { name: "Whole speeches", what: "A speech a minute at a time", href: "/speech?id=jfk-inaugural", main: false },
      { name: "Pause drills", what: "Pause where the text is marked", href: `/session?mode=pause&prompt=${PAUSE_DRILLS[0]!.id}`, main: false, count: `${PAUSE_DRILLS.length} drills` },
      { name: "Warm-up", what: "Three moves, one minute, nothing recorded", href: "/voice/warmup", main: false },
      // Each voice drill kind, opening its first drill
      ...VOICE_KINDS.map((kind) => {
        // The kind's drills
        const drills = VOICE_DRILLS.filter((drill) => drill.kind === kind);
        // Its entry
        return { name: VOICE_MODE_NAMES[kind], what: drills[0]?.intro ?? "", href: `/voice/drill?id=${drills[0]?.id ?? ""}`, main: false, count: `${drills.length} drills` };
      }),
      { name: VOICE_MODE_NAMES.shadow, what: "Copy a voice phrase by phrase", href: `/voice/shadow?id=${SHADOW_PASSAGES[0]!.id}`, main: false, count: `${SHADOW_PASSAGES.length} passages` },
      { name: "Your voice", what: "Every voice mode on one page", href: "/voice", main: false },
    ],
  },
  // Learning and plans
  {
    name: "Learning and plans",
    entries: [
      // The extended ones
      { name: "Learn cards", what: "What the research says, one card at a time, and missions", href: "/learn", main: false },
      { name: "Skill lessons", what: "One practical tip and a text to practise it on", href: `/session?mode=lesson&prompt=${LESSONS[0]!.id}`, main: false, count: `${LESSONS.length} lessons` },
      { name: "Courses", what: "Guided lessons made of the modes above", href: "/courses", main: false, count: `${COURSES.length} ${COURSES.length === 1 ? "course" : "courses"}` },
      { name: "Weekly check-in", what: "Read, pitch, story and a surprise question, compared week to week", href: "/check-in", main: false },
    ],
  },
];
