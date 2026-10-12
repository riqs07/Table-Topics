# VoiceLab

Private, one-minute speaking practice: speak, get one specific fix, retry, and see whether it worked.

Start with [documents/README.md](documents/README.md) for the product, architecture, and roadmap.

The previous Table Topics game (plain JavaScript) is preserved on the `master` branch.

## Run it locally

You need Node.js 22 or newer and pnpm 10.

```sh
pnpm install   # install exact dependency versions
pnpm dev       # start the app at http://localhost:3000
pnpm check     # lint, type check, and run tests
```

Secrets go in `.env.local` (copy `.env.example`). Never commit it and never paste keys into chat.
