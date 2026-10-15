# Plan: VoiceLab for public speaking

**Purpose:** The build plan for turning VoiceLab into a public-speaking practice app. The agent works through it in order and ticks items off here.
**Agreed:** 2026-10-15. The user approved every idea in the research summaries, and asked for the new modes to come before smarter analysis.
**Last updated:** 2026-10-15

## Where we are and where we're going

VoiceLab already has Table Topic, Record a response, the practice library, the pause drill, Rehearse my talk, and a ten-lesson skill path. Most of these suit a speaker. The app's *stated* user does not: the PRD (section 2) and the coach's instructions both target "the shy person who wants to be more outgoing".

The new target user (decided in step A1): **someone with a talk, pitch, toast or meeting coming up, or who speaks regularly (a Toastmasters-style member), and wants to deliver it well.** Nerves still matter, but the goal is a better talk, not small talk.

The order:

1. **Phase A, reposition:** wording, focuses and prompts, so everything points at speaking. Small.
2. **Phase B, new modes:** event prep, openings and closings, Q&A practice, more lessons. The main work.
3. **Phase C, real use:** deploy, then a week of the user practising with their real voice.
4. **Phase D, intelligence:** smarter analysis, based on the 2026-10-15 research.

Every step follows the playbook's definition of done (section 4). Docs change in the same commit as the code. Each step names its open choices and the default the agent uses if the user doesn't answer (playbook section 6).

---

## Phase A: Reposition for public speaking

### A0. Browser test suite in the repository (done first, because B adds screens)
- **What:** move the scratchpad Playwright checks into `tests/e2e/`. Then:
  - load every page directly and fail on any console error;
  - click every navigation link;
  - run one Table Topic and one rehearsal end to end with a stand-in microphone;
  - run the suite in CI on every push.
- **Why now:** each new mode adds screens and journeys. Every bug that reached the user lived in those journeys (playbook T5, T10, T11, section 8).
- **Done when:** `pnpm e2e` passes locally and in CI, and the playbook's section 7 item 1 is ticked.

### A1. New target user, written down
- **What:** the documents:
  - PRD version 3: section 2 gets the new target user. The cut and deferred lists are re-checked: social prompts are cut; "the already-outgoing person who wants polish" moves into scope.
  - Decision 22 in `architecture/decisions.md`.
  - The one-line summary in `documents/README.md`.
- **Decision for the user:** the target user wording above. *Default:* as written.

### A2. Coach instructions for a speaker
- **What:** rewrite `COACH_SYSTEM_PROMPT` in `src/core/coachPrompt.ts`:
  - The person is preparing to speak to an audience, so the fix should make the talk land better for listeners.
  - The rules stay the same: three parts, one fix, quotes from the transcript, no comments on tone.
  - The mode notes stay as they are.
- **Tests:** the existing coach-message tests are updated. A new test checks that the prompt no longer mentions being "outgoing".

### A3. Weekly focuses become speaking skills
- **What:** the new focus list in `src/core/focus.ts`, in this order:
  1. Strong opening
  2. Clear structure
  3. Pausing
  4. Cut filler words
  5. Strong close
  6. Vocal variety (needs audio analysis, so it stays hidden until D4 adds pitch)
- **Old sessions keep their labels:** sessions saved under `start-and-finish`, `pace` or `warmth-and-energy` still show their old title. Titles are looked up from a list of retired focuses.
- **The focus's number:**
  - Fillers keeps its rate. Pausing uses pauses a minute (from `findPauses`).
  - Opening and close have no number until D1 adds the text checks. The headline names the focus, as `headlineFor` already does.
- **Tests:** rotation over six focuses (five shown); old focus ids still get titles; `measureFor` for each new focus.
- **Decision for the user:** the order. *Default:* as listed.

### A4. Prompts a speaker would get
- **What:** Record a response gets about 12 new speaking prompts in four groups:
  - explain something to a newcomer;
  - persuade a group;
  - a short toast or tribute;
  - an update at work.

  The most personal or social prompts (meals, songs, mornings) move to Table Topic or are retired. Table Topic keeps light questions, since that is how real Table Topics work.
- **Content approval:** the user approves the new prompts (checkpoint C13).

---

## Phase B: New modes

### B1. Event prep: "I'm speaking on [date]" (the main new feature)
A talk in Rehearse my talk can be given an event date. VoiceLab then builds a countdown plan and shows today's step on the home screen.

- **Data:**
  - `TalkRecord` gains `eventDate: string | null`.
  - The talk is split into **sections** at blank lines; a talk with no blank lines is one section.
  - Each rehearsal session records which section it covered (`sectionIndex: number | null`, where null means the whole talk).
  - The database layout does not change; only the record shape does, and old records read as "no date, whole talk". `data-model.md` is updated.
- **Logic (in `core/`, tested thoroughly):**
  - `eventPlan(talk, today, runs)`: today's step, and the steps for the days left. With 7 or more days to go:
    - section by section first;
    - the opening and close get extra runs;
    - then whole run-throughs;
    - then the memory ladder;
    - a full rehearsal the day before, then a light warm-up on the day.

    With fewer days, the plan compresses. On the day itself it offers a warm-up lesson and one run.
  - `memoryLadder(text, level)`: the text at three levels:
    - full text;
    - keywords only (the first two words of each sentence plus any `*marked*` words);
    - nothing.
  - `runTimes(sessions)`: how long each whole run-through took, by date, against the talk's goal.
- **Screens:**
  - Rehearse gains a date field, a section picker, a memory-ladder switch (it replaces the current "hide the text"), and a run-time chart (made with the dataviz skill's guidance).
  - The home screen shows a top band when a talk has a date: "Your talk is in 5 days. Today: practise the opening twice."
- **Tests:**
  - Unit tests for the plan at 0, 1, 3, 7 and 30 days, past dates, and talks with one section or many.
  - A few screen tests: main path, no date, past date.
  - Browser suite: set a date, follow today's step.
- **Decisions for the user:**
  - How far ahead a plan can go. *Default:* up to 30 days; beyond that, it shows "check back closer to the date".
  - Whether reminders (notifications) are wanted. *Default:* no, and it goes on the later list.

### B2. Openings and closings drill
The first and last 30 seconds matter most, so they get a short drill of their own.

- **What:** a new mode, `bookend`, with two choices:
  - **Your talk:** speak the first or last section of a saved talk.
  - **A prompt:** a cue such as "Open a talk about why your team needs a new tool."

  Each run is limited to 45 seconds (a light at 30 seconds, stopping at 60). Draft and approve about 10 opening prompts and 10 closing prompts (C13).
- **Measures:**
  - For openings, reuse what the app already measures: the silence before the first word (lesson 1) and the opening words (a "So, um…" start is named).
  - For closings, reuse the fading-ending check and the clean-close check (lessons 5 and 10).
  - The coach's mode note asks it to comment only on the opening or the close.
- **Tests:** timing rules for `bookend`; the coach mode note; screens for both choices.

### B3. Q&A practice
After a rehearsal or a prepared response, VoiceLab asks the questions an audience would likely ask. You then answer each one under Table Topic timing.

- **Privacy:** questions are written from the run's **transcript**, never the script. This keeps decision 20 ("a rehearsal's script never leaves the device"). The note before sending says what goes.
- **Server:**
  - A new route, `/api/questions`, behind the same passphrase gate and rate limit as feedback.
  - Its output format has exactly three short questions.
  - The transcript goes in its own block, with an instruction not to follow anything written inside it (as the coach already does).
- **Works without the coach:**
  - you can type your own expected questions, with no server needed;
  - offline, or when the coach is unavailable, the screen says why (the T1 and T13 rules) and offers that typed option.
- **Mode:** `qa`. A session stores which question it answered and which session or talk it came from. The session page groups the answers under their rehearsal.
- **Tests:**
  - server handler: passphrase, rate limit, the reply's shape, and a bad reply;
  - client: success, failure, and no reply;
  - the question screen: main path and failure path.
- **Decision for the user:** how many questions. *Default:* three, and you can skip any of them.

### B4. More lessons for the skill path
New lessons, each pairing one tip with a text and an on-device check, as decision 21 requires:

| # | Lesson | Check |
|---|--------|-------|
| l011 | Open with a hook (question, story or surprising fact) | Coach |
| l012 | Tell a short story (setting, problem, turn, point) | Coach |
| l013 | Bridges between points ("That brings me to…") | Coach |
| l014 | Answer a question with point, reason, example, point | Coach |
| l015 | Recover from a blank (pause, repeat your last point, carry on) | Long pause followed by speech: on device, from `findPauses` |
| l016 | Vocal variety | Coach for now; pitch after D4 |

- **Content approval:** the lesson texts go to C13.
- **Tests:** lesson data (every lesson has a tip, text and known check); the l015 check.

### B5. A home screen for speakers
The home screen order:

1. your next talk (B1), when one has a date;
2. Table Topic;
3. Record a response;
4. Practice library;
5. the "More" line, which gains openings and closings and Q&A.

The main navigation stays as it is. Screenshots are checked at phone and desktop width.

---

## Phase C: Real use before intelligence

- Deploy to Vercel with a **new** passphrase (the old one appeared in chat).
- **C10:** run the coach on about 10 of your real sessions.
- **C3 and C5:** test with a real microphone, and on your phone.
- **A week of real use:** then decide which Phase D items matter most. Phase D can start in parallel only for logic that doesn't depend on what that week shows (D1).

---

## Phase D: Intelligence (after the modes)

Based on the 2026-10-15 research (frameworks and voice analysis). **The rule throughout: no per-area 1–5 scores and no charts of the AI's opinions.** Research shows AI scores per area are unreliable and shift with model updates. Yes/no checks backed by quotes are used instead.

### D1. Text checks on the device (free, fully testable)
`core/textChecks.ts`, on every transcript:
- weak openings ("So, um", "I'm not sure but") and trailing closes ("…yeah, that's it");
- hedging words ("kind of", "I guess", "I think");
- average and longest sentence length;
- repeated phrases;
- vocabulary range.

These feed the Strong opening and Strong close focus numbers (A3), and appear on the session page as plain sentences.

### D2. The coach's breakdown, with evidence
The reply gains a `checks` list. Each entry is a yes/no answer with a quote from the transcript:
- a clear main point;
- the expected shape:
  - point, reason, example, point for Table Topic and Q&A;
  - point, reason, example, point or situation, task, action, result for responses, depending on the prompt;
  - Monroe's motivated sequence as an option for persuasive talks;
- a concrete example or story;
- a strong close.

**Quote check:** the server checks that each quote really appears in the transcript, allowing small differences; a check whose quote doesn't match is dropped. The breakdown picks the one fix; keep, change and retry cue stay as they are. Read, pause and lesson modes skip the content checks.

**Decision for the user:** show the breakdown on the Feedback screen, or use it only to choose the fix. *Default:* show it under the fix, collapsed.

### D3. A check on the coach's quality
- A script runs the coach twice on a fixed set of saved transcripts, including the C10 sessions.
- It reports how often the checks agree between the two runs, and with the user's own labels.
- It runs again whenever the model or the prompt changes.

### D4. Pitch variety on the device
- pitchy (the McLeod pitch method) reads pitch from the audio already recorded.
- It reports pitch range and how much the voice moves within sentences, so monotone speech is flagged.
- This unlocks the Vocal variety focus and the l016 check.
- Pitch tracking is unreliable on breathy or quiet speech, so the page says when the reading is unsure.

### D5. Word timings
- **First choice:** Whisper running in the browser (WebGPU), for exact pause placement, pace per sentence, and reliable filler counts.
- **If it's too slow on the phone:** AssemblyAI with disfluencies kept, after a privacy note and a new decision, because audio would leave the device.
- **What it unlocks:**
  - the pause drill checks the exact places;
  - lesson 4 checks the pause before the point;
  - the filler count stops running low.

### D6. Optional: an AI that listens to audio
Gemini, run on about 10 recordings next to the current coach. It is only adopted if its notes are clearly better and the user accepts audio going to a second company.

---

## Later list (not in this plan)
- Video (eye contact, gestures).
- Reminders.
- The coach reading its fix aloud, and live conversation practice (V1 and V2 in the roadmap).
- Hume tone analysis.
- Azure and Speechace scores.
