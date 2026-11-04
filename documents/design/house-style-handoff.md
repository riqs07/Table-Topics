# House style: handoff notes (in progress)

**Purpose:** Where our understanding of VoiceLab's house style stands (graphics, styling, storyboarding, video), so a new session can pick it up and keep refining it until it is ready to become a skill. This is a record of what we have learned, not a rulebook. Update it at the end of each design session.
**Last updated:** 2026-11-04 (first session: the redesign direction, the cast, the art studies, the first posted reel).
**Read with:** [redesign/README.md](redesign/README.md) (the app redesign, direction B, the cast) and [art-style.md](art-style.md) (the current app's drawing rules).

## How to resume

1. Read this file, then skim `redesign/README.md`.
2. Open the studies listed below in a browser (they are self-contained HTML) and watch the reel.
3. Ask the user what they want to push next; show options as stills before animating, animate before voicing, voice before polishing.
4. At the end, add what was learned to the sections below (move items from "Emerging" to "Settled" only when the user confirms).

## What the user responds to (the strongest signal)

| Liked | Disliked |
|---|---|
| Duolingo-like warmth, but grown-up; direction B, Playful | Anything childish (Finch's home) or generic "vibe-coded" (glassy purple gradients) |
| Scenes that carry an idea you can guess without the caption: the museum of the pause, the story blueprint, the runway "STOP", the cutaway of your head | The blob next to a prop; busy scenes as small tiles (better as video) |
| The glowing science-explainer look (dark sky, saturated glow, tiny characters, a real study) | Default rounded fonts that read as "AI slop" |
| Simple rounded characters told apart by silhouette | Accessories and human details on characters (glasses, hats, hair, headphones) |
| Characters that react kindly; arms only when gesturing | Arms at rest; constant looping motion |
| Sources shown as objects (the clipped journal card) | Strike-through lines and generic citation text |
| Quick social pace | Beats that change before you can read them |

## Settled (confirmed by the user)

- **App direction:** B, Playful. The cast: you (apricot round), Sage (pine coach, sprout), the friend (teal egg, curl); bosses Wobbly, Bun, Squircle; Pear held back. No accessories; small non-human details are fine.
- **Tiles vs. video:** simple single-idea tiles in the app; rich scenes belong in video.
- **Reels:** under about 20 s, a hook in the first 3 s with the character in it, a real study on screen, Mira's voice, sparse sound.
- **Type for video:** Fraunces (the app's serif) for headlines, Atkinson for body, IBM Plex Mono for "evidence".

## Emerging (seen working, not yet confirmed)

- **One finding per reel, acted out:** worry, then "science says", then a visual metaphor that *is* the finding (the storm shrinking into a porthole), then the data with the source on the same screen, then what it means for you, then a one-line takeaway.
- **Holds:** every beat needs 0.5 to 1 s with nothing new appearing after its line, longest on the reveal, the smile and the data (the user's note on the first reel).
- **One moving thing at a time;** stagger the rest.
- **Night-sky explainer look** as the social style; the soft-glow daytime look for the app.
- **Special formats** where the content fits: a blueprint for structure, a museum for "value this", a runway for endings, a weather map for reading the room.
- **Sound:** voice first; one thunderclap beats continuous effects; ambience under the voice.

- **Charts (sketch, 2026-11-04, `redesign/chart-kit.html`):** one chart language from five marks (your voice as a ribbon, a gap for a real pause, a dot for a pause word, pitch as one soft line, last time as a dashed ghost); a headline that the chart proves; your words as the axis where possible; no red (teal for went-well, apricot for pause words, grey for short); colours validated for colour blindness in both themes.

## Open questions

- Is the night-sky explainer look *the* brand look, or the social one only?
- Course path: venues are a working idea; tiles that get harder to a boss is the agreed shape.
- Music: none yet (needs the full ElevenLabs connector or a licensed track).
- The origin story (the characters began as the record button): where to tell it.
- Should reels always end on the title card?

## Where everything is

| What | Where |
|---|---|
| App redesign: direction, cast, picks, storyboard (30 screens) | `redesign/README.md`, `redesign/*.html` |
| Reference screenshots and the user's ranking | `redesign/references/` |
| Art studies (tiles, styles, people, showpieces, wild ideas, explainers) | `redesign/art-studies/*.html` |
| The posted reel, the second reel, storm-beat tests, blueprint video, title cards | `redesign/art-studies/*.mp4`, `*.png` |
| Video source: reels, storm beat, blueprint, title card | `video/src/demo/SciencePosts.tsx`, `StormBeat2.tsx`, `StoryBlueprint.tsx`, `TitleCard.tsx` |
| Voiceover and sound effects | `video/public/reels/` |
| Render | from `video/`: `export CHROMIUM_PATH=/opt/pw-browsers/chromium`, then `npx remotion render src/index.ts ScienceTransparency out/x.mp4` (stills: `npx remotion still … --frame=N`) |
| ElevenLabs | voice "Mira – Bright & Friendly Narrator" (`eleven_v4`, tags like `[soft]`); sound effects `eleven_text_to_sound_v2`; the flow "VoiceLab reel: storm sounds" holds this session's takes |

## Workflow that worked

1. Explore wide as stills (four storm options), the user picks or combines.
2. Animate the pick as a short standalone clip.
3. Write the voice script, generate, split it at its pauses, and time every visual to those cues (plus holds).
4. Add sound last, under the voice.
5. Check stills from every beat before each full render.
