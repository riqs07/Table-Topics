# Warnings for the next project

**Purpose:** What went wrong building VoiceLab with an AI agent, written as warnings, each with the habit that prevents it. Copy this file into the new repository on day one.
**Drawn from:** VoiceLab's AI development playbook, risks, checkpoints, decisions, setup and content notes, and the git history of both versions of the app (January and October 2026).
**Last updated:** 2026-10-20

## How to use this file

- **For you:** read "The five that cost the most", then use the three checklists at the end as they are.
- **For the AI agent:** read this whole file before the first change. The checklists apply to every change. Put this line in the new project's `CLAUDE.md`: "Read documents/next-project-warnings.md before changing anything; its checklists apply to every change."
- **Keeping it current:** when a new mistake reaches you, add a warning here in the same change as the fix: what happened, and what would have caught it.

## The five that cost the most

1. **Passing tests are not proof it works.** All six bugs you found yourself passed every test and a browser check. The agent's tests share its blind spots (W7 to W13).
2. **The riskiest check never happened.** The plan called the real-phone test the biggest risk and marked it blocking. It was never recorded as done, and about 60 decisions were built on top of it (W15).
3. **Features came before real use.** The plan put a week of real use next. It was never done, and three new areas were built instead (W25).
4. **The documents stopped agreeing.** When the testing and comment rules changed, one document was updated and two kept the old rules (W27).
5. **The first version kept the key in the browser.** In January the OpenAI key was stored in plain text in browser storage and sent from the page, with nothing to limit what it spent (W5).

## Setup: do these on day one

**W1. Projects on the same computer share browser storage.** Every project served at `localhost:3000` shares one browser storage. VoiceLab's database, named "voicelab", collided with another project's database of the same name. The first fix opened the other project's database and broke in a new way (bugs B2 and B4).
- Name all storage after the app and its purpose (`appname-sessions`), never the app name alone.
- Give each project its own local port.

**W2. Errors that vanish.** A save started with `void save()` failed silently and left the screen on "Saving…" forever (B1).
- Turn on a lint rule that flags promises nobody waits for (`no-floating-promises` in TypeScript).

**W3. Browser checks that only run when someone remembers.** VoiceLab's first browser checks were throwaway scripts outside the repository.
- Put the end-to-end browser suite in the repository, and run it in CI, in the first week.

**W4. A command that hides a failure.** A failing test was pushed because the commit command piped the test output through `grep`, and the pipe reported success. Another time, a test file failed to load and its tests silently dropped out of the total. A third time, a server left running from earlier served an old build to the tests.
- Gate commits on the check's own exit code (`set -o pipefail`, or run the check on its own).
- Read the "Test Files" count as well as "Tests".
- Let the browser suite start its own server every time.

**W5. Secrets that reach the browser.** The January version stored the OpenAI key in plain text in browser storage and called OpenAI straight from the page. Any script on the page could read it, and no rate limit or spend cap stood in the way.
- Keys live only in server settings: a local `.env.local` that is never committed, and the hosting dashboard.
- Nothing secret gets a prefix that sends it to the browser (`NEXT_PUBLIC_` in Next.js).
- Every AI route gets a passphrase, rate limits counted in a shared store, and a spend limit set at the provider. If the counter is down, refuse requests rather than allow them.
- Keys never go in the chat. If one is pasted by mistake, replace it at once.

**W6. Versions that move under you.** AI models get retired, and a new major version of a tool may not work with the framework yet.
- Pin exact tool versions with a lockfile, and keep model names in one config file.

## Testing: what the agent's tests miss

**W7. Tests share the agent's blind spots.** A passing suite proves the code does what the agent imagined, with stand-ins. Every bug that reached you came from real conditions: leftover data, loading a page directly, moving between screens, a setting typed slightly wrong.
- Test the unhappy paths and leftover state on purpose (W8 to W13).
- Every report says what was checked and with what. "Stand-in microphone, desktop Chromium" is not "works with your voice".

**W8. Only the success path gets tested.** Stand-ins that never fail hide missing error handling, and missing code has no test to fail (B1).
- Anything the user starts that can fail (save, upload, send, load) shows a message and a way to try again. Write its "it fails" test alongside its "it works" test.
- Every stand-in gets one test where it throws and one where it never answers.

**W9. Storage assumed to start empty.** Every test started with empty storage. The test for the storage fix built the "other project's" database the way our app would have built it, so the test passed while the real one failed (B2, B4).
- Test against old data, data from an older version of the app, and data from a different app. Build those fixtures from what the other app really does.

**W10. Pages that draw differently on the server and in the browser.** A page decided what to show by asking "does this browser support speech?" while the server drew it, and the server always said no (B3).
- Never decide the first drawing from browser-only facts: the window, speech support, storage, today's date.
- Browser checks load every page by its address, not only by clicking through, and fail on any console error.

**W11. Screens tested one at a time.** Each screen's tests checked its own content. Nothing checked that every section could be reached from every screen, and the recording page linked nowhere (B5).
- One test walks the main navigation from every screen. A new screen joins that list.

**W12. Stand-ins that replace the real default.** Recording stopped itself on every redraw. The screen tests passed because they supplied their own clock instead of the default one.
- If a component takes a clock, service or store as an option, at least one test leaves it out.

**W13. Fixing the first symptom.** The fix for B2 changed a version number, but the cause was the shared name. That fix caused B4.
- Before fixing a bug, write a test that produces the exact error the user saw. Then ask: did I fix the cause, or the first symptom?
- When you report a bug, paste the exact error text. B2 and B4 were found within minutes once the message arrived.

**W14. Ceremony that costs more than it catches.** Committing each failing test on its own (97 commits) added time and caught nothing extra. A rule requiring a comment on every line made about 40% of the app code comments, and cost more than the tests did.
- Test logic thoroughly. Give each screen a few tests for its main path and its failure path. Let the browser suite cover journeys between screens.
- Comments explain why, not what.

## Real-world checks: what only you can do

**W15. A blocking checkpoint that gets skipped.** The agent has no microphone, no phone and limited network access. The plan said the real-phone test decides the architecture ("Nothing else is as risky") and marked it blocking. It was never recorded as done, and the next plan (pitch and volume drills) depends on phone microphones even more.
- A blocking checkpoint stops new features, not only "that line of work". The agent names it at the start of every session until it is answered.
- Book the real-device test for the first week, before the design work.

**W16. Privacy promises that are wrong.** An early VoiceLab document said audio never leaves the device. Browser speech recognition usually sends audio to Google (in Chrome) or Apple (in Safari).
- Before writing any privacy promise, check where each service you use sends the data.

**W17. Numbers that look precise but aren't.** Counting every "so" and "really" made a reading of the Gettysburg Address score 4.3 fillers a minute. Speech recognition is also less accurate for accents and stammered speech.
- Run every measurement on real samples, including known texts, before showing it.
- Show numbers with units and kind wording, and offer a way to turn them off.

**W18. Problems no test can see.** One walkthrough as a brand-new user at phone size found eleven problems: a welcome that led to a menu instead of a first recording, a microphone prompt with no explanation, a first day that asked too much, results that read as failure.
- Before calling anything an MVP, walk it as a new user at phone size, with one screenshot per screen as it first appears.

**W19. Health checks that test less than the app does.** The check script tested the API key but not the passphrase. The app refused every request because the passphrase was under 16 characters, and the screen said only "the server is missing a setting" (B6). Separately, some text editors turn quotes into curly quotes, which then become part of a setting's value.
- A health check runs the same checks as the real app.
- An error names which setting is wrong and how, never its value.
- Any rule the user must follow (like a minimum length) is in the setup instructions and checked where they type it.

## AI services

**W20. A reply cut off by its own thinking.** The coach model thinks before it answers, and a 4,000-token cap ended replies midway, leaving no feedback at all.
- Leave room for thinking in the token cap. The cap is a limit, not a cost: billing is for tokens used.
- Ask for structured output (a JSON schema) when the app needs a fixed shape back, and show a refusal plainly instead of retrying silently.

## Content and research

**W21. Text recalled by the AI is not a source.** The build environment blocked the speech archives, so the agent wrote speech readings out from memory. When 13 of them were checked against published texts, two needed corrections. The published copies had their own misreads ("urgent agents" for "insurgent agents").
- Every quoted text comes from a named published source, compared against a second copy where one exists.
- Anything written from memory is marked "unchecked" until it is checked.

**W22. Research that is really anecdote.** Reviews of competing apps are opinions, not evidence.
- Mark each finding as strong (a study or an official guideline) or anecdote, and build on the strong ones first.

**W23. An idea with a hidden origin.** The timed-talk mode was built twice before it came out that it was based on Toastmasters Table Topics.
- Say up front where an idea comes from ("this is based on X") so the agent can research the real rules first.

## Product and scope

**W24. Navigation that grows one section at a time.** Screens were approved one at a time, and each new area added a tab. The main navigation was then redesigned six times in two days, between three and six tabs (decisions 41 to 66).
- Sketch the whole app's map (every section, and how you reach it) before the screens.
- Before building a new area, decide where it sits on that map.

**W25. New areas before real use.** The public-speaking plan put "a week of the user practising with their real voice" next, before the smarter analysis. It was never done. Small talk, Learn cards, missions and a plan for seven voice modes came next.
- Write "use it for real" as a blocking checkpoint, and hold new areas until it passes.
- Mark MVP compromises as temporary in the roadmap, so they don't become permanent by accident.

**W26. Building before the request is understood.**
- For multi-part requests, the agent restates its understanding and asks its open questions before building. For VoiceLab's two modes this caught gaps (what happens to the old modes, which recording becomes the baseline) before any code.
- Unanswered questions get recorded defaults that you can change later.

## The documents themselves

**W27. Documents that disagree.** On 2026-10-15 the playbook dropped the "failing test as its own commit" rule and the "comment on every line" rule. The coding standards still require both, the documents index still checks for test-first code and a comment on every line, and the agent follows the playbook.
- State each rule in one place, and link to it everywhere else.
- When a rule changes, find every place it is stated and change them in the same commit.

**W28. Documents that grow by adding.** The rule was "keep each file under about two pages". The design system became a list of every change since day one, and the two longest plans ran to about 240 and 280 lines.
- Main documents describe how things are now. The history of how they got there goes in the decisions file.

## What worked: keep doing these

- **A decisions file from day one**, with the reason, a "revisit when", and a "not chosen" list. It is the agent's memory between sessions.
- **Docs changed in the same commit as the code.** 82 of VoiceLab's 131 feature commits did this.
- **Thorough tests for pure logic.** They were cheap, fast, and caught the most: a rounding slip (3.05 shown as "3.0"), a test file that stopped loading, changes to what was sent to the coach.
- **All colours and fonts in theme files**, with a test that fails on a raw colour and an automatic contrast test.
- **The production build on every change.** It caught server-only code pulled into the browser.
- **Screenshots at phone width (375 px)** for every new screen.
- **Checkpoints with a stated default**, so work carries on with anything that does not depend on you.
- **A plan you read and answer before any code**, with your answers recorded at the top.

## Checklists

### Day one

- [ ] Storage names and the local port are unique to this app (W1)
- [ ] The floating-promise lint rule is on (W2)
- [ ] Unit tests, the browser suite and CI run on every push (W3)
- [ ] Commits are gated on exit codes, not filtered output (W4)
- [ ] Keys are server-only, `.env.example` lists names without values, and provider spend limits are set (W5)
- [ ] Tool versions are pinned, and model names are in one config file (W6)
- [ ] The decisions file exists, with "not chosen" and "revisit later" sections
- [ ] The real-device test is booked for the first week (W15)

### Every change

- [ ] New logic has tests, the failure path is tested, and a bug fix starts with a test that reproduces the exact error (W8, W13)
- [ ] Lint, typecheck, unit tests and the production build pass, and the Test Files count didn't shrink (W4)
- [ ] Each touched page was loaded directly in a browser with a clean console, and looked at at phone width (W10, W18)
- [ ] The report says what was verified, with what, and what still needs a real device (W7)
- [ ] Docs changed in the same commit, and no other document still states an old rule (W27)
- [ ] If you found the bug, a warning was added to this file

### Before adding a new area

- [ ] Every blocking checkpoint is answered (W15)
- [ ] The app has been used for real since the last new area (W25)
- [ ] You know where the area sits on the app's map (W24)
- [ ] Any new privacy promise has been checked (W16)
