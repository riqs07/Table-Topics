# Plan: storytelling as a practice mode

> **Update, decision 126 (2026-10-25):** the shapes and the one-focus choices below were replaced by four templates (Lesson learned, Client win, Turning point, Funny moment), the coach marks each template beat strong, weak or missing, the phone's checklist and the shape strip left the results, and 4/3/2 is its own drill page. The research below still stands; the shapes are kept only so older stories read.

**Built 2026-10-21 (decision 92); guided stories added the same day (decision 93).** The user asked to "add emphasis on stories and story telling … create story telling as a practice mode". It is a first-class part of the app, not a drill: its own place on the Practice menu, its own page, a step in today's practice, a family on the speaking profile, and its own coach.

## The idea in one line

Tell a short, true, everyday story, then tell the same story again, a little better. Retelling is the heart of it: storytellers improve a story by telling it many times, and the app's retry-with-before-and-after loop (decision 18 onwards) is already built for exactly that.

## What the research says, and what it changes

Sources were checked on 2026-10-21. Evidence strength follows the house scale (strong, moderate, practical).

| Finding | Strength | What the app does with it |
|---|---|---|
| People who are absorbed in a story ("transported") are more persuaded by it, and transportation is helped by characters a listener can picture and a plot that is easy to imagine ([Green and Brock 2000](https://www.onfiction.ca/2014/06/transportation-into-narrative-worlds.html); meta-analysis of about 76 studies, [van Laer et al. 2014](https://openaccess.city.ac.uk/id/eprint/6755/)). A large experiment found stories no more persuasive than facts for policy views (already a Learn card) | Strong for absorption, mixed for persuasion | Coach and checks aim at what makes a story easy to picture: specific detail, someone's words, a turn. The app never claims stories always beat facts |
| Told stories of personal experience share a shape: orientation (who, where), complicating action, evaluation (why it matters), resolution, and a coda that returns to now ([Labov and Waletzky 1967; Labov 1972](https://cle.ens-lyon.fr/anglais/fichiers/william-labov-a-structural-analysis-of-narrative-mode-de-compatibilite-769-_1366115192183-pdf)) | Strong (decades of use) | The **Classic** shape: where and who, what went wrong, the turn, how it ended, what it meant. The coach's five beats (setting, stakes, turn, ending, meaning) follow the same parts |
| Linking beats with "but" and "therefore" instead of "and then" turns a list of events into cause and effect ([Parker and Stone, NYU 2014, as reported](https://perell.com/note/but-therefore-rule/)) | Practical | The **But and so** shape; the phone counts "and then"; the change without the coach swaps "and then" for "but" or "so" |
| Conversational storytellers build involvement with **constructed dialogue** (reported speech) and **detail that creates images** ([Tannen, *Talking Voices*, 1989/2007](https://www.deborahtannen.com/talking-voices)) | Strong (linguistics) | The checks look for reported speech ("she said", "I was like", "he goes") and specific details; two of the focuses are "Add one line of what someone said" and "One vivid detail" |
| Concrete words are remembered and understood better than abstract ones, though not in every study ([review summarised here](https://www.wyliecomm.com/concrete-images-in-writing/); [Richardson 1975 on limits](https://oro.open.ac.uk/50257)) | Moderate | Details count as numbers, times, names and places; "One vivid detail" asks for something a listener can picture |
| A story turns on one small moment of change or realisation; start close to the change, with forward movement, not by setting expectations ([Matthew Dicks, *Storyworthy*, in interview and summary](https://www.artofmanliness.com/people/social-skills/how-to-tell-better-stories/); [summary](https://jithinvmadathil.substack.com/p/the-art-of-storytelling-insights)) | Practical | **One small moment** and **Then and now** shapes; the "Start in the middle" and "End on the point" focuses; the check for a lead-in ("so basically", "let me tell you about") and for an ending that states the change. The existing "One moment a day" notes (Dicks's own habit) feed this mode |
| Listeners are co-narrators: distracted listeners make tellers tell worse, especially endings ([Bavelas et al. 2000](https://www.responsebasedpractice.com/wp-content/uploads/2020/04/Listeners-as-Co-Narrators.pdf); already in Learn) | Strong | Practising alone, the ending is the part most likely to trail off; it is a check and a focus |

## Where it lives

- **Practice menu:** a "Tell stories" group, second after "Speak on the spot": Today's story, Tell one again, From your moments, and See all. `JOBS` gains "Tell stories" (`/stories`) and `MODES` gains "Storytelling". Note: neither Today nor Practice draws `JOBS` as cards today (Practice is grouped rows since decision 48, Today shows the plan), so the job entry is catalogue data and the visible place is the Practice group.
- **`/stories`:** Today's story; **Your stories** (each by title, renamable, how many times told, when, the takeaway for next time, **Tell it again** and the last telling); **From your moments** (the latest five notes, each "Tell it properly"); **Something to tell** (the prompt bank folded by group).
- **The Small talk page's moment list** also offers "Tell it properly" under each note.
- **`/stories/tell?prompt=…` or `?moment=…`:** the prompt or the note's words, then the choices, with a preview of the shape card. Start opens the recording page.
- **Today's practice:** a story step about twice a week (rule in [plan-daily-mix-and-connection.md](plan-daily-mix-and-connection.md#the-daily-mix)).
- **Learn:** "One thing, told well" and "A story always beats facts" now lead to Stories. More story cards come in a separate change.

## Picking a story

- **The bank** (`src/content/stories.ts`): 40 prompts, five in each of eight groups: a time something went wrong, a small win, a first time, someone who changed your mind, a place, a surprise, something you learned, something funny. All start "Tell me about", all light and everyday; a test refuses heavy words (death, illness, accidents and the like). Today's prompt steps through the bank by a stride of 7, so neighbouring days come from different groups and every prompt comes up once in 40 days.
- **Your moments:** a moment note seeds a story whose id is `moment-` and the note's id.
- **Your stories:** a story already told, to tell again.

## Shape and focus

Optional, chosen before planning, shown as a small card while planning and in one line beside the voice shape while telling:

| Shape | Beats |
|---|---|
| Classic (default) | Where and who · What went wrong · The turn · How it ended · What it meant |
| But and so | What you wanted · But… · So… · But… · So, in the end… |
| Then and now | How it was before · The moment it changed · How it is now |
| One small moment | Where you were, in one line · The moment: what you saw, heard, said · What it meant to you |

One focus, or "Just tell it" (the default): Start in the middle; Add one line of what someone said; One vivid detail; End on the point; Under a minute (which also picks the short length).

## Planning and telling

The recording page in mode `story`: the prompt, the shape card and the focus, then **Plan it** starts up to a minute of planning with the clock (as a prepared speech's two minutes; **Ready** skips the rest), then recording. **Short** is about a minute (green 0:45, yellow 1:00, red 1:15, 15 seconds' grace, stops at 2:00); **Full** is two to three minutes (green 2:00, yellow 2:30, red 3:00, 30 seconds' grace, stops at 4:00). The lights are the prepared speech's pattern (`STORY_WINDOWS` in `src/core/recordingRules.ts`).

## Results

- **What I heard** (`src/core/storyChecks.ts`, pure and tested): started in the action (no lead-in such as "so basically", "this one time", "let me tell you about"), someone's words ("she said", "I was like", "he goes", or a quote; "he went home" is not speech), specific details (numbers, times, names and places, up to five), a turn ("but", "suddenly", "until", "turns out", "so then"…), a feeling word, and an ending that states a point or change ("since then", "I realised", "now I"…). A string of "and then" is called out. Browser transcripts come without punctuation, so the first sentence is the first 12 words and the last the last 15 when there are no full stops. The page says plainly these are rough guesses.
- **One change:** from the story coach; without it, from the checks (`storyChange`): the chosen focus first if it was missed, then "and then" in place of a turn, then the first missing check in the order start, turn, details, someone's words, the point, a feeling. A telling well past its window is told to land sooner first.
- **Your line → Could sound like:** the coach quotes one sentence and rewrites it in the speaker's voice, inventing nothing, with gaps in square brackets, as the conversation results do.
- **The beats the coach heard:** setting, stakes, turn, ending, meaning, each with the words that showed it.
- The usual numbers, voice section, notes, timing ring, and "See all measures for this take".

## Telling it again

"Tell it again" (on the results and in Your stories) opens the recording page with the same seed and `retryOf` the latest telling; the shape, focus and length are read from that telling, so they stay the same whatever the address says. The new telling's page keeps its full results and adds **Last time and this time**: what it was working on, a headline ("5 of 6 this time, up from 2."), and a table of each check and the usual numbers on both tellings (the second-try table, now shared as `BeforeAfterTable`). Every telling is a session with the story's id as its `promptId`, so the versions are simply the story's sessions in time order (`storyVersions`).

## Telling it three times (4/3/2, decision 118)

Built 2026-10-22. A story can be told three times in one sitting, shorter each time, after Paul Nation's 4/3/2 fluency activity: a short story 2:00, 1:30, 1:00; a full one 3:00, 2:15, 1:30 (a prepared speech keeps Nation's 4:00, 3:00, 2:00). It is a switch on the set-up page and a link before telling, so it works with Tell it again too. Each round is a telling of the same story, linked by a loop id; after the third, the rounds are compared: one line on what changed (pace and pause words, only past the noise), the phrase row with all three rounds' curves where the words line up, and a small table with the story checks per round. It is not part of today's practice (three sessions in one step would change the plan's rules; see decision 118).

## Data

The simpler sound option: **the seed's id is the story's id**, kept as each telling's `promptId`, plus a small `stories` collection for the title (`StoryRecord`: id, title, createdAt, updatedAt). Each telling also keeps its set-up (`story: { shape, focus, length }`). Counts, the latest telling and the takeaway are worked out from the sessions, so nothing is stored twice. Export and import carry stories; the merge keeps the most recently renamed title and the earlier first-told date (`mergeStory`). Details in [architecture/data-model.md](architecture/data-model.md).

## Measures and the profile

Seven phone measures (`story.*`, engine `device-story-v1`) and six story-coach scores (`rub.story_*`), in a "Stories" group, and a "Stories" family that compares stories only with stories. Details in [architecture/measurements.md](architecture/measurements.md#stories-decision-92).

## Guided stories (decision 93)

The user asked for "more of a guide for the user... like sample scenarios... you went to the zoo and you ate some food and you saw a gorilla. And you just have to retell that story, but make it maybe a little bit more exciting."

- **Content** (`src/content/guidedStories.ts`): 24 guided stories, ids `gs01` to `gs24`. Each has a title ("A day at the zoo"), three to five plain facts written flat on purpose ("You went to the zoo." "You got a hot dog." "You saw a gorilla."), two or three nudges toward what to add ("What did the gorilla do?") and a starting focus that suits it. Twelve are **Just the facts** (easier) and twelve end **With a twist** (harder: "The gorilla was staring right at you."); the twist is what makes one harder (`guidedLevel`). Light and everyday: a bad haircut, a cooking disaster, a missed train, a first day, a lost phone, a camping trip, moving house, a dog that got out, a job interview, wedding rings, a surprise party, being locked out… A content test keeps 3 to 5 facts and 2 to 3 nudges, unique ids, no heavy words, and the facts flat: no feeling, reported speech, turn or point in them, so anything the comparison finds came from the user.
- **Where:** a "Guided stories" section on `/stories`, second, after Today's story: "You get the facts. You make it a story." and two folds, one per level, each row the title with its first fact. A "Guided stories" row in Practice's "Tell stories" group links to it (`/stories#guided-stories`).
- **Set-up and telling:** `/stories/tell?prompt=gs13` shows the title and the **facts card** (`GuidedStoryCard`): the facts numbered, the twist marked, "Make it yours" with the nudges, and the chosen shape and focus by name. It takes the place of the shape card rather than sitting beside it, so a phone shows one card; the shape's beats are left off it because the facts are the beats here. The focus starts on the story's own (for the zoo, "Start in the middle") and can be changed; shapes and lengths work as for any story. While telling, the facts sit on one line beside the voice shape, with the focus.
- **Results** (`src/core/guidedStory.ts`, pure and tested): **What you added** replaces "What I heard": a feeling, someone's words, a turn, details of your own (names, numbers, places and times, plus colours, sizes, sounds and textures, since guided details are rarely names) and a point at the end, each only when the facts did not already say it. Then **The facts · N of M heard**: a fact counts as heard when at least half its content words were said (rough stems, stop words left out, two words run together counting, so "hotdog" meets "hot dog"); each fact not heard is listed with the words listened for. The page still says these are rough guesses. Without the coach, the change (`guidedChange`) is: too little said, then the chosen focus if missed, then a missing fact, then "and then", then the first thing not added.
- **Coach:** the story coach looks the guided story up by id on the server (the facts never come from the request) and gets its title, facts, twist and nudges. The reply gains `broughtToLife` (one or two sentences on what was added beyond the facts and what is still flat, shown on the results as "Beyond the facts, the coach heard") and the story rubric gains `alive` (0 to 3); both are null for any other story, and the six existing rubric ids are unchanged. The e2e stand-in has a guided reply (`GUIDED_COACH_REPLY`).
- **Library and Tell it again:** the guided id is the story's id, as for a prompt, so Your stories, renaming and Tell it again work unchanged. A retelling's headline counts what was added ("You added 4 of 5 this time, up from 1.") and its table shows each added line, the facts kept and "and then" on both tellings.
- **Measures:** `story.added` and `story.facts_kept` (engine `device-guided-v1`) and `rub.story_alive`, only on guided tellings ([measurements.md](architecture/measurements.md#stories-decision-92)).
- **Plan:** the on-the-spot group's second story turn is a guided story, so open and guided alternate ([plan-daily-mix-and-connection.md](plan-daily-mix-and-connection.md#the-daily-mix)).

## Choices that differ from the brief, and why

- **A story's id is its seed's id**, not a separate id on each session: a prompt or moment note can only ever be one story, so a second id could only drift. The `stories` collection still exists, for the editable title.
- **The plan step uses the short length by default**, so today's practice stays a few minutes; the full length is one tap away.
- **"Tell it again" keeps full results** (with the comparison added) rather than the bare second-try screen, because a retold story still deserves its checklist and the coach's line.
- **The library's takeaway is the next telling's cue** (the coach's retry cue, or the checks'), because that is what the user needs before telling it again.
- **The Practice group sits second**, after "Speak on the spot", since `JOBS` is not drawn as cards anywhere.

## Not verified yet

Guided stories: the facts check and the added list have only met stand-in speech and written transcripts; how often a real browser transcript loses a fact the user did say is not known yet. The story coach's prompt has only been run against recorded and stand-in replies, not the live model; the checks have only met stand-in speech and written transcripts, not a real voice on a phone.
