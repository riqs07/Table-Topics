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
- The week's focus tilts the Delivery pick (pausing week brings more pause drills).
- **Review is mixed in:** about one day in three, a lane offers something you did a week or more ago (a lesson's beat, an earlier question) instead of something new. Spacing and mixing kinds of practice both help retention.

## The Connection curriculum

Six units. Each unit: lessons in the app (idea, a flat example beside a better one, your turn), a voice drill where one is possible, and real-world missions that climb from easy to harder.

| Unit | What it teaches (from the research) | Drill in the app | Missions, easiest first |
|------|-------------------------------------|------------------|-------------------------|
| **1. Answering** (built) | Moment, hook, feeling, hand back | Everyday questions | Give one detail and a question back when someone asks how you are |
| **2. Asking** (built, decision 47) | Follow-up questions; pick up what people mention in passing; don't "boomerask" (ask so you can answer yourself); stay with their answer one more turn | The voice says something with a detail ("I just got back from Lisbon"); you ask one follow-up (aim for under 12 seconds). Notes: open or closed, picked up the detail, about them or you, one question | Ask one follow-up question → ask two before sharing anything of yours → find out one thing about someone you did not know |
| **3. Listening** (built, decision 47) | Listeners are co-narrators: specific reactions ("no way!", a wince) make stories better; support rather than shift; check you understood | The voice tells a short story, not shown on screen; you respond in up to 30 seconds. Notes: a reaction, their words, their feeling, any shift to yourself | Let someone finish a story without adding yours → react specifically to one story → ask "what happened next?" |
| **4. Reading the room** | Notice changes (lighting up, shorter answers, glancing away), treat them as questions, adjust or ask; eye contact rises and falls naturally; show interest with a real smile and nods. Myths named plainly | Scenario cards: "Their answers are getting shorter and they keep checking their phone. What do you say?" You answer aloud | Notice what made someone light up → notice one sign someone wanted to go, and wrap up → match someone's energy |
| **5. Starting and ending** | Openers from what is around you; names; conversations run longer than people want, so warm exits are kind | Practise an opener and an exit line aloud | Say hello to a neighbour → use someone's name twice → end one conversation warmly on a high point |
| **6. Going deeper** | People like you more than you think (the liking gap); deeper talk goes better than expected; share a little more | "Upgrade the question": turn "What do you do?" into something that invites a real answer | Ask one "what's the best part of..." question → share one honest opinion → ask a deeper question of a friend |

Lessons are written from the research note, quoting the finding in one plain line ("why it works"), as the small-talk lessons do now.

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
- **Privacy:** the conversation is sent to the AI as it happens; this is opt-in and said plainly. *As built: only the conversation's words (as text) are sent, and only when the passphrase is set; no audio of you leaves the device.*

## Where things live (to decide)

Five tabs is the most Apple and Google suggest. One option: **Today · Practice · Connect · Learn · History**, with Skills' lessons and readings moving into Practice as "Speaking", and Small talk becoming Connect. Another: keep the tabs and put Learn inside Skills.

## Stages

1. **The daily mix:** three lanes, the rules above, small talk counting for the streak and History (moments stay private). Built (decision 46); since decision 51 the day is a Learn card, the warm-up, then two picks from the bank's three groups, with "Keep going" suggestions afterwards. Spaced review of earlier lessons in the lanes is still to come.
2. **Connection units 2 and 3:** asking and listening lessons, and their voice drills. Built (decision 47).
3. **Missions and debriefs.** Built (decision 52): predict, try, debrief by taps or voice, compare.
4. **Learn:** the card format, recall questions, and the first sets (body language myths, charisma, conversation).
5. **Units 4 to 6** and their missions. A "Responding to news" unit came first (decision 55), from the 2026-10 research; the missions ladder (decision 52) covers their real-world tries.
6. **The live conversation partner.** First stage built (decision 83): four characters with recorded lines, tap Done to end each turn, about 3 minutes, and the coach's notes on the whole conversation afterwards. Second stage built (decision 84): the four are personas with a fixed personality and life, in eight situations (two per skill) with a different twist each time, and with the coach every line is written for the situation by Claude and spoken in their voice by ElevenLabs; the recordings remain for use without the coach. Still to come: harder versions unit by unit, and a conversation in the daily mix.

## Open questions

- **Tabs:** decided 2026-10-18: Today · Practice · Connect · Learn · History (decision 48).
- **Debrief:** voice, taps, or both?
- **Missions:** every day, or a few days a week (with in-app drills on the others)?
- **Streak:** forgiving (a rest day a week keeps it going), as the UX research suggested?
