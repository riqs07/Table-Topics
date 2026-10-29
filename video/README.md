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

## A new video

Copy `src/BuyABeat.tsx`, write the phrases, record the voice with a short pause between phrases, save it in `public/`, point `scripts/prepare.mjs` at it, and add a `Composition` in `src/Root.tsx`. Check the frames (one from each phrase, and eight in a row mid-sentence for the mouth) before sharing.

## Licence

Remotion is free for individuals and companies of up to three people; larger companies need a company licence (see remotion.dev/license).
