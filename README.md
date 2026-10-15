# VoiceLab

Private, one-minute speaking practice: speak, get one specific fix, retry, and see whether it worked.

Start with [documents/README.md](documents/README.md) for the product, architecture, and roadmap.

The previous Table Topics game (plain JavaScript) is preserved on the `master` branch.

## Run it locally

You need Node.js 22 or newer and pnpm 10.

```sh
pnpm fresh     # get the latest code, install new packages, clear the cache, start the app
pnpm dev       # just start the app at http://localhost:3000
pnpm check     # lint, type check, and run tests
pnpm build && pnpm e2e   # browser checks in Chromium (set CHROMIUM_PATH to use a local Chromium)
```

Use `pnpm fresh` whenever new work has been pushed. The first time on a new computer, run `pnpm install` once before it.

Secrets go in `.env.local` (copy `.env.example`). Never commit it and never paste keys into chat.
