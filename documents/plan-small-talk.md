# Plan: small talk and storytelling

Proposed 2026-10-17; building started the same day. The user's own goal: answer everyday questions ("How was your weekend?", "How was your trip?") with a short, lively story instead of "Good, not much", and build a habit of expressing themselves. VoiceLab is a personal app, so this is shaped around that struggle rather than a general audience.

## What the user decided

| Question | Decision |
|----------|----------|
| What to build first | The short mode only: a voice asks one everyday question, you answer, and that is the whole exchange. Longer conversations where the voice answers you come later |
| Summaries during the conversation | Never. The voice does not repeat or sum up what you said; reflection happens in the notes afterwards |
| Teaching | Lessons as well as practice: what makes a good answer and what to listen for, shown on screen while practising until it sticks |
| Voice | ElevenLabs (the user is happy to pay) |
| Where it lives | **Separate from the speech practice for now** (2026-10-17): its own tab, "Small talk", between Skills and History. Small-talk answers stay out of today's plan, the weekly focus, the streak and strip on Today, History and the speech progress numbers; they are listed on the Small talk page. Ways to join the two up come later |
| Defaults offered and not changed | Answers of 20 to 45 seconds; the recipe Moment · Hook · Feeling · Hand back; an optional "one moment a day" note; the recipe strip stays still while you talk (no live ticks) |

## What the research says (short version)

- **People like those who ask follow-up questions** ([Huang et al., 2017](https://www.hks.harvard.edu/publications/it-helps-ask-cumulative-benefits-asking-follow-questions); a real but modest effect). So a good answer gives the other person something to follow up on: details that invite a question, which the communication writer Alan Garner calls "free information" ([Art of Manliness](https://www.artofmanliness.com/social/social-skills/social-briefing-9-think-questions-ask-people/)).
- **Small moments make good stories.** Matthew Dicks's "Homework for Life" (noting the most storyworthy moment of each day) trains you to notice material you would otherwise forget ([Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-to-tell-better-stories-matthew)).
- **A little of the real you helps.** Sharing about yourself goes with being liked ([Collins & Miller, 1994](https://pubmed.ncbi.nlm.nih.gov/7809308/)), and people underestimate how much others want more than surface talk ([Kardas, Kumar & Epley](https://www.chicagobooth.edu/review/deep-conversations-strangers-are-more-fulfilling-small-talk)).
- **Match the depth to the setting, then hand it back.** One pleasant moment and a question back suits a coworker ([overview](https://speakconfidentenglish.com/?p=387958)); a specific question back beats a bare "you?" ([Gretchen Rubin](https://nextbigideaclub.com/magazine/gretchen-rubin-9-strategies-making-small-talk-less-awkward/7119)).
- **Feedback after, not during.** Duolingo's AI calls never correct you mid-conversation because it breaks the flow ([Duolingo](https://investors.duolingo.com/news-releases/news-release-details/duolingo-launches-ai-powered-video-call-android)); Yoodli also analyses afterwards ([Yoodli](https://support.yoodli.ai/en/articles/9550465-practice-with-yoodli)).
- **Learn from an example, then less and less help.** Seeing a worked example before trying, with guidance that fades as you improve, is a well-established way to learn a skill. It shapes the lessons and the on-screen strip.

## The recipe

Four beats, about 30 seconds:

| Beat | What it means | Example |
|------|---------------|---------|
| **Moment** | One thing that happened. Small is fine | "Kind of a nerdy weekend: I built an app." |
| **Hook** | A specific detail they could ask about | "It coaches me on public speaking, and I got it working on my phone Sunday night." |
| **Feeling** | Why it mattered to you | "Way more fun than it sounds. I got a bit obsessed." |
| **Hand back** | A real question back | "Did you get up to anything good?" |

One line of "why it works" goes with each beat, shown in lessons and in the notes:
- Moment: "One thing told well beats a list. Small moments make better stories than big events."
- Hook: "People like those who ask follow-ups, so give them something to follow up on."
- Feeling: "Saying why it mattered is what makes it sound like you."
- Hand back: "A question back turns your answer into a conversation."

## The lessons (on the Small talk page)

Each lesson: the idea in a few lines, a flat answer beside a good one (the good one can be played in the voice), then your turn with a prompt that uses the idea.

| # | Title | The idea | Flat | Good | Your turn |
|---|-------|----------|------|------|-----------|
| 1 | The dead end | "Good" or "Not much" gives the other person nothing to say next. Even a quiet weekend has one thing worth telling | "Good, pretty chill." | "Pretty quiet, but I finally fixed my bike, so that felt good." | How was your weekend? |
| 2 | One moment | Pick one thing and tell it, rather than listing everything. Small is fine | "I did some chores, watched TV, went to the store." | "I spent Saturday morning at the farmers' market and found the best peaches I've had all year." | What did you get up to yesterday? |
| 3 | Give a hook | Add a detail someone could ask about: a name, a place, a number, something odd | "I watched a movie." | "I finally watched *Dune*. I saw it on the biggest screen I could find, and the sound alone was worth it." | Seen anything good lately? |
| 4 | Say how it felt | One line on why it mattered: proud, relaxed, surprised, obsessed | "Work's fine. Busy." | "Busy, but in a good way. We shipped something I've been on for months, and I was weirdly proud of it." | How's work? |
| 5 | Hand it back | End with a real question, ideally about the same thing | "It was good. Anyway." | "…It was such a good trip. Have you been anywhere this year?" | How was your trip? |
| 6 | All together | All four beats, about 30 seconds | — | The recipe example above | Rotating everyday questions |

After the lessons, the everyday questions are reps on the Small talk page.

## The everyday questions, easiest first

1. **Recent past:** How was your weekend? What did you get up to? How was your trip? Anything fun lately? How have you been?
2. **Work:** How's work? What are you working on? What do you do?
3. **Taste:** Seen or read anything good lately? What do you do for fun?
4. **Plans:** Anything coming up? Plans for the holidays? Doing anything this weekend?

About 30 questions to start, each with a stable id, in `src/content/` like the other prompts.

## The flow of one answer

1. The question shows on screen with **"Hear it"**. Tapping it plays the question in the voice. The tap also counts as the "user action" iPhones require before playing sound.
2. When the voice finishes, recording starts by itself, so the recording never picks up the voice.
3. While you answer, the **recipe strip** sits under the question: Moment · Hook · Feeling · Hand back. It stays still, with no ticks while you talk.
4. You speak for 20 to 45 seconds, with a light like the Table Topic one: green at 20 seconds, yellow at 35, red at 45, stopping by itself at 60.
5. **Listening back** asks the four questions instead of the usual tags. You tick the beats you heard yourself do before seeing any feedback, so you judge first:
   - Was there one clear moment?
   - Is there a detail someone could ask about?
   - Did you say how it felt, or sound like you enjoyed it?
   - Did you end on a real question?
6. **The notes** follow the same four beats, quoting your own words under each, then give one change. Below them comes your answer made livelier **using only facts you said**, with the beats labelled. "Try it again" carries the one beat to work on.

### The strip fades as you improve

- At first, each beat shows a one-line reminder.
- Once a beat has been found in 3 of your last 5 answers, its reminder shrinks to just the word.
- Once all four have been found in 3 of the last 5, the strip is hidden. "Show the recipe" brings it back.

## What the phone checks, and what needs the coach

**On the phone, with no coach needed:**

| Check | How |
|-------|-----|
| Dead-end opening | The answer starts with "not much", "nothing really", "good", "fine" or "pretty chill" and has fewer than 15 words |
| Length | Inside the 20 to 45 second window |
| Feeling | A word from a list (fun, loved, proud, relaxing, excited, surprised, obsessed, glad, ...) |
| Hand back | A question phrase in the last 12 words: "what about you", "how about you", "how was yours", "did you", "have you", "are you" |

**From the coach:**
- whether there was one clear moment
- how many hooks there were, and the best one
- whether the feeling came through
- how good the hand-back was
- the livelier version, built only from the user's facts
- one change

The coach gets a dedicated small-talk prompt with that rubric. Without the coach, the phone's checks pick the one change (the same idea as decision 40).

## One moment a day (optional)

A short voice note on the Small talk page: "What's one thing from today worth telling?" It is saved like a session but kept out of every number. The weekend questions show your recent moments as a reminder before you answer. It is private, and never sent to the coach.

## The voice (ElevenLabs)

- **How it works:** a server route `/api/voice?prompt=<id>` looks up the question's text **on the server**, so it only ever speaks the app's own prompts, never text sent from outside. It asks ElevenLabs for the audio (`POST /v1/text-to-speech/{voice_id}`, high-quality model `eleven_multilingual_v2`; latency does not matter for fixed prompts). The route is gated by the passphrase, like the coach.
- **Caching:** each question's audio is cached on the phone after the first play. About 30 short questions use a tiny share of a plan's monthly characters.
- **Fallback:** when there is no key, no connection or no passphrase, the phone's own voice reads the question (robotic on iPhone, but it works). The question is always written on screen too.
- **Later:** the longer conversations would use the same route with the coach's reply text, so this is the groundwork for them.

### What you set up (never paste a key into this chat)

1. Create an ElevenLabs API key limited to **text to speech** only, with a monthly credit limit if you like ([ElevenLabs authentication](https://elevenlabs.io/docs/api-reference/authentication/llms.txt)).
2. Put it in `.env.local` and the hosting dashboard as `ELEVENLABS_API_KEY`. No `NEXT_PUBLIC_` prefix: the key stays on the server.
3. Pick a voice in the ElevenLabs voice library and set its ID as `ELEVENLABS_VOICE_ID`. A voice ID is not a secret, so you can also just tell me the voice's name or ID.

## Not in this plan

- Conversations where the voice answers you back (the next plan, once this one works).
- Recording real conversations with other people (consent laws, and it changes how people act).
- Listening drills ("support, not shift" responses), which come with the conversations.

## Stages

1. **Content and checks.** Built. The questions, the six lessons with their examples, the recipe text, and the phone's checks (`src/core/smallTalk.ts`), all with tests.
2. **The mode.** Built (decision 42); the lessons' teaching lives on the recording page before the question, so there are no separate lesson pages. A new session mode `smalltalk` kept out of the speech numbers, the Small talk tab and page, the recording page with the strip and its fading, the timing window, the four listen-back questions, and notes by beat (phone checks first).
3. **The voice.** Built (decision 43). The `/api/voice` route with a stand-in for tests, the "Hear it" button, auto-start after the voice, caching, and the phone-voice fallback.
4. **The coach.** Built. The small-talk prompt and schema (moment, hooks, feeling, hand-back, livelier version, one change), shown by beat.
5. **Lessons and moments.** Built (decision 44). The lesson pages (idea, flat and good examples, your turn) and the one-moment note, all on the Small talk page.
6. **Docs, decisions, screenshots,** Done. and a browser journey through a whole answer.

## Open questions

- **Which voice:** pick one in the ElevenLabs voice library.
- **Joining it up with the speech practice:** later, once the small-talk part works on its own.
