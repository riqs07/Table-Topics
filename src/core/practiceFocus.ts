// What the user wants to get better at most, chosen at the welcome, on Today or in Settings (decision 97): one or two areas, each tied to the practice, Learn sets and Practice group it steers. No content is loaded here, so Today, Practice and Learn can use it without the plan's download (decision 88); the suggestion that needs content is in dailyPlan.ts

// Load the Learn set type
import type { LearnSetId } from "@/content/learn";

// The areas someone can pick
export type FocusAreaId = "stories" | "conversation" | "spot" | "voice" | "work" | "talk";

// The groups on the Practice page, by their ids there
export type PracticeGroupId = "on-the-spot" | "stories" | "conversation" | "voice";

// One kind of practice the daily plan can pick (the bank's kinds, plus a lesson or a prepared speech from an area's own list)
export type PickKind = "talk" | "response" | "story" | "guided" | "skill" | "voice" | "pause" | "connect" | "smalltalk" | "scenarios" | "scene" | "listening" | "focus-lesson" | "focus-speech";

// One area: what it is called, what it steers, and the one next thing to suggest
export interface FocusArea {
  // Stable id, saved in the settings
  id: FocusAreaId;
  // Its name on the choice, as the user would say it
  name: string;
  // A few words on what it covers
  detail: string;
  // Its name inside a sentence ("Your focus: telling stories.")
  phrase: string;
  // The Learn sets it puts first
  learnSets: ReadonlyArray<LearnSetId>;
  // The Practice group it puts first
  practiceGroup: PracticeGroupId;
  // The kinds of practice the plan takes from it, in turn by day
  picks: ReadonlyArray<PickKind>;
  // Lessons it takes in turn, for a "focus-lesson" pick (ids from src/content/lessons.ts)
  lessons: ReadonlyArray<string>;
  // Prepared-speech tasks it takes in turn, for a "focus-speech" pick (ids from src/content/prompts.ts)
  speeches: ReadonlyArray<string>;
}

// The most areas one person can pick
export const MAX_FOCUS = 2;

// Every area, in the order the question lists them
export const FOCUS_AREAS: ReadonlyArray<FocusArea> = [
  // Telling stories: open and guided stories (decisions 92 and 93)
  { id: "stories", name: "Telling stories", detail: "Your own stories and guided ones", phrase: "telling stories", learnSets: ["stories"], practiceGroup: "stories", picks: ["story", "guided"], lessons: [], speeches: [] },
  // Small talk and conversations: the units, scenes, everyday questions and Active listening (decision 151; the paid conversation partner stays a suggestion, not a plan step)
  { id: "conversation", name: "Small talk and conversations", detail: "Everyday chats, and talking with someone", phrase: "small talk and conversations", learnSets: ["conversation", "warmth"], practiceGroup: "conversation", picks: ["connect", "scene", "smalltalk", "listening"], lessons: [], speeches: [] },
  // Thinking on my feet: Rapid Fire and prepared speeches (Q&A was removed in decision 61)
  { id: "spot", name: "Thinking on my feet", detail: "Rapid Fire and prepared speeches", phrase: "thinking on my feet", learnSets: ["point", "nerves"], practiceGroup: "on-the-spot", picks: ["talk", "response", "focus-lesson"], lessons: ["l014", "l015"], speeches: [] },
  // How I sound: voice drills, pausing and reading aloud
  { id: "voice", name: "How I sound", detail: "Voice drills, reading aloud and pausing", phrase: "how I sound", learnSets: ["voice"], practiceGroup: "voice", picks: ["voice", "pause", "skill"], lessons: [], speeches: [] },
  // Speaking at work: short updates, persuading the team, the structure lessons, and Rapid Fire for speaking up in a meeting (in place of the retired closing drill; decision 106)
  { id: "work", name: "Speaking at work", detail: "Updates, meetings and short speeches", phrase: "speaking at work", learnSets: ["work", "point"], practiceGroup: "on-the-spot", picks: ["focus-lesson", "focus-speech", "talk"], lessons: ["l014", "l007", "l013"], speeches: ["p048", "p040", "p037", "p043", "p045", "p046", "p050"] },
  // A talk coming up: a prepared speech, and the lessons for the start, the end and a blank (the openings and closings drill was retired, decision 106; a dated talk of your own takes this pick, as before)
  { id: "talk", name: "A talk coming up", detail: "Prepare it, open strong, end well", phrase: "a talk coming up", learnSets: ["nerves", "point", "skills"], practiceGroup: "on-the-spot", picks: ["response", "focus-lesson"], lessons: ["l001", "l011", "l010", "l015"], speeches: [] },
];

// Whether a value is a known area id
export function isFocusAreaId(value: unknown): value is FocusAreaId {
  // One of the listed ids
  return FOCUS_AREAS.some((area) => area.id === value);
}

// The saved choice made safe: known ids only, each once, at most two (anything else, such as an old or edited backup, reads as none); missing stays missing, as "never asked"
export function readPracticeFocus(value: unknown): FocusAreaId[] | undefined {
  // Never asked
  if (value === undefined) return undefined;
  // Not a list: treat as answered with nothing
  if (!Array.isArray(value)) return [];
  // Known ids, each once, the first two
  return [...new Set(value.filter(isFocusAreaId))].slice(0, MAX_FOCUS);
}

// Pick or unpick an area: picking a third replaces the earlier of the two, so a tap always does what it shows
export function toggleFocus(current: ReadonlyArray<FocusAreaId>, id: FocusAreaId): FocusAreaId[] {
  // Already picked: take it off
  if (current.includes(id)) return current.filter((item) => item !== id);
  // Add it, keeping the latest two
  return [...current, id].slice(-MAX_FOCUS);
}

// The areas for a list of ids, in the order picked
export function focusAreas(ids: ReadonlyArray<FocusAreaId> | undefined): FocusArea[] {
  // Each known one
  return (ids ?? []).flatMap((id) => FOCUS_AREAS.filter((area) => area.id === id));
}

// Today's two roles for the areas: one gives the plan's practice pick, the other the Learn card; with two areas they swap each day, with one it does both, with none there is nothing
export function focusForDay(ids: ReadonlyArray<FocusAreaId> | undefined, dayNumber: number): { pick: FocusArea; card: FocusArea; turn: number } | null {
  // The areas picked
  const areas = focusAreas(ids);
  // None: the plan as it always was
  if (areas.length === 0) return null;
  // Which area leads today, kept positive for days before the start
  const lead = ((dayNumber % areas.length) + areas.length) % areas.length;
  // How many times the leading area has led before, so its kinds take turns on its own days
  const turn = Math.floor(dayNumber / areas.length);
  // The leader gives the pick; the other (or the same) gives the card
  return { pick: areas[lead]!, card: areas[(lead + 1) % areas.length]!, turn };
}

// The Practice page's groups, the picked areas' groups first (each once), then the rest in their usual order
export function orderPracticeGroups(ids: ReadonlyArray<FocusAreaId> | undefined, usual: ReadonlyArray<PracticeGroupId>): PracticeGroupId[] {
  // The picked areas' groups
  const first = [...new Set(focusAreas(ids).map((area) => area.practiceGroup))];
  // Those, then everything else
  return [...first, ...usual.filter((group) => !first.includes(group))];
}

// The Learn page's groups: with a focus, a "For your focus" group of its sets first, and those sets left out of their usual groups; without one, as usual
export function orderLearnGroups<Group extends { name: string; sets: ReadonlyArray<LearnSetId> }>(ids: ReadonlyArray<FocusAreaId> | undefined, groups: ReadonlyArray<Group>): Array<{ name: string; sets: ReadonlyArray<LearnSetId> }> {
  // The picked areas' sets, each once, in the order picked
  const sets = [...new Set(focusAreas(ids).flatMap((area) => area.learnSets))];
  // No focus: the usual groups
  if (sets.length === 0) return groups.map((group) => ({ name: group.name, sets: group.sets }));
  // The focus group, then each usual group without those sets (a group left empty is dropped)
  return [{ name: "For your focus", sets }, ...groups.map((group) => ({ name: group.name, sets: group.sets.filter((set) => !sets.includes(set)) })).filter((group) => group.sets.length > 0)];
}

// The picked areas in a sentence: "telling stories", or "telling stories and how I sound"
export function focusPhrase(ids: ReadonlyArray<FocusAreaId> | undefined): string {
  // Each area's phrase, joined
  return focusAreas(ids).map((area) => area.phrase).join(" and ");
}
