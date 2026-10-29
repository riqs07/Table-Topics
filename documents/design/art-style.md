# Art Style: the Blob, Scenes, Course Tiles and Videos

**Purpose:** The rules that keep VoiceLab's drawings looking like one family, and the recipe for adding more. Read this before drawing a new scene, tile or video.
**Last updated:** 2026-10-29 (decisions 134, 136, 142 and 143)
**Code:** `src/components/scenes/Scene.tsx` (the blob, its faces, the scenes), `src/components/scenes/CourseTile.tsx` (course tiles), `src/components/script/BlobFace.tsx` (the voice shape's face), `video/` (short videos). The motion lives in `src/app/globals.css` under "The blob scenes (decision 136)".

## 1. The character: the blob

The blob is VoiceLab's one recurring character. Everything else is a prop around it.

| Rule | Detail |
|------|--------|
| **One outline, never redrawn** | Always draw the body from `BLOB` in `Scene.tsx` (a slightly uneven round, 100 units across its radius). Place and size it with `translate(x y) scale(r / 100)`. Do not draw a new circle or a new blob path: the slight unevenness is what makes it recognisable |
| **Its colours** | Body `warm`; shaded side `warm-shade`; face `on-warm`. A second person in a scene is the same outline in `accent` with an `accent-ink` face. It is never another colour |
| **Shading (course tiles and videos)** | Use `Body` from `CourseTile.tsx`, which draws (1) the body in `warm-shade`, (2) the body in `warm` over it, nudged `translate(-9 -8) scale(0.93)` so the shade shows as a crescent at the lower right, and (3) an `art-cream` highlight at 50%: an ellipse at (-50, -54), 20 by 12, turned -35°. The light always comes from the upper left. Scenes (the small ink-line drawings) stay flat, with no shading |
| **The face** | Two dark ovals for eyes and one simple mouth, in the blob's upper middle. No nose, no eyebrows except to show worry or puzzlement, no outlines. Use a face from `Face` (`ready`, `wow`, `sing`, `happy`, `down`, `up`, `wonder`, `puff`, `side`, `side-left`); a new face goes into `Face` so every drawing can use it. Eyes blink (`s-blink`) |
| **Personality** | Friendly and a little earnest. It can be surprised, puzzled, nervous or proud, never cross, mocking or sad. When it gets something wrong, it looks puzzled ("hmm"), not ashamed: VoiceLab never makes the user feel judged |
| **Limbs** | Only when they show something. Arms are short ellipses (about 10 by 16 tile units) in `warm`, the far arm in `warm-shade`, tucked behind the body at its sides (not on top, or they read as ears). Feet are flat `warm-shade` ovals, only when it runs or stands on something. No hands, fingers or legs |
| **Accessories** | One at most, and only when it tells the idea: a crown, a headband, a parachute. Accessories use the art colours, never `warm` |

## 2. Two families: scenes and course tiles

| | **Scenes** (decision 136) | **Course tiles** (decision 142) |
|---|---|---|
| For | A kind of practice (Rapid Fire, a story, reading aloud…), Today's steps, the focus picker | A course or a lesson |
| Square | 120 units | 200 units |
| Look | Flat theme colours (`warm`, `accent`, `card`, `warm-tint`) with `ink` lines 2.6 units thick, on whatever is behind | No outlines; a bright, tilted rounded square with its own ground colour; shaded blob; sparkles |
| Size on screen | 48 to 128 px | 64 to 112 px (up to 620 px in videos) |
| Feel | Quiet, an icon that moves | A picture-book cover |

Do not mix them: no ink outlines on a tile, no tilted ground behind a scene.

## 3. Anatomy of a course tile

1. **The tile:** `rect x=14 y=14 width=172 height=172 rx=34` (the clip uses the same shape). It leans between 3° and 5°, left or right; tiles shown next to each other lean opposite ways.
2. **The ground:** one art colour (`art-sky`, `art-sun`, `art-bloom`, `art-leaf`, `art-plum`, `art-coral`). Neighbouring tiles use different grounds. Pick one that suits the idea (calm green for breathing, sunny yellow for a win).
3. **One background shape**, clipped to the tile: a large circle or a ground line, lighter (`art-cream` at 15–20%) or darker (`on-warm` at 10%). Two at most, and then in opposite corners.
4. **The blob:** radius 24 to 46 tile units, usually lower-middle, with its face suiting the idea.
5. **One prop that tells the idea in a glance:** the bullseye for "point first", the pause sign for "buy a beat". Props use the art colours and `art-cream`, and must stand out from the ground (never a leaf-green prop on a leaf-green ground).
6. **One or two sparkles** (`Twinkle`), in `art-cream` or `art-sun`, in empty corners.
7. **Room to breathe:** keep everything about 10 units inside the tile's edge. Nothing pokes out past the tile, except a moving part's overshoot.

The test that matters: shrink it to 64 px. If the idea is still clear from the prop and the blob's face, it works; if not, remove detail rather than add it.

## 4. Colour

- **Only theme roles**, never raw colours (a test fails on any hex in a component). The art roles exist for drawings and are never used for text: `warm-shade`, `art-sky`, `art-sun`, `art-bloom`, `art-leaf`, `art-plum`, `art-coral`, `art-cream`. They are defined in every theme in `src/theme/themes.ts`, slightly deeper in dark mode. The gray theme keeps them gray on purpose.
- `art-cream` is the "paper" of the drawings (pages, ice, signs, highlights) because it stays light in dark mode; `card` does not.
- A new colour role is a last resort: add it to `roles.ts`, every palette in `themes.ts`, the `@theme` block in `globals.css`, this table, and the design system.

## 5. Motion

The drawings move to feel alive, not to grab attention. A page full of them must still feel calm.

| Rule | Detail |
|------|--------|
| **Slow** | Loops of 1.4 to 5 seconds (blinks every 4.6 s). Fast things such as feet or a scribble move only a few pixels |
| **Small** | At most about 5 px, 10°, or 8% bigger. Nothing leaves its place |
| **One main movement, one helper** | E.g. the parachute sways (main) and a sparkle twinkles (helper). Out-of-step copies use `delay`, not new keyframes |
| **Turn from the right place** | Give `Move` an `origin` at the real pivot (an arm's shoulder, an arrow's tip, a flag's pole), in the drawing's own units |
| **Seamless loops** | A loop starts and ends at rest, or uses `alternate`, so it never jumps |
| **Budget** | On one screen, one drawing loops (`motion="loop"`), the others play three rounds and rest (`"few"`), and rows only blink (`"still"`). With reduced motion, every drawing is still |
| **Where** | Keyframes live in `globals.css` inside the "only when motion is welcome" block: scenes use `s-*`, tiles use `t-*`. Reuse one before adding one. The loops so far: `t-float`, `t-breathe`, `t-pulse`, `t-drift`, `t-air`, `t-wobble`, `t-wave`, `t-step`, `t-glide`, `t-speed`, `t-flag`, `t-patter`, `t-twinkle` |

## 6. Adding a new course tile (recipe)

1. Name it after the lesson's idea (`"point-first"`) and add it to `CourseTileName` in `CourseTile.tsx`.
2. Give it a ground and lean in `GROUNDS` (a different ground from its neighbours in the course).
3. Draw it in `TILES`, following section 3. Comment every line, as everywhere.
4. Map the course or lesson to it in `src/components/scenes/tileFor.ts`. The test `tests/unit/content/tileFor.test.ts` fails until every course and lesson has a tile.
5. Add the name to the list in `tests/component/courseTile.test.tsx`.
6. **Look at it.** Render the course page and screenshot every tile at 240 px side by side (light and dark), and take eight frames 0.4 s apart to check the motion stays small and pivots in the right place. Check it at 64 px.
7. Record it in the decision for that course and in `design-system.md`.

The same steps, with `Scene.tsx` and `sceneFor.ts`, add a scene.

## 7. Review checklist

- Is the blob drawn from `BLOB`, in `warm`, shaded with `Body` (tiles) or flat (scenes)?
- Is its face from `Face`, and is it kind?
- Is there exactly one idea-telling prop, readable at 64 px?
- Does every colour come from a role, and does each prop stand out from its ground?
- Is the motion slow, small, pivoting correctly, and within the budget? Does reduced motion still it?
- Does it look right in dark mode?

## 8. Short videos (decision 143)

Videos are made in `video/` with Remotion, which renders React to MP4. They use the app's own `CourseTile`, `Body` and theme, so the blob is the same character in the app and in a video. How to make one is in [video/README.md](../../video/README.md). The style rules:

- **Format:** vertical 1080 by 1920, 30 frames a second, about 20 to 30 seconds, with a 2 to 3 second end card (the course tile, "VoiceLab", the course and lesson).
- **Safe areas:** keep words and faces between 150 px from the top and 370 px from the bottom, and 150 px from the right, where the apps put their own buttons.
- **The blob talks:** `TalkingBlob` gives it a mood per phrase (`ready`, `wow`, `up`, `worried`, `closed`, `happy`) and a mouth that opens with the voice's loudness. While a phrase is being spoken, the mouth never quite shuts, so it does not flicker.
- **Backgrounds:** one art colour per idea, fading over 0.2 s, with two soft circles drifting. A tile shown on a background must not share its ground colour.
- **Props:** pop in with a spring when the word is said; leave in 0.2 s (a slow exit leaves specks behind the next idea).
- **Captions:** every phrase, in a cream box (44 px corners) near the bottom, Fraunces at 74 px, the word being said in `accent`.
- **Voice:** warm and friendly, at an even pace (the first video uses ElevenLabs' "Mira"). Write the script in the app's voice: short sentences, one idea each, no jargon.
