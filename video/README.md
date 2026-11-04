# VoiceLab videos

Short vertical videos starring the blob, made with [Remotion](https://www.remotion.dev) (React rendered to MP4). They import the app's own drawings (`CourseTile`, the blob's `Body`) and theme from `../src`, so the character looks the same in the app and in a video. The style rules are in [documents/design/art-style.md](../documents/design/art-style.md), section 8 (decision 143).

This folder has its own packages and is not part of the app's build, lint or tests.

## Make the "Buy a beat" video

```bash
cd video && pnpm install
```

```bash
pnpm render
```

The video is written to `out/buy-a-beat.mp4`. `pnpm studio` opens Remotion's editor in the browser to scrub through it. In a cloud session, point it at the installed Chromium first: `export CHROMIUM_PATH=/opt/pw-browsers/chromium`.

## How a video is put together

1. **Script:** a short list of phrases in the composition (`src/BuyABeat.tsx`, `SCRIPT`), each with the blob's mood and a background colour.
2. **Voice:** the script read aloud, saved as `public/take-a.mp3` (ElevenLabs, voice "Mira", model `eleven_v4`; tags such as `[hesitant]` shape the delivery).
3. **Prepare:** `scripts/prepare.mjs` runs before every render. It finds the phrases in the voice by its pauses (ffmpeg's silence finder), measures the loudness of every frame (for the mouth), and copies the app's scene animations out of `src/app/globals.css`. The render stops with a clear message if the number of phrases no longer matches the script.
4. **Compose:** the blob (`TalkingBlob`), props that pop in on their words, captions with the word being said picked out, and an end card. The app's CSS animations (the tiles' loops) are paused and set from the frame (`Synced`), so every render is the same.

## The course shorts (decision 145)

Each course has a 15-second short: `src/CourseShort.tsx` draws any of them from its words in `src/shorts.ts` and its voiceover in `public/courses/<course id>.mp3` (ElevenLabs, "Mira – Bright & Friendly Narrator", `eleven_v4`). `scripts/prepare.mjs` splits every voiceover at its pauses; a line that the voice paused inside covers two phrases (`span: 2`). The video stops with a clear message if the phrases and lines no longer match, or if the voice leaves under two seconds for the end card.

```bash
pnpm render-shorts
```

The videos are written to `out/shorts/<course id>.mp4`. One on its own: `npx remotion render src/index.ts short-stop-freezing out/stop-freezing.mp4`.

## Lesson clips (decisions 146 and 147)

Every lesson has a 30 to 45 second, 4:5 clip for its first part's "See it" step. A clip is data in `src/lessons/clips/<course>.ts` (its lines, beats and closing card; types in `src/lessons/types.ts`), drawn by `src/lessons/LessonClip.tsx`. Its voiceover is `public/lessons/<clip id>.mp3`; `src/lessons/align.ts` times the lines and words from the voice's own pauses.

To make or remake one: write its data, read its voice prompt (`npx tsx` a script calling `voicePrompt(findClip(id))` from `src/lessons/clips`), voice it with ElevenLabs ("Mira – Bright & Friendly Narrator", `eleven_v4`) into `public/lessons/<id>.mp3`, then:

```bash
pnpm render-lessons <clip id>
```

That renders it at 864 by 1080 and copies it, with a still of its closing card, into the app's `public/lessons/`. Then, from the app's folder, list the clips for the app:

```bash
npx tsx video/scripts/export-clips.ts
```

## The website commercial (decision 157)

A 48-second, 1920 by 1080 advert for the website, in the proposed direction B look (the "Playful" redesign, not yet the app's theme): the moment your mind goes blank, then the app's screens as if live (a surprise question, its result, a story, a conversation and how it went, a quick look at scenes, drills, courses and a boss, then and now), ending on "Join the waitlist". It is labelled "A first look at the new VoiceLab", and every number on screen is a sample take, never a claim.

- **Code:** `src/commercial/`. `Commercial.tsx` places the beats (`scenes/*.tsx`, one per beat, each with its own sound cues) and lays the voice, music, sounds and captions over them. `timeline.ts` holds where each piece of the voiceover plays and the captions. `kit.tsx` has the window, camera, cursor, captions and side rail; `Cast.tsx` the cast (you, Sage, the friend, Wobbly); `Tile.tsx` the course tiles; `palette.ts` direction B's colours and faces (Fredoka and Nunito).
- **Voice:** one take by "Mira – Bright & Friendly Narrator" (`eleven_v4`), `public/commercial/voice.mp3`, cut into pieces at its pauses (ffmpeg's `silencedetect`); a re-recorded take needs the times in `timeline.ts` checked again.
- **Music and sounds:** made from plain sine waves by `scripts/commercial-audio.mjs` (a quiet electric-piano loop at 92 beats a minute with a pad and bass, held back under the voice; a pop, a tap, a chime and a tick), so they are ours.

```bash
node scripts/commercial-audio.mjs
```

```bash
npx remotion render src/index.ts Commercial out/commercial.mp4
```

Then bring it to the web's usual loudness (about -16 LUFS; the render alone comes out near -25), copying the picture as it is:

```bash
ffmpeg -i out/commercial.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k out/commercial-web.mp4
```

## A new video

Copy `src/BuyABeat.tsx`, write the phrases, record the voice with a short pause between phrases, save it in `public/`, point `scripts/prepare.mjs` at it, and add a `Composition` in `src/Root.tsx`. Check the frames (one from each phrase, and eight in a row mid-sentence for the mouth) before sharing.

## Licence

Remotion is free for individuals and companies of up to three people; larger companies need a company licence (see remotion.dev/license).
