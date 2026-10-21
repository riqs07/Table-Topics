# Product Requirements: VoiceLab

**Version:** 3.0 (refocused on public speaking, 2026-10-15)
**Status:** Draft for review
**Last updated:** 2026-10-20

## 1. Summary

VoiceLab is a private practice app for public speaking. Each session is short: answer a topic, give part of a talk, or work on one skill. Then get **one** specific fix, retry with it, and see the result. Progress is shown against the user's own first recording. The plan for the public-speaking features is in [plan-public-speaking.md](plan-public-speaking.md).

## 2. Target user (ICP)

> **Changed 2026-10-15 (decision 22):** we are building for *someone who has to speak to an audience*. This replaces the C2 choice (2026-10-12) of "the shy person who wants to be more outgoing". Nervous speakers are still welcome, but the goal is now a better talk, not easier small talk. The person who wants polish is now in scope.

**Who:** an adult with a talk, pitch, toast, presentation or meeting update coming up, or someone who speaks regularly (for example a Toastmasters-style club member). They want to deliver it well: a clear point, a strong opening and close, steady pace and pauses, and few fillers. Many are nervous about it.

**Where:** practicing alone at home, mostly on a phone. Privacy is a requirement, not a feature.

**What they struggle with:**

| Problem | What the product does about it |
|---------|--------------------------------|
| A talk is coming up and practice has no plan | Rehearse my talk, with a countdown plan to the date |
| Hearing their own voice is uncomfortable | Short, easy first sessions; recordings private by default |
| "I'm bad at this" is vague, so nothing improves | Exactly one specific fix per session |
| A wall of scores feels discouraging | Show one or two numbers at a time, tied to the current focus |
| Progress is slow and invisible | Compare against a saved first recording (the baseline) |
| Practice alone does not carry into real life | One real-world speaking challenge per week |

## 3. Core loop

1. **Pick up** the day's prompt (no menus, no setup).
2. **Speak** for 60 to 90 seconds. A live transcript appears.
3. **Get feedback:** one thing to keep, one thing to change.
4. **Retry** the same prompt using the fix.
5. **See the change** in the measured number (for example, fillers per minute).

Once a week: complete one **real-world challenge** and mark it done.

## 4. v1 features (must ship)

| Feature | Why it exists (actionable outcome) |
|---------|-------------------------------------|
| Daily prompt, 60-90 s session | Removes the "what do I say?" barrier |
| 30-second warm-up on an easier prompt (added 2026-10-13; retired from the home screen 2026-10-14, old warm-ups still show in history) | Gives a lower-pressure way in on hard days. Counts for the streak, never for progress numbers, never the baseline; leads into the full minute instead of a retry |
| Today, three jobs, and plain descriptions (added 2026-10-15, decision 25) | The app is organised around three jobs: prepare a talk (Talks), speak on the spot (Practice: Rapid Fire, prepared answer, openings and closings, Q&A), and build a skill (Skills: lessons, readings, pause drills, tricky words). The menu is Today · Practice · Skills · History, with Settings as a gear in the title row (since decision 41; talks are the first section of Practice). Today shows one recommended next step with its reason (a dated talk's plan first; then a first prepared answer for a new user; then the mode that trains this week's focus) and the three jobs. A first visit with nothing saved asks "What brings you here?" and goes straight to the matching job. Every mode says what you do, how long it takes and what you get afterwards, on its job page and in a "How this works" note before recording. "Record Response" is now called "Prepared answer" |
| Two modes (decided 2026-10-14, decision 18; details to be tuned after the MVP) | **Rapid Fire** (called Table Topic until decision 85)**:** a briefing that there is very little waiting time, then a light, short-answer question with a 10-second countdown that starts recording by itself; Toastmasters timing (1:00 to 2:00, green 1:00, yellow 1:30, red 2:00; under 1:00 or over 2:30 would not qualify). **Record Response:** a deeper prompt, 2 minutes to think with a structure hint (point, reason, example, point again) and two or three angles for that prompt, kept in the margin while speaking; a 3:00 goal with yellow from 2:15 and red past it. The home screen offers Table Topic, Record a response and the practice library; when a talk has a date coming up, its plan becomes the main action and a response turns into a quieter option (changed 2026-10-15, plan step B5). The "More" line links the skill path, openings and closings, the pause drill, Rehearse my talk, and Q&A practice on the latest rehearsal or response. The session page states the timing |
| Then and now (added 2026-10-15) | Plays a session beside the first earlier day's recording of the same prompt or passage ("day 1" and "day 14"), with both days' numbers and a button to hear them in turn. The first recording of every prompt keeps its audio |
| Read aloud (added 2026-10-15) | Practise delivery on a known text: eighteen public-domain speech excerpts (six from 2026-10-15: Lincoln, F. D. Roosevelt, Kennedy, T. Roosevelt, Susan B. Anthony; twelve added 2026-10-16: Patrick Henry, Frederick Douglass, Lincoln, Chief Joseph, Booker T. Washington, T. Roosevelt, Wilson, F. D. Roosevelt twice, Eisenhower, Kennedy twice) and six practice passages. Afterwards the passage is shown with words that were not heard struck through, with the percentage read, repeats, and extra words. Reading never sets the baseline and stays out of progress numbers |
| Pauses on every session (added 2026-10-15) | The loudness readings taken for the level meter are saved, and the session page says how many pauses of at least 0.6 seconds there were, how long on average, and how much of the time was spent speaking. Measured on the device |
| Pause drill (added 2026-10-15) | Five passages with marked pause points (shown as ‖). Afterwards: how many pauses were taken against the number of marks, plus the reading check |
| Rehearse my talk (added 2026-10-15) | Paste your own talk or notes with an optional goal in minutes, rehearse with a timing light, step down a memory ladder (full text, keywords, nothing), see how much of the script each run covered, and compare runs from different days. Talks stay on the device; the coach never receives the script |
| Event prep (added 2026-10-15, plan step B1) | Give a talk the date it will be given, and its page plans each day until then: each section once, then the opening and close twice each, then whole runs with the text, from keywords and from memory, a full rehearsal the day before and a warm-up on the day (compressed when there are fewer days; open practice when the date is more than 30 days away). Sections come from blank lines in the text. Today's step shows its progress, the home screen leads with the next dated talk, and each whole run's length is shown against the goal |
| Openings and closings (added 2026-10-15, plan step B2) | A drill on just the first or last part of a talk: ten opening and ten closing tasks (one of each offered per day), or the first and last section of the user's own talk. 45-second goal (yellow from 0:30, red past it, stops at 1:00) with one tip on screen. Afterwards: an opening shows the pause before the first word and whether it started on fillers; a close shows fillers in the last words and whether sentences faded. Never the baseline; left out of progress numbers |
| Q&A practice (added 2026-10-15, plan step B3; **removed 2026-10-18, decision 61**) | Removed at the user's request. Old Q&A answers stay in History and still open with their question. |
| Skill path (added 2026-10-15; six lessons added the same day for public speaking, plan step B4) | Sixteen short lessons, all open, each one practical public-speaking tip with a practice text built for it: pause before you start, crisp consonants, slow down for numbers and names, pause before the point, land the ending, stress the key word, signposting, the rule of three, a tongue-twister warm-up, a strong close, open with a hook, tell a short story, bridges between points, answer with point, reason, example, recover from a blank, and vocal variety. The tip stays in view while practising; afterwards each lesson has its own check (opening silence, clear words, pace, pauses at the marks, endings that fade, fillers in the close, a deliberate stop and restart for recovering from a blank) or, for judgement skills, the coach. Square-bracketed instructions in a text ("[Stop here and count to three]") show in italics and are not counted as words to read. Lessons can be repeated any time |
| Practice library (added 2026-10-15) | Every speech, practice passage, pause drill and tricky-word list in one place, picked freely and repeated as often as wanted; replaces the daily read-aloud option on the home screen |
| Storytelling (added 2026-10-21, decision 92) | A first-class mode for telling true, everyday stories and telling them again better. Pick today's story, one of 40 light prompts in eight groups, one of your own "One moment a day" notes ("Tell it properly"), or a story already told ("Tell it again"). Choose an optional shape (Classic; But and so; Then and now; One small moment), one thing to try (start in the middle, a line of what someone said, one vivid detail, end on the point, under a minute) and a length (short, about a minute; full, two to three), plan for up to a minute with the shape in view, then tell it with timing lights. Results: "What I heard" (a start in the action, someone's words, specific details, a turn, a feeling, an ending on the point, and any string of "and then"), honest that these are rough guesses; one change from the story coach, or from the checks without it; one of your lines and how it could sound; the beats the coach heard. "Tell it again" keeps the story, shape and focus and shows both tellings side by side. "Your stories" lists every story by its title (editable), how often it was told and the takeaway for next time. A story step comes up in today's practice about twice a week, open and guided in turn |
| Guided stories (added 2026-10-21, decision 93) | A second kind of story seed: 24 light, everyday scenarios (a bad haircut, a missed train, a day at the zoo…), each with three to five plain facts written flat on purpose and two or three nudges toward what to add; twelve are "Just the facts" and twelve end "With a twist" to land. On Stories under "Guided stories" ("You get the facts. You make it a story."), and as a row in Practice's "Tell stories" group. The facts and nudges are the card while planning and one line while telling; shapes and focuses still apply, each story starting on a focus that suits it. Results: "What you added" beyond the facts (a feeling, someone's words, a turn, details of your own, a point at the end) and, as a rough check, any fact not heard; the story coach also gets the facts and says how far they were brought to life. Tell it again compares what was added and the facts kept |
| Talk with someone (added 2026-10-20, decisions 83 and 84) | A short spoken conversation, about 3 minutes, with one of four personas (Maya, Theo, Chris, Priya), each with a fixed personality, in one of eight everyday situations that practise the four conversation skills; each conversation moves to a new situation with a new twist. You answer out loud and tap Done; Claude writes their next line for the situation and ElevenLabs speaks it in their voice, or, without the coach, they say their recorded lines in their own situation. Afterwards: how much of the talking was yours, your questions, one change, and one of your lines as it could sound |
| Live transcript | Lets the user see their words as they speak |
| Three-part feedback (keep / change / retry cue) | Gives a single next step instead of a critique |
| Retry flow with before/after numbers | Proves the fix worked within minutes |
| Baseline recording (first session, saved) | Makes long-term progress visible |
| Weekly focus (one skill at a time) | Prevents overwhelm; keeps feedback consistent |
| Weekly real-world challenge | Bridges practice to real speaking moments (speak first in a meeting, give a toast, visit a speaking club) |
| Showing-up streak (counts any completed session) | Rewards practice, not performance |
| Session history with transcript, feedback, and the recording to play back | Lets the user review, hear themselves, and see patterns |
| Recordings and history stay on the device by default | Protects privacy for a vulnerable activity. Browser speech recognition may send audio to the browser maker, so the exact promise is decided at checkpoint C5. Deeper analysis (decision 91) sends recordings to AssemblyAI and the app's own voice worker only when the user switches it on; neither keeps them |

## 5. What we measure (and what we do not)

We only show numbers we can compute reliably from a transcript.

| Measure | Source | v1 |
|---------|--------|----|
| Filler words per minute | Transcript | Yes |
| Words per minute | Transcript and duration | Yes |
| Session length | Timer | Yes |
| Pauses (count, length, time spent speaking) | Loudness readings, on the device | Yes (added 2026-10-15) |
| Exactly where each pause falls | Needs word timestamps (Whisper) | Later |
| Pitch range and how phrases end | Pitch readings, on the device, against the speaker's own usual pitch | Yes (added 2026-10-20, decision 81) |
| Volume across the take (phrases fading, the last third, how even) | Loudness readings without the browser's levelling, against the speaker's own phrases | Yes where the browser allows (decision 81) |
| Tone, emotion, energy | Cannot be measured reliably | No |

We do **not** present guesses about tone, emotion or vocal variety as fact. Pitch and volume are shown only as measured, against the speaker's own voice, never as "too quiet" or a score.

The headline number follows the weekly focus (decided 2026-10-14, focuses changed 2026-10-15): fillers a minute in filler week, pauses a minute in pausing week. Weeks with no measure yet (opening, structure, close) show the focus name and say the notes are what count, as do sessions saved before loudness was kept; the retry screen then says "Your second try is in." instead of comparing numbers. The other number stays visible in smaller type.

## 6. Feedback format

Every session returns exactly:

1. **Keep:** one thing done well, quoting the user's own words.
2. **Change:** one specific fix, with an example from their transcript.
3. **Retry cue:** one sentence to read before trying again.

Tone is direct and kind. No empty praise, no lists of five problems.

## 7. Weekly focus

The app assigns one focus per week, in this order for a new user:

1. Strong opening: pause, then start with something worth hearing
2. Clear structure: point first, then a reason and an example
3. Pausing: pause between ideas instead of filling the gap
4. Cut filler words
5. Strong close: end on your point, then stop
6. Vocal variety (needs pitch analysis, plan step D4)

Feedback and numbers all relate to the current focus.

These public-speaking skills replaced the earlier focuses (start and finish, pace, structure, warmth and energy) on 2026-10-15. Old sessions keep their focus's name.

In v1 the focus changes every 7 calendar days, cycling through 1 to 5 and then starting again. Focus 6 is skipped until pitch can be measured. A user who is away advances one focus per full week missed. (Default set in M3; change it with a note in architecture/decisions.md.)

## 8. Removed or deferred

| Item | Decision | Reason |
|------|----------|--------|
| Leagues, gems, battle mode | Cut | Social competition adds pressure for an anxious user |
| Five-dimension scoring and composite 1-100 score | Cut for v1 | Too much at once; not reliable from text |
| Radar chart | Cut | Noise; replaced by one trend line |
| Video and body language | Later | Audio-first is lower pressure |
| Accounts and cloud sync | Later | Local-first protects privacy |
| Push reminders | Later | Needed once habit data shows drop-off |
| Freestyle mode, debate mode | Later | Not core to this user |
| Small-talk and social conversation practice | Cut (2026-10-15); **back since 2026-10-17** (decision 42 onwards: small talk and seven connection units, the last three (reading the room, starting and ending, going deeper) added in decision 95; and since decision 83 conversations with characters) | Cut as belonging to the old target user; the user brought it back as everyday conversation practice beside the speaking practice |
| Video (eye contact, gestures) | Later | A big step in work and privacy; see plan-public-speaking.md |

## 9. Success metrics

| Metric | Target |
|--------|--------|
| Completes a first session | 90% of new users |
| Completes a retry after feedback | 60% of sessions |
| Returns on day 7 | 40% |
| Filler words per minute, week 4 vs. baseline | Down 30% |
| Completes at least 2 real-world challenges in first month | 50% |
| Rehearses a talk at least three times before its date (once event prep ships) | 50% of talks with a date |

## 10. Open questions

1. ~~Confirm the ICP assumption in section 2.~~ Confirmed at C2, then changed to public speakers on 2026-10-15 (decision 22).
2. How long do we keep audio locally? (Proposed: last 30 sessions.)
3. Does the retry flow feel like progress or like repetition? (Test with real users early.)
4. Is a typed fallback needed for people practicing where they cannot speak aloud?
5. Privacy promise: what can we honestly promise, given that browser speech recognition may send audio to the browser maker? (Decided at C5; see risks.md R3.)
6. Does "Export my data" ship in v1, since browsers can clear stored data? (Decided at C8; see risks.md R7.)
7. Do filler words survive transcription well enough to be our headline number? (Tested in the spike; see risks.md R1.)
