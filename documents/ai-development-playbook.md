# AI-driven development playbook

Lessons from building VoiceLab with an AI coding agent, written so they carry over to future projects. Started 2026-10-14.

## How to use this file

- **For you:** read the "Bugs that reached you" table before starting a new project, and copy this file into the new repository. The checklists in sections 3 to 6 are meant to be used as-is.
- **For the AI agent:** read this file before starting work in a project that contains it. Follow sections 3 and 4 on every change.
- **Keeping it current:** whenever a bug reaches the user (they find it, not the tests), the agent adds a row to section 1 in the same change as the fix, and adds or sharpens a rule in sections 3 to 6 if the lesson is new. A bug is not fixed until this file says why the tests missed it.

## 1. Bugs that reached you, and why the tests missed them

Every one of these passed the full test suite and a browser check. The pattern is the same each time: **the tests checked what the agent expected, not what your machine actually had.**

| # | Date | What you saw | The real cause | Why the tests missed it | Rule it produced |
|---|------|--------------|----------------|-------------------------|------------------|
| B1 | 2026-10-14 | Recording stuck on "Saving…" forever | The save step had no error handling. Any failure left the screen waiting, and the error only went to the console | Every test used stand-ins that never fail, and only the success path was tested. Missing code has no test to fail | T1, T2 |
| B2 | 2026-10-14 | "The requested version (1) is less than the existing version (10)" | Another project on `localhost:3000` had already made a browser database called "voicelab" | Every test and browser run started with empty storage | T3, S1 |
| B3 | 2026-10-14 | "Hydration failed because the server rendered HTML didn't match the client" | The page asked "does this browser support speech?" while the server was drawing it. The server always said no | Component tests only drew pages in a browser-like setting. Browser checks always clicked through from the home page, so the server never drew that page | T4, T5 |
| B4 | 2026-10-14 | "The object store uses in-line keys and the key parameter was provided" | The fix for B2 reused the other project's database, whose collections were laid out differently | The test for the B2 fix built the "existing" database the way **our** app would, not the way the other project did. The fix treated the symptom (a version number), not the cause (sharing a name) | T3, T6, S1 |
| B5 | 2026-10-15 | No way to get back to the starting page from a prompt or session | Screens were designed and approved one at a time; only the home page linked to other sections, and the recording page linked nowhere | Each screen's tests checked its own content. Nothing checked the app as a whole: "from every screen, can you reach every section?" The approved wireframes had the same gap | T11 |
| B6 | 2026-10-15 | Coach feedback never appeared, though the API key worked | The server requires a passphrase of at least 16 characters; a shorter one made it refuse every request. The page said only "the server is missing a setting", and the instructions never mentioned the length | The check script tested the key but not the passphrase, so it passed while the app failed. Tests covered the rule on the server, but nothing covered how the user would find out | T13 |

### Caught before they reached you (what worked)

These were caught by the agent's own checks. Keep doing these.

- **Recording stopped itself on every redraw:** caught by running the real flow in a browser. Component tests had passed because they supplied their own clock instead of the default one (rule T7).
- **Speech recognition restarted forever after the microphone was blocked:** caught in the browser.
- **A server-only file (using `node:crypto`) was pulled into the browser bundle:** caught by the production build.
- **Theme previews showed the wrong colors:** caught by a test that checks nested themes.
- **A gray filler-word color was slightly too faint (contrast 4.49 instead of 4.5):** caught by the automatic contrast test.
- **Buttons overflowing on a phone, or not fitting:** caught by screenshots at phone width (rule T8).
- **Rounding: 3.05 shown as "3.0":** caught by a test written before the code.
- **Every browser check failed at once (2026-10-15):** an app server left running from a screenshot was still serving the previous build, and the suite reused it. The suite now always starts its own server.
- **An automatic timer re-entering a retry path (2026-10-20, our own review):** a conversation turn that started after the time limit ended itself at once with nothing caught, and the "say that again" path started another, forever, each loop a paid call. Component tests had only ever pressed Done by hand. The lesson: when a timer can call the same function a person does, test what happens when it fires at zero, and make sure any retry path has an end.
- **Two copies of one limit drifting apart (2026-10-20, our own review):** the app could record 30 minutes and take any length of note, while the server refused over 15 minutes or 500 characters, so those sessions were never reviewed. Each side's tests passed on its own. The lesson: keep a limit in one place both sides read, and test the app's longest case against the real server check.
- **A stale copy written back (2026-10-20, our own review):** Settings kept the settings it loaded first and wrote them back on any switch after an import or a delete; re-importing a backup replaced newer records and unlinked recordings. The lesson: after anything that changes stored data behind a screen, reload it, and test import against a device that already has newer data.
- **A budget test that lists its pages by hand (2026-10-21, our own review):** the first-screen word budget named a few small-talk drill pages but no lesson pages, so 21 of the 33 lessons had crept to 101 to 121 words unseen. The lesson: when a check covers "every page of a kind", build its list from the content (here `SMALL_TALK_LESSONS`), not by hand.
- **A failing test pushed anyway (2026-10-15):** the agent's commit command piped the test output through `grep` to shorten it. The pipe reported success, so the commit and push went ahead with one test failing. It was fixed in the next commit, before CI finished. The lesson: gate commits on the check's own exit code (`set -o pipefail`, or `pnpm check` on its own), never on filtered output.

## 2. The one big lesson

Tests written by the same agent that writes the code share its blind spots. A passing suite proves the code does what the agent imagined. It does not prove the code survives your browser, your data, your other projects, or your real voice. So:

1. **Test the unhappy paths and the leftover state on purpose** (section 3), because nothing else will.
2. **Say plainly what was and wasn't verified.** "Checked with a stand-in microphone" is different from "works with your voice". The agent reports which one it did.
3. **When you hit a bug, paste the exact error text.** B2 and B4 were found within minutes once the exact message arrived; B1 took guesswork because there was no message.

## 3. Testing rules

| Rule | What to do |
|------|------------|
| **T1. Every user action that can fail has a visible failure state, and a test for it** | Anything async the user starts (save, upload, send, load) needs a try/catch that shows a message and a way to try again. Write the "it fails" test alongside the "it works" test. A screen must never be able to sit on a loading state forever |
| **T2. Stand-ins must be able to fail** | Every fake (fake microphone, fake database, fake network) gets at least one test where it throws, and one where it never answers (use a timeout) |
| **T3. Never assume storage starts empty** | Test against storage that already holds old data, data from an older version of the app, and data from a **different** app with different shapes. Build those fixtures from what the other app really does, not from what ours does |
| **T4. Test that the server and browser draw the same first page** | For server-rendered pages: render to HTML as the server would, then let the browser take over, and fail on any mismatch. Never decide what to draw from browser-only facts (window, speech support, storage, the date) during the first render |
| **T5. Browser checks open every page directly, not just by clicking through** | A page reached by a link and the same page loaded fresh behave differently. Load each route by its address at least once, and fail the check on any console error |
| **T6. Reproduce the user's exact error before fixing it** | Write a test that produces the same message the user saw. If the test can't produce it, the cause isn't understood yet. After the fix, ask: "did I fix the cause, or the first symptom?" |
| **T7. Test the defaults, not only the injected fakes** | If a component takes a clock, service or store as an optional setting, have at least one test that leaves it out and uses the real default |
| **T8. Check layouts at phone width with screenshots** | Look at every new screen at 375 px wide, and check that nothing scrolls sideways |
| **T9. For a bug fix, reproduce the bug in a failing test first** | Reproducing the user's exact error is what pinned down B2 and B4 (see T6). For new features, writing tests alongside the code is enough; committing every failing test as its own commit was ceremony that added time without catching anything extra (revised 2026-10-15, see section 8) |
| **T12. Test logic thoroughly, screens broadly** | Pure logic (counting, timing, measuring, data) gets thorough unit tests: they are cheap, fast, and caught the most. Each screen gets a few tests for its main path and its failure path, not one per detail. Journeys between screens and real-browser conditions belong to the browser suite (T5, T10, T11) |
| **T13. Health checks test everything the real path uses, and errors name the exact cause** | A "does it work" script must run the same settings checks as the app, not a subset. When a setting is wrong, the screen shows which one and what is wrong with it (never its value). Any rule the user must follow (like a minimum length) is in the setup instructions and checked where they type it |
| **T10. Browser checks belong in the repository and in CI** | In this project the browser checks lived in throwaway scripts, so they only ran when the agent remembered. Keep end-to-end checks with the code and run them on every push |
| **T11. Test the journeys between screens, not just each screen** | One test runs over every screen and checks the shared parts: the main navigation leads to every section, and the current one is marked. A browser check loads each page directly and clicks every navigation link. When a new screen is added, it joins that list |

## 4. Definition of done for an AI change

Before saying "done", the agent confirms each of these and reports any that were skipped:

- [ ] New logic has tests; a bug fix has a test that reproduced the bug before the fix (T9).
- [ ] The failure path is tested (T1, T2), not just the success path.
- [ ] Lint, typecheck, unit tests and the production build all pass. Read the "Test Files" count too, not just "Tests": a file that fails to load drops its tests from the total silently (this happened on 2026-10-15 and was caught only because the total shrank).
- [ ] The change was run in a real browser, each touched page was loaded directly, and the console was clean (T5).
- [ ] New or changed screens were looked at in screenshots at phone and desktop width (T8).
- [ ] The report says exactly what was verified and with what (for example "stand-in microphone, desktop Chromium"), and what still needs the user (a real voice, a phone, an API key).
- [ ] Docs changed in the same commit as the code.
- [ ] If this fixes a bug the user found, section 1 of this file has a new row.

## 5. Setup checklist for a new project

Things that would have prevented B2 to B4 if done on day one:

- **S1. Give browser storage an app-specific name** (database names, localStorage keys, cache names), such as `appname-purpose`, never just the app name. Every project you run at `localhost:3000` shares the same browser storage.
- **S2. Use a different local port for each project**, or clear site data when switching projects, for the same reason. Service workers left over from one project can also serve stale files to another.
- **S3. Turn on a lint rule that flags promises nobody waits for** (for TypeScript, `@typescript-eslint/no-floating-promises`). B1 started as a `void save()` whose errors vanished.
- **S4. Set up the end-to-end browser suite and CI in the first week**, not later (T10).
- **S5. Write the "not chosen" and "revisit later" lists in a decisions file from the start**, so the reasons survive between sessions.
- **S6. Ask for comments that explain why, not one on every line.** A rule requiring a comment above every line made about 40% of this project's app code comments, many of them restating the code ("Show the time" above the line that shows the time). That cost more than the tests did.

## 6. Working with an AI agent on product decisions

- **Say where an idea comes from early.** The timed-talk mode was built twice before it came out that the idea came from Toastmasters Table Topics. Naming the source up front ("this is based on X") lets the agent research the real rules first.
- **For multi-part requests, ask the agent to confirm its understanding before building.** Doing this for the two modes caught gaps (what happens to the old modes, which recording becomes the baseline) before any code was written.
- **Unanswered questions get recorded defaults.** When you approve a plan without answering every question, the agent uses the defaults it proposed and writes them down where you can change them later.
- **Mark MVP compromises as temporary.** "Good enough for launch, revisit later" goes in the roadmap, so it doesn't harden into a permanent decision by accident.
- **Keys and secrets never go in the chat.** They go in `.env.local` and the hosting dashboard only.

## 6a. UX lessons that carry over (from the October 2026 research)

What a UX review near the MVP turned up, written as rules for the next app. Evidence and sources are in [research/ux-research-2026-10.md](research/ux-research-2026-10.md).

- **Walk the app as a brand-new user on a phone before calling it an MVP.** Screenshot every screen at phone size, as it first appears (not full-page captures, which hide what fixed bars cover). The agent found eleven problems in one pass that no test would catch.
- **Get to the first real use within a minute.** Onboarding questions should lead into the core action, not to a menu.
- **Explain a permission in your own words before the browser asks.** A declined browser prompt is hard to get back.
- **Never end a session on a number that reads as failure.** Lead with what happened (time spoken, words read), then one task-focused suggestion. More feedback is not always better.
- **Setup details are not user interface.** Passphrases, sync queues and server settings belong behind an "advanced" section, and the core loop must still give value when they are missing.
- **Five bottom tabs at most, always labelled.** Hide them while the user is doing the main task.
- **Show keyboard hints only on devices with a keyboard.**
- **Measure gently and let people opt out.** Speech-recognition counts are rough for accents and stammered speech; offer an off switch and kind wording.
- **Habits: small, daily, celebrated at once, and forgiving.** A broken streak drives people away; count days in a week instead.
- **Mark research as strong or anecdotal.** Reviews of competitor apps are anecdote; build on studies and platform guidelines first.

## 7. Open improvements in this project

Concrete steps that follow from the rules above, not yet done:

1. ~~**Move the browser checks into the repository as a Playwright suite and run it in CI** (T5, T10).~~ Done 2026-10-15: `tests/e2e` loads every page directly, checks phone width and the navigation from every page, runs Table Topic, a rehearsal and the leftover-database case end to end, and fails on any console error. A planted console error was used to confirm it really fails.
2. **Turn on typed linting with `no-floating-promises`** (S3).
3. **Do a real-voice test on desktop and a phone test** (checkpoints C3 and C5). Nothing so far has used a real microphone.
4. **Bring the coding standards in line with section 8**: test-first only for bug fixes, fewer and broader screen tests, and comments that explain why. Waiting on the user's go-ahead, since the standards are theirs.

## 8. Are AI-written tests worth it? (measured on VoiceLab, 2026-10-15)

The user asked whether the tests were worth their cost, given that they will never read them. The honest answer from this project: **yes, but not in the way you might expect, and not on their own.**

**What they cost.** About 5,300 lines of tests next to 7,400 lines of app code. Running them takes about 16 seconds, so they never slowed anything down. Writing them added roughly a quarter to a third of the time per feature, mostly in screen tests.

**What they bought.** Almost every feature after the first two modes changed the same shared screens and data code. The tests caught the breakage each time, before the user saw it:
- a name clash that silently stopped a whole test file from loading;
- a change to what is sent to the coach;
- a change to which recordings keep their audio;
- a rounding slip (3.05 shown as "3.0");
- a colour too faint to read;
- the recording stopping itself whenever the screen redrew.

They also made large changes safe: adding the skill path touched about fifteen files, and 500 checks confirmed nothing else broke.

**What they did not buy.** Every bug that reached the user (B1 to B5) passed every test. Unit and screen tests check what the agent imagined, with stand-ins. The user's bugs came from real conditions: leftover browser data, loading a page directly, moving between screens. Only running the real app catches those, which is why the browser suite (T10) matters more than adding more unit tests.

**The verdict, as rules:**
1. Keep thorough tests for logic: they are the cheapest insurance in the project (T12).
2. Keep screen tests few and broad: the main path and the failure path (T12).
3. Make the browser suite the priority for catching what users actually hit (T10, T11).
4. Reproduce a bug in a test before fixing it; skip the separate-commit ritual for features (T9).
5. The bigger source of bloat was a comment on every line, not the tests (S6).
6. The user never needs to read the tests. They exist so the agent can change code quickly without breaking what already works, and the agent reports what they did and did not cover.
