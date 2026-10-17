# UX improvements plan (proposed 2026-10-17)

Design changes that follow from [research/ux-research-2026-10.md](../research/ux-research-2026-10.md). The user chose waves 1 and 2 (2026-10-17); wave 3 is not planned. Built items are marked. Sizes: **S** an hour or two, **M** half a day, **L** a day or more.

The idea in one line: **the loop is right; smooth the edges.** The first minutes, the moments that can feel like failure, setup details showing through, and screen space on a phone.

## Wave 1: first impressions and tone

**1. A first win in under a minute (M).** Built (decision 37).
- After the welcome question (or Skip), go straight into a 1-minute reading, not a section page. The welcome answer still sets what the plan leans towards.
- In the first week, the plan's last step is a Table Topic instead of a 2 to 4 minute prepared speech. To keep progress tracking, let the first Table Topic or prepared speech become the first recording (today only a prepared speech can).
- Evidence: reach the first moment of value fast; Speeko's whole routine is about 5 minutes.

**2. Explain the microphone before the browser asks (S).** Built (decision 38).
- One screen before the first ever recording: "VoiceLab listens through your microphone. Recordings stay on this phone. Your browser will ask next." Then the browser prompt.
- If the user says no, a screen with the two taps it takes to allow it in their browser, and "Try again". Never a dead end.
- Evidence: Google Meet cut friction this way; Babbel asks at the first speaking exercise.

**3. Never end on a number that reads as failure (M).** Built (decision 39).
- A reading stopped early: "You read the first 26 words", and "not heard" counts only within the stretch read.
- "Done for today": lead with time spoken ("You spoke for 3 minutes 20 today"), then each step's own note, or a neutral fact. No filler counts on Today.
- A small moment when the day is done: the ticks fill in one by one, with a single line ("Fourth day this week"). Still under reduced motion.
- Evidence: feedback that points at the person tends to hurt; celebrate straight away (Tiny Habits).

**4. Always a next step, coach or not (M).**
- When the coach is not set up or cannot be reached, the app picks one change itself from the numbers: the biggest gap (pace, pause words, pauses, trailing off, timing), with a short tip and a cue for the retry, marked "From your numbers". The coach's note replaces it when it arrives.
- Results never mention the passphrase. Settings moves the passphrase, sending waiting feedback, and the coach-reads-notes switch into a collapsed "Coach (advanced)" section.

## Wave 2: screen space and navigation

**5. Four tabs plus a settings icon (M).**
- Tabs: **Today, Practice, Skills, History**. Talks becomes the first section of Practice ("Your talks"); Settings becomes a gear icon in the masthead.
- Inside today's practice, the tab bar marks Today, not Skills.
- Evidence: Apple and Google both say 3 to 5 tabs, always labelled.

**6. Focus mode for practising (S).**
- On the recording and listen-back pages, hide the tab bar entirely (a close button in the masthead leads back). The action band becomes a little shorter.
- Keyboard hints show only on computers (devices with a fine pointer).
- On a reading's start screen, the text comes first; the clock sits small in the masthead line until recording starts.

**7. A tidier results page (S).**
- Close the empty middle. Secondary actions (read what I said, next part, try again, finish) become a short list of rows instead of four links squeezed into one line.

## Wave 3: self-review, inclusivity and habits

**8. A kinder listen-back (S).**
- One line above the player: "Most people dislike hearing their own voice. Listen the way a friendly coach would."
- Tags first, fewer of them (three for what worked, three to change, "More" for the rest); the two text boxes open behind "Add a note".
- Evidence: preparation before self-review corrects harsh self-views; guided prompts give deeper reflections.

**9. Pause words, said kindly, and an off switch (M).**
- In the app's words, "fillers" become "pause words", with one line where they first appear: a few are normal, and listeners use them as a signal.
- Settings: "Show pause-word counts" (on by default) and "I stammer" (hides pause words, repeats and fluency judgements, and tells the coach not to comment on fluency).
- One quiet line near the numbers: the phone's speech service can mishear accents, so counts are rough.
- Evidence: stammering guidance, recognition errors for stammered and accented speech, "um" as a real word.

**10. A streak that forgives (S).**
- Say "4 of the last 7 days" rather than an unbroken chain; one rest day a week keeps the run going; never a "you broke it" message.
- Evidence: broken streaks drive people away; Duolingo added freezes and repairs.

**11. Smaller fixes (S each).**
- History: units on every number, and a filter for speaking or reading.
- "Can't speak now?" on a step's start screen: skips the step for today without counting it as done.
- Read-along under reduced motion: colour only, no smooth scrolling (already no smooth scroll; check the highlight never animates).

## Later: a shared prompt of the day

The daily Table Topic is already the same for everyone on the same day. A first community step could simply say so ("Today's shared topic"), with answers kept private. Anything more (seeing others' takes, peer feedback) should be opt-in, share the prompt rather than recordings by default, use a structured kind format like Toastmasters evaluations, and come with a plain promise that recordings never train anything. No evidence yet that it helps a solo practice app, so it waits until after the MVP.

## Suggested order

Wave 1 first (items 1 to 4): the first impression and the moments someone might quit. Then items 5 to 7 together as one layout change. Then wave 3.
