# Course Outlines: One Course for Each Focus Area

**Purpose:** The shape of the six guided courses (one per focus area) before their words are written: what each course promises, its lessons, its parts, and the mode each part practises on. Agree the shape here first, then write each course in full in `src/content/courses.ts`.
**Status:** Written and built (decision 144, 2026-10-29): every course below is in `src/content/courses.ts` with its final words. The words there are the source of truth; this outline is kept for the shape and the reasoning. Changes made while writing: Ready by the day practises on talk tasks written for the course and links to Rehearse my talk (its own-talk parts are for later); voice drills, the warm-up, shadowing, Talk with someone and the 4/3/2 drill are links under a part's idea rather than recorded inside the course; Beyond "good, you?" has six lessons (the conversation itself is the link in its last lesson); A voice they lean in for's "Fill the room" has one part.
**Read with:** [plan-courses.md](plan-courses.md) (how courses work), [design/art-style.md](design/art-style.md) (tiles and videos, which come after the words).

## How to read this

Each course has a few **lessons**, each teaching one skill. Each lesson has a few **parts**: **Learn** (one idea) → **See it** (a model answer or a video, when there is one) → **Try it** (once or twice, on a mode the app already has) → **Wrap up**. Three days later a part's prompt comes back on Today, so the user can compare the two answers.

In the tables:

- **Try it** names the mode and what the tries are compared on. ✅ means courses can already do it. 🔧 means the course engine needs a change first (see [What the engine needs](#what-the-engine-needs)).
- **Tile** is a one-line idea for the lesson's course tile, to draw later (art style, section 6).

The same rules apply to every course:

- **One skill per lesson, one goal per try.** A goal the user can check themselves ("Say your answer in the first sentence").
- **About an hour of practice per course,** in parts of three to six minutes, so a part fits a coffee break.
- **Model answers are written for the app,** short, and in the app's voice. Each highlights the words that show the skill.
- **Never judge.** A part may say "instead of…, try…", never "wrong".
- **Teach only what the evidence supports.** Where a Learn card already covers an idea, the part teaches the action and links to the card. The evidence labels stay on the cards.
- **The last lesson is always "The run":** everything together on a new prompt, twice in a row.

## The six courses at a glance

| Focus | Course | For someone who… | Lessons | Can be built now? |
|---|---|---|---|---|
| Thinking on my feet | **Stop freezing** (draft exists) | goes blank when asked something out of the blue | 6 | ✅ Yes |
| Speaking at work | **Explain it simply** | rambles in updates and meetings, or goes quiet in them | 6 | ✅ Yes |
| A talk coming up | **Ready by the day** | has a toast, talk or pitch on a set date | 6 | 🔧 Needs their own talk in a course |
| Telling stories | **Stories that land** | has stories but tells them flatly or too long | 6 | 🔧 Needs story mode in a course |
| Small talk and conversations | **Beyond "good, you?"** | answers in one line and lets conversations die | 7 | 🔧 Needs small-talk and conversation modes in a course |
| How I sound | **A voice they lean in for** | sounds flat, rushed or unclear | 7 | 🔧 Needs voice, reading and pause modes in a course |

**Suggested writing order:** Stop freezing (it exists, and its words are placeholders) → Explain it simply (no engine change) → Ready by the day (the main audience in the competitor research) → Beyond "good, you?" → Stories that land → A voice they lean in for.

---

## 1. Stop freezing (thinking on my feet)

**Promise:** "Answer anything out of the blue in a minute, without the ums."
**By the end you can:** take a breath and start within two seconds; say your answer in the first sentence; fill a minute with point, reason, example; end on purpose; get going again after a blank.
**Changes to the draft:** keep its five lessons and add **Back on track** (going blank) before The run, since that fear is in the course's name. Add a third part to Buy a beat on lines that buy time honestly.

| Lesson | Parts (Learn → Try it) | Try it | Tile |
|---|---|---|---|
| **1. Buy a beat** | **Pause, don't fill:** a pause sounds sure, an "um" sounds lost. Breathe before the first word. · **Start within two seconds:** start with the first true thing. · **A line that buys time:** say the question back, or "Good one. Let me think." Never "um, so". | Rapid Fire ✅ pause words; 2 tries | Exists: eyes shut, breathing, beside a pause sign |
| **2. Point first** | **Answer first:** the first sentence is the answer. Model answer. · **Pick a side:** "it depends" is not an answer. · **The headline test:** would your first sentence alone answer the question? | Rapid Fire ✅ pause words | Exists: an arrow in a bullseye |
| **3. Point, reason, example** | **Three beats:** model answer. · **Make it a minute:** the example is where the time comes from. · **Other shapes:** past, present, future; problem, fix. Use them when PRE doesn't fit. | Rapid Fire ✅ length | Exists: three numbered blocks |
| **4. Land it** | **Finish where you started:** say the point again in a few words. · **Then stop:** silence after the last line is fine. | Rapid Fire ✅ pause words / length | Exists: parachute to a target |
| **5. Back on track** (new) | **Blank? Go back:** say your point again, and the next sentence usually comes. · **The example rescue:** "For example…" opens a door. · **Name it and carry on:** "Where was I? Right…" sounds human, not lost. | Rapid Fire ✅ length; 2 tries | Blob puzzled, then smiling, on a path that loops back to a signpost |
| **6. The run** | **Two in a row:** breathe, point, example, land. · **Harder ones:** two prepared-speech prompts with a short think. | Rapid Fire, then prepared speech ✅ pause words | Exists: running in a headband |

**Better measure, later:** time to the first word and time to the point would suit this course better than pause words (plan-courses "Still to do" #3). "Land it" can already use the trailing-ending measure (`close.weak_ending`).
**Video idea:** "Buy a beat" (made).

---

## 2. Explain it simply (speaking at work)

**Promise:** "Say it once, clearly, and get back to work."
**By the end you can:** give a 60-second update that leads with the bottom line; explain your work to someone outside it; add to a meeting without rambling; say "I don't know" well; pitch an idea in a minute.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. Bottom line first** | **Lead with the news:** the outcome or the ask first, then the detail. Model: a status update both ways. · **One sentence, then stop:** could they act on your first sentence alone? | Prepared speech ✅ length; 2 tries | Blob holding a sign with one bold line |
| **2. The 60-second update** | **Done, next, need:** three slots that fit any update. · **Numbers slow:** say figures and names more slowly (links to the "Slow down for numbers and names" lesson). | Prepared speech ✅ length | Blob beside a three-row checklist ticking itself off |
| **3. Explain it to a friend** | **One idea, plain words:** cut the jargon. If a word needs explaining, swap it. · **Give it a picture:** one comparison ("it's like a library card for…"). Model answer. · **Check the gap:** end with "Does that make sense for what you need?" | Free talk ✅ pause words; prompts like "Explain what you do to a ten-year-old" | Blob drawing a simple picture on a small board |
| **4. Speak up in meetings** | **Build on it:** "Adding to what Sam said…" gets you in without interrupting. · **Disagree kindly:** "I see it a bit differently, because…" plus one reason. · **Keep it short:** one point per turn. | Rapid Fire ✅ length (meeting-style prompts) | Two blobs at a table, the warm one leaning in |
| **5. When you don't know** | **Say so, then say when:** "I don't know yet. I'll find out by Friday." · **Answer the part you can:** "What I do know is…". Model answer. | Rapid Fire ✅ pause words | Blob with a question mark becoming a calendar tick |
| **6. The run: pitch an idea** | **Problem, idea, ask:** a minute to get a yes. · **Two in a row:** an update, then a pitch. | Prepared speech ✅ length; 2 tries | Blob on a small box, one arm up, a lightbulb flag |

**New prompts needed:** about 15 work prompts (updates, explanations, meeting questions, pitches). The work speeches in `practiceFocus.ts` can be the "See it" material for lesson 6.
**Video idea:** "Bottom line first": the blob buried under detail, then pulling the one line out.

---

## 3. Ready by the day (a talk coming up)

**Promise:** "Your talk, ready by the day." (The headline the competitor research recommends.)
**By the end you can:** say your message in one sentence; open without "Hi, I'm… today I'll talk about…"; close on a line people remember; give the talk from keywords, then from nothing; handle the nerves on the day.
**Open question for you:** practise on **the user's own talk** (from Rehearse my talk or event prep) when they have one, and on a **sample talk** (a two-minute toast) when they don't? This is the main engine change for this course.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. One message** | **The one sentence:** if they remember one thing, what is it? Write it before anything else. · **Three points at most:** each one serves the message. | Outline 🔧, then free talk ✅ length | Blob holding up one big card |
| **2. Open strong** | **Skip the throat-clearing:** start with a story, a question or a surprising fact (links to the "Open with a hook" lesson). Model openings, each three ways. · **Learn your first 30 seconds by heart:** nerves peak at the start. | Your talk's opening 🔧 / sample ✅ length; 2 tries | Blob on a stage, curtain opening |
| **3. Close on purpose** | **Come back to the start:** a callback to the opening. · **The last line is the one they keep:** a call to act or a single image. Never "so, yeah, that's it, any questions?". · **Questions before the close:** take questions, then give the last line. | Your talk's close 🔧 / sample ✅ | Blob bowing, a ribbon tying itself |
| **4. Off the page** | **The memory ladder:** full script → keywords → nothing. · **Signposts:** "First… / The second thing… / So…" keep you and them on track (links to "Signposting"). | Rehearse my talk 🔧 (ladder rungs); 2 tries; compared on length and pause words | Blob climbing three rungs, the page fading |
| **5. Nerves on the day** | **Call it excitement:** the same racing heart, a different word (Learn card "Nerves and presence"). · **The two-minute warm-up:** low breath, lip trills, the ready line. · **If it goes wrong:** pause, look at your keywords, carry on. Nobody minds. | Voice warm-up routine 🔧, then your opening ✅ | Blob in a calm breathing pose, the heart slowing |
| **6. The dress rehearsal** | **Stand up, time it:** a full run at full volume. · **A dry run with one person:** advice only, no recording (competitor research, gap 2). · **After the day:** "How did it go?" and the next course. | Rehearse my talk 🔧 length | Blob in a small tie, a spotlight |

**Video idea:** "The memory ladder": the script page losing words rung by rung while the blob keeps talking.

---

## 4. Stories that land (telling stories)

**Promise:** "Turn what happened into a story people want to hear."
**By the end you can:** find stories in your own week; start in the middle; build tension with "but" and "so"; bring one moment to life with a detail and a line someone said; end on the point; tell it in under a minute.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. You have stories** | **Small moments count:** a missed train is a story if something changed. · **Keep a moment note:** the app's moment notes become story seeds. | Story 🔧 from a story prompt; length | Blob by a campfire holding a tiny notebook |
| **2. Start in the middle** | **Skip the run-up:** start at the moment it went wrong ("Start in the middle"). Model: the same story two ways. · **Who, where, when, in one line.** | Story 🔧 shape "Start in the middle"; 2 tries | Blob jumping into an open book mid-page |
| **3. But, and so** | **Tension keeps them listening:** "and then, and then" goes flat; "but… so…" pulls forward (the "But and so" shape). Model answer. | Story 🔧 shape "But and so"; length | Blob on a zigzag path with a "but" sign |
| **4. Bring it to life** | **One vivid detail:** the smell, the colour, the exact time. · **One line someone said:** in their words, out loud (story focuses "One vivid detail" and "Add one line of what someone said"). | Story 🔧 with that focus; 2 tries | Blob holding a magnifying glass over a speech bubble |
| **5. End on the point** | **Why you're telling it:** the change, the lesson, or the laugh. Pick one. · **Templates for work:** Lesson learned, Client win. | Story 🔧 template "Lesson learned"; length | Blob placing a full stop like a stone |
| **6. The run: tell it shorter** | **4, 3, 2:** the same story three times, shorter each time. · **Tell it again in three days** (the comeback). | 4/3/2 drill 🔧 length | Exists: the campfire scene. A tile: three shrinking speech bubbles |

**Measures that would suit it:** the story checks already measure a start in the action, someone's words, details, a turn and an ending on the point (`device-story-v1`).
**Video idea:** "Start in the middle": the blob yawning through a long run-up, then cutting straight to the moment.

---

## 5. Beyond "good, you?" (small talk and conversations)

**Promise:** "Keep a conversation going, and let it go somewhere."
**By the end you can:** answer with a hook; ask a follow-up about what they said; show you're listening out loud; share back and hand back; go one level deeper; start and leave a conversation gracefully.
**Built on:** the seven small-talk units and the Connect research ([charisma deep dive](research/charisma-connection-deep-dive-2026-10.md)). The course is the guided way through material that already exists.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. Answer with a hook** | **More than one word:** "Good, you?" closes. "Good, I finally tried the new climbing place" opens. · **Leave something to ask about.** Model answer. | Small-talk drill 🔧 (answering unit); 2 tries | Blob with a small fishing hook on a speech bubble |
| **2. Ask the second question** | **Follow their detail:** the follow-up is about what they just said, not a new topic. · **Just one question:** not three at once. | Small-talk drill 🔧 (asking unit) | Two blobs, a thread linking their bubbles |
| **3. Listen out loud** | **React first:** "No way!" before your own news. · **Use their words, name their feeling:** "Stuck for three hours? That sounds exhausting." | Small-talk drill 🔧 (listening and news units) | Blob with one hand cupped to its ear, hearts floating |
| **4. Share back, hand back** | **Match, don't top:** a story the same size as theirs, not bigger. · **Hand it back:** end your turn with a question or a pause. | Talk with someone 🔧 (Quick play); compared on talk share | Two blobs passing a ball |
| **5. One level deeper** | **From what to why:** "What made you pick that?" · **Share a little first:** opening up invites opening up. | Small-talk drill 🔧 (deeper unit) | Blob diving gently into a pool |
| **6. Start and leave well** | **The easy opener:** something you both can see. · **The warm exit:** "Great talking to you. I'm going to grab food, but let's…". | Small-talk drill 🔧 (starting and ending unit) | Blob waving at a door |
| **7. The run** | **A whole conversation:** a persona and a situation, using all of it. · **Again, harder:** a quieter persona. | Talk with someone 🔧 (two difficulties) | Two blobs chatting (the existing scene) |

**Measures that would suit it:** questions asked, follow-ups versus new topics, talk share. Turn timing is already measured (decision 101).
**Video idea:** "Good, you?": the blob's one-line answer falls flat, then its hook answer lights up the other blob.

---

## 6. A voice they lean in for (how I sound)

**Promise:** "Sound clear, steady and like you mean it."
**By the end you can:** breathe low and warm up in two minutes; say every word clearly; slow down and pause on purpose; stress the word that matters; end statements down, not up; fill a room without shouting.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. Breath first** | **Low breath:** the belly moves, not the shoulders (voice drills "Shoulders down", "Low breath"). · **One breath count.** | Voice drill 🔧 | Blob with a balloon inflating in its middle |
| **2. Clear sounds** | **Word endings:** finish every word (sound set "Word endings"). · **Tongue twisters as a warm-up,** not a test. | Voice drill / read aloud 🔧 | Blob with crisp letters popping out |
| **3. Pace and pauses** | **Slow down for what matters:** numbers, names, the key line. · **Pause on purpose:** marked pauses in a passage (pause drill). · **The metronome read.** | Pause drill 🔧 pauses; read aloud 🔧 pace | Blob beside a metronome |
| **4. Stress the key word** | **One word per line carries the meaning:** the same sentence, three meanings ("Stress the key word"). | Voice drill 🔧 (planned stress) | Blob holding up one big word among small ones |
| **5. Land it low** | **Statements go down at the end:** going up sounds unsure (pitch drills "Statement or question", "Land it low"). | Voice drill 🔧 pitch; 2 tries | Blob sliding down a gentle curve |
| **6. Fill the room** | **Three rooms:** the same line for a table, a meeting room and a hall ("Three rooms" drills). · **Loud is not shouting:** more breath, not more throat. | Voice drill 🔧 loudness | Blob with sound rings growing outward |
| **7. The run** | **Read a speech excerpt with all of it,** then **shadow** a line and compare. | Read aloud and shadowing 🔧 pace, pauses | Blob at a lectern with a scroll |

**Measures that would suit it:** pitch range and rising endings (`pro.ends_rise_share`), pace and pauses, all already measured on the phone.
**Video idea:** "Land it low": the same sentence ending up, then down, with the blob's confidence changing.

---

## The second course for each focus (decision 155, built 2026-10-30)

At the user's request ("create some more courses… base the courses off of [the research]"), each focus area has a second course, offered once its first is finished (the engine already did this; Today then adds the second course's next part). Each has five lessons of two or three parts, a tile for the course and each lesson, a lesson clip in each lesson's first part with the blob's own example, and a 15-second short. They were written from the research in `documents/research/`: the storytelling report (Interview ready, Toasts and tributes, Tell it again), the charisma and connection reports (Listen like you mean it, The tough question) and the speech-analysis report (Know your voice). The content lives in `src/content/courseBank/`, one file per course.

### Interview ready (speaking at work)

**Promise:** “Have your answer ready for “tell me about yourself” and “tell me about a time when…”.”
**By the end you can:** Answer “tell me about yourself” with one moment, linked to now; Tell a “tell me about a time…” story as situation, task, action, result; Say what you did, with “I” and a number; Answer the mistake or weakness question honestly, as something you learned; Say why you want the role, and ask a real question back.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. Tell me about yourself** | One moment, not your CV · Link it to now · Two minutes, then stop | story | `tell-me-about-yourself` |
| **2. The STAR answer** | Situation, task, action, result · Short set-up, long action · Keep a few stories ready | story | `star-answer` |
| **3. Own it** | Say “I” · Give it a number | story, prepared speech | `own-it` |
| **4. The hard one** | A real one · End on what you’d keep | story, prepared speech | `the-hard-one` |
| **5. Your close** | Why this role · A question back · The run | story | `your-close` |

### Toasts and tributes (a talk coming up)

**Promise:** “A toast, a leaving speech or a thank-you: short, warm and about them.”
**By the end you can:** Pick one story that shows one thing about them; Open on them, not on your nerves; Keep it to a few warm minutes; End by raising a glass, or on the thanks; Stand up on the day with three words in your head.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. One story, one quality** | One story, not a list · Say what it shows | story | `one-story-one-quality` |
| **2. Open on them** | Not “I’m not good at this” · How you know them, in one line | story, prepared speech | `open-on-them` |
| **3. Short and sweet** | Two or three minutes · Keep it about them | story | `short-and-sweet` |
| **4. Raise the glass** | End with the glass · A thank-you ends on the thanks | story | `raise-the-glass` |
| **5. On the day** | Call it excitement · Three words, out loud | prepared speech | `toast-on-the-day` |

### Listen like you mean it (small talk and conversations)

**Promise:** “Stop waiting for your turn. Hear them, and let them know it.”
**By the end you can:** React to the moment in their story, not with “mm-hmm”; Say back how it felt for them, not just what happened; Stay on their story instead of jumping to yours; Hold the advice until it’s asked for; Ask about the part that mattered to them.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. React to the moment** | Specific beats “mm-hmm” · Stop planning your line | small talk | `react-to-the-moment` |
| **2. Their words, their feeling** | The feeling, not the facts · Check, don’t tell | small talk | `their-feeling` |
| **3. Stay on their story** | Support, don’t shift · Their news, not yours · Your story can wait | small talk | `stay-on-their-story` |
| **4. Hold the advice** | Hold the fix · No “at least” · Ask before you advise | small talk | `hold-the-advice` |
| **5. Ask about what mattered** | Find the heart of it · What they didn’t say · All together | small talk | `ask-what-mattered` |

### Tell it again, better (telling stories)

**Promise:** “Pick a few good stories and polish them, one telling at a time.”
**By the end you can:** Catch a story a day in one line, and pick your five; Start each story close to the moment it changed; Slow down the few seconds that matter; Give someone one line, in words that sound like them; End on what it meant, and tell it tighter each time.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. Find your five** | One line a day · Pick your five | story | `five-stories` |
| **2. Start close to the change** | Find the change first · Start on the opposite · The stakes, not the ending | story | `close-to-the-change` |
| **3. Slow down the moment** | The five seconds · Slip into now | story | `slow-the-moment` |
| **4. Let them speak** | Your version of their words · Put the line at the turn | story | `in-their-words` |
| **5. End on what it meant** | Say why it mattered · One thing per telling · Tighter, not faster | story | `what-it-meant` |

### Know your voice (how I sound)

**Promise:** “Read what your recordings say, then change one thing at a time.”
**By the end you can:** Find where your pauses fall, and move them between ideas; Read your two pace numbers, and slow down for the line that matters; Read your pitch range and how your statements ended; Use volume with variety, and keep it to the last line; Change one thing at a time, and tell a real change from noise.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. Where your pauses fall** | Pauses mid-sentence · “Um” is a signal · Words per run | read aloud, pause drill | `pause-map` |
| **2. Your pace** | Two paces · Slow the key line | read aloud | `pace-dial` |
| **3. Your pitch range** | Your range in steps · Where your peaks land · Count your endings | read aloud, lesson | `pitch-span` |
| **4. Your energy** | Volume with variety · Keep it to the end | read aloud, pause drill | `volume-meter` |
| **5. Then and now** | One thing at a time · Small changes are noise · Same words, weeks apart | read aloud, pause drill | `takes-side-by-side` |

### The tough question (thinking on my feet)

**Promise:** “Stay calm and answer well when the question has an edge.”
**By the end you can:** Say a sharp question back in calm words, then answer it; Hear the worry behind a question, and answer that; Agree with what’s fair, then disagree calmly; Say “I don’t know” without bluffing, and own a slip; Answer briefly, then stop, without a long defence.

| Lesson | Parts | Try it | Tile |
|---|---|---|---|
| **1. Say it back** | Take the edge off · Answer the one they asked · Look away to think | Rapid Fire | `say-it-back` |
| **2. Find the doubt** | Hear the worry · Never leave it hanging | prepared speech | `find-the-doubt` |
| **3. Agree with what’s true** | Give them the fair part · Drop the hedges · Their side, then yours | Rapid Fire, prepared speech | `agree-then-differ` |
| **4. Say “I don’t know” well** | Don’t bluff · Caught out? Own it | prepared speech | `admit-it-well` |
| **5. Short, then stop** | Answer, then stop · Hand it back · The run | Rapid Fire, prepared speech | `short-then-stop` |


## What the engine needs

**Done (decision 144):** parts can now record stories (with their set-up), readings, pause drills, small-talk questions and lessons, as well as Rapid Fire, prepared speech and free talk; practices with their own screens are links under the idea. **Still open:** the user's own talk inside a part, and the new measures. The table as planned:

| Change | Needed for | Size (rough) |
|---|---|---|
| Story mode in a part, with a shape, focus or template | Stories that land | Small: the story screen already takes these |
| Small-talk drills and Talk with someone in a part | Beyond "good, you?" | Medium: each has its own screen and return path |
| Voice drills, read aloud, pause drill and shadowing in a part | A voice they lean in for, Ready by the day lesson 5 | Medium |
| A part on the user's own talk (Rehearse my talk and its ladder), with a sample talk when there is none | Ready by the day | Medium: no fixed prompt, so the comeback compares runs of the same talk |
| New measures: time to the first word, pauses taken, pitch at line ends, questions asked, talk share | Better comparisons in courses 1, 5 and 6 | Varies; most are already measured somewhere and only need adding to `CourseMeasure` |

## Questions for you (answered 2026-10-29)

The user left the content to Claude ("I trust you to make the content for now"). As built: the six names kept; "Back on track" added to Stop freezing; Ready by the day on sample talk tasks with links to the user's own talk; the writing order as suggested; See it uses our own model answers only, until the course videos exist.
