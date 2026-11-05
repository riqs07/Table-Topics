# Handoff: the direction B redesign, the commercial, and how feedback should work

**For:** the next session on VoiceLab's redesign (the user, or an AI session picking it up).
**From:** the design session of 2026-11-04 and 05.
**Status:** exploration. Nothing in the app has changed yet. The commercial is built and committed; the redesign and the feedback model are still being decided.
**How to use it:** read "Decided" and "Still open" first. Every link and path you need is here; the scratch files from that session are gone.

## Where everything is

| What | Where |
|---|---|
| Desktop screens in direction B (Today, Recording, Result, Practice, Courses, a course path, Me), plus eight "in use" screens (a live talk, how it went, a scene, the boss call, telling a story, reading aloud, a pitch drill, active listening) | claude.ai canvas "VoiceLab Desktop Screens": https://claude.ai/artifact/N9sh7W164mQb3K1PrpgEWg |
| 20 screens of today's app (screenshots, desktop, sample data) next to their direction B remakes | claude.ai canvas "VoiceLab Current App, Remade": https://claude.ai/artifact/9srou7RFXfaq37dQv4f3G6 |
| The phone screens of direction B | "VoiceLab Redesign Prototypes" https://claude.ai/artifact/UPZcFNqUe3p8EPCTzdgmZ7, "VoiceLab Playful Screens" https://claude.ai/artifact/T7XWaQ9dM9osn9a3vaNt9m, "VoiceLab Storyboard" (30 screens) https://claude.ai/artifact/XPkHHQiUNUV7wyj1CAFX5Q |
| The cast | "VoiceLab Cast Lineup" https://claude.ai/artifact/7z2weQi2LiManhc2mH4Wnt, "Character Workshop" (the user's votes) https://claude.ai/artifact/5RTBM8839LmK9yQrjh6oDf |
| The user's ranking of other apps (what they love and avoid) | "VoiceLab Reference Ranking" https://claude.ai/artifact/WExYmeP621CjdegDh6Xdnr |
| Charts in the new look | "VoiceLab Chart Kit" https://claude.ai/artifact/DnCKx6Vv9ft136ayQPbUcg |
| The website commercial (48 s, 1920 by 1080) | Code in `video/src/commercial/` (decision 157, `video/README.md`); render it with the two commands there. The rendered file is not committed (`video/out/` is ignored) |

## Decided (by the user)

- **Direction B, "Playful"**: cream page `#fff7ef`, green action `#3fa66b` with chunky buttons, 2px-bordered cards (22px corners), Fredoka for headings and numbers, Nunito for text, six illustration colours (sky, sun, bloom, leaf, plum, coral). Adult wording, never childish (the user disliked Finch for looking "too child-like").
- **Never red; nothing locked; compare people only with themselves; never show zeros.**
- **Navigation:** four tabs: Today, Practice, Courses (which takes in Learn as "Quick reads") and Me (progress and settings together, like Headspace). On a computer the tabs become a side rail.
- **Cast:** you (the apricot blob), Sage (the pine coach with a sprout; green is Sage's alone), the friend (a teal egg with a curl: the other person in conversations). The user liked Bun, Pear, Squircle and Wobbly in the Workshop; no roles assigned yet.
- **The commercial:** Mira narrates, a warm music bed that stays in the background, "Join the waitlist" at the end, labelled "A first look at the new VoiceLab". The user loved it.
- **Feedback, the user's current lean:** on each take, **one "paid" chart** (the part the AI looks at) **plus a few free charts** (worked out on the device from the microphone and the words), chosen by the course or mode. Everything else behind "See more". Conciseness (word economy, longest stretch) only in the courses and modes that are about it. Don't flood people with irrelevant numbers.

## Still open (the user wants to think about these)

### 1. How much to ask the AI per take
The trade-off the user named: more calls, or bigger calls, could give better feedback; they cost more. They don't want to stop exploring what the API can do when given a lot and asked for a lot.

Rough costs per two-minute take, from the app's own price setting (`src/config/models.ts`: $2 per million input tokens, $10 per million output; thinking adds a little; check prices before relying on them):

| Approach | Rough cost |
|---|---|
| One call, one thing to look at (today) | ~$0.006 |
| One call, three things to look at | ~$0.01 (the transcript is read once) |
| A separate call per chart (10 essays, like the app the user showed) | ~$0.07 |

**Suggested way to decide:** a small experiment before any design commits to it. A script (like the existing `scripts/filler-bakeoff.ts` and `pnpm analysis-check`) that runs a handful of real takes through (a) today's single call and (b) a "rich" call given everything we have (the words with timings, the pauses, the pitch summary, the take's history) and asked for a lot back (moment-by-moment notes, a rewrite, what to try next time). It prints the cost and the answers side by side for the user to judge. If the rich call is clearly better, it can become an opt-in "deeper look" rather than the default.

### 2. Which chart each course and mode shows
A first proposal (not agreed): every course and mode names one spotlight chart (free) and one question for the coach (the one call).

| Course or mode | Spotlight chart (free) | Coach's one question |
|---|---|---|
| Stop freezing, Rapid Fire | Time to first word; pauses vs "um"s | The moment to pause instead of fill |
| Explain it simply, Interview ready, The tough question | Conciseness: longest stretch without a pause, repeats and hedges against your usual | A shorter way to say it: the wordiest stretch rewritten, "saved N words" |
| Ready by the day | Pace over time against your usual band; time against target | Where you rushed, and one fix |
| Stories that land, Tell it again | The story's shape | The beat to slow down |
| Beyond "good, you?", Listen like you mean it | Talk timeline: your share, questions asked | A better line for the flattest turn |
| A voice they lean in for, Know your voice | Pitch in your words; loudness | One phrase to try again |
| Toasts and tributes | Length against target; the ending | The ending, tightened |

Two smaller questions from the same talk: should the rewrite appear on every take or only when it is worth it (say, saving 8 or more words)? Should the spotlight follow the person's chosen focus, or what stood out most in this take?

### 3. Feedback visuals: what to borrow from the app the user showed
The user shared screenshots of another app's results (a dark, very long page of scores). Keep: the banded meter with a marker (where am I, in half a second), "shorter ways to say it" (your sentence struck through, the tighter one under it, "saved 27 words"), pace over time with a shaded band. Drop: scores out of 70, 100 or 200 on every measure; three different speeds with three different "ideal" scales that disagree (132 green on one, 158 "slow" on another); one ideal for everyone; "0 per minute" zeros; an AI essay per category. For VoiceLab the meter would be one scale centred on the person's usual (the app already has "your usual zone"), worded "a bit quick for you", never "Too fast", never red. A caveat: the browser's live transcript has no full stops, so "words per sentence" is a guess; "longest stretch without a pause" and "run-ons chained with and… so…" are measurable.

### 4. Smaller design questions
- Illustration style: the flat crescent shading the tiles use now (suggested) or the "soft glow" of the finished scenes (suggested for marketing only).
- Which Workshop character becomes which course's boss; the friend's name (Pip, Rio, Nell; the screens used Maya and Priya).
- White text on the green `#3fa66b` is only about 3:1; use the darker `#2c8050` for button fills.
- Small uppercase labels: direction B uses them; `design-system.md` bans them. Dropping the ban must be on purpose.
- A 9:16 cut of the commercial: gains the social apps and the phone-first framing; loses the desktop screens (too small in a phone frame). Suggested: rebuild the six app beats with the phone screens, cut to about 30 seconds.

## How to build the redesign (suggested, not started)
Screen by screen behind a switch, on the same logic, storage and content, as `documents/roadmap.md` ("Later: a UX redesign") already says:
0. Write the decisions above into `design-system.md` and `art-style.md` (the art-style rules on the cast, shading and motion size need changing for the new screens).
1. Move logic still inside screens (such as Today's data loading) into `core` and hooks; fix the bugs below first.
2. Build the shared pieces: a direction B theme in `src/theme/themes.ts` (the contrast tests will check it), Fredoka and Nunito served from the app, card, chunky button, label, rail and tab bar, the cast as app components (the video's `video/src/commercial/Cast.tsx` is a start).
3. A switch (a setting and a `?ui=new` link) and the screens in order: the shell and navigation; Today, recording and result; Practice and Courses; Me; the modes; the rest. Each screen its own change, with tests, phone and desktop screenshots compared with the canvases, and motion checked frame by frame (T15).
4. Switch the new UI on, keep the old one a short while, then delete it and redirect the old addresses.

## Found while walking today's app (fix before or during the redesign)
- **A bug:** the story set-up page lowercases every beat name, so "How I know them" shows as "(how i know them)" (`src/components/screens/TellStoryScreen.tsx`, about line 181, `.toLowerCase()`). A task card was offered for it.
- **To check:** "Your speaking profile" shows two different paces and pause-word rates for what reads as the same recent takes (114 vs 117 words a minute, 3 vs 4 pause words a minute). It may be two different windows of takes; if so the page needs to say which.
- **Too much at once:** Stories has six sections and three overlapping ways to pick a story ("Who I am" and "Who you are", "Toast" and "Toasts and thank-yous"); Today stacks the plan, extras, the focus question and a backup reminder; Settings is 4,159 px tall and opens with progress charts.
- **Empty screens on a computer:** scenes, active listening, the talk's start, Learn cards and course parts are one narrow column with most of the window blank.
- **Everyone is the same green blob:** Priya, Maya and other people look alike and read as Sage.
- **Start controls that look like decoration:** the mascot-shaped start buttons on Rapid Fire, the drills and Read aloud.
- **The wrong tab is marked:** the check-in page marks Today; the profile is called three different things on one page; the course page has a close cross but no navigation.
- **A development block on results:** "Every chart (trial)" and its "Not drawn for this take" list still show on a take's results.

## Rules for whoever picks this up
Read `CLAUDE.md`, `AGENTS.md`, the playbook and the coding standards first. The design canvases are the approved look; compare screenshots with them for shape, not just layout (T14). Ask the user before choosing the feedback model or the AI budget: those are theirs to decide.
