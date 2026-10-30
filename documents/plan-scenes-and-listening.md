# Plan: Scenes and Active listening

**Built 2026-10-30 (decisions 149, 150 and 151).** The user asked to make the practice modes "a little bit more robust", starting with two: a choose-your-own-adventure conversation built from recorded lines ("you can kind of select the best answer, and then based on that answer, you know, the person talks back to you"), and an active-listening mode ("recorded voice lines that say something and you're supposed to respond back based on certain details"). Both were to feed Today and, later, the courses. The user approved the agent's three picks: build on the 27 quick scenarios rather than start again, tap for the first exchanges and speak the last one, and reuse the four people from Talk with someone and their voices.

## The idea in one line

**Scenes:** a short conversation with someone you have met before, where every reply you choose changes how they answer, and the last reply is yours, out loud. **Active listening:** someone tells you a story once; you answer out loud, and the phone shows which details you caught and whether you heard what mattered.

## What the research says, and what it changes

Sources are the ones already in [charisma-connection-deep-dive-2026-10.md](research/charisma-connection-deep-dive-2026-10.md), on the house scale.

| Finding | Strength | What the modes do with it |
|---|---|---|
| Competing wrong options teach: learners reason about every option to reject it, and recall the related material better ([Little & Bjork 2014](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2017/01/LittleBjorkMemCog2015.pdf)) | Moderate | Every option in a scene is plausible and named (the quick scenarios' tiers and patterns carry over), and the reason for each is shown after the choice |
| Follow-up questions raise liking, and people do not predict it ([Huang et al. 2017](https://dash.harvard.edu/handle/1/35647952)) | Strong to moderate | A follow-up about what they said is the best reply in most scenes, and Active listening checks whether your question was about the part that mattered |
| Perceived listening goes with relationship quality ([Kluger et al. 2024](https://www.hermanaguinis.com/pdf/JBPlistening.pdf)); listeners are co-narrators ([Bavelas et al. 2000](https://www.responsebasedpractice.com/wp-content/uploads/2020/04/Listeners-as-Co-Narrators.pdf)) | Strong (correlational) | Active listening exists at all: the skill is hearing the specifics, not having a reply ready |
| Active listening made people feel more understood than advice did ([Weger et al. 2014](https://reachfamilies.umn.edu/sites/default/files/prtw/2021-09/Weger_2014__2021091010606.pdf)) | Moderate | In both modes, advice before it is asked for is a misstep, and the spoken checks look for it |
| Paraphrasing alone did not make people feel understood ([Weger et al. 2010](https://stars.library.ucf.edu/scopus2010/1477)) | Mixed | Picking up their words counts, but it is one check of several; naming the feeling and asking about what mattered count too |

## Scenes (decision 149)

**Where:** Practice → Everyday conversation, second after Talk with someone; `/scenes` lists them and `/scenes/play?id=…` plays one. Today's conversation lane offers the next one (decision 151).

**A scene, step by step:**

1. **The setting**, two lines, and who you are with (one of the four people, drawn as the accent blob).
2. **They speak** (their recorded line, with the words on screen).
3. **You choose** one of three replies. Their tier and pattern stay hidden until you choose.
4. **They react** to the reply you chose, in their voice. Their face changes with the conversation: pleased, at ease or deflated. A short line says why your reply landed or did not, and what the best one was.
5. **A bridging line** that they say whatever you chose takes the conversation on (the branches join again, so a scene needs about 11 recordings, not dozens).
6. **A second choice**, the same way. A misstep never ends a scene: the next choice is a chance to win them back, which teaches repair.
7. **Your turn, out loud.** They say one more thing, and you answer in your own words (up to 45 seconds). The phone checks the reply against the scene's move: a reaction, their words, naming their feeling, one open question, staying on their story, no advice or "at least".
8. **They close** with a warm line when most checks passed, or a polite, flatter one when not.
9. **How it went:** your two choices with their tiers, the spoken checks with the words that showed each, the move in one line, and Play again.

**Warmth:** the best reply adds two, also good adds one, flat adds nothing, a misstep takes one away. The face follows it (two or more pleased, below zero deflated). It is never shown as a number.

**The first exchange of each scene reuses a quick scenario's situation and replies** where one fits, so the writing, the tiers and the reasons carry over. The quick round stays in Learn for now; Today offers scenes instead of it.

**Content:** eight scenes, two for each person, each in their character and a situation that fits their skill (Maya answering, Theo asking, Chris listening, Priya news).

## Active listening (decision 150)

**Where:** Practice → Everyday conversation, after Scenes; `/listening` lists the stories by level and `/listening/play?id=…` plays one. Today's conversation lane offers the next one (decision 151).

**A story, step by step:**

1. **Who and where**, one line, and what to listen for in general ("what happened, how it felt, what matters to them"). No text of the story is shown.
2. **They tell it**, 20 to 40 seconds, in their voice. On level 1 you may hear it once more; after that, once only.
3. **You answer out loud**, as you would to a friend (up to 45 seconds).
4. **The phone checks** the reply against the story: the details you picked up (each detail has a few words that count, numbers in digits and words), whether you named how it felt for them, whether a question went to the part that mattered (the core), whether you stayed on their story, and no advice.
5. **The reveal:** the story's words, with the details you caught marked and the ones you missed underlined, the core marked as what mattered, one example reply, and Hear it again.
6. **They answer you** with a short warm line when you asked about the core, or a polite one when you did not.

**Levels:** 1, a short story with clear details and a replay; 2, longer with more details, heard once; 3, what is not said: the thing that matters is implied (a move date said a little too flatly), heard once.

**Content:** nine stories, three per level, spread over the four people.

## Today and the courses (decision 151)

- Today's conversation lane takes, in turn: the next Connect lesson, a scene, an everyday question, an Active listening story. The quick scenarios round leaves Today's rotation (it stays in Learn and on Practice's full list).
- A scene's or a story's step is done when one was finished today. The next one offered is the first not yet played, then the one played longest ago.
- **Not built yet:** a course part that practises on a scene or a story. Course parts practise on recorded sessions (`CoursePracticeMode`), and neither mode saves one; the Connect course's listening lessons are the natural place for them. A later change.

## Storage

Neither mode saves a session or any audio. Progress is kept in the settings, so it travels in exports and is joined on import (the later play wins):

- `settings.scenes[sceneId]`: plays, first and last played, the last and best warmth, and the last spoken checks passed out of how many.
- `settings.listening[storyId]`: plays, first and last played, and the last and best number of details caught out of how many.

## Recordings

Every line is read once by the person's own ElevenLabs voice on `eleven_v4`, with audio tags for delivery, trimmed and evened to −16 LUFS as in decision 82, saved in `public/clips/` and listed in `src/content/voiceClips.ts`. Any line without a recording, or that will not play, is said by the phone's own voice, so both modes work before and without the recordings.

## What was not built, and could come next

- **Say yours first:** a harder scene where you speak your reply before the options appear, then see which one it was closest to.
- **Course parts** on scenes and stories (see above).
- **More scenes and stories,** and converting the remaining quick scenarios into scenes once the eight have been tried on the phone.
- **Background noise** for a fourth listening level (a café), and a recall question after a story.
