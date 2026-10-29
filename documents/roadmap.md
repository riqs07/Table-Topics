# Roadmap

**Purpose:** The order VoiceLab is built in. Every milestone starts with tests, and every milestone lists where you step in.
**Last updated:** 2026-10-29

Checkpoint IDs (C#) are defined in [checkpoints.md](checkpoints.md). The riskiest assumptions are tested first (milestone 1), because their answers can reshape later milestones, especially 5 and 10.

| # | Milestone | First tests written | Done when | Your checkpoints |
|---|-----------|---------------------|-----------|------------------|
| 0 | **Project setup** | A trivial passing test proves the runner works | Repo, strict TypeScript, lint, test runner, and CI all run clean; `.env.example` exists | C1, C2 |
| 1 | **Feasibility spikes** (throwaway) | None; these are experiments. Findings are written into decisions.md | We know if browser transcription works on your phone, if "um" survives transcription, and if recording and recognition can share the microphone | C3, C4, C5 |
| 2 | **Design foundations** | Every theme defines every role; every theme passes contrast; no raw colors in components | Token system, three starter themes, and the style tile page exist, and you picked a direction | C6 |
| 3 | **Core logic** | Filler counting, words per minute, streaks, weekly focus rotation | All pure logic in `core/` is tested and passing | C7 |
| 4 | **Data layer** | Save, load, and prune against an in-memory fake; export file round-trips (if C8 is yes) | Repository works and audio past the last 30 sessions is removed | C8 |
| 5 | **Recording and live transcript** | A fake recorder produces a transcript and duration | Works on your phone using the approach chosen at C5 | None |
| 6 | **Feedback API, access gate, cost guard** | Response must have keep, change, and retry cue; calls without the passphrase are rejected; limits survive across server instances (fake store); a missing variable fails with a clear message | Real coach feedback comes back for a real transcript | C9, C10 |
| 7 | **Session loop screens** | Component tests for prompt, record, feedback, retry; built in the gray theme first | One full loop works end to end in your chosen theme | C11, C12 |
| 8 | **Baseline, history, trend** | First session is marked baseline; before and after numbers are correct | You can see progress against your first recording | None |
| 9 | **Weekly focus and challenge** | Focus advances weekly; a challenge can be completed once | Both appear on the home screen | C13 |
| 10 | **Offline, PWA, fallback** | Offline sessions are queued and sent later; the fallback triggers when browser transcription is missing | Installable on your phone and usable without a connection | C14 |
| 11 | **Deploy and daily use** | End-to-end test of the full loop at phone size | Deployed, installed, and used daily for two weeks | C15, C16 |

## While waiting on you

Work continues on anything that does not depend on the open checkpoint. For example, core logic (M3) can proceed while the palette (C6) is undecided. Non-blocking checkpoints use their stated default.

## Done: two modes (agreed and built 2026-10-14)

Decision 18 in decisions.md has the details. In build order:

1. Split the prompts: a new list of light, short-answer prompts for Table Topic; the current deeper prompts go to Record Response, each with two or three written angles (both lists go to C13 for approval).
2. Table Topic: briefing screen, 10-second countdown that starts recording by itself, Toastmasters lights and the qualify sentence (already built).
3. Record Response: 2-minute thinking screen with the structure hint and angles, hints kept in the margin while speaking, 3:00 goal light (since 2026-10-17 a 2 to 4 minute window with green, yellow and red lights; decision 35).
4. Home screen offers just the two modes; the one-minute session and warm-up are retired (old sessions stay in history). Baseline moves to the first Record Response.

## Done: then and now, read aloud, reading checks (2026-10-15)

## Done: pauses, pause drill, Rehearse my talk (agreed and built 2026-10-15)

1. Pause detection on the device from the loudness the level meter already reads: count and length of pauses, and how much of the time was spent speaking.
2. Pause drill: a passage with marked pause points; the session page says which pauses were taken.
3. Rehearse my talk: paste your own talk or notes, rehearse it with a timer, line it up word by word like a reading, and compare runs with "then and now".

## Done: skill path and practice library (2026-10-15)

## Next: public speaking (agreed 2026-10-15)

VoiceLab is being refocused on public speaking. The step-by-step plan is in [plan-public-speaking.md](plan-public-speaking.md). The phases are:

- **A, reposition:** browser suite, target user, coach wording, focuses, prompts. **Done 2026-10-15.**
- **B, new modes:** event prep, openings and closings, Q&A practice, more lessons, home screen. **Done 2026-10-15.**
- **C, real use.**
- **D, smarter analysis:** text checks, coach checks backed by quotes, pitch, word timings.

## Done: user experience round (2026-10-15)

The menu is organised by job (Today, Talks, Practice, Skills, History, Settings). Today recommends one next step. A first visit asks one welcome question. Every mode says what it is for, how long it takes, and what you get afterwards. "Record Response" became "Prepared answer". See decision 25.

## Done: storytelling (built 2026-10-21, decision 92)

A first-class Stories mode: a 40-prompt bank, your moment notes as seeds, optional shapes and one focus, a planning minute, story checks on the phone and a story coach, "Tell it again" with both tellings side by side, and "Your stories". The plan is in [plan-storytelling.md](plan-storytelling.md). Later: more Learn cards on stories (a separate change), and the story checks' word lists tuned once real tellings show what they miss.

## Built: guided courses, the flow (2026-10-29, decision 131)

Courses for each focus, made of lessons in short parts that use the modes the app already has; the next part is an added step on Today, and a part's prompt comes back days later for a side-by-side comparison. Built with one draft course ("Stop freezing"); the real content, more courses and videos are next. The plan is in [plan-courses.md](plan-courses.md).

## Built: livelier look (2026-10-29, decisions 134 and 135)

The voice shape has a face in six moods, Open Peeps people greet new users and celebrate a finished course, and Practice's main ways are blob scene cards that move. Still to draw: scenes for the voice drills and the conversation units.

## To revisit after the MVP (agreed 2026-10-14)

Accepted for launch, but expected to change so the app does not become a copy of Toastmasters:

- The amount of animation on Practice (decision 135): one scene always moving, four playing a few rounds. Cut back (small cards still, then the big card) if it proves distracting or slows phones.
- The Table Topic timings (currently the Toastmasters contest rules) and the 10-second countdown (fixed, or random between 5 and 10).
- Record Response thinking time (2 minutes), its 3:00 goal, and when its light turns yellow.
- The hint format: the fixed structure (point, reason, example, point) and the per-prompt angles.
- Whether the warm-up or the one-minute session should come back in some form.

## To do: voice features (added 2026-10-13)

Ideas agreed for later, in order. Each sends audio or text to ElevenLabs, so each needs an ElevenLabs API key (`ELEVENLABS_API_KEY`, server only) and a plain notice to the user about what leaves the device.

| # | Feature | What it does | Cost and notes |
|---|---------|--------------|----------------|
| V1 | **The coach speaks** | The coach reads the one fix and the retry cue aloud in a calm voice; "Hear it smoothly" reads the user's own sentence back without the fillers, so they hear the target before retrying. Optional later: the user's own cloned voice, opt-in only | ElevenLabs text-to-speech, priced per character. Text leaves the device, not audio (unless the voice is cloned) |
| V2 | **Live conversation practice** | A new mode: a real-time voice partner for small talk, interviews, or ordering coffee, with Claude as its brain and feedback afterwards | ElevenLabs Agents: plans from about $99 a month plus about $0.08 a minute plus AI usage (third-party figures, to be confirmed). Audio leaves the device during the call. **A cheaper version is built instead (decisions 83 and 84):** four personas in eight situations; Claude Haiku writes each line and ElevenLabs speaks it, about 10 to 15¢ a conversation (recorded lines, at no cost, without the coach), with no audio of the user leaving the device |

Not chosen for now: ElevenLabs Scribe as the transcriber (would keep filler words and time every word, but sends audio to ElevenLabs). Revisit if browser transcription drops too many fillers (risk R1).

## After launch

Use it daily for two to four weeks before adding anything from the PRD's deferred list. Watch which prompts get skipped, whether feedback gets read, and whether the retry helps. Let real use decide what comes next.
