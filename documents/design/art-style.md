# Art Style: the Blob, Scenes, Course Tiles and Videos

**Purpose:** The rules that keep VoiceLab's drawings looking like one family, and the recipe for adding more. Read this before drawing a new scene, tile, course header or video.
**Last updated:** 2026-11-05 (decisions 134, 136, 142, 143 and 145; the Illustration Study's richer rendering, section 3a, and course headers, section 3b)
**Code:** `src/components/scenes/Scene.tsx` (the blob, its faces, the scenes), `src/components/scenes/CourseTile.tsx` (course tiles: the registry), `src/components/scenes/tiles/` (the shaded `Body`, `Twinkle` and each course's drawings, one file per course; decision 145), `src/components/scenes/art/` (the richer rendering: `light.tsx` for light, land, grain and shadows, `TileFrame.tsx` for the frame every tile is drawn in, `headerScenes.tsx` for the course headers), `src/components/scenes/CourseHeader.tsx`, `src/components/scenes/ModeTile.tsx` (mode tiles), `src/components/script/BlobFace.tsx` (the voice shape's face), `video/` (short videos). The motion lives in `src/app/globals.css` under "The blob scenes (decision 136)".

## 1. The character: the blob

The blob is VoiceLab's one recurring character. Everything else is a prop around it.

| Rule | Detail |
|------|--------|
| **One outline, never redrawn** | Always draw the body from `BLOB` in `Scene.tsx` (a slightly uneven round, 100 units across its radius). Place and size it with `translate(x y) scale(r / 100)`. Do not draw a new circle or a new blob path: the slight unevenness is what makes it recognisable |
| **Its colours** | Body `warm`; shaded side `warm-shade`; face `on-warm`. A second person in a scene is the same outline in `accent` with an `accent-ink` face. It is never another colour |
| **Shading (course tiles and videos)** | Use `Body` from `tiles/parts.tsx` (re-exported by `CourseTile.tsx`; a second person is `Body` with `accent`, the accent colour with a darker crescent from `on-warm` at 25%, so the shade stays dark in both themes), which draws (1) the body in `warm-shade`, (2) the body in `warm` over it, nudged `translate(-9 -8) scale(0.93)` so the shade shows as a crescent at the lower right, and (3) an `art-cream` highlight at 50%: an ellipse at (-50, -54), 20 by 12, turned -35°. The light always comes from the upper left. Scenes (the small ink-line drawings) stay flat, with no shading |
| **The lit blob (tiles, mode tiles, course headers)** | Inside a lit drawing (one drawn in `TileFrame` or `CourseHeader`, which set `--vl-art-on` and `--vl-art-lit` on their root; `litStyle` in `art/light.tsx`), the same `Body` also gets the Illustration Study's look: a body light (a radial gradient over the whole body, `art-cream` at 50% at the upper left, clear through the middle, `on-warm` at 30% at the lower right), a thin `art-cream` rim light along the lower right edge, `art-coral` cheeks at 40%, a catchlight in each open eye (it blinks with the eye), and a soft contact shadow (`on-warm` at 20%) on the ground under it. Pass `shadow={false}` for a blob in the air or inside something (a parachute, a block of ice); `look="flat"` keeps a blob flat even in a lit drawing. Outside a lit drawing (the cast, the videos) these details are switched off, so `Body` looks as it always did |
| **The face** | Two dark ovals for eyes and one simple mouth, in the blob's upper middle. No nose, no eyebrows except to show worry or puzzlement, no outlines. Use a face from `Face` (`ready`, `wow`, `sing`, `happy`, `down`, `up`, `wonder`, `puff`, `side`, `side-left`, `flat`); a new face goes into `Face` so every drawing can use it. Eyes blink (`s-blink`) |
| **Personality** | Friendly and a little earnest. It can be surprised, puzzled, nervous or proud, never cross, mocking or sad. When it gets something wrong, it looks puzzled ("hmm"), not ashamed: VoiceLab never makes the user feel judged |
| **Limbs** | Only when they show something. Arms are short ellipses (about 10 by 16 tile units) in `warm`, the far arm in `warm-shade`, tucked behind the body at its sides (not on top, or they read as ears). Feet are flat `warm-shade` ovals, only when it runs or stands on something. No hands, fingers or legs |
| **Accessories** | One at most, and only when it tells the idea: a crown, a headband, a parachute. Accessories use the art colours, never `warm` |

**Two people talking** (decisions 149 and 150): `SceneCast` (`src/components/scenes/SceneCast.tsx`) draws you as the warm blob and the person you are talking to as the accent blob, facing each other on a ground line, with a speech bubble while they speak. Their face shows how the conversation is going: `happy` when pleased, `side-left` at ease, `flat` (open eyes, a straight mouth; added for this) when deflated, never cross. It is the one looping drawing on a scene or story screen. Practice's rows for the two modes use the scenes `scenes` (the blob wondering beside three reply cards, the chosen one swinging out) and `listening` (the other person talking, sound arcs travelling to the blob, who leans in).

**Story scenes** (decisions 152 and 153): `who-i-am` (the blob beside a framed picture of its smaller self, the frame swaying on its nail), `interview` (its bubble showing a result climbing), `toast` (one arm raised behind the body holding a glass, a sparkle rising), `choice` (two paths, the chosen one's sign lit) and `story-dice` (two dice hopping). The setup screen shows the same scene as the Practice row or Today step it came from, so the drawing glides in.

## 2. Three families: scenes, tiles and course headers

The Illustration Study (`documents/design/redesign/art-studies/art.html`, "How rich can the art get?") is the art direction. What makes it richer than the flat tiles it replaced: a scene, not an icon; depth in layers (far shapes lighter, the middle, the character up front); light (soft gradients from one source, glows, soft shadows, a contact shadow under the blob); a fine grain over everything; the blob with a lit body, rim light and cheeks. The settled rule from the house style (`house-style-handoff.md`) still holds: **simple single-idea tiles in the app; rich scenes belong in video and in the big course headers.** So tiles keep one idea, readable at 64 px, drawn with the study's rendering; the course headers are the full scenes.

| | **Scenes** (decision 136) | **Tiles** (course tiles, decision 142; mode tiles) | **Course headers** |
|---|---|---|---|
| For | A kind of practice (Rapid Fire, a story, reading aloud…), Today's steps, the focus picker | A course or a lesson; a kind of practice on a card | The top of a course |
| Shape | 120 square | 200 square | 1200 by 480 (5:2) |
| Look | Flat theme colours (`warm`, `accent`, `card`, `warm-tint`) with `ink` lines 2.6 units thick, on whatever is behind | No outlines; a bright, tilted rounded square lit from the upper left, land behind, grain; the lit blob; one prop; sparkles | A place: a sky lit from one source, two or three layers of land, the course's idea acted out, the lit blob (and the cast), grain |
| Size on screen | 48 to 128 px | 64 to 240 px (up to 620 px in videos) | The width of its column |
| Feel | Quiet, an icon that moves | A picture-book cover | A picture-book spread |

Do not mix them: no ink outlines on a tile or a header, no tilted ground behind a scene.

**Mode tiles (the UI rewrite, 2026-11-04).** The redesign shows a kind of practice as a tile, not a scene: `ModeTile` (`src/components/scenes/ModeTile.tsx`) is a course tile built from parts, a ground (`sky`, `sun`, `bloom`, `leaf`, `plum`, `coral`), one prop from a fixed set (a bolt, a campfire, a speech bubble, waves, a pause sign, a bullseye, a calendar, a glass, an ear, a question mark, a book, three dots, a flag, a loop, a star, a microphone, a door) and the shaded blob's face. Each kind's tile is in `SCENE_TILES` (`modeTileFor.ts`), keyed by its scene name, so every place that knew a kind's scene now shows its tile (Practice cards and rows, Today's steps, the panel at the top of a mode's screen). Courses and lessons keep their own hand-drawn tiles. The ink-line scenes stay for the focus picker and the drawings inside screens. A mode tile on a card sits on its ground's soft tint (`GROUND_TINT`).

**Buddy (the UI rewrite).** `Buddy` (`src/components/scenes/Buddy.tsx`) draws the blob (you) or Sage (the coach, the same outline in the accent green, a little wider and settled, as in [characters/sage.md](characters/sage.md)) on its own, bobbing gently (`b-bob`) unless still. Sage speaks in a `BUBBLE` on Today and the welcome; the blob keeps you company on a course path and heads Me.

## 3. Anatomy of a course tile

1. **The tile:** `rect x=14 y=14 width=172 height=172 rx=34` (the clip uses the same shape). It leans between 3° and 5°, left or right; tiles shown next to each other lean opposite ways. `TileFrame` draws it (see 3a): a tile's file only gives its ground, lean and drawing.
2. **The ground:** one art colour (`art-sky`, `art-sun`, `art-bloom`, `art-leaf`, `art-plum`, `art-coral`). Neighbouring tiles use different grounds. Pick one that suits the idea (calm green for breathing, sunny yellow for a win).
3. **One background shape**, clipped to the tile: a large circle or a ground line, lighter (`art-cream` at 15–20%) or darker (`on-warm` at 10%). Two at most, and then in opposite corners.
4. **The blob:** radius 24 to 46 tile units, usually lower-middle, with its face suiting the idea.
5. **One prop that tells the idea in a glance:** the bullseye for "point first", the pause sign for "buy a beat". Props use the art colours and `art-cream`, and must stand out from the ground (never a leaf-green prop on a leaf-green ground).
6. **One or two sparkles** (`Twinkle`), in `art-cream` or `art-sun`, in empty corners.
7. **Room to breathe:** keep everything about 10 units inside the tile's edge. Nothing pokes out past the tile, except a moving part's overshoot.

The test that matters: shrink it to 64 px. If the idea is still clear from the prop and the blob's face, it works; if not, remove detail rather than add it.

### 3a. The richer rendering (the Illustration Study, in every tile)

`TileFrame` (`art/TileFrame.tsx`) draws every course tile and mode tile the same way, so a tile's own drawing stays one idea:

1. **A soft shadow under the tile:** the same rounded square in `on-warm` at 10%, nudged down and right, away from the light.
2. **The ground, lit:** the ground's role as a gradient, lighter (24% towards `art-cream`) at the upper left, its own colour in the middle, deeper (26% towards `on-warm`) at the lower right.
3. **The sun's glow** from the upper left: a soft `art-cream` radial glow, clipped to the tile.
4. **Land, in two layers** (`land: "hills"`, the default): a far hill in `art-cream` at 20%, then the near ground in the ground's role darkened 30%, at 55%. A tile with its own floor, steps or sky may set `land: "none"`. This is the tile's one far shape and its ground; with it, keep at most one background shape of the tile's own.
5. **The drawing,** with the lit blob (section 1).
6. **A fine grain** over the tile: fractal noise as dark specks at 16%, clipped to the tile. It reads as illustration rather than clip art, and disappears at 64 px, as it should.

Mode tiles (`ModeTile`, from a ground, a prop and a face) use the same frame, with their prop and blob upright and a soft drop shadow under the prop (the `-drop` filter). A prop must stand out from its ground: a sun-coloured prop on a sun ground gets an `art-cream` outline (the star, the bolt).

### 3b. Course headers

`<CourseHeader course="<course id>" />` (`src/components/scenes/CourseHeader.tsx`; scenes in `art/headerScenes.tsx`) draws a course's wide scene, like the study's "Stop freezing" (you stepping out of a melting block of ice in sunlight) and "Stories that land" (a campfire at night, the friend and Sage listening). Every course has one; a test fails when a course has none.

- **One place, one idea acted out:** a knot pulled into a straight line (Explain it simply), a path up a hill to a flag beside a circled date (Ready by the day), a spotlight on a stage (A voice they lean in for), a storm's spiky question and you calm under an umbrella (The tough question).
- **Light from one source:** the sun (`Sun`), a fire or lamp (`Glow` with `warm`), or a spotlight beam. The sky is a vertical gradient (`Sky`) made from tones of the art roles; night skies are art roles darkened towards `on-warm`.
- **Depth in three layers:** far land paler with distance, the middle, then the blob (and the cast) up front with a contact shadow (`Shadow` under things that are not a `Body`).
- **Composition:** the focal point sits right of middle, so a title laid over the lower left still reads. Keep faces and the idea out of the outer 60 units, which a `fit="cover"` band may crop.
- **The cast:** you are the lit `Body`; the friend and Sage come from `Cast` (placed with `CastAt` in the scenes file), never redrawn.
- **Size:** it fills its container's width at 5:2 (`fit="width"`, the default), or fills a box of any shape behind words, cropped round its middle (`fit="cover"`). It is an image with a label (`role="img"`; pass `label` to replace the scene's own description).
- **Motion:** one main movement and helpers (the fire's glow and flame, drips and drifting ice); by default `motion="few"`.

## 4. Colour

- **Only theme roles**, never raw colours (a test fails on any hex in a component). Gradients, glows and shadows read the roles' CSS variables: `role("art-sky")` is `var(--vl-art-sky)`, and `tone("art-sky", 0.3)` mixes it 30% towards `art-cream` (or, with a negative amount, towards `on-warm`) with `color-mix`. Give them to a gradient stop as a style (`<Stop at={0} color={tone("art-sun", 0.6)} />`), never as a raw colour. Light in a drawing is always `art-cream`; shade and shadow are always `on-warm`. The art roles exist for drawings and are never used for text: `warm-shade`, `art-sky`, `art-sun`, `art-bloom`, `art-leaf`, `art-plum`, `art-coral`, `art-cream`. They are defined in every theme in `src/theme/themes.ts`, slightly deeper in dark mode. The gray theme keeps them gray on purpose.
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
| **Budget** | On one screen, one drawing loops (`motion="loop"`), the others play three rounds and rest (`"few"`), and rows only blink (`"still"`). A course header counts as a drawing in the budget and defaults to `"few"`. The light, the land and the grain never move. With reduced motion, every drawing is still |
| **Where** | Keyframes live in `globals.css` inside the "only when motion is welcome" block: scenes use `s-*`, tiles use `t-*`. Reuse one before adding one. The loops so far: `t-float`, `t-breathe`, `t-pulse`, `t-drift`, `t-air`, `t-wobble`, `t-wave`, `t-step`, `t-glide`, `t-speed`, `t-flag`, `t-patter`, `t-twinkle`, and (decision 145) `t-sway`, `t-nod`, `t-hop`, `t-slide`, `t-ring`, `t-swing`, `t-glow`, `t-pop` |

## 6. Adding a new course tile (recipe)

1. Name it after the lesson's idea (`"point-first"`) and add it to its course's file in `src/components/scenes/tiles/` (a new course gets a new file, spread into `TILES` in `CourseTile.tsx`; `CourseTileName` follows from the keys).
2. Give it a ground (`fill`) and lean (`tilt`): a different ground from its neighbours in the course, leaning the other way.
3. Draw it in `draw`, following section 3. Comment every line, as everywhere.
4. Map the course or lesson to it in `src/components/scenes/tileFor.ts`. The test `tests/unit/content/tileFor.test.ts` fails until every course and lesson has a tile.
5. Add the name to the list in `tests/component/courseTile.test.tsx`.
6. **Look at it.** Open `/dev/tiles` (or `/dev/tiles?course=…`; `&still=1` stills the motion) while developing: for each course its header, then every tile at 240 px beside the same tile at 64 px; at the end (without `?course=`), every mode tile. Screenshot it at 1440 and 390 wide, in light and dark, beside the Illustration Study, and take eight frames 0.4 s apart to check the motion stays small and pivots in the right place.
7. Record it in the decision for that course and in `design-system.md`.

The same steps, with `Scene.tsx` and `sceneFor.ts`, add a scene.

## 7. Review checklist

- Is the blob drawn from `BLOB`, in `warm`, shaded with `Body` (tiles and headers, lit there) or flat (scenes)? Is its contact shadow off when it is in the air?
- Is it drawn in the lit frame (`TileFrame` or `CourseHeader`), with light from the upper left (or the scene's one source), land behind, and grain?
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

### Course shorts (decision 145)

Every course has a 15-second short (`video/src/CourseShort.tsx`, one component; the words are in `video/src/shorts.ts`). The shape, for any new course:

- **About 12 seconds of voice, then a 2.5 to 3 second end card.** A hook (the problem, with a bubble prop), the course's name with its tile, three lessons named with their tiles popping in, and a short close. Each phrase is one idea.
- **Tiles take the stage:** while a tile is shown (with a label such as "Lesson 2 · Point first"), the blob steps down and shrinks underneath and keeps talking. The background never matches the tile's ground; the video picks another colour if a phrase's does.
- **Voice:** "Mira – Bright & Friendly Narrator" (ElevenLabs, `eleven_v4`), each phrase on its own line with a direction tag where it helps (`[curious]`, `[worried]`, `[warm]`, `[confident]`, `[cheerful]`). When the voice pauses inside a line, or adds a sound of its own (a sigh), set the line's `span` or give the sound its own caption, so the phrases still line up.
- **End card:** the course tile, "VoiceLab", the course's name and one line on it ("6 short lessons · practise out loud").

### Lesson clips (decision 146)

A lesson clip teaches one idea inside a course part's "See it" step. It is not an advert, so it differs from the shorts:

- **4:5 (1080 by 1350), 30 to 45 seconds:** about 30 seconds of voice and a 4-second closing card.
- **Calm:** one background per beat (not per phrase), a few beats only, slower moves. A label for the course and lesson at the top left; no app name.
- **Captions:** one short phrase at a time, in a cream box near the bottom. The voice pauses often in a calm read, so each pause is its own caption.
- **Teach from the Learn cards,** and end on something to do: a closing card such as "Today, notice … Tonight: write one line".
- **Reuse the drawings:** the lesson's own tile appears once; simple props (cards that turn over, a notebook line writing itself) do the explaining.
- **The blob gives its own example (decision 147):** one beat where it tells, in the first person, an ordinary moment that shows the lesson's idea ("Here’s mine…"), on a cream story card titled "My moment", "My update" or similar, its key words writing themselves in. No real people, brands, places or news.
- **Made from data:** a clip is its lines, beats and closing card in `video/src/lessons/clips/`; the pictures are a bubble, the tile, a burst struck through, "instead of" then "try", cards turning over, numbered steps, a page of lines, and the example card. Text that fits: card labels up to 18 characters, step labels 16, list lines 40, contrast lines 70, example quotes 60.

