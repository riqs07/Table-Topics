---
id: 2026-11-04-ui-rewrite
title: The UI rewrite
dates: [2026-11-04, 2026-11-05]
branch: ui-rewrite
commits: [4a597af, ea0fd57, 2bd91dd]
outcome: partial
agent: Claude Code
sources_read:
  - "claude.ai artifact: VoiceLab Desktop Screens (canvas index; boards Today, Practice, Recording, side rail, course tile)"
  - "claude.ai artifact: VoiceLab Current App, Remade (canvas index; boards Today, Practice, side rail, course tile)"
  - "claude.ai artifact: VoiceLab Playful Screens (phone stills)"
  - "claude.ai artifact: VoiceLab Redesign Prototypes (three directions)"
  - documents/design/design-system.md
  - documents/design/art-style.md
  - documents/design/ux-improvements-plan.md
  - documents/roadmap.md (the redesign section)
  - documents/design/characters/sage.md (first part)
sources_skipped:
  - "VoiceLab Desktop Screens: 13 of 18 boards skimmed for headings only (Result, Courses, course path, Me, talk call and result, scene reply, boss call, story, read aloud, pitch drill, listening, cast)"
  - "VoiceLab Current App, Remade: 39 of 43 boards skimmed for headings or not viewed (including 20 screenshots of the current app)"
  - "claude.ai artifacts never opened: VoiceLab Storyboard, Stills Picker, Art Directions, Illustration Study, Header Lockups, Cast Lineup, Character Workshop, Venues and Cast, the scene artifacts, Reference Ranking"
blog: null
---

# The UI rewrite

## Goal

Rewrite the app's front end from the redesign stills: the desktop and phone mockups, the chosen design language (direction B, Playful) and the course tiles. The person's words: "I'm pretty confident that you can design, especially using the stills as inspiration … let it rip."

## What happened

1. **Context.** The agent read the sources above and wrote back its understanding: the look, the four sections, where each old screen goes, and five clashes between the mockups and the repo's rules (fonts, tiles versus scenes, Sage, Practice's layout, Me). The person said "let it rip" and named the branch.
2. **Theme and shared parts.** A `playful` theme (Fredoka over Nunito, cream, a chunky green), two new colour roles (`accent-tint`, `accent-tint-ink`), and restyled buttons, cards, labels and progress bars. Every screen took the new look at once.
3. **Shell.** A side rail on a computer and a tab bar on a phone: Today, Practice, Courses, Me. Learn moved inside Courses, Settings inside Me.
4. **Screens.** Today, Practice, Courses and Me rebuilt; `ModeTile` (a tile from a ground, a prop and a face) and `Buddy` (the blob or Sage on their own) added. 39 unit tests updated to the new markup. Commit 4a597af.
5. **Course path and checks.** The course page rebuilt as lesson cards on a dotted path. The first full browser run failed all 530 checks: the cloud browser did not match the pinned Playwright. With a local config pointing at the installed browser, 484 passed; after fixes for contrast, the glide animation and navigation, 528 of 530 (the two left fail in this cloud setup on master too). Commit ea0fd57.
6. **One fix.** The Settings button beside Me's heading removed on phones. Commit 2bd91dd.
7. **Showing it.** Three older versions rebuilt from git (18 October, 29 October, 4 November), screenshotted beside the rewrite, and every page crawled from Today for reachability.

In all: 3 commits, 75 files, 1,277 lines added and 535 removed. All 234 unit test files passed; 528 of 530 browser checks.

## Went well

- The design language came through intact, because the stills fixed every visual decision before any code was written.
- Writing back an understanding before coding surfaced five real clashes, each settled before it could cost a rebuild.
- Named colour roles and shared button and card styles let about ten files re-skin the whole app.
- The accessibility checks caught muted text failing contrast on the new tints and green text failing on the soft cream.
- Git history made true before/after pictures cheap: each stage is a real build.

## Went wrong

| What | Cause | Cost |
| --- | --- | --- |
| Screens drifted from their boards: Practice's four topics, the course path's round nodes, Me's "Then and now", Recording and Result | The agent read 4 of 18 desktop boards in full and let the shared styles carry the rest, with no side-by-side check | A second, screen-by-screen pass |
| Practice built as five modes, though the agent had recommended the four topics | It followed the existing code's structure instead of its own stated plan, without saying so | Contradicted the confirmed plan |
| The Storyboard and several design artifacts were never opened | The agent treated the two canvases and the stills as the whole brief | Unknown |
| The in-use screens were only restyled | Scope the agent set itself without stating it | Part of the second pass |
| The first full browser run was empty | The test setup was not checked before an 18-minute run | About 18 minutes |
| Minutes lost to "hydration" errors | The dev server served stale code after edits made with shell commands | Time only |
| Some test edits silently did not apply | An edit script stopped at its first missing match and wrote nothing | One extra rebuild |
| The rail's "4 of the last 7 days" card is missing | It needs data the rail does not load | A visible gap |

## Calls made without asking

- Built straight on the branch instead of behind an on/off switch.
- Kept the old themes; Playful is the default.
- Darkened the green from #3fa66b to #287549 for contrast.
- Removed the settings gear: Settings is inside Me.
- Moved Learn inside Courses as Quick reads.
- Put Sage on Today and the welcome.
- Made mode tiles from parts instead of drawing one per mode.
- Hid the page title on computers, where the rail names the section.

## Rules

1. Before starting a redesign, list every source you were given and say which you will read in full and which you will skip. Let the person correct the list.
2. Treat each mockup board as a spec: build the screen, screenshot it beside its board, list the differences, fix them, then move on.
3. When you change your own confirmed plan, say so in the moment, with the reason.
4. State what is out of scope in the plan, before the work, not in a later answer.
5. Before a long browser run, launch one browser test to prove the setup works.
6. After editing files with shell commands, restart the dev server before trusting a hydration error.
7. Make edit scripts fail loudly: check every replacement applied before moving on.

## Open

- [ ] Fidelity pass: Practice (four topics and a Role play row), the course path (round nodes, the blob, a Start pop-up), Me ("Then and now" with Hear day 1 / Hear now, the takes list, settings rows), Recording, Result
- [ ] Rebuild the in-use screens to their boards: talk call and result, scene reply, boss call, story, read aloud, pitch drill, listening
- [ ] The rail's "4 of the last 7 days" card
- [ ] Read the Storyboard and the other skipped artifacts, and note what they change
- [ ] Decide whether Learn needs its own way in again, now it is one tap deeper
