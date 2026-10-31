# Roadmap

**Purpose:** The order VoiceLab is built in. Every milestone starts with tests, and every milestone lists where you step in.
**Last updated:** 2026-10-31

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

Courses for each focus, made of lessons in short parts that use the modes the app already has; the next part is an added step on Today, and a part's prompt comes back days later for a side-by-side comparison. Six courses, one for each focus area, with their final words (decision 144), a tile for every course and lesson, and a 15-second short for each course (decision 145). The plan is in [plan-courses.md](plan-courses.md).

## Built: livelier look (2026-10-29, decisions 134 and 136)

The voice shape has a face in six moods, Open Peeps people greet new users and celebrate a finished course, and Practice's main ways are blob scene cards that move. Still to draw: scenes for the voice drills and the conversation units.

## Done: overnight audit and fixes (2026-10-31, decision 156)

Security, accessibility, performance and stickiness were audited in one autonomous pass and the safe fixes made; the report is [audit-2026-10-31.md](audit-2026-10-31.md). Still to do from it, each needing a product call: a cross-platform install nudge after the first finished day; real reminders for the installed app (web push, decision 2's known risk); a "short day" and a lighter first day back; recording without live words when the speech service is offline; a lighter day one (the course step makes it five steps); keeping the passphrase out of script reach (an HttpOnly cookie); server-side start times for live minutes so a dishonest client cannot refund them; atomic counter expiry in the rate-limit store.

## To do: scrutinise and polish the videos (added 2026-10-30)

The 6 course shorts (decision 145) and 37 lesson clips (decisions 146 and 147) are fine for now (the user: "this is okay"), but they were made quickly, mostly by agents, and checked only from still frames. Treat them as a pilot: review them properly, then clean them up.

1. **Watch every one with sound,** start to end, on a phone. Note anything that sounds off, reads badly or drags. So far only stills have been checked; nobody has listened to all of them.
2. **Check the scripts as a set:** the wording against each lesson's Learn cards, the app's voice, repeated phrases or examples across clips, and lengths (30 to 43 s now; aim for about 35 s).
3. **Known issues to fix:**
   - In Stop freezing lesson 6, the caption "So: tea." comes about 0.6 s late. Feeding the aligner word times from a transcript (ElevenLabs Scribe) would fix this and any similar slips.
   - Many example beats sit on the same pink ground; vary the colours across a course.
   - In Ready by the day lesson 5, the blob calls itself "Blob" ("Blob, you know this."). Decide whether the character has a name.
   - In the Beyond "good, you?" short, the "(sigh)" caption: keep it or re-voice without it.
4. **Pilot with a few learners:** show a handful of clips in the lessons and see whether they press play, watch to the end, and whether the closing card's action sticks. Change the format (length, pace, the example beat) from what they do.
5. **Then clean up:** re-voice and re-render what changes (`pnpm render-lessons <id>`), and move the 45 MB of video out of the repository to a file store before launch; think about playing them offline.

## Done: Scenes and Active listening (built 2026-10-30, decisions 149 to 151)

The first two of a round making the practice modes more robust. **Scenes:** choose two replies in a short conversation with one of the four people, each answered in their voice, then say the last one out loud. **Active listening:** hear a story once, answer out loud, see which details you caught and whether you heard what mattered. Both feed Today's conversation lane. The plan, and what was left for later (course parts on them, a harder "say yours first", more content), is in [plan-scenes-and-listening.md](plan-scenes-and-listening.md).

## Done: stories you'll need and the guided-story dial (built 2026-10-30, decisions 152 to 154)

From [research/storytelling-2026-10.md](research/storytelling-2026-10.md): four new kinds of story (who I am, interview answer, toast, a choice I made) with their own prompts and checks, and guided stories as a five-step dial ending in "Make it a…". On Practice under Tell stories and in Today's on-the-spot lane. The plan, and what is next (signature stories, a per-story page, "Make it true"), is in [plan-story-types.md](plan-story-types.md).

## Done: a second course for each focus area (built 2026-10-30, decision 155)

Six more courses from the research: Interview ready, Toasts and tributes, Listen like you mean it, Tell it again (better), Know your voice and The tough question, each with five lessons, tiles, lesson clips and a short. Outlines in [course-outlines.md](course-outlines.md).

## To revisit after the MVP (agreed 2026-10-14)

Accepted for launch, but expected to change so the app does not become a copy of Toastmasters:

- The amount of animation on Practice (decision 136): one scene always moving, four playing a few rounds. Cut back (small cards still, then the big card) if it proves distracting or slows phones.
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

## Later: smarter use of AI, feedback and access per mode (added 2026-10-31)

To workshop with the user. One idea with three parts: each mode declares what it is for, and the app decides from that (1) when to use AI, (2) which feedback and charts to show afterwards, and (3) whether it is open any time or unlocked and limited. Mostly to keep AI costs down without users missing anything that matters.

- **When to use AI, by need (1 to 5):** 5, essential, AI every time on the best model (boss levels, Rapid Fire, prepared speech, stories you'll need such as STAR answers, tell a story, talk with someone); 4, high, AI every time on a cheaper model (guided stories, story dice, tell one again, small talk, active listening, short speech, the weekly check-in's spoken parts); 3, useful, AI on request with a "Get coach feedback" button (your talk, free talk, 4/3/2); 2, light, and 1, none: phone measures and ready-written tips only (skill lessons, quick scenarios, scenes, one moment a day; read aloud, whole speeches, pause drills, voice drills, shadowing, warm-up). Courses inherit the level of each part's mode. Live voice (boss calls, spoken conversation lines) is costed and limited separately from text analysis.
- **Which feedback and charts to show:** each mode shows the few results that match its purpose (a reading: pace, pauses and stress against the text; Rapid Fire: the point and its structure, the start, pause words; a story: its beats), with the rest one tap away, instead of every measure after every take.
- **Open any time or limited:** a core set always open (to decide: reading and voice drills, which cost nothing, and a daily allowance of the AI-heavy modes), others unlocked through courses or limited a day, as boss levels are.
- **Questions:** which modes are always open; how big the daily allowance is, and whether a paid plan lifts it; which charts belong to each mode; whether "on request" feedback feels like a loss to users.

## Later: a UX redesign (added 2026-10-31)

Once the app is in a workable, finished state, redesign the user experience and the look as one coherent system, keeping the content, the code underneath and the app's spirit. Not started; the user will say when.

- **Why:** the app grew one idea at a time and now has many good parts without one plan tying them together.
- **How:** build a new interface alongside the current one, screen by screen behind a switch, on the same logic, storage and content (about 60% of the code and 179 of the 225 test files carry over; the screens and their tests are rebuilt). Users' saved practice keeps working throughout.
- **Order:** (1) audit: map every screen, journey and choice; (2) the core loop and structure (the first five minutes, week and month; which modes lead; how Today, Practice, Learn and Courses relate); (3) one design language (the two-layer colour idea from the palette comparison, type scale, spacing, components, motion and illustration per `design/art-style.md`); (4) mockups tested on a phone; (5) build.
- **First, cheaply:** move the logic still inside screens (such as Today's data loading) into `core` and hooks, so the redesign is mostly visual.
- **Inputs:** UX pattern libraries and Figma through MCPs, and real usage data once there are users.
- **Keep:** one change per take, honest privacy, never making the user feel judged, progress you can hear.

## After launch

Use it daily for two to four weeks before adding anything from the PRD's deferred list. Watch which prompts get skipped, whether feedback gets read, and whether the retry helps. Let real use decide what comes next.
