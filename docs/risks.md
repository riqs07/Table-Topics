# Risk Register

**Purpose:** Problems we expect to hit, how we would notice, and what we will do. Written before building so setbacks are planned for, not discovered late.
**Last updated:** 2026-10-11

Ordered roughly by how much damage each could do. "Milestone" refers to [roadmap.md](roadmap.md); "C#" refers to [checkpoints.md](checkpoints.md).

| # | Risk | Why it is real | How we would notice | Plan | Milestone |
|---|------|----------------|---------------------|------|-----------|
| R1 | **Filler words vanish from transcripts** | Speech-to-text often cleans up "um" and "uh", so our headline number could undercount | In the spike you say 20 "ums" and far fewer show up in the transcript | Test both engines; try prompting Whisper to keep them; if neither works, measure visible fillers ("like", "you know", repeated words) and stop promising "um" counts | M1 |
| R2 | **Live transcript is flaky on phones** | Browser speech recognition is missing in some browsers, can behave differently once installed to the home screen, and may fight the recorder for the microphone | The spike fails or the transcript stops mid-session on your phone | Decide at C5: keep live transcript, or record first and transcribe afterwards (loses the live words) | M1 |
| R3 | **Our privacy claim was wrong** | Browser speech recognition usually sends audio to the browser maker's servers; we had written that audio never leaves the device | The spike shows which engine runs | Docs are corrected; tell the user during onboarding; decide at C5 how strongly privacy is promised | M1 |
| R4 | **Strangers run up the AI bill** | A deployed route is public; counters kept in server memory reset between serverless runs, so they are not a real limit | Unexpected usage in the provider dashboard | Access passphrase, a small shared store for counters, and a spend limit set at the provider | M6 |
| R5 | **I cannot test what needs a microphone or live keys** | My workspace has no microphone and limited network access | Tests pass but the app fails on your phone | Automated tests use fakes; you run a live-check script and the device checkpoints | All |
| R6 | **Coach feedback is generic or off-tone** | The coaching prompt is the core product, and quality is partly taste | You read the feedback but do not act on it | Review about 10 real transcripts together at C10; keep them as test fixtures; tune the prompt | M6 |
| R7 | **Browser storage gets cleared** | Browsers can delete site data, especially for sites that are rarely used; the baseline recording is the progress anchor | History disappears | Install as an app; offer "Export my data"; decide at C8 | M4 |
| R8 | **Look-and-feel decisions drag on** | Color and copy take several rounds | Repeated palette changes that touch many files | Theme files hold all colors, so a change is one file; grayscale first; freeze at C6 and C11 | M2 |
| R9 | **The retry loop feels like homework** | Repeating the same prompt can feel punishing | You skip the retry | One retry, skippable; judge at C12; adjust the PRD | M7 |
| R10 | **Prompts and challenges feel off** | Tone matters a lot for shy users, and I am drafting without knowing your taste | Cringe on read-through | I draft, you approve at C13 | M9 |
| R11 | **Code cannot reach your phone** | My workspace is separate from your computer and phone | Nothing to install or open | Decide delivery at C1 (private repo or download) | M0 |
| R12 | **Model names and package versions change** | AI models get retired; framework major versions change | Build or API errors | Model names in one config file; pinned versions with a lockfile; check provider notices | Ongoing |
| R13 | **Custom colors hurt readability** | A palette you like may fail contrast rules | Hard-to-read text | Automated contrast test on every theme | M2 |

## Later, if this becomes a product for others

- A privacy policy and clear consent for recording and AI processing.
- Accounts, cloud sync, and a real backend (changes the privacy story in the PRD).
- Support for more browsers and devices than the one you test on.
