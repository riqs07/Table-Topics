"use client";
// Stories (decisions 92, 126 and 152): today's story with its suggested template, the user's own stories to tell again, the stories you'll need (each opening today's prompt of its kind), the four everyday templates (each starts today's story with it), then guided stories with the facts given (decision 93), moment notes to tell properly, and the bank of story prompts

// Load React's state and effect tools
import { useCallback, useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the page heading with the main navigation, and the page title
import { Masthead } from "@/components/script/Masthead";
import { PageTitle } from "@/components/script/PageTitle";
// Load the shared button and row looks
import { QUIET, RowLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the folded group card
import { FoldCard } from "@/components/script/FoldCard";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the story prompts and groups
import { NEEDED_TYPES, STORY_GROUPS, STORY_PROMPTS, STORY_TEMPLATES, findStoryTemplate, neededPromptForDay, momentTitle, storyPromptForDay, suggestedTemplate } from "@/content/stories";
// Load the guided stories (decision 93)
import { GUIDED_LEVELS, GUIDED_STORIES, guidedLevel } from "@/content/guidedStories";
// Load the moment note's prompt
import { MOMENT_PROMPT } from "@/content/smallTalk";
// Load the library rules
import { STORY_TITLE_MAX, storyLibrary, type LibraryStory } from "@/core/storyLibrary";
// Load the title saver
import { renameStory } from "@/data/stories";
// Load the day label
import { dayLabel } from "@/core/copy";
// Load the record and repository types
import type { SessionRecord } from "@/data/records";
import type { Repository } from "@/data/repository";
// Load the shared heading and card looks
import { CARD, CARD_LIST, SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

// How many moment notes to offer
const MOMENTS_SHOWN = 5;

// Where telling a prompt starts
export const tellHref = (promptId: string, template?: string) => `/stories/tell?prompt=${encodeURIComponent(promptId)}${template ? `&template=${template}` : ""}`;

// Where telling a moment note starts
export const tellMomentHref = (momentId: string) => `/stories/tell?moment=${encodeURIComponent(momentId)}`;

// Where telling a story again starts: the same seed, its last telling as the one to compare with (its shape, focus and length are read from it)
export const retellHref = (story: LibraryStory) => `/session?mode=story&prompt=${encodeURIComponent(story.id)}&retryOf=${encodeURIComponent(story.latest.id)}`;

// What was loaded: the stories and the moment notes (null while loading)
interface Loaded {
  // The library
  stories: LibraryStory[];
  // Moment notes, newest first
  moments: SessionRecord[];
}

// One story in the library, with a way to rename it and tell it again
function StoryRow({ story, repo, now, onRenamed }: { story: LibraryStory; repo: Repository; now: Date; onRenamed: () => void }) {
  // Whether the title is being edited
  const [editing, setEditing] = useState(false);
  // The title as typed
  const [draft, setDraft] = useState(story.title);
  // Why saving failed, if it did
  const [error, setError] = useState("");

  // Save the new title
  async function save() {
    // Saving can fail (the browser database can refuse a write)
    try {
      // Saved
      await renameStory(repo, story.id, draft, now);
      // Done editing
      setEditing(false);
      // No problem
      setError("");
      // Reload the list
      onRenamed();
    } catch (problem) {
      // Say why, and keep the field open to try again
      setError(`The title could not be saved. The browser said: “${problem instanceof Error ? problem.message : String(problem)}”`);
    }
  }

  // The row
  return (
    <li data-story={story.id} className="py-3">
      {/* The title, or the field to change it */}
      {editing ? (
        <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="flex flex-wrap items-center gap-2">
          {/* The field */}
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={STORY_TITLE_MAX} aria-label="Story title" className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-rule bg-card px-3" />
          {/* Save */}
          <button type="submit" className={SECONDARY}>Save</button>
          {/* Cancel */}
          <button type="button" onClick={() => { setEditing(false); setDraft(story.title); setError(""); }} className={QUIET}>Cancel</button>
        </form>
      ) : (
        <p className="flex flex-wrap items-baseline justify-between gap-x-3">
          {/* The title */}
          <span className="min-w-0 font-display text-cue font-semibold leading-tight">{story.title}</span>
          {/* Rename */}
          <button type="button" onClick={() => setEditing(true)} aria-label={`Rename “${story.title}”`} className={`${TEXT_LINK} text-footnote text-ink-muted`}>Rename</button>
        </p>
      )}
      {/* Why saving failed */}
      {error && <p role="alert" className="mt-1 text-footnote">{error}</p>}
      {/* How often, and when last */}
      <p className="mt-1 text-footnote text-ink-muted">{story.latest.story?.template ? `${findStoryTemplate(story.latest.story.template).name} · ` : ""}Told {story.tellings === 1 ? "once" : story.tellings === 2 ? "twice" : `${story.tellings} times`} · last {dayLabel(new Date(story.lastToldAt), now).toLowerCase()}</p>
      {/* The takeaway for next time */}
      <p className="mt-1 text-lede"><span className="text-footnote text-ink-muted">Next time: </span>{story.takeaway}</p>
      {/* Tell it again, and see the last telling */}
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* Tell it again */}
        <Link href={retellHref(story)} aria-label={`Tell “${story.title}” again`} className={SECONDARY}>Tell it again</Link>
        {/* The last telling */}
        <Link href={`/sessions?id=${encodeURIComponent(story.latest.id)}`} className={`${TEXT_LINK} text-footnote`}>Last telling</Link>
      </p>
    </li>
  );
}

// The page
export function StoriesScreen(props: ScreenProps) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // What was loaded
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // Why loading failed, if it did
  const [loadError, setLoadError] = useState<string | null>(null);
  // Bumped to load again
  const [version, setVersion] = useState(0);

  // Load the stories and moment notes
  useEffect(() => {
    // Ignore a late answer once the page closes
    let cancelled = false;
    // Read both
    Promise.all([repo.listSessions(), repo.listStories()]).then(([sessions, stories]) => {
      // Stop if closed
      if (cancelled) return;
      // The library and the moments
      setLoaded({ stories: storyLibrary(sessions, stories), moments: sessions.filter((session) => session.mode === "moment" && session.transcript.trim() !== "") });
      // No problem
      setLoadError(null);
    }).catch((error: unknown) => {
      // Say why, if still open
      if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, version]);

  // Load again
  const reload = useCallback(() => setVersion((count) => count + 1), []);

  // Today's story prompt
  const todays = today ? storyPromptForDay(today) : null;

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation */}
      <Masthead title="VoiceLab" section="practice" />
      {/* The page's name and what it is for */}
      <PageTitle title="Stories">Tell a true story, then tell it again, a little better each time.</PageTitle>

      {/* Today's story, with the template suggested for it (decision 126) */}
      {todays && (
        <section aria-labelledby="today-story" className={`mt-8 p-5 ${CARD}`}>
          {/* Heading */}
          <h2 id="today-story" className="text-footnote font-semibold uppercase tracking-wide text-ink-muted">Today’s story</h2>
          {/* The prompt */}
          <p className="mt-2 font-display text-cue font-semibold leading-tight">{todays.text}</p>
          {/* The suggested template */}
          <p className="mt-2 text-footnote text-ink-muted">Suggested template: {findStoryTemplate(suggestedTemplate(todays.id)).name}</p>
          {/* Tell it */}
          <Link href={tellHref(todays.id)} className={`mt-4 ${SECONDARY}`}>Tell it</Link>
        </section>
      )}

      {/* Why loading failed */}
      {loadError !== null && <p role="alert" className="mt-8 max-w-[48ch] text-lede">Your stories could not be loaded. The browser said: “{loadError}” <button type="button" onClick={reload} className={TEXT_LINK}>Try again</button></p>}

      {/* Your stories */}
      <section aria-labelledby="your-stories" className="mt-10">
        {/* Heading */}
        <h2 id="your-stories" className={SECTION_HEADING}>Your stories</h2>
        {/* The list, or what will be here */}
        {loaded && loaded.stories.length > 0 && today ? (
          <ul aria-label="Your stories" className={`mt-2 ${CARD_LIST}`}>
            {/* Each story */}
            {loaded.stories.map((story) => <StoryRow key={`${story.id}-${story.title}`} story={story} repo={repo} now={today} onRenamed={reload} />)}
          </ul>
        ) : (
          loaded && <p className="mt-2 max-w-[48ch] text-ink-muted">Stories you tell land here, ready to tell again.</p>
        )}
      </section>

      {/* The stories you'll need (decision 152): each opens today's prompt of its kind, told with its template */}
      <section aria-labelledby="needed" id="stories-youll-need" className="mt-10 scroll-mt-6">
        {/* Heading */}
        <h2 id="needed" className={SECTION_HEADING}>Stories you’ll need</h2>
        {/* What they are */}
        <p className="mt-1 max-w-[48ch] text-ink-muted">The few stories people tell again and again, and dread. Get them ready.</p>
        {/* Each kind */}
        <ul aria-label="Stories you’ll need" className={`mt-2 ${CARD_LIST}`}>
          {NEEDED_TYPES.map((type) => (
            // One kind, opening today's prompt of it
            <li key={type.template}>
              <RowLink href={today ? tellHref(neededPromptForDay(type.group, today).id) : "/stories"} label={`${type.name}: ${type.detail}`}>
                {/* Its name */}
                <span className="block font-semibold">{type.name}</span>
                {/* What it is for */}
                <span className="block text-footnote text-ink-muted">{type.detail}</span>
                {/* Its beats */}
                <span className="block text-footnote text-accent">{findStoryTemplate(type.template).beats.map((beat) => beat.name).join(" → ")}</span>
              </RowLink>
            </li>
          ))}
        </ul>
      </section>

      {/* The templates: each starts today's story told with it (decision 126); the everyday ones only, since the stories you'll need come with their own prompts */}
      <section aria-labelledby="templates" className="mt-10">
        {/* Heading */}
        <h2 id="templates" className={SECTION_HEADING}>Templates</h2>
        {/* What they are */}
        <p className="mt-1 max-w-[48ch] text-ink-muted">A few beats to tell a story in. Pick one for today’s story.</p>
        {/* Each template */}
        <ul aria-label="Templates" className={`mt-2 ${CARD_LIST}`}>
          {STORY_TEMPLATES.filter((template) => template.family === "everyday").map((template) => (
            // One template, starting today's story with it
            <li key={template.id}>
              <RowLink href={todays ? tellHref(todays.id, template.id) : "/stories"} label={`${template.name}: ${template.forWhat}`}>
                {/* Its name */}
                <span className="block font-semibold">{template.name}</span>
                {/* What it is for */}
                <span className="block text-footnote text-ink-muted">{template.forWhat}</span>
                {/* Its beats */}
                <span className="block text-footnote text-accent">{template.beats.map((beat) => beat.name).join(" → ")}</span>
              </RowLink>
            </li>
          ))}
        </ul>
      </section>

      {/* Guided stories: the facts are given, the user makes them a story (decision 93) */}
      <section aria-labelledby="guided" id="guided-stories" className="mt-10 scroll-mt-6">
        {/* Heading */}
        <h2 id="guided" className={SECTION_HEADING}>Guided stories</h2>
        {/* What they are, honestly */}
        <p className="mt-1 max-w-[48ch] text-ink-muted">You get the facts. You make it a story.</p>
        {/* One fold per level */}
        <div className="mt-2 flex flex-col gap-2">
          {GUIDED_LEVELS.map((level) => {
            // The level's stories
            const stories = GUIDED_STORIES.filter((story) => guidedLevel(story) === level.id);
            // One fold
            return (
              <FoldCard key={level.id} id={`guided-${level.id}`} name={level.name} detail={level.blurb} count={stories.length}>
                {/* The stories */}
                <ul aria-label={level.name} className="divide-y divide-rule">
                  {/* Each story: its title, with its first fact under it */}
                  {stories.map((story) => <li key={story.id}><RowLink href={tellHref(story.id)} label={story.title}><span className="block font-semibold">{story.title}</span><span className="block text-footnote text-ink-muted">{story.facts[0]}</span></RowLink></li>)}
                </ul>
              </FoldCard>
            );
          })}
        </div>
      </section>

      {/* From your moments */}
      <section aria-labelledby="from-moments" className="mt-10">
        {/* Heading */}
        <h2 id="from-moments" className={SECTION_HEADING}>From your moments</h2>
        {/* The notes, each one to tell properly */}
        {loaded && loaded.moments.length > 0 && today ? (
          <ul aria-label="Your moments" className={`mt-2 ${CARD_LIST}`}>
            {/* Each note */}
            {loaded.moments.slice(0, MOMENTS_SHOWN).map((moment) => (
              // One note
              <li key={moment.id}>
                {/* The whole row starts telling it */}
                <RowLink href={tellMomentHref(moment.id)} label={`Tell it properly: ${momentTitle(moment.transcript)}`}>
                  {/* When */}
                  <span className="block text-footnote text-ink-muted">{dayLabel(new Date(moment.createdAt), today)}</span>
                  {/* What was said, two lines at most */}
                  <span className="line-clamp-2">{moment.transcript}</span>
                  {/* What the row does */}
                  <span className="block text-footnote font-semibold text-accent">Tell it properly</span>
                </RowLink>
              </li>
            ))}
          </ul>
        ) : (
          loaded && <p className="mt-2 max-w-[48ch] text-ink-muted">Your one-moment notes show here, ready to tell properly. <Link href={`/session?mode=moment&prompt=${MOMENT_PROMPT.id}`} className={TEXT_LINK}>Record today’s moment</Link></p>
        )}
      </section>

      {/* The prompt bank, folded by group */}
      <section aria-labelledby="prompts" className="mt-10">
        {/* Heading */}
        <h2 id="prompts" className={SECTION_HEADING}>Something to tell</h2>
        {/* One fold per group */}
        <div className="mt-2 flex flex-col gap-2">
          {STORY_GROUPS.map((group) => {
            // The group's prompts
            const prompts = STORY_PROMPTS.filter((prompt) => prompt.group === group.id);
            // One fold
            return (
              <FoldCard key={group.id} id={`group-${group.id}`} name={group.name} count={prompts.length}>
                {/* The prompts */}
                <ul className="divide-y divide-rule">
                  {/* Each prompt */}
                  {prompts.map((prompt) => <li key={prompt.id}><RowLink href={tellHref(prompt.id)}>{prompt.text}</RowLink></li>)}
                </ul>
              </FoldCard>
            );
          })}
        </div>
      </section>
    </main>
  );
}
