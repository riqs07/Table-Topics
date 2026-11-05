# Handoff: the UI rewrite, second pass (for the next agent)

**Written:** 2026-11-05, at the end of the session that built most of the second pass.
**Branch:** `claude/peaceful-feynman-qbpg5i`. Work on it, commit to it, push to it. Do not open a pull request unless the user asks.
**Your job:** finish the second pass, so that **every screen and every state of every feature the app has** looks like it belongs to the four references below. Then check it the way section 5 says, and push.

Read first, as `CLAUDE.md` says: `AGENTS.md` (this Next.js differs from older training data), `documents/ai-development-playbook.md` (sections 3 and 4 apply to every change), `documents/standards/coding-standards.md`, `documents/design/art-style.md`, then `documents/design/design-system.md` ("The UI rewrite" section).

## 1. The references: these four, and only these

| Artifact | What it is for | Link |
|---|---|---|
| **VoiceLab Desktop Screens** | Computer layouts (1440 wide). A Design canvas of 18 artboards: Today, Recording, the result after a take, Practice, Courses, a course's path, Me; the shared parts (side rail, the cast, a course tile); and "in use": Talk with someone live and how it went, Scenes, Boss call, Telling a story, Reading aloud, a pitch drill, Active listening | https://claude.ai/artifact/N9sh7W164mQb3K1PrpgEWg |
| **VoiceLab Storyboard** | Phone layouts and the flow between screens: thirty phones in six chapters (first minutes, a day of practice, Practice, Courses and Learn, a boss, your progress) | https://claude.ai/artifact/XPkHHQiUNUV7wyj1CAFX5Q (a copy is in the repo: `documents/design/redesign/storyboard.html`) |
| **VoiceLab Chart Kit** | Every chart: five marks (your voice as a ribbon, a gap for a real pause, a dot for a pause word, pitch as one soft line, last time as a dashed ghost), a headline the chart proves, no red | https://claude.ai/artifact/DnCKx6Vv9ft136ayQPbUcg (copy: `documents/design/redesign/chart-kit.html`) |
| **VoiceLab Illustration Study** | The art direction: a scene not an icon, depth in layers, soft light, grain, the lit blob; course headers as full scenes | https://claude.ai/artifact/E8UJ2Do1juVhXeQn48BShN (copy: `documents/design/redesign/art-studies/art.html`) |

**Retired, do not use:** "VoiceLab Current App, Remade", "VoiceLab Playful Screens" and the first prototypes. The first pass leaned on "Current App, Remade", which is why it came out as the old screens restyled one to one.

**How to see them.** Read each with the Artifact tool (`action: "read"`). The Storyboard, Chart Kit and Illustration Study are single HTML pages: open the repo copies in Playwright and screenshot them (each phone is a `.pcol` element). Desktop Screens is a Design canvas: list its files (`action: "list"`, `scope: "files"`), read every `project/*.dc.html` plus `artifact-type/dc-runtime.js`, copy `dc-runtime.js` to `project/support.js`, serve the `project/` folder over HTTP (`python3 -m http.server 8811 --directory …/project`; it does not work from `file://`, because the shared parts load by fetch), and screenshot each artboard with Playwright at its size from `project/canvas.json` (most are 1440 × 900 to 1150). The `.dc.html` source has the exact copy, sizes and spacing. Its colour variables map to theme roles: `--p-bg` paper-raised, `--p-card` card, `--p-line` rule, `--p-ink` ink, `--p-muted` ink-muted, `--p-accent` accent and fill, `--green-soft` accent-tint, `--green-ink` accent-tint-ink, `--rough-bg` warm-tint, `--rough-ink` warm-ink, `--soft` paper, `--sky` and the others art-sky and so on.

## 2. The rules

1. **The extrapolation rule (the user's words, 2026-11-05):** "If you come across a page I didn't give you a reference for, you're able to still take that and run with it." The references show one state of some screens, not every screen. Every screen and every state of every feature the app has gets the new design. When there is no picture of it (a mode before you press Start, a countdown, saving, an error, a list or hub page, a second try, a settings page), build it from the nearest reference: its skeleton, parts, hierarchy, characters, cards and buttons. Never leave the old layout in new colours.
2. **Only features that do not exist are skipped, and never invented.** Today that means the boss call (Wobbly, Bun, Squircle exist as drawings in `Cast.tsx`, but there is no boss feature) and the "take a breath" step before a timed take. "No reference" is never a reason to leave a screen alone; "no feature" is the only one.
3. **Real data only.** Where a reference shows a number the app has, use the real one. Where the app has no data for a part (a playback position it doesn't report), leave that part out and say so. Never show fake numbers, and never open on zeros for a new user (show a first step instead).
4. **Keep behaviour.** Routes, recording, turn-taking, AI calls, storage and accessibility stay as they are: real buttons and links, labels, one `h1`, 44 px targets. Change the screen's structure and look, not its logic.
5. **Theme roles only.** A test fails on raw colours, arbitrary Tailwind values (`border-[2.5px]`) or raw fonts in components. Add a role or token if you truly need one (`roles.ts`, every palette in `themes.ts`, the `@theme` block in `globals.css`).
6. **The design's hallmarks**, so you can tell new from old at a glance:
   - **Page:** warm cream, with white cards that have a 2 px edge and a solid ledge under them.
   - **Type and buttons:** Fredoka headings over Nunito text; chunky green uppercase buttons with a darker underside.
   - **Pictures:** tiles drawn as a tilted rounded square with the lit blob, one prop, soft light and grain.
   - **The cast** (`<Cast who=…>`): you are the apricot blob, Sage is the pine coach with a sprout, the friend is a teal egg with a curl.
   - **Focus mode while practising:** ✕, a thick progress bar and a green capitals step label (`PracticeBar.tsx`), two columns on a computer and one on a phone.
   - **Navigation:** the side rail on a computer, the tab bar on a phone.
   - **Charts:** from `src/components/charts/`.
   - **Old leftovers look like this:** plain text pages, flat tinted banners with no card ledge, the giant orange blob used as a button with words inside, small outline buttons as the main action, and old link lists.

## 3. What is done (on the branch)

- **Shared parts:**
  - `Cast.tsx`: you, Sage with seven moods, the friend, and the bosses as drawings.
  - The rail's week card, `RailWeek.tsx`.
  - Colour roles: `sage`, `friend` and their shades; `chart-voice`, `chart-um`, `chart-well`, `chart-ghost`, `chart-band`.
  - `PracticeBar.tsx`, the focus-mode bar with its layout classes, `SingingBlob` and `LevelBars`.
- **Daily loop:**
  - Today, on a computer and as a phone deck.
  - The welcome as two screens.
  - Recording mid-take, focus mode in two columns.
  - The Rapid Fire countdown ring.
  - The result after a take, with the verdict panel: green for a good take; warm amber with Sage's one note for a rough one; a slide-up sheet on a phone.
  - Day done.
  - Read aloud and Tell a story inside `RecordingScreen`.
  - Logic in `src/core/takeWords.ts`.
- **Finding things:**
  - Practice as four jobs (Speak on the spot, Tell stories, Conversations, Your voice) plus role play, with a new `/practice/ways?job=…` list page.
  - Courses.
  - A course's path with the chosen lesson's panel and Sage's "By the end you will".
  - Each course's illustrated header in its band.
  - Me (`MeTop.tsx`), and History as "Your takes".
- **Practising:**
  - Talk with someone live, with the friend, and how it went.
  - Scenes.
  - Active listening.
  - The voice drill.
  - The story set-up and guided story.
  - `PracticeBar` on Shadow, Warm-up, Outline, Mission, Phrase rows and Scenarios.
- **Charts:** the Chart Kit as components (`src/components/charts/`, geometry in `src/core/chartKit.ts`). Every existing chart is redrawn in it.
- **Art:** the lit rendering for every course tile and mode tile (`src/components/scenes/art/`). `CourseHeader` scenes exist for all 12 courses. `art-style.md` is updated.
- **Checks on the merged branch:** typecheck clean; lint clean; vitest 239 files and 2,767 tests passing.
  - Run lint with `npx eslint . --ignore-pattern '.claude/**'` if `.claude/worktrees/` exists locally; old agent worktrees there make a plain `pnpm lint` fail.
  - The build and the full browser suite were **not** run on the merged branch.

## 4. What is left (known so far; the grid in step 1 below will find more)

The user found the first two by using the app. Both are the same failure: the references showed the middle of a session, and the state you land on was left as the old layout.

1. **Rapid Fire before you start** (`/session?mode=talk&prompt=t001`, `RecordingScreen.tsx`). It still shows an "Aim for 1:00 to 2:00" note on the left, a lilac banner, "Your topic is hidden until you start." and the giant blob button "Show my topic". Rebuild it as the opening of the Recording layout: the ✕ and progress bar on top, the blob waiting where it will sing, the hidden topic and the 10-second think where the question will appear, and one chunky Start (storyboard 6, the countdown).
2. **Talk with someone before the call** (`/conversations/talk?id=maya`, `ConversationScreen.tsx`). It is a plain set-up page with a small card for Maya and a Start button. Rebuild it as the TalkCall layout before the first turn: Maya in the call, her introduction in the bubble, the goal on the right, and Start in the "Your turn" card.
3. **The ✕ while recording.** Desktop Screens keeps it top left; `PracticeBar` hides it while busy. Show it, with the same discard confirmation the app already has.
4. **Left out by the workers and not challenged:**
   - The hub and list pages (Scenes, Stories, Listening, Voice, Conversations lists, event prep).
   - The second-try result.
   - Read aloud's list of parts, `SpeechScreen`.
   - The story set-up's "One thing to try" chips (the app has no picker; decide whether one is in reach).
   - Settings beyond its rows.
   - Check-in screens.
   - Learn cards and sets.
   - Course parts, `CoursePartScreen`.
   - The mission.
   - Small-talk units and lessons.
   - Dev pages (low priority).
   - Audit each one against rule 1.
5. **Small wiring.**
   - The weekly check-in's "then and now" chart (`CheckInCompareScreen.tsx`, the `LastVsThisLoader` near line 293) should get `pauseWords`. The setting is not in scope at that point, so pass it down from where `pauseWordsShown(data.settings)` is worked out.
   - In one screenshot, the rough-take verdict panel looked faded. Check whether that was just the slide-in caught mid-move.
6. **The glide check** (`tests/e2e/glide.spec.ts`): the scene's layer reads `auto`. `documents/audit-2026-10-31.md` records this failing in the cloud container and passing in CI's browser. One worker saw it pass before a merge, so check it, don't assume it.
7. **The playbook.** The user found this gap, not the tests, so `CLAUDE.md` requires a row in the playbook's "Bugs that reached you" table, in the same change as the fix.
   - **What they saw:** Rapid Fire and Talk with someone looked very different from the references.
   - **The cause:** each worker matched only the state its reference showed.
   - **Why the checks missed it:** the screenshots and the side-by-side checks covered only the referenced state, not the one you land on.
   - **The rule:** add T16, below.
   - Also write rule 1 of this file into `design-system.md` under "The UI rewrite".

## 5. How to do it (what went wrong last time, and the process that fixes it)

**What went wrong:**
- The briefs mapped each reference to a screen ("Recording → Recording.png") but never stated rule 1.
- They also told workers to keep behaviour and leave out what had no data, which made "leave it alone" the safe default for anything unshown.
- Nobody listed the states.
- Checking looked only where the pictures were.
- Workers' "left out" lists were passed on instead of challenged.

**The process:**

1. **List the states before any code: the coverage grid.**
   - Take every route in `ROUTES` (`tests/e2e/support/fixtures.ts`, about 100), grouped by the screen component it renders.
   - For each group, list its states: as you land on it, before start, countdown or think, recording or live, saving, the result (good and rough), a second try, empty for a new user, failed to load.
   - For each cell write the reference, or "extrapolate from <reference>", or NOT-BUILT.
   - Screenshot each cell by loading the route directly and clicking through as a user would, at 1440 × 1000 and 390 × 844. Pass the welcome with `localStorage.setItem("voicelab-welcome-seen", "yes")`. Seed takes as `tests/e2e/support/seed.ts` does, or record with the fake microphone (Chromium flags `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`; see `playwright.config.ts`).
   - Mark each cell MATCHES, NEW-BUT-OFF, OLD or NOT-BUILT.
   - Commit the grid as `documents/design/redesign/coverage-grid.md`.
   - The user asked for this grid. They are happy for you to go straight on to building, but keep the grid current as you go.
2. **Build from the grid, worst and most seen first.**
   - Everything marked OLD or NEW-BUT-OFF.
   - If you split the work across parallel agents, put rule 1, rule 2 and the hallmarks into every brief.
   - Split by groups of rows in the grid, so every cell has one owner. Give each a dev-server port.
   - "Left out" may only ever mean "the feature doesn't exist".
   - Parallel worktree agents start from an old commit: have each one reset to the branch tip first. Merge their branches yourself.
3. **Acceptance is the screenshots.**
   - Every cell, re-shot after the change.
   - A reviewer agent that wrote none of the code compares each one with its reference (or with the nearest reference, for the extrapolated ones) and flags anything that still reads as the old app.
   - Fix, re-shoot and repeat until the grid has no OLD and no NEW-BUT-OFF cells.
   - The builder's own screenshots don't count as acceptance: they share the builder's blind spots.
4. **Definition of done** (playbook section 4):
   - `pnpm typecheck`, lint and `pnpm vitest run` all green, with the "Test Files" count read.
   - `pnpm build`.
   - One full `pnpm e2e` run before the final push. In the cloud container, Playwright may need `CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`, because @playwright/test expects a browser build that isn't installed.
   - The docs (`design-system.md`, `art-style.md`, this file) changed in the same commits as the code.
   - The playbook row.
   - Push to `claude/peaceful-feynman-qbpg5i`.
5. **The report to the user** says plainly what was verified and with what (a stand-in microphone, desktop Chromium) and what still needs them (a real voice, a phone, an ElevenLabs key). It links the grid and lists any remaining NOT-BUILT cells.

**A rule to add to the playbook (T16):** a redesign is checked against a grid of screens by states, not against the reference pictures. Every cell has a reference or the reference it extrapolates from, is screenshotted by loading the route directly and walking it as a user would, and is reviewed by someone who did not build it. Uncovered states are where the old app hides.
