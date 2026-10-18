# VoiceLab

Private, one-minute speaking practice: speak, get one specific fix, retry, and see whether it worked.

Start with [documents/README.md](documents/README.md) for the product, architecture, and roadmap.

The previous Table Topics game (plain JavaScript) is preserved on the `master` branch.

## Run it locally

You need Node.js 22 or newer and pnpm 10.

```sh
pnpm fresh     # get the latest code, install new packages, clear the cache, start the app
pnpm dev       # just start the app at http://localhost:3000
pnpm phone     # start the app plus a tunnel, and print an https link to open on your phone
pnpm check     # lint, type check, and run tests
pnpm build && pnpm e2e   # browser checks in Chromium (set CHROMIUM_PATH to use a local Chromium)
```

Use `pnpm fresh` whenever new work has been pushed. The first time on a new computer, run `pnpm install` once before it.

To try the app on a phone, run `pnpm phone` (it needs `cloudflared`: `brew install cloudflared` on a Mac). Phones only allow the microphone on https sites, so it starts the app, opens a Cloudflare quick tunnel to it, and prints the link in a box (on a Mac it is also copied, ready to paste on an iPhone). The link changes every run; Ctrl+C stops both. To get the latest code first, run `pnpm fresh`, stop it with Ctrl+C, then run `pnpm phone`.

Secrets go in `.env.local` (copy `.env.example`). Never commit it and never paste keys into chat.
