# Plan: the daily mix, the conversation curriculum, and learning cards

Proposed 2026-10-18, for the user to read before anything is built. The user's direction: "a Duolingo for speech and charisma". Every day a short practice drawn from a bank of different kinds, a curriculum for real conversations with practice out in the world, a live conversation partner with feedback, and an educational part. The research behind it is in [research/charisma-conversation-duolingo-2026-10.md](research/charisma-conversation-duolingo-2026-10.md).

## What the user decided (2026-10-18)

| Question | Decision |
|----------|----------|
| How today's practice is chosen | Three lanes, one step from each, picked within the lane: **Delivery**, **Thinking on your feet**, **Connection** |
| "Coached session" | A **live conversation with feedback**: an AI voice you talk with, notes afterwards |
| Small talk and missions in the streak and History | **Yes** once they are part of the daily mix (changes decision 42, which kept small talk apart) |
| Research first | Done: charisma, body language, conversation, Duolingo |
| Educational content | **Yes**, as its own part of the app |

## The shape of the app

Like Duolingo, a **path** for each area, and a short **daily mix** that draws on all of them:

- **Speaking** (Delivery): reading aloud, pause drills, voice and clarity lessons.
- **On the spot** (Thinking on your feet): Table Topics, prepared speeches, openings and closings, everyday questions.
- **Connection**: the conversation curriculum below, missions, and later the live conversation partner.
- **Learn**: short cards on what the research says (charisma, body language myths, listening), each ending with a recall question.

From Duolingo we take the path of units, short sessions, spaced review mixed in, a streak and feedback after conversations. We leave out leagues and hearts: they add pressure without helping learning, and losing hearts for mistakes works against speaking nerves.

## The daily mix

One step from each lane, each day:

| Lane | Drawn from |
|------|------------|
| **Delivery** | The next part of a speech to read aloud, a pause drill, a skill lesson, tricky words, (later) a voice-variety drill |
| **Thinking on your feet** | A Table Topic, an everyday small-talk question, an opening or closing drill, a prepared speech (at most once a week) |
| **Connection** | The next Connection lesson, a round of quick scenarios (decision 72), today's mission (with its evening debrief), a listening or follow-up drill, (later) a live conversation, a Learn card |

Rules:
- Picked from the date and the sessions before today, so it never reshuffles during the day (as now).
- The same kind of step is not used two days running within a lane, and each kind comes round at least once a week.
- At most one long step a day; the day stays about 5 to 10 minutes.
- A talk coming up still takes the On-the-spot step; new users still get a gentle first week.
- **Stories (added 2026-10-21, decision 92).** The on-the-spot group's kinds are taken in turn as Rapid Fire, story, opening or closing, story, prepared speech (`GROUPS` in `src/core/dailyPlan.ts`). A story is two turns in five of a group that comes up two days in three, so about twice a week, and it never follows itself because an opening or Rapid Fire sits between. The step is today's story prompt (`storyPromptForDay`), set up on `/stories/tell` with the short length chosen first inside the plan, and counts as 2 minutes (a minute to plan, about a minute to tell). It is done by any telling of that prompt today. In the first days the prepared speech is still left out, which leaves Rapid Fire, story, opening, story. Chosen over a new lane or a swap in the conversation group because it leaves every other group's rotation, and the plan's existing tests, as they were.
- **Guided stories (added 2026-10-21, decision 93).** The second story turn is a guided story: the kinds are now Rapid Fire, open story, opening or closing, guided story, prepared speech. So the story steps still come about twice a week, never twice in a row, and alternate open and guided. The guided step is today's guided story (`guidedStoryForDay`, a stride of 5 through the 24, so all come up before any repeats), labelled "Guided story", two minutes, set up on `/stories/tell?prompt=gs…` with the short length and the story's own focus.
- The week's focus tilts the Delivery pick (pausing week brings more pause drills).
- **What you want to get better at (added 2026-10-21, decision 97).** The welcome asks "What do you want to get better at most?", one or two of six areas, saved as `practiceFocus` (`src/core/practiceFocus.ts`). The weighting rule: **two of the day's four steps come from the focus, the Learn card and the first pick; the warm-up and the second pick stay as they were.** In detail:
  - *The card* is the next unread card in the focus's Learn sets (in the order the area lists them), else the next unread card anywhere.
  - *The first pick* is the focus's kind for the day, its kinds taken in turn on the days it leads, so it never repeats on consecutive turns: telling stories → open story, guided story; small talk and conversations → the next unit lesson or drill, quick scenarios, an everyday question; thinking on my feet → Rapid Fire, prepared speech, a lesson (point-reason-example, recover from a blank); how I sound → a voice drill, a pause drill, the week's skill drill; speaking at work → a lesson (point-reason-example, signposting, bridges), a work prepared speech (an update, a new way of working, explaining your job, a change at work, thanking or welcoming a team, news that changes plans), an opening or closing; a talk coming up → an opening or closing, a lesson (pause before you start, open with a hook, a strong close, recover from a blank), a prepared speech.
  - *The second pick* comes from whichever of today's two bank groups is not the focus pick's lane, with the group's usual turn of kinds (the next kind if it would repeat the focus step), so the other skills keep coming round.
  - *Two areas* share the day: one gives the pick and the other the card, swapping each day (by the day's number, so the same all day).
  - *Kept rules:* four steps (a card first, the warm-up, two picks in different lanes), day one opens with free talk, the first days leave out prepared speeches (the focus's own too), a dated talk still takes a pick (the focus's when the focus is "a talk coming up", otherwise the second), and without a focus, or with an empty one, the plan is exactly as before (a test compares three weeks of both).
  - *Keep going* leads with the focus's next kind; once every step is done, Today's main band offers the leading area's next thing (another story, a conversation, one more Rapid Fire, a voice drill, a short speech, rehearsing your talk).
  - A change in Settings applies at once, so today's steps can change after it; a step already done stays recorded in History.
- **Check-in days (added 2026-10-21, decision 100).** On a weekly check-in day (day two to four of use for the first, then the chosen weekday with two days of grace) the plan is the check-in (6 minutes: read, pitch, story, surprise question) and the Learn card; the warm-up and both picks give way, since the check-in already reads aloud, speaks on the spot and tells a story. Worked out from the days before today, so it stays the same all day; never on day one. Details in [plan-weekly-check-in.md](plan-weekly-check-in.md).
- **Review is mixed in:** about one day in three, a lane offers something you did a week or more ago (a lesson's beat, an earlier question) instead of something new. Spacing and mixing kinds of practice both help retention.

## The Connection curriculum

Six units. Each unit: lessons in the app (idea, a flat example beside a better one, your turn), a voice drill where one is possible, and real-world missions that climb from easy to harder.

| Unit | What it teaches (from the research) | Drill in the app | Missions, easiest first |
|------|-------------------------------------|------------------|-------------------------|
| **1. Answering** (built) | Moment, hook, feeling, hand back | Everyday questions | Give one detail and a question back when someone asks how you are |
| **2. Asking** (built, decision 47) | Follow-up questions; pick up what people mention in passing; don't "boomerask" (ask so you can answer yourself); stay with their answer one more turn | The voice says something with a detail ("I just got back from Lisbon"); you ask one follow-up (aim for under 12 seconds). Notes: open or closed, picked up the detail, about them or you, one question | Ask one follow-up question → ask two before sharing anything of yours → find out one thing about someone you did not know |
| **3. Listening** (built, decision 47) | Listeners are co-narrators: specific reactions ("no way!", a wince) make stories better; support rather than shift; check you understood | The voice tells a short story, not shown on screen; you respond in up to 30 seconds. Notes: a reaction, their words, their feeling, any shift to yourself | Let someone finish a story without adding yours → react specifically to one story → ask "what happened next?" |
| **4. Reading the room** (built, decision 95) | Notice changes (lighting up, shorter answers, glancing away), treat them as questions, adjust or ask; eye contact rises and falls naturally; show interest with a real smile and nods. Myths named plainly | Scenario cards: "Their answers are getting shorter and they keep checking their phone. What do you say?" You answer aloud | Notice what made someone light up → notice one sign someone wanted to go, and wrap up → match someone's energy |
| **5. Starting and ending** (built, decision 95) | Openers from what is around you; names; conversations run longer than people want, so warm exits are kind | Practise an opener and an exit line aloud | Say hello to a neighbour → use someone's name twice → end one conversation warmly on a high point |
| **6. Going deeper** (built, decision 95) | People like you more than you think (the liking gap); deeper talk goes better than expected; share a little more | "Upgrade the question": turn "What do you do?" into something that invites a real answer | Ask one "what's the best part of..." question → share one honest opinion → ask a deeper question of a friend |

Lessons are written from the research note, quoting the finding in one plain line ("why it works"), as the small-talk lessons do now.

**As built for units 4 to 6 (decision 95).** Each has six lessons (idea, a flat example beside a better one, your turn, and a "why it works" line with its source), twelve drills and four beats the phone checks. Their drills are **read on a card, not heard**: nobody is speaking to you in a described moment or a flat question, so there is no voice, and recording starts at the tap. Reading the room's beats are Name it, Ask, Their lead and Keep it light; Starting and ending's are Something here and Easy question for the opener, then What you enjoyed and Warm goodbye (a reason and a wish) in one take; Going deeper's are Open, Real answer, About them and Just one. Two refinements from the 2026-10 research: the name mission is the research-corrected "learn one new name and use it when you say goodbye" (m14, already in the ladder) rather than "use someone's name twice", which has no support; and "match someone's energy" is framed as matching the mood, not copying gestures, since deliberate mimicry did nothing in a preregistered test. Missions: Reading the room m15 (light up, easy) → m16 (wrap up, a stretch) → m17 (match energy, bold); Starting and ending m18 (say hello, easy) → m09 (end on a high point) → m13 and m14; Going deeper m10 (the "best part" question) → m11 (an honest opinion) → m19 (a deeper question of a friend). Each new mission has its own debrief question. Practice now shows the next unit and "See all", which opens every unit at `/small-talk`.

## Missions and debriefs

- **Morning:** the Connection step shows today's mission card: what to try, and one thing to notice. "I'll try it" accepts it (or "Not today", which offers an in-app drill instead).
- **Evening:** a short debrief by voice, or by tapping: Did you try it? What happened? What did you notice about them? What would you try next time? It is about what you learned, not whether it went well. On mission days it replaces the "one moment" note, so there is one evening habit.
- **Climbing:** each unit's missions get a little harder only after an easier one is done. "Too much" on a debrief steps back one.
- **Privacy:** nobody else is ever recorded; debriefs are your own words, kept on the phone, sent to the coach only if you choose.
- Missions count for the streak and appear in History.

## Learn (the educational part)

The full design (card format, evidence labels, recall and review, and a catalogue of about 35 cards with sources) is in [plan-learn.md](plan-learn.md). In short:


Short cards, three to five screens each, read in a minute, then one recall question (recalling beats rereading). Grouped into sets:

- **Charisma:** presence and warmth (influence and affability); charisma is a set of behaviours you can practise; stories, contrasts and lists of three; your voice (pitch variety and pace).
- **Body language, myth or fact:** "93% is non-verbal" (myth); power posing (did not replicate); reading emotions from faces (unreliable); spotting liars (barely better than chance); genuine smiles; mirroring (mixed); eye contact's natural rhythm.
- **Conversation:** the liking gap; follow-up questions; boomerasking; listeners as co-narrators; conversations end too late; deeper talk goes better than expected.
- **Speaking:** pauses, fillers and why counts are rough; pace; nerves.

Each card links to the practice that uses it ("Try it: a follow-up drill"). Earlier recall questions come back now and then in the daily mix.

## The live conversation partner (first stage built, decision 83)

The "coached session":
- **Characters with a situation:** a new coworker at a party, a friend having a rough week, someone quiet who gives short answers. Unit by unit they ask more of you.
- **Hold to talk:** no guessing when you have finished. Claude answers in character; ElevenLabs speaks it (the faster Flash model, for short gaps). *As built: tap Done when you have finished (the user found tapping better than holding). Decision 83 had Claude pick from recorded lines; since decision 84 Claude writes each line and ElevenLabs speaks it with delivery directions, so no two conversations are the same.*
- **No corrections mid-conversation:** after 3 to 5 minutes, the transcript and notes. Talk share, questions asked and how many were follow-ups, boomerasking, shifts versus support, and whether you came back to something they said. Then one change, and try again.
- **Privacy:** the conversation is sent to the AI as it happens; this is opt-in and said plainly. *As built: only the conversation's words (as text) are sent, and only when the passphrase is set; VoiceLab sends no audio of you. (Corrected 2026-10-21, decision 97: this said "no audio of you leaves the device", but the browser's speech recognition that turns your words into text usually sends the audio to Apple or Google.)*

## Where things live (to decide)

Five tabs is the most Apple and Google suggest. One option: **Today · Practice · Connect · Learn · History**, with Skills' lessons and readings moving into Practice as "Speaking", and Small talk becoming Connect. Another: keep the tabs and put Learn inside Skills.

## Stages

1. **The daily mix:** three lanes, the rules above, small talk counting for the streak and History (moments stay private). Built (decision 46); since decision 51 the day is a Learn card, the warm-up, then two picks from the bank's three groups, with "Keep going" suggestions afterwards. Spaced review of earlier lessons in the lanes is still to come.
2. **Connection units 2 and 3:** asking and listening lessons, and their voice drills. Built (decision 47).
3. **Missions and debriefs.** Built (decision 52): predict, try, debrief by taps or voice, compare. The prediction was removed in decision 104; now try, debrief, and see how it went.
4. **Learn:** the card format, recall questions, and the first sets (body language myths, charisma, conversation).
5. **Units 4 to 6** and their missions. Built (decision 95). A "Responding to news" unit came first (decision 55), from the 2026-10 research; then Reading the room, Starting and ending, and Going deeper, with five new missions in the ladder (decision 52) and the drill turns in the daily mix taken across all six units.
6. **The live conversation partner.** First stage built (decision 83): four characters with recorded lines, tap Done to end each turn, about 3 minutes, and the coach's notes on the whole conversation afterwards. Second stage built (decision 84): the four are personas with a fixed personality and life, in eight situations (two per skill) with a different twist each time, and with the coach every line is written for the situation by Claude and spoken in their voice by ElevenLabs; the recordings remain for use without the coach. Still to come: harder versions unit by unit, and a conversation in the daily mix.

## Open questions

- **Tabs:** decided 2026-10-18: Today · Practice · Connect · Learn · History (decision 48).
- **Debrief:** voice, taps, or both?
- **Missions:** every day, or a few days a week (with in-app drills on the others)?
- **Streak:** forgiving (a rest day a week keeps it going), as the UX research suggested?
