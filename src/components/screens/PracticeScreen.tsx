"use client";
// Practice, slimmer (decision 125): the five kinds of practice that do the most work first (Rapid Fire, a prepared speech, a story, talking with someone and reading aloud; the weekly check-in comes to Today on its day, decision 100), and everything else one tap away under "More ways to practise". Inside it, as before: every kind of practice in one place, grouped, the groups of what the user wants to get better at first (decision 97; the conversation units as the next one and "See all", decision 95; stories second, decision 92; Read aloud with speaking on the spot and the openings drill reached from Today instead, decision 93), each row leading to its own screen (today's steps live on Today; decision 48; your talks hidden for now, decision 49; Q&A practice removed, decision 61); each group shows its first few rows, the most relevant first, with "See all" for the rest, decision 108

// Load Next.js's link component
import Link from "next/link";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared page title
import { PageTitle } from "@/components/script/PageTitle";
// Load an icon for each kind of practice
import { ArrowCounterClockwiseIcon, ScrollIcon, BookOpenTextIcon, ListNumbersIcon, MaskHappyIcon, PresentationIcon, MicrophoneStageIcon, CaretRightIcon, LightningIcon, NotePencilIcon, PauseIcon, RepeatIcon, SignpostIcon, SpeakerHighIcon, SunHorizonIcon, TextAaIcon, UsersThreeIcon, WaveSineIcon, WindIcon } from "@phosphor-icons/react/dist/ssr";
// Load the Connect units' icons
import { UNIT_ICONS } from "@/components/script/unitIcons";
// Load the next Connect unit (decision 95)
import { nextUnit, type UnitProgress } from "@/core/units";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load this week's challenge
import { WeeklyChallenge } from "@/components/screens/WeeklyChallenge";
// Load the day's pickers, and the drills
import { PAUSE_DRILLS, TRICKY_WORDS, promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the voice drills' next picks (decision 80)
import { nextShadowPassage, nextVoiceDrill } from "@/core/voicePicks";
// Load the voice drills, for clear sounds' next one's name
import { VOICE_DRILLS } from "@/content/voice";
// Load what Practice shows at once: the rows split, the voice modes by need, and clear sounds' next item (decision 108)
import { nextClearSound, splitRows, voiceRowsByNeed, type VoiceRowId } from "@/core/practiceRows";
// Load the rule for which comes next
import { nextToPractise } from "@/core/skillNext";
// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the moment note's prompt
import { MOMENT_PROMPT } from "@/content/smallTalk";
// Load today's story prompt (decision 92)
import { storyPromptForDay } from "@/content/stories";
// Load the shared heading look
import { SECTION_HEADING, CARD_LIST } from "@/components/script/textStyles";
// Load the shared link look
import { TEXT_LINK } from "@/components/script/Buttons";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";
// Load React's fragment, to place the groups in order
import { Fragment, type ReactNode } from "react";
// Load what the user wants to get better at most, and the order it gives the groups (decision 97)
import { focusAreas, orderPracticeGroups, readPracticeFocus, type FocusAreaId, type PracticeGroupId } from "@/core/practiceFocus";

// The groups in their usual order
const USUAL_ORDER: ReadonlyArray<PracticeGroupId> = ["on-the-spot", "stories", "conversation", "voice"];

// One kind of practice on the page
interface Way {
  // Its name
  name: string;
  // What it is, in a few words, with its length
  detail: string;
  // Where it starts (none while it cannot start yet)
  href: string | null;
  // Its icon
  icon: Icon;
}

// One row: icon, name and detail, the whole row a link (quiet and not a link while it cannot start)
function WayRow({ way }: { way: Way }) {
  // The words, shared by both forms
  const words = (
    <>
      {/* The icon on a faint tile, as on the course cards */}
      <span aria-hidden="true" className={`flex size-11 flex-none items-center justify-center rounded-[14px] ${way.href ? "bg-warm-tint text-warm-ink" : "bg-paper text-ink-muted"}`}>
        {/* The icon */}
        <way.icon className="size-6" />
      </span>
      {/* Name and detail */}
      <span className="min-w-0 flex-1">
        {/* The name */}
        <span className="block font-display text-xl font-semibold leading-tight tracking-tight">{way.name}</span>
        {/* What it is */}
        <span className="block text-footnote text-ink-muted">{way.detail}</span>
      </span>
    </>
  );
  // A row that starts it, or a quiet row
  return way.href ? (
    <Link href={way.href} className="flex min-h-16 items-center gap-4 py-3 hover:text-accent">
      {/* Icon and words */}
      {words}
      {/* The chevron */}
      <CaretRightIcon aria-hidden="true" className="size-5 flex-none text-ink-muted" />
    </Link>
  ) : (
    <div className="flex min-h-16 items-center gap-4 py-3 text-ink-muted">{words}</div>
  );
}

// A group of rows under a run-in heading (a focus group says so beside its heading; decision 97): its first few rows, and "See all" for the rest, as a link to the page that has them or, where there is none, opening them in place (decision 108)
function Group({ id, title, ways, more, focus = false }: { id: string; title: string; ways: ReadonlyArray<Way>; more?: { href: string; label: string }; focus?: boolean }) {
  // Whether the rest is open in place
  const [open, setOpen] = useState(false);
  // The rows shown at once, and the rest
  const { shown, more: rest } = splitRows(ways, focus);
  // The rest opens in place when no page holds it
  const inPlace = !more && rest.length > 0;
  // The rows drawn now
  const rows = inPlace && open ? ways : shown;
  // The heading (with "See all"), then the rows between rules
  return (
    <section aria-labelledby={id} className="mt-8">
      {/* Heading, and the way to everything */}
      <div className="flex items-baseline justify-between gap-4">
        {/* Run-in heading */}
        <h2 id={id} className={SECTION_HEADING}>{title}{focus && <span className="ml-2 rounded-full bg-warm-tint px-2 py-0.5 align-middle text-footnote font-normal normal-case tracking-normal text-warm-ink">Your focus</span>}</h2>
        {/* Everything in this group, on its own page */}
        {more && <Link href={more.href} className={`${TEXT_LINK} text-footnote`}>{more.label}</Link>}
        {/* Or the rest, opened here */}
        {inPlace && <button type="button" aria-expanded={open} aria-controls={`${id}-rows`} onClick={() => setOpen(!open)} className={`${TEXT_LINK} text-footnote`}>{open ? "Show fewer" : "See all"}</button>}
      </div>
      {/* The rows */}
      <ul id={`${id}-rows`} className={`mt-2 ${CARD_LIST}`}>
        {/* Each kind of practice */}
        {rows.map((way) => <li key={way.name}><WayRow way={way} /></li>)}
      </ul>
    </section>
  );
}

// The page
export function PracticeScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);

  // How often each lesson and drill was practised, once read (empty until then, so the rows first lead to the lists)
  const [counts, setCounts] = useState<ReadonlyMap<string, number> | null>(null);
  // The Connect unit to suggest next (the first unit until the sessions are read; decision 95)
  const [unit, setUnit] = useState<UnitProgress>(() => nextUnit([]));
  // What the user wants to get better at most, once read (none until then, so the page starts in its usual order; decision 97)
  const [focus, setFocus] = useState<FocusAreaId[]>([]);
  // Whether the rest of the ways to practise are open (decision 125)
  const [more, setMore] = useState(false);

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
    }, () => undefined);
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

  // Count the lessons, readings and drills practised
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
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo]);

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

  // The five that do the most work, always shown (decision 125)
  const core: Way[] = [
    // A surprise question
    { name: "Rapid Fire", detail: "A surprise question, 1 to 2 minutes", href: topic ? `/session?mode=talk&prompt=${topic.id}` : null, icon: LightningIcon },
    // A prepared speech
    { name: "Prepared speech", detail: "Plan for 2 minutes, speak for 2 to 4", href: prompt ? `/session?mode=response&prompt=${prompt.id}` : null, icon: NotePencilIcon },
    // Today's story, with the user's own stories a tap further
    { name: "Tell a story", detail: story ? `Today: ${story.title}` : "A true story, 1 to 3 min", href: story ? `/stories/tell?prompt=${story.id}` : "/stories", icon: ScrollIcon },
    // A whole conversation, out loud
    { name: "Talk with someone", detail: "Four people, 3 minutes, out loud", href: "/conversations", icon: UsersThreeIcon },
    // Reading aloud
    { name: "Read aloud", detail: "Famous speeches and passages", href: "/skills", icon: BookOpenTextIcon },
  ];

  // The picked areas' groups, to mark them
  const focusGroups = focusAreas(focus).map((area) => area.practiceGroup);
  // Each group, by its id, so the focus can put its groups first
  const groups: Record<PracticeGroupId, ReactNode> = {
    // The "on-the-spot" group
    "on-the-spot": (
      <>
          {/* Speaking on the spot */}
          <Group
            focus={focusGroups.includes("on-the-spot")}
            id="on-the-spot"
            title="Speak on the spot"
            ways={[
              // With "a talk coming up" as a focus: your own talk, rehearsed (the talk pages hidden from the menu by decision 49 come back for this focus only; decision 97)
              ...(focus.includes("talk") ? [{ name: "Your talk", detail: "Rehearse a talk you’re giving", href: "/rehearse", icon: PresentationIcon }] : []),
              // With speaking at work or a talk as a focus, the short speech comes first: an update, a pitch, a plan (decision 97)
              ...(focus.includes("work") || focus.includes("talk") ? [{ name: "Short speech", detail: "Your topic and a few points, then speak", href: "/practice/outline", icon: ListNumbersIcon }] : []),
              // Rapid Fire (once called Table Topic; decision 85)
              { name: "Rapid Fire", detail: "A surprise question, 1 to 2 minutes", href: topic ? `/session?mode=talk&prompt=${topic.id}` : null, icon: LightningIcon },
              // A prepared speech
              { name: "Prepared speech", detail: "Plan for 2 minutes, speak for 2 to 4", href: prompt ? `/session?mode=response&prompt=${prompt.id}` : null, icon: NotePencilIcon },
              // Reading aloud, moved here from Build a skill (decision 93); the page holds the readings only now (decision 107)
              { name: "Read aloud", detail: "Famous speeches and passages", href: "/skills", icon: BookOpenTextIcon },
              // Free talk: anything, as long as you like (decision 73), under "See all" (decision 108)
              { name: "Free talk", detail: "Talk about anything, as long as you like", href: "/session?mode=free&prompt=free", icon: MicrophoneStageIcon },
              // A short speech the user plans: topic and points (decision 73), here unless the focus put it first; under "See all" (decision 108)
              ...(focus.includes("work") || focus.includes("talk") ? [] : [{ name: "Short speech", detail: "Your topic and a few points, then speak", href: "/practice/outline", icon: ListNumbersIcon }]),
            ]}
          />
      </>
    ),
    // The "stories" group
    "stories": (
      <>
          {/* Telling stories, and telling them again (decision 92) */}
          <Group
            focus={focusGroups.includes("stories")}
            id="stories"
            title="Tell stories"
            more={{ href: "/stories", label: "See all" }}
            ways={[
              // Today's story prompt
              { name: "Today’s story", detail: story ? story.title : "A true story, 1 to 3 min", href: story ? `/stories/tell?prompt=${story.id}` : "/stories", icon: ScrollIcon },
              // The user's own stories, told again
              { name: "Tell one again", detail: "Your stories, a little better each time", href: "/stories#your-stories", icon: ArrowCounterClockwiseIcon },
              // A guided story: the facts are given (decision 93)
              { name: "Guided stories", detail: "You get the facts, you make it a story", href: "/stories#guided-stories", icon: SignpostIcon },
              // A moment note, told properly
              { name: "From your moments", detail: "A one-moment note, told properly", href: "/stories#from-moments", icon: SunHorizonIcon },
            ]}
          />
      </>
    ),
    // The "conversation" group
    "conversation": (
      <>
          {/* Everyday conversation: a whole conversation, the next of the seven units (the rest under "See all"), and the moment note (decision 95) */}
          <Group
            focus={focusGroups.includes("conversation")}
            id="conversation"
            title="Everyday conversation"
            more={{ href: "/small-talk", label: "See all" }}
            ways={[
              // A whole conversation with one of four people (decision 83)
              { name: "Talk with someone", detail: "Four people, 3 minutes, out loud", href: "/conversations", icon: UsersThreeIcon },
              // The next unit, straight to its page, with its next lesson or what you do in it
              { name: unit.unit.name, detail: unit.nextLesson ? `Next: lesson ${unit.nextLesson.number}, ${unit.nextLesson.title}` : unit.unit.youDo, href: `/small-talk/unit?id=${unit.unit.id}`, icon: UNIT_ICONS[unit.unit.id] },
              // One moment a day
              { name: "One moment a day", detail: "A private note of something worth telling", href: `/session?mode=moment&prompt=${MOMENT_PROMPT.id}`, icon: SunHorizonIcon },
            ]}
          />
      </>
    ),
    // The "voice" group
    "voice": (
      <>
          {/* How you sound: warm-ups and voice drills, straight into the next of each (decision 80) */}
          <Group
            focus={focusGroups.includes("voice")}
            id="voice"
            title="Your voice"
            more={{ href: "/voice", label: "See all" }}
            ways={[
              // A warm-up, nothing recorded
              { name: "Warm-up", detail: "Three moves, one minute, nothing recorded", href: "/voice/warmup", icon: WindIcon },
              // Then the modes, the one done least first, so the rows shown are what is next (decision 108)
              ...voiceRowsByNeed(counts ?? new Map()).map((row) => voiceWays[row]),
            ]}
          />
      </>
    ),
  };

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="practice" />
      {/* The page's name, and how it relates to Today */}
      <PageTitle title="Practice">Pick one and speak. Your steps for the day are on Today.</PageTitle>

      {/* The five that do the most work (decision 125) */}
      <ul aria-label="Main ways to practise" className={`mt-6 ${CARD_LIST}`}>
        {/* Each one */}
        {core.map((way) => <li key={way.name}><WayRow way={way} /></li>)}
      </ul>

      {/* Everything else, one tap away */}
      <button type="button" aria-expanded={more} aria-controls="more-practice" onClick={() => setMore(!more)} className={`mt-4 ${TEXT_LINK}`}>{more ? "Fewer ways to practise" : "More ways to practise"}</button>

      {/* The groups, the focus's first (decision 97), once opened */}
      <div id="more-practice">{more && orderPracticeGroups(focus, USUAL_ORDER).map((id) => <Fragment key={id}>{groups[id]}</Fragment>)}</div>

      {/* This week's challenge off the page */}
      {today && <WeeklyChallenge repo={repo} today={today} />}
    </main>
  );
}
