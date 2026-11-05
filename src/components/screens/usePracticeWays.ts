"use client";
// Every way to practise, grouped into the four jobs Practice shows as picture cards (second design pass: Speak on the spot, Tell stories, Conversations, Your voice) and the role plays, each way leading to its own screen. Practice and each job's list of ways read them from here, so the counts on the cards always match the lists (the groups and their order come from decisions 92, 93, 95, 97, 108, 149, 150, 152 and 153)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load an icon for each kind of practice
import { ArrowCounterClockwiseIcon, BookOpenTextIcon, CardsIcon, ChatsCircleIcon, DiceFiveIcon, EarIcon, LightningIcon, ListNumbersIcon, MaskHappyIcon, MicrophoneStageIcon, NotePencilIcon, PauseIcon, PresentationIcon, RepeatIcon, ScrollIcon, SignpostIcon, SpeakerHighIcon, SunHorizonIcon, TextAaIcon, TimerIcon, UsersThreeIcon, WaveSineIcon, WindIcon } from "@phosphor-icons/react/dist/ssr";
// Load the Connect units' icons
import { UNIT_ICONS } from "@/components/script/unitIcons";
// Load the shape of one way to practise
import type { Way } from "@/components/script/WayCard";
// Load the mode tile's look
import type { ModeTileLook } from "@/components/scenes/modeTileFor";
// Load the scene names
import type { SceneName } from "@/components/scenes/Scene";
// Load the Connect units and the next one (decision 95)
import { nextUnit, type UnitProgress } from "@/core/units";
import { UNITS } from "@/content/smallTalk";
// Load the day's pickers, and the drills
import { PAUSE_DRILLS, TRICKY_WORDS, promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the voice drills' next picks (decision 80)
import { nextShadowPassage, nextVoiceDrill } from "@/core/voicePicks";
// Load the voice drills, for clear sounds' next one's name
import { VOICE_DRILLS } from "@/content/voice";
// Load the voice modes by need and clear sounds' next item (decision 108)
import { nextClearSound, voiceRowsByNeed, type VoiceRowId } from "@/core/practiceRows";
// Load the rule for which comes next
import { nextToPractise } from "@/core/skillNext";
// Load the moment note's prompt
import { MOMENT_PROMPT } from "@/content/smallTalk";
// Load today's story prompts (decisions 92 and 152)
import { NEEDED_TYPES, neededPromptForDay, storyPromptForDay } from "@/content/stories";
// Load today's Story dice (decision 153)
import { connectStoryForDay } from "@/content/guidedStories";
// Load the people to talk with, the scenes and the stories to listen to, for their counts
import { PERSONAS } from "@/content/conversations";
import { SCENES } from "@/content/scenes";
import { LISTEN_STORIES } from "@/content/listening";
// Load the focus and the order it gives the groups (decision 97)
import { focusAreas, orderPracticeGroups, readPracticeFocus, type FocusAreaId, type PracticeGroupId } from "@/core/practiceFocus";
// Load the repository type
import type { Repository } from "@/data/repository";

// The jobs: the four groups, and the role plays
export type JobId = PracticeGroupId | "role-play";

// One job: its name, its tile, its ways, and whether the focus picked it
export interface PracticeJob {
  // Its id, used in its list's address
  id: JobId;
  // Its name
  title: string;
  // Its tile
  look: ModeTileLook;
  // Its ways, the most relevant first
  ways: Way[];
  // Whether it is one of the user's focus areas
  focus: boolean;
}

// Each job's name and tile, in the usual order
export const JOB_LOOKS: Readonly<Record<JobId, { title: string; look: ModeTileLook }>> = {
  // Rapid Fire, prepared speeches, reading aloud
  "on-the-spot": { title: "Speak on the spot", look: { ground: "sun", prop: "bolt", face: "ready" } },
  // Stories
  stories: { title: "Tell stories", look: { ground: "coral", prop: "fire", face: "happy" } },
  // Talking with people
  conversation: { title: "Conversations", look: { ground: "bloom", prop: "chat", face: "ready" } },
  // How you sound
  voice: { title: "Your voice", look: { ground: "leaf", prop: "waves", face: "sing" } },
  // Practising a part with someone
  "role-play": { title: "Role play", look: { ground: "plum", prop: "door", face: "wonder" } },
};

// The four groups in their usual order
const USUAL_ORDER: ReadonlyArray<PracticeGroupId> = ["on-the-spot", "stories", "conversation", "voice"];

// The scene for each of the stories you'll need (decision 152)
const NEEDED_SCENES: Readonly<Record<string, SceneName>> = { "who-i-am": "who-i-am", interview: "interview", toast: "toast", choice: "choice" };

// A job's address
export function jobHref(id: JobId): string {
  // Its list of ways
  return `/practice/ways?job=${id}`;
}

// A job's line under its name: how many ways, then (on a computer) the first few by name
export function jobLine(job: Pick<PracticeJob, "ways">): { count: string; names: string } {
  // The count and the first three names
  return { count: `${job.ways.length} ${job.ways.length === 1 ? "way" : "ways"}`, names: `${job.ways.slice(0, 3).map((way) => way.name).join(", ")}${job.ways.length > 3 ? "…" : ""}` };
}

// What Practice and the job lists get: the four jobs (the focus's first), the role plays, and the quick start
export interface PracticeWays {
  // The four jobs, the focus's first (decision 97)
  jobs: PracticeJob[];
  // The role plays
  rolePlay: PracticeJob;
  // Rapid Fire, the quick start (no address until the day is known)
  quickStart: Way;
  // Whether the focus has been read (the order may change once it has)
  focusRead: boolean;
}

// Every way to practise, grouped, for today
export function usePracticeWays(repo: Repository, today: Date | null): PracticeWays {
  // How often each reading and drill was practised, once read (empty until then, so the rows first lead to the lists)
  const [counts, setCounts] = useState<ReadonlyMap<string, number> | null>(null);
  // The Connect unit to suggest next (the first unit until the sessions are read; decision 95)
  const [unit, setUnit] = useState<UnitProgress>(() => nextUnit([]));
  // What the user wants to get better at most, once read (none until then, so the page starts in its usual order; decision 97)
  const [focus, setFocus] = useState<FocusAreaId[] | null>(null);

  // Read the focus once in the browser
  useEffect(() => {
    // Wait for the browser
    if (!today) return;
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the settings, keeping the usual order if they cannot be read
    repo.getSettings(today).then((settings) => {
      // Keep the focus if still open
      if (!cancelled) setFocus(readPracticeFocus(settings.practiceFocus) ?? []);
    }, () => !cancelled && setFocus([]));
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

  // Count the readings and drills practised
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    repo.listSessions().then((sessions) => {
      // Stop if closed
      if (cancelled) return;
      // Count by prompt
      const next = new Map<string, number>();
      // Each reading, drill or voice drill adds one
      for (const session of sessions) if (session.mode === "read" || session.mode === "pause" || session.mode === "voice") next.set(session.promptId, (next.get(session.promptId) ?? 0) + 1);
      // Keep them
      setCounts(next);
      // The next Connect unit
      setUnit(nextUnit(sessions));
    }, () => undefined);
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

  // The focus, or none while unread
  const picked = focus ?? [];
  // The next pause drill (once counted)
  const nextPause = counts ? PAUSE_DRILLS.find((drill) => drill.id === nextToPractise(PAUSE_DRILLS.map((item) => item.id), counts)) : undefined;
  // Clear sounds' next drill or word list, as one list (decision 108)
  const nextClear = nextClearSound(counts ?? new Map());
  // Its name
  const nextClearTitle = VOICE_DRILLS.find((drill) => drill.id === nextClear.id)?.title ?? TRICKY_WORDS.find((list) => list.id === nextClear.id)?.title ?? "";
  // The next drill of each voice mode (the first of each until counted)
  const nextVoice = (kind: "volume" | "pitch" | "tone") => nextVoiceDrill(kind, counts ?? new Map());
  // The next passage to shadow
  const nextShadow = nextShadowPassage(counts ?? new Map());

  // Today's Rapid Fire question and prepared-speech task (one along from today's practice, so they differ from its steps)
  const topic = today ? tableTopicForDay(today, 1) : null;
  // The task
  const prompt = today ? promptForDay(today, 1) : null;
  // Today's story prompt (decision 92)
  const story = today ? storyPromptForDay(today) : null;
  // Today's Story dice: a "Connect these" guided story, one along each day (decision 153)
  const dice = today ? connectStoryForDay(today) : null;

  // Rapid Fire (once called Table Topic; decision 85)
  const rapidFire: Way = { name: "Rapid Fire", detail: "A surprise question, 1 to 2 minutes", href: topic ? `/session?mode=talk&prompt=${topic.id}` : null, icon: LightningIcon, scene: "rapid-fire" };
  // The short speech: an update, a pitch, a plan (decision 73)
  const shortSpeech: Way = { name: "Short speech", detail: "Your topic and a few points, then speak", href: "/practice/outline", icon: ListNumbersIcon, scene: "short-speech" };
  // With speaking at work or a talk as a focus, the short speech comes first (decision 97)
  const speechFirst = picked.includes("work") || picked.includes("talk");

  // Each voice mode's row, straight into its next drill (decision 80; clear sounds holds the tricky-word lists too, decision 108)
  const voiceWays: Record<VoiceRowId, Way> = {
    // Clear sounds and the word lists
    clear: { name: "Clear sounds", detail: `Next: ${nextClearTitle}`, href: nextClear.href, icon: TextAaIcon },
    // Volume
    volume: { name: "Volume", detail: `Next: ${nextVoice("volume").title}`, href: `/voice/drill?id=${nextVoice("volume").id}`, icon: SpeakerHighIcon },
    // Pitch and stress
    pitch: { name: "Pitch and stress", detail: `Next: ${nextVoice("pitch").title}`, href: `/voice/drill?id=${nextVoice("pitch").id}`, icon: WaveSineIcon },
    // Tone
    tone: { name: "Tone", detail: `Next: ${nextVoice("tone").title}`, href: `/voice/drill?id=${nextVoice("tone").id}`, icon: MaskHappyIcon },
    // Pausing: the pause drills
    pausing: { name: "Pausing", detail: nextPause ? `Next: ${nextPause.title}` : "Pause where the text is marked, 1 min", href: nextPause ? `/session?mode=pause&prompt=${nextPause.id}` : "/voice#pausing", icon: PauseIcon },
    // Shadowing
    shadowing: { name: "Shadowing", detail: `Next: ${nextShadow.title}`, href: `/voice/shadow?id=${nextShadow.id}`, icon: RepeatIcon },
  };

  // Each group's ways, the most relevant first
  const ways: Record<PracticeGroupId, Way[]> = {
    // Speaking on the spot
    "on-the-spot": [
      // With "a talk coming up" as a focus: your own talk, rehearsed (decision 97)
      ...(picked.includes("talk") ? [{ name: "Your talk", detail: "Rehearse a talk you’re giving", href: "/rehearse", icon: PresentationIcon, scene: "your-talk" } satisfies Way] : []),
      // The short speech first with work or a talk as a focus
      ...(speechFirst ? [shortSpeech] : []),
      // Rapid Fire
      rapidFire,
      // A prepared speech
      { name: "Prepared speech", detail: "Plan for 2 minutes, speak for 2 to 4", href: prompt ? `/session?mode=response&prompt=${prompt.id}` : null, icon: NotePencilIcon, scene: "prepared-speech" },
      // Reading aloud (decision 93); the page holds the readings (decision 107)
      { name: "Read aloud", detail: "Famous speeches and passages", href: "/skills", icon: BookOpenTextIcon, scene: "read-aloud" },
      // The 4/3/2 drill (decision 126)
      { name: "4/3/2", detail: "Say it three times, shorter each time", href: "/practice/four-three-two", icon: TimerIcon, scene: "four-three-two" },
      // Free talk (decision 73)
      { name: "Free talk", detail: "Talk about anything, as long as you like", href: "/session?mode=free&prompt=free", icon: MicrophoneStageIcon, scene: "free-talk" },
      // The short speech, here unless the focus put it first
      ...(speechFirst ? [] : [shortSpeech]),
    ],
    // Telling stories, and telling them again (decisions 92, 152 to 154)
    stories: [
      // Today's story prompt
      { name: "Today’s story", detail: story ? story.title : "A true story, 1 to 3 min", href: story ? `/stories/tell?prompt=${story.id}` : "/stories", icon: ScrollIcon, scene: "story" },
      // The user's own stories, told again
      { name: "Tell one again", detail: "Your stories, a little better each time", href: "/stories#your-stories", icon: ArrowCounterClockwiseIcon, scene: "tell-again" },
      // A guided story: the facts are given (decision 93)
      { name: "Guided stories", detail: "You get the facts, you make it a story", href: "/stories#guided-stories", icon: SignpostIcon, scene: "guided-stories" },
      // A moment note, told properly
      { name: "From your moments", detail: "A one-moment note, told properly", href: "/stories#from-moments", icon: SunHorizonIcon, scene: "moment" },
      // The stories you'll need (decision 152), each straight into today's prompt of its kind
      ...NEEDED_TYPES.map((type) => ({ name: type.name, detail: type.detail, href: today ? `/stories/tell?prompt=${neededPromptForDay(type.group, today).id}` : "/stories#stories-youll-need", icon: ScrollIcon, scene: NEEDED_SCENES[type.template] } satisfies Way)),
      // Story dice: four things to connect into one story (decision 153)
      { name: "Story dice", detail: "Four things that don't belong together. Make one story", href: dice ? `/stories/tell?prompt=${dice.id}` : "/stories#guided-stories", icon: DiceFiveIcon, scene: "story-dice" },
      // Every story, on its own page
      { name: "All stories", detail: "Your stories, templates, guided stories and prompts", href: "/stories", icon: ListNumbersIcon },
    ],
    // Everyday conversation (decisions 95, 149 and 150)
    conversation: [
      // A whole conversation with one of four people (decision 83)
      { name: "Talk with someone", detail: `${PERSONAS.length} people, 3 minutes, out loud`, href: "/conversations", icon: UsersThreeIcon, scene: "conversation" },
      // A scene: choose replies, then say the last one (decision 149)
      { name: "Scenes", detail: "Choose your replies, then say the last one", href: "/scenes", icon: ChatsCircleIcon, scene: "scenes" },
      // Active listening (decision 150)
      { name: "Active listening", detail: "Hear a story once, answer to what mattered", href: "/listening", icon: EarIcon, scene: "listening" },
      // The next unit, straight to its page
      { name: unit.unit.name, detail: unit.nextLesson ? `Next: lesson ${unit.nextLesson.number}, ${unit.nextLesson.title}` : unit.unit.youDo, href: `/small-talk/unit?id=${unit.unit.id}`, icon: UNIT_ICONS[unit.unit.id] },
      // One moment a day
      { name: "One moment a day", detail: "A private note of something worth telling", href: `/session?mode=moment&prompt=${MOMENT_PROMPT.id}`, icon: SunHorizonIcon, scene: "moment" },
      // Every small-talk unit, on its own page
      { name: "Small talk", detail: `All ${UNITS.length} units, each with lessons and drills`, href: "/small-talk", icon: ListNumbersIcon },
    ],
    // How you sound: a warm-up, then the modes done least first (decisions 80 and 108)
    voice: [
      // A warm-up, nothing recorded
      { name: "Warm-up", detail: "Three moves, one minute, nothing recorded", href: "/voice/warmup", icon: WindIcon, scene: "warm-up" },
      // The modes, the one done least first
      ...voiceRowsByNeed(counts ?? new Map()).map((row) => voiceWays[row]),
      // Every drill, by mode, on its own page
      { name: "All voice drills", detail: "Every drill, by what it works on", href: "/voice", icon: ListNumbersIcon },
    ],
  };

  // The role plays: a part to play with someone, and every small-talk unit
  const rolePlayWays: Way[] = [
    // A whole conversation
    { name: "Talk with someone", detail: `${PERSONAS.length} people, 3 minutes, out loud`, href: "/conversations", icon: UsersThreeIcon, scene: "conversation" },
    // Scenes
    { name: "Scenes", detail: `${SCENES.length} scenes. Choose your replies, then say the last one`, href: "/scenes", icon: ChatsCircleIcon, scene: "scenes" },
    // Listening
    { name: "Active listening", detail: `${LISTEN_STORIES.length} stories. Hear one once, answer to what mattered`, href: "/listening", icon: EarIcon, scene: "listening" },
    // Quick scenarios
    { name: "Quick scenarios", detail: "Choose the best reply, then say it", href: "/learn/scenarios", icon: CardsIcon },
    // Each small-talk unit
    ...UNITS.map((item) => ({ name: item.name, detail: item.when, href: `/small-talk/unit?id=${item.id}`, icon: UNIT_ICONS[item.id] } satisfies Way)),
  ];

  // The picked areas' groups, to mark them
  const focusGroups = focusAreas(picked).map((area) => area.practiceGroup);
  // The four jobs, the focus's first
  const jobs = orderPracticeGroups(picked, USUAL_ORDER).map((id) => ({ id, ...JOB_LOOKS[id], ways: ways[id], focus: focusGroups.includes(id) }));
  // Everything
  return { jobs, rolePlay: { id: "role-play", ...JOB_LOOKS["role-play"], ways: rolePlayWays, focus: false }, quickStart: rapidFire, focusRead: focus !== null };
}
