# Plan: From Personal App to 1,000 Users and the App Store

**Purpose:** What has to change before VoiceLab is used by other people at scale: the data model and cloud storage, security, privacy and data retention, content licences, the app stores, and cost. A planning document, not a decision; nothing here is built yet.
**Last updated:** 2026-10-29
**Status:** Draft for later. Not legal advice: have a privacy lawyer review the policy, terms and the items marked **(lawyer)** before a public launch.

## 1. Where VoiceLab stands today

VoiceLab was built for one person, and its design reflects that:

| Today | Good for one user | Blocks a public launch because |
|---|---|---|
| **Everything is stored in the browser** (IndexedDB): sessions, transcripts, measures, settings, recordings | Private by design, costs nothing to run, works offline | Data is lost if the browser clears it or the phone is lost (risk R7); nothing moves between devices |
| **No accounts.** The AI routes are protected by **one shared passphrase** (`APP_ACCESS_SECRET`) | Simple, and strangers cannot run up the bill | A passphrase cannot be handed to 1,000 people: one leak opens it to everyone, and it cannot be revoked for one person |
| **Rate limits and monthly caps are global** (Upstash counters in `src/server/guard.ts`) | Holds a leaked passphrase to about $31 a day | Shared caps mean one heavy user uses up everyone's allowance |
| **Audio never reaches our server** (except opt-in deeper analysis, passed straight through) | A strong privacy promise | Must be kept, or deliberately and visibly changed, if cloud backup is added |

The good news: the app already has much of what a public product needs: input limits on every route (`src/core/requestLimits.ts`), structured AI output, vendor spend caps, strict security headers, a full data export and import with careful merge rules, "Delete all my data", a retention policy (decision 98), honest disclosure of where audio goes (decision 97), and only public-domain or properly licensed content.

## 2. The big decision: accounts and where data lives

**Recommendation: accounts are required; cloud backup is optional and opt-in; recordings stay on the device by default.**

- **Accounts are unavoidable** for a public launch: without them there is no way to give each person their own AI allowance, take payment, or stop one abuser without stopping everyone.
- **Keep the device as the main copy** (local-first). The app already works fully offline from IndexedDB; cloud sync becomes a backup and a way to move between devices, not a rewrite. The export and import merge rules (decision 86) are most of a sync engine already.
- **Text syncs; audio is a separate, opt-in choice.** Transcripts, measures and feedback are small and are what make progress visible. Recordings are large and are the most sensitive thing VoiceLab holds. Offer "Back up my recordings" as its own setting, ideally end-to-end encrypted so even we cannot hear them (section 5).

## 3. The database

### 3.1 What the app stores now (in the browser)

One IndexedDB database, `voicelab-practice-journal`, with these collections (full field lists in [architecture/data-model.md](architecture/data-model.md)):

| Collection | One per | Holds | Size |
|---|---|---|---|
| `sessions` | Recording | When, which mode and prompt, length, the transcript, pace and pause words, coach feedback and its status, your notes, stars, and the extras for each mode (a story's template, a check-in's part, a course part, a conversation's turns…) | A few KB each |
| `signals` (readings) | Take | Loudness and pitch ten times a second, and each word's time | Tens of KB; dropped after 30 days unless starred (decision 98) |
| `analyses` | Take | Every measure, the raw features to recompute them, the coach's rubric, deeper analysis results | A few KB |
| `audio` | Take | The recording itself | About 1 MB a minute; kept 14 days by default |
| `stories`, `talks`, `challenges` | Story, saved talk, week | Titles, a talk's text (up to 50,000 characters), missions | Small |
| `summaries` | Week | The coach's weekly summary | Small |
| `settings` | (one) | Choices, the focus, course progress, check-in settings, missions | Small |
| `meta` | (one) | The layout version, for moving older data | Tiny |

A heavy user produces roughly 5 to 30 MB of text and measures a year, plus whatever audio they keep.

### 3.2 A cloud schema for accounts and sync

A relational database (Postgres, for example through Supabase or Neon) for records, and object storage (Cloudflare R2, S3 or Supabase Storage) for recordings. Every row carries `user_id`, and **row-level security** makes the database itself refuse to show one user's rows to another, so a bug in our code cannot leak data across accounts.

| Table | Key columns | Notes |
|---|---|---|
| `users` | `id`, `created_at`, `auth_provider`, `plan`, `region`, `deleted_at` | No name needed; email only if the sign-in method requires it |
| `consents` | `user_id`, `kind`, `policy_version`, `granted_at`, `revoked_at` | One row per choice: coach feedback, deeper analysis, live conversations, notes to the coach, recording backup. Proves what someone agreed to and when |
| `settings` | `user_id` (key), `data` (JSON), `updated_at` | The current settings record as is |
| `sessions` | `id`, `user_id`, `created_at`, `mode`, `prompt_id`, `duration_sec`, `transcript`, `words_per_minute`, `fillers_per_minute`, `feedback` (JSON), `feedback_status`, `self_review` (JSON), `starred`, `marker`, `extras` (JSON: story, check-in, course, loop, conversation…), `audio_key`, `updated_at`, `deleted_at` | The common fields as columns (for queries); the mode-specific extras as JSON, so a new mode needs no migration |
| `analyses` | `session_id` (key), `user_id`, `schema_version`, `metrics` (JSON), `rubric` (JSON), `server` (JSON), `updated_at` | |
| `readings` | Not synced at first | Large and kept only 30 days on the device; sync only for starred and check-in takes if ever needed |
| `stories`, `talks`, `challenges`, `summaries` | Their current fields, plus `user_id`, `updated_at`, `deleted_at` | |
| `course_progress` | `user_id`, `part_id`, `take_id`, `done_at` | Moved out of settings once synced, so two devices finishing parts do not overwrite each other |
| `usage` | `user_id`, `month`, `kind`, `amount` | Per-user allowances (coach calls, conversation minutes, live minutes), replacing today's global counters |
| `subscriptions` | `user_id`, `platform` (apple, google, web), `product`, `status`, `expires_at` | Filled from store notifications (RevenueCat or similar) |
| `audit_log` | `user_id`, `action`, `at` | Exports, deletions, consent changes. No content |

**Recordings** live in object storage at `users/{user_id}/takes/{session_id}`, private, reached only through short-lived signed links, deleted by the same retention rule as on the device.

**Sync rules:** each record has `updated_at` and a `deleted_at` tombstone (so a deletion on one device reaches the others); the newest change to a record wins, with the existing merge rules for stars, notes and feedback (decision 86) so nothing is lost. The app keeps working offline and syncs when it can.

## 4. Scale and cost at 1,000 users

**The servers are not the problem.** 1,000 users is a light load: Vercel's serverless routes, one small Postgres database and Upstash all handle it on their entry paid plans. **The AI and voice vendors are the cost.** Rough monthly figures, assuming 300 people practise on a given day, three coached takes each (check every vendor's current prices before relying on these):

| Item | Assumption | Rough monthly cost |
|---|---|---|
| Coach feedback (Anthropic) | About 1 to 2 cents a take (setup-requirements.md), 900 takes a day | $270 to $540 |
| Weekly summaries | One a week per active user, a larger model | Tens to low hundreds of dollars |
| Conversations with spoken lines (Anthropic + ElevenLabs) | The biggest unknown; depends on how many minutes people talk | Must be capped per user |
| Live and phone-call conversations (AssemblyAI, ElevenLabs Agents) | About $0.15 an hour (live) and $0.08 a minute (calls) by our notes | Must be capped per user, or paid-plan only |
| Database and storage | 1,000 users of text: a few GB. Recording backup, if opted in: grows by tens of GB a month | Roughly $25 to $75 |
| Hosting, counters, monitoring | Vercel Pro, Upstash, an error tracker | Roughly $40 to $100 |

So roughly **$500 to $1,500 a month**, almost all of it AI and voice. That decides the business model: a free tier with a small daily allowance of coached takes (most practice already works without the AI: the measures, timings, pause counts and charts all run on the phone), and a subscription for unlimited coaching, conversations and backup. **Per-user allowances must exist before any public sign-up.**

## 5. Security

### 5.1 Must have before strangers use it

| Item | Why | How |
|---|---|---|
| **Per-user sign-in** | Replaces the shared passphrase | A managed service (Supabase Auth, Clerk or Auth.js). Email magic links or passkeys, plus **Sign in with Apple** (on iOS, offering a social sign-in such as Google means also offering Sign in with Apple or an equally private option) |
| **Per-user allowances and rate limits** | One person cannot use up the budget | Key the existing guard (`src/server/guard.ts`) by user id instead of the passphrase; keep the global daily cap as a backstop |
| **The server decides who you are** | Never trust a user id sent by the app | Read the user from the verified session on every route; row-level security in the database as a second lock |
| **Abuse of free accounts** | Free accounts are free AI | Verified email or device check before AI features; per-account caps; a captcha on sign-up if needed |
| **No content in logs** | Transcripts are personal | Log ids and counts only (as `/api/usage` already does); scrub error reports (Sentry and similar can strip request bodies) |
| **Account deletion that reaches everywhere** | Law and the App Store require it | Delete rows, recordings and backups, and ask vendors to delete where they keep data (section 6) |
| **Content Security Policy without `'unsafe-inline'` scripts** | Today's policy allows inline scripts (a Next.js default) | Switch to per-request nonces (Next.js supports this) |

### 5.2 Already in place

Input size limits on every route; structured AI output (no free-form HTML is rendered); secrets only on the server (never `NEXT_PUBLIC_`); vendor spend caps; short-lived single-use tokens for live audio; strict headers (HSTS, frame denial, a tight `connect-src`, microphone only for this site); dependency audits (decision 123).

### 5.3 Worth doing as it grows

- **End-to-end encrypted recording backup:** recordings are encrypted on the phone with a key derived from the user's passkey or a recovery phrase, so the cloud holds only unreadable files. The strongest privacy story available, at the cost of "lost key, lost backup".
- **Prompt injection:** transcripts and talk texts go to the AI. Keep the structured output and never let the model's reply trigger actions or render as HTML.
- **Dependency and secret scanning in CI** (GitHub's Dependabot and secret scanning are free).
- **A security contact** (`security.txt`) and a plan for what to do if a key leaks (rotate, check vendor logs, tell affected users).

## 6. Privacy, consent and data retention

### 6.1 What a launch needs

- **A privacy policy and terms** in plain words, matching what the app really does. Section "What leaves the device" in [architecture/data-model.md](architecture/data-model.md) is already most of the privacy policy's content.
- **A list of sub-processors** (every company that touches user data): Anthropic (coach), ElevenLabs (voices, phone calls), AssemblyAI (deeper analysis, live), the voice worker's host (Modal or Google Cloud), Vercel (hosting), Upstash (counters), the database and storage host, the error tracker, and the browser's speech service (Apple, Google, Microsoft), which the user's browser calls directly.
- **Data processing agreements** with each of those vendors (most offer a standard one to sign online). **(lawyer)**
- **Consent where it is not essential:** the app already asks before deeper analysis, live conversations and sharing notes. Keep each optional vendor behind its own switch, recorded in `consents`.
- **Vendors' own retention:** each AI vendor keeps API inputs for a period for abuse monitoring unless a zero-retention agreement is in place. Check each vendor's current terms, ask for zero retention where offered, and state the real periods in the policy.
- **GDPR (EU and UK users) and US state laws (California and others):** a lawful basis for each use, the right to see, export and delete data (export and delete exist already; they must reach the cloud copy too), and a named contact. **(lawyer)**
- **Sensitive data:** the "I stammer" setting is sent to the coach today (decision 79). Health-related data has stricter rules in the EU and in some US states (Washington's My Health My Data Act is broad). Consider keeping it on the device and sending only the instruction "leave fluency alone". **(lawyer)**
- **Voice recordings and biometric laws:** VoiceLab measures how someone speaks, but does not identify people by voice. Say so plainly, and never add speaker identification without legal advice (Illinois' BIPA and similar laws). **(lawyer)**
- **Age:** set a minimum age (13 in the US under COPPA; up to 16 in parts of the EU) and ask at sign-up, or build for children deliberately, which is a much bigger job.

### 6.2 A retention schedule

| Data | On the device (today) | In the cloud (proposed) |
|---|---|---|
| Recordings | 14 days (7 or 30 if chosen); starred, check-in and first takes kept | Only if backup is on; the same rule, deleted from the cloud when deleted on the device |
| Detailed readings | 30 days | Not uploaded |
| Transcripts, measures, feedback, notes | Until the user deletes them | Until the user deletes them or their account |
| A deleted account | Removed at once | Removed within 30 days, including backups |
| Usage counts | Not kept | About 13 months, for billing and abuse checks; no content |
| Server logs and error reports | None | 30 days, without content |
| Inactive accounts | n/a | Warn after 12 months without sign-in; delete after 24, unless they pay |

## 7. Content and licences

| Content | Status | To do before launch |
|---|---|---|
| **Speech texts** | Public domain in the US (pre-1930 works and US government works), each traced to a source ([content-sources.md](content-sources.md)) | Check the few readings still written from memory (the Gettysburg Address, Susan B. Anthony, Chief Joseph, "The Strenuous Life", Kennedy at Rice). US government works can have copyright abroad; low risk, but note it **(lawyer)** |
| **Recorded voices** (ElevenLabs clips, the video voiceover) | Commercial use depends on the ElevenLabs plan when they were made | Confirm the plan was a paid one with a commercial licence; if not, regenerate on a paid plan before launch. Keep a note of the plan per batch |
| **Drawings** | Open Peeps: CC0 (no credit needed); the blob, scenes and tiles: drawn for VoiceLab | Nothing |
| **Fonts** | Atkinson Hyperlegible and Fraunces: SIL Open Font Licence | Keep the licence text with the app (already in `src/theme/fonts/OFL.txt`); add Fraunces' to an "Acknowledgements" page |
| **Code libraries** | Mostly MIT and Apache | Add a licence check to CI and an acknowledgements page; Remotion (videos, decision 143) has its own licence: free up to three people, paid above |
| **YouTube videos in course parts** | Embedded with YouTube's privacy-enhanced player, which YouTube's terms allow | Never download or re-host them; check each still plays before a release |
| **Research cited in Learn cards** | Findings paraphrased and credited | Keep quotes short; keep crediting |
| **The name** | "VoiceLab" is a common name, and other products use it | **Run a trademark search before choosing the store name.** Avoid "Toastmasters" (a registered trademark) and check "Table Topics" before using it in marketing or the store listing; the mode is already called Rapid Fire (decision 85), but the repository is named Table-Topics **(lawyer)** |

## 8. The app stores

### 8.1 Three ways to get there

| Way | What it means | Verdict |
|---|---|---|
| **Stay a web app (PWA)** | Installed from the browser; no store | Cheapest and no store fees, but harder to find, iPhone storage can still be cleared, and no store presence |
| **Wrap it with Capacitor** | The same code inside a native shell, with native plugins where the web falls short | **Recommended.** Keeps one codebase; the plugins fix the web's weak spots on phones (below) |
| **Rewrite natively** (React Native or Swift) | A new app | Not worth it for this app |

### 8.2 What Capacitor would fix

- **Speech recognition:** the browser's speech API may not be available inside an iPhone app's web view the way it is in Safari. Plan on a native speech plugin (Apple's speech framework can recognise **on the device**, so audio would no longer go to Apple's servers: a privacy upgrade).
- **Storage that is not cleared** (risk R7 goes away for the app's own files).
- **Real reminders:** local notifications at the user's practice time, replacing the calendar file (decision 78).
- **Microphone handling** with proper permission prompts.

The screens already load their data in the browser, so most of the app can be built as static files for the shell, with the API routes staying on Vercel. This needs a check of each page (a short spike).

### 8.3 Apple's rules that apply

- **Minimum functionality (4.2):** an app that is only a website in a frame gets rejected; native speech, notifications and offline storage show it is a real app.
- **Privacy (5.1):** a privacy policy link, a privacy "nutrition label", a privacy manifest file, clear purpose strings for the microphone and speech recognition, **in-app account deletion**, and since 2025 explicit disclosure and consent before personal data goes to a third-party AI (which the app's consent screens already mostly do).
- **Sign-in options (4.8):** if Google or another social sign-in is offered, the app must also offer Sign in with Apple or another option with the same privacy promises (no tracking, email can be hidden).
- **Payments (3.1.1):** a subscription for in-app features goes through Apple's in-app purchase. Apple takes 30%, falling to 15% for a subscription after its first year, and 15% throughout for developers earning under $1 million a year (the Small Business Program). Check the current rules, which have been changing, including for links to outside payment in the US. RevenueCat handles Apple, Google and the web in one place.
- **Health claims:** describe it as speaking practice, not therapy; avoid medical claims, especially around stammering.
- **Review:** give Apple a demo account and notes on what the microphone is for.

Google Play is similar: a data safety form, a web link for account deletion, and up-to-date Android targets.

## 9. A phased plan

| Phase | When | What |
|---|---|---|
| **0. While building (now)** | Ongoing, cheap | Keep sending the minimum to vendors (review "I stammer"); check the speech texts still from memory; confirm the ElevenLabs plan; run a trademark search; switch the content policy to nonces; add licence and dependency checks to CI; draft the privacy policy from the data-model document; decide the minimum age |
| **1. Private beta** | 20 to 50 people | Accounts (magic link or passkey, plus Sign in with Apple), per-user allowances, the privacy policy and terms, consent records, server-side deletion, error tracking without content, vendor data agreements |
| **2. Public, about 1,000 users** | After the beta | Cloud sync of text (Postgres with row-level security), opt-in encrypted recording backup (R2 or S3), the Capacitor apps with native speech and notifications, subscriptions through RevenueCat, store submissions, a lawyer's review |
| **3. Beyond** | If it grows | A status page, regular access reviews, a security review by an outside firm, more regions for data storage if EU users ask |
