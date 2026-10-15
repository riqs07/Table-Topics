# Product Requirements: VoiceLab

**Version:** 2.0 (rewritten around a new target user)
**Status:** Draft for review
**Last updated:** 2026-10-13

## 1. Summary

VoiceLab is a private speech-practice app for people who want to speak better but find it uncomfortable. Each session is about one minute: speak, get **one** specific fix, retry with it, and see the result. Progress is shown against the user's own first recording.

## 2. Target user (ICP)

> **Confirmed at C2 (2026-10-12):** we are building for the *shy and wants to be more outgoing* user. Two other possible users (the rambler who needs structure, and the already-outgoing person who wants polish) are out of scope for v1.

**Who:** an adult who feels they are not great at speaking. They hesitate, trail off, use filler words, or avoid speaking up. They want to be more outgoing and express themselves clearly.

**Where:** practicing alone at home, mostly on a phone. Privacy is a requirement, not a feature.

**What they struggle with:**

| Problem | What the product does about it |
|---------|--------------------------------|
| Hearing their own voice is uncomfortable | Short, easy first sessions; recordings private by default |
| "I'm bad at this" is vague, so nothing improves | Exactly one specific fix per session |
| A wall of scores feels discouraging | Show one or two numbers at a time, tied to the current focus |
| Progress is slow and invisible | Compare against a saved first recording (the baseline) |
| Practice alone does not carry into real life | One real-world challenge per week |

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
| Two modes (decided 2026-10-14, decision 18; details to be tuned after the MVP) | **Table Topic:** a briefing that there is very little waiting time, then a light, short-answer question with a 10-second countdown that starts recording by itself; Toastmasters timing (1:00 to 2:00, green 1:00, yellow 1:30, red 2:00; under 1:00 or over 2:30 would not qualify). **Record Response:** a deeper prompt, 2 minutes to think with a structure hint (point, reason, example, point again) and two or three angles for that prompt, kept in the margin while speaking; a 3:00 goal with yellow from 2:15 and red past it. The home screen offers only these two; the session page states the timing |
| Then and now (added 2026-10-15) | Plays a session beside the first earlier day's recording of the same prompt or passage ("day 1" and "day 14"), with both days' numbers and a button to hear them in turn. The first recording of every prompt keeps its audio |
| Read aloud (added 2026-10-15) | Practise delivery on a known text: six public-domain speech excerpts (Lincoln, F. D. Roosevelt, Kennedy, T. Roosevelt, Susan B. Anthony) and six practice passages. Afterwards the passage is shown with words that were not heard struck through, with the percentage read, repeats, and extra words. Reading never sets the baseline and stays out of progress numbers |
| Pauses on every session (added 2026-10-15) | The loudness readings taken for the level meter are saved, and the session page says how many pauses of at least 0.6 seconds there were, how long on average, and how much of the time was spent speaking. Measured on the device |
| Pause drill (added 2026-10-15) | Five passages with marked pause points (shown as ‖). Afterwards: how many pauses were taken against the number of marks, plus the reading check |
| Rehearse my talk (added 2026-10-15) | Paste your own talk or notes with an optional goal in minutes, rehearse with a timing light, hide the text to practise from memory, see how much of the script each run covered, and compare runs from different days. Talks stay on the device; the coach never receives the script |
| Live transcript | Lets the user see their words as they speak |
| Three-part feedback (keep / change / retry cue) | Gives a single next step instead of a critique |
| Retry flow with before/after numbers | Proves the fix worked within minutes |
| Baseline recording (first session, saved) | Makes long-term progress visible |
| Weekly focus (one skill at a time) | Prevents overwhelm; keeps feedback consistent |
| Weekly real-world challenge | Bridges practice to real conversations |
| Showing-up streak (counts any completed session) | Rewards practice, not performance |
| Session history with transcript, feedback, and the recording to play back | Lets the user review, hear themselves, and see patterns |
| Recordings and history stay on the device by default | Protects privacy for a vulnerable activity. Browser speech recognition may send audio to the browser maker, so the exact promise is decided at checkpoint C5 |

## 5. What we measure (and what we do not)

We only show numbers we can compute reliably from a transcript.

| Measure | Source | v1 |
|---------|--------|----|
| Filler words per minute | Transcript | Yes |
| Words per minute | Transcript and duration | Yes |
| Session length | Timer | Yes |
| Pauses and hesitation | Needs word timestamps (Whisper) | Later |
| Pitch, tone, energy | Needs audio analysis | Later |

We do **not** present guesses about tone or vocal variety as fact. A transcript cannot support them.

The headline number follows the weekly focus (decided 2026-10-14): fillers a minute in filler week, words a minute in pace week. Weeks with no transcript measure (start and finish, structure) show the focus name and say the notes are what count; the retry screen then says "Your second try is in." instead of comparing numbers. The other number stays visible in smaller type.

## 6. Feedback format

Every session returns exactly:

1. **Keep:** one thing done well, quoting the user's own words.
2. **Change:** one specific fix, with an example from their transcript.
3. **Retry cue:** one sentence to read before trying again.

Tone is direct and kind. No empty praise, no lists of five problems.

## 7. Weekly focus

The app assigns one focus per week, in this order for a new user:

1. Start and finish: complete your sentences, stop trailing off
2. Cut filler words
3. Pace: slow down, pause instead of filling
4. Structure: point first, then reason
5. Warmth and energy (needs later audio analysis)

Feedback and numbers all relate to the current focus.

In v1 the focus changes every 7 calendar days, cycling through 1 to 4 and then starting again. Focus 5 is skipped until audio analysis exists. A user who is away advances one focus per full week missed. (Default set in M3; change it with a note in architecture/decisions.md.)

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

## 9. Success metrics

| Metric | Target |
|--------|--------|
| Completes a first session | 90% of new users |
| Completes a retry after feedback | 60% of sessions |
| Returns on day 7 | 40% |
| Filler words per minute, week 4 vs. baseline | Down 30% |
| Completes at least 2 real-world challenges in first month | 50% |

## 10. Open questions

1. ~~Confirm the ICP assumption in section 2.~~ Confirmed at C2.
2. How long do we keep audio locally? (Proposed: last 30 sessions.)
3. Does the retry flow feel like progress or like repetition? (Test with real users early.)
4. Is a typed fallback needed for people practicing where they cannot speak aloud?
5. Privacy promise: what can we honestly promise, given that browser speech recognition may send audio to the browser maker? (Decided at C5; see risks.md R3.)
6. Does "Export my data" ship in v1, since browsers can clear stored data? (Decided at C8; see risks.md R7.)
7. Do filler words survive transcription well enough to be our headline number? (Tested in the spike; see risks.md R1.)
