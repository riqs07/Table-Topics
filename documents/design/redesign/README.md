# Redesign direction: B, Playful (chosen 2026-11-04)

**Purpose:** What the later UX redesign should look and feel like, how it was chosen, and what is still open. Decision 157 points here. Nothing in the app has changed yet; the roadmap's "Later: a UX redesign" says when and how it gets built.
**Inputs:** the user's ranking of 24 screens from six apps ([references/ranking.md](references/ranking.md)), and three prototypes of Today and the result after a take ([prototypes.html](prototypes.html), open it in a browser; switch light and dark, a good or a rough take).

## How it was chosen

1. The user collected screens from Finch, Headspace, Wellspoken, Brilliant, Duolingo and an English tutor app, and ranked them on a five-step board from Love it to Avoid, with notes.
2. Three directions were prototyped with the same content: **A, Studio** (calm, today's apricot and green, refined), **B, Playful** (illustrated cards, a talking blob, chunky buttons, a slide-up feedback strip) and **C, Spotlight** (a new plum and marigold stage, the take drawn as a poster of the voice).
3. The user: "B is head and shoulders above the rest… closer to Duolingo. That's the direction we want to move in." They also liked A's single "Now" card on Today.

## What B means

| Area | B, Playful |
|---|---|
| **Feel** | Picture-book energy, but adult: grown-up words and type, never Finch's kid-app look (the user's one Dislike) |
| **The blob** | The app's voice. It talks in a speech bubble on Today, and reacts to every take: happy after a good one, puzzled (never sad or cross) after a rough one, as `art-style.md` already says |
| **Today** | A greeting from the blob, the week as tick squares, and the day's steps as **illustrated cards in a stack** that fan out on tap (Wellspoken's daily tasks). One big Start button. Take A's idea of one card clearly marked "now" |
| **Pictures** | Each step and course has a picture: the course-tile style (tilted ground, shaded blob, one prop), already drawn for every course, used much larger and more often |
| **Results** | Your words come back with pause words highlighted and real pauses marked, and a **feedback strip slides up** from the bottom (Duolingo): the blob peeking over its edge, one line, the cue, then one big button (Try again, or Continue) |
| **Colour** | Today's apricot blob and the art colours stay; the green becomes a brighter action green with a darker edge under chunky buttons. A rough take is warm amber, **never red** |
| **Type** | A rounded display face for headings and buttons (Fredoka in the prototype) with a friendly sans for reading (Nunito); to be settled in the design system |
| **Tabs** | Four, labelled: Today, Practice, Courses, Me. Progress and settings live together in Me (Headspace's profile, which the user loved) |
| **Both themes** | Light and dark are designed together; three of the user's four favourites were dark screens |

## Rules from the ranking

- Characters react, and make a miss feel fine (Duolingo's "Incorrect", the user's top pick for feedback).
- Pictures do the work (Wellspoken's drills: "like the pictures, like the vibe").
- A real progress home, but it never opens on zeros for a new user.
- One calm first screen: one character, one line, one button (Headspace's welcome).
- **Avoid:** glassy purple and blue gradients, and anything that looks generic or "vibe-coded" (the globe app).
- Keep the game layer light: no currencies, gems or hearts; the run stays forgiving.

## Later, not now

- Onboarding in Brilliant's and Duolingo's style (one question per screen, the blob speaking, a segmented progress bar). The user agreed the flows are much the same everywhere and it can wait.
- A course path like Duolingo's for Courses ("making the lessons fun and playful, even the navigator").
- Role-play packs, which map onto Scenes and Talk with someone.
- Choosing the blob's colour or voice at the start (neutral: "may be too much").

## Venues, Sage and the blob's moments (mocked up 2026-11-04)

[venues-and-cast.html](venues-and-cast.html), open in a browser:

- **The venue path** replaces the Duolingo-style course path the user found unoriginal: each lesson is a bigger room, the audience grows, and the course's boss waits in the last one (Stop freezing: mirror, sofa, café, meeting room, open mic, hall, then live on air with Benny). Every lesson stays open. Each course would get its own rooms.
- **Sage speaks for the app; the orange blob is you.** Sage greets you on Today, breathes with you before a timed take, teaches a lesson's idea while your blob gives its example, and gives the one note after a take. Drawn from `video/src/characters/Sage.tsx` and [../characters/sage.md](../characters/sage.md).
- **The orange blob's moments:** idle is a breath and a blink only (no constant bobbing, which the user felt could look cheap); a reaction plays once, with a wind-up, an overshoot and a settle: a nod for a held pause, leaning in when an ending trails off, a proud puff for a personal best, sheepish then "hmm" after a rough take, looking at the button for your turn, and moving with your voice while you speak. Eight still poses (ready, listening, thinking, proud, sheepish, cheering, waiting, focused) carry most of the expression.
- **The user's response (2026-11-04):** likes the direction overall.
  - **Course path:** keep the idea of a course as separate tiles that get harder, leading to the boss. Venues are a working version, not locked in.
  - **Sage and a cast:** Sage at those four moments is right, but **design the characters first**, before placing any of them on screens.
  - **Arms:** only when they show something (a gesture, a cheer), never at rest. This is already the rule in `art-style.md` ("Limbs: only when they show something"); the first mockup broke it and was fixed the same day.
  - **Later:** somewhere in the app, tell the story that the characters began as the microphone (record) button.
- **Open:** the user's blob colour (not attached to apricot); a new colour for "the other person" so Sage only ever means Sage (sage.md, question 3); whether polished rigs move to Rive later.

## Open questions

1. How playful can the wording get before it reads as childish? Test with real screens.
2. Fredoka and Nunito, or other rounded faces? Decide in the design system with a phone in hand.
3. Does Practice become a grid of illustrated tiles (Wellspoken), or a few big jobs with tiles inside?
4. What does Me show on day one, before there is any progress?

## The cast (proposed 2026-11-04)

The user: the orange blob stays **you** (every tile is about you), and the cast stays small but can be more than two. Proposed in [cast-lineup.html](cast-lineup.html), all at rest with no arms, told apart by shape first:

| Character | Role | Shape | Colour | Signature |
|---|---|---|---|---|
| You | the learner | the original uneven round | apricot | none |
| Sage | the coach, the app's voice | the round, 10% bigger and settled | pine green (green means Sage) | sprout, permanent brows |
| The friend (name open) | the other person in conversations, Scenes, role play | an egg | teal (new) | a curl on top |
| Benny | boss, Stop freezing | wide and round | purple | headphones, quiff |
| Jules | boss, Beyond "good, you?" | a tall bean | blue (was green) | beanie with a pom-pom |
| Helen | boss, Explain it simply | an upright rounded square | coral | high bun, glasses |

Open: the friend's name and colour; whether Helen's coral sits too close to your apricot.

**The user's verdict (2026-11-04):** the friend is kept; **Benny, Jules and Helen's drawings are rejected** (they were placeholders and look tacky). **No accessories on any character** (no headphones, hats, glasses or buns). Rounder bodies are fine. Next: [character-workshop.html](character-workshop.html), twelve accessory-free rounded candidates told apart by proportion, face and colour only, with Like / Maybe / No saved on the page. Open: whether Sage's sprout counts as an accessory, and whether the friend keeps its curl.

## Next steps

0. **Characters first (the user, 2026-11-04):** settle the cast (you, Sage, the other person, the bosses) as character sheets with shapes, colours, faces and poses at rest without arms, before more screens use them.
1. ~~Prototype the rest of B: Practice, a course, Me, and the recording screen.~~ Done 2026-11-04: [screens-b.html](screens-b.html) has Practice (a quick start and four illustrated jobs, role-play packs), Courses (courses and Learn's card sets in one tab), a course's path (every lesson open, no locks), recording (focus mode, the blob singing along, the cue in view) and Me (then and now you can hear, run, stats, takes, settings).
2. Turn B into a design system (tokens for both themes, type scale, card, button, sheet, tab bar) before any app code changes.
3. Then the roadmap's order: move logic still inside screens into `core` and hooks, and build the new screens one at a time behind a switch.
