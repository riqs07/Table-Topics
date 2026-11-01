# Social posts

One row per social video (Instagram and any other feed): what it is, where its final file lives, and whether it has gone up. App lesson clips are not listed here; they ship inside the app.

**Statuses:** Idea → Scripted → Voiced → Rendered → Posted (or Dropped).

**Final files:** `out/` is not committed, so once a render is final, put the MP4 in the shared social folder outside git (Drive, Dropbox or wherever you keep them) and write where it is under "Final file".

**Adding a post:** add a row when the idea starts, not when it is posted, so nothing sits half-made and forgotten. Fill in "Posted" and "Link" the day it goes up.

## Posts

| Video | Composition (render id) | Status | Final file | Caption / hook | Posted | Link |
|---|---|---|---|---|---|---|
| Buy a beat | `BuyABeat` | Rendered? | | | | |
| Short: Stop freezing | `short-stop-freezing` | Rendered? | | | | |
| Short: Explain it simply | `short-explain-it-simply` | Rendered? | | | | |
| Short: Ready by the day | `short-ready-by-the-day` | Rendered? | | | | |
| Short: Stories that land | `short-stories-that-land` | Rendered? | | | | |
| Short: Beyond good you | `short-beyond-good-you` | Rendered? | | | | |
| Short: Voice lean-in | `short-voice-lean-in` | Rendered? | | | | |
| Short: Interview ready | `short-interview-ready` | Rendered? | | | | |
| Short: Toasts and tributes | `short-toasts-and-tributes` | Rendered? | | | | |
| Short: Listen like you mean it | `short-listen-like-you-mean-it` | Rendered? | | | | |
| Short: Tell it again | `short-tell-it-again` | Rendered? | | | | |
| Short: Know your voice | `short-know-your-voice` | Rendered? | | | | |
| Short: The tough question | `short-the-tough-question` | Rendered? | | | | |
| Two-person café demo (test) | `TwoPeople` | Rendered? | | | | |

## Rendering one

From `video/`, after `pnpm install`:

```bash
npx remotion render src/index.ts short-stop-freezing out/social/shorts/stop-freezing.mp4
```

All the course shorts at once: `pnpm render-shorts`. "Buy a beat": `pnpm render`. See [README.md](README.md) for how each kind is made.
