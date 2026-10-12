# Coding Standards

**Purpose:** The rules every change must follow, so a human can trust the code without reading all of it.
**Last updated:** 2026-10-11

## 1. Test-driven development (mandatory)

Every behavior change follows this loop:

1. **Red:** write a test that describes the behavior. Run it. It must fail, and the failure must be for the right reason.
2. **Green:** write the smallest code that makes the test pass.
3. **Refactor:** clean up with the tests still passing.

Evidence the inspector can check:

- The failing test run is shown before the implementation is written.
- The test and the code that satisfies it are separate commits when practical (test first).
- No code is added without a test that would fail if the code were removed.
- Bug fixes start with a test that reproduces the bug.

## 2. Test layers

| Layer | Tool | What it covers | Share of tests |
|-------|------|----------------|----------------|
| Unit | Vitest | Pure logic in `core/`: metrics, feedback parsing, focus rules, streaks | Most |
| Component | Testing Library | Screens and components, with fakes for audio and the AI | Some |
| End to end | Playwright | The full loop: prompt, record, feedback, retry | A few |

## 3. What is faked in tests

| Dependency | In tests | Why |
|------------|----------|-----|
| AI coach | Recorded sample responses | Tests must be fast, free, and repeatable |
| Microphone and Web Speech | Fake recorder that plays back fixed text | Browsers cannot be driven by a real voice in tests |
| IndexedDB | In-memory fake | Speed |
| Clock | Controllable fake time | Streak and weekly-focus rules depend on dates |

The AI prompt is also checked by one test that validates a real response matches the required keep / change / retry shape. It is run on demand, not on every commit.

## 4. Commenting rule

**Every line of code has a plain-language comment saying what it does at a high level.**

- The comment explains the purpose, not the syntax. "Count the fillers" is good. "Add one to i" is not.
- Place the comment on the line above the code.
- Lines that only close a block (a lone `}` or `)`) and blank lines do not need one.
- Files that cannot hold comments (such as JSON) are described in a nearby doc or in the code that reads them.
- If a comment and the code disagree, that is a bug.

Example:

```ts
// Count how many filler words appear in a transcript
export function countFillers(transcript: string): number {
  // Lowercase the text so matching ignores capitalization
  const text = transcript.toLowerCase();
  // Start the running total at zero
  let total = 0;
  // Check each known filler phrase in turn
  for (const filler of FILLERS) {
    // Add the number of times this filler appears
    total += text.split(filler).length - 1;
  }
  // Report the final count
  return total;
}
```

Tests follow the same rule.

## 5. Other standards

- TypeScript in strict mode. No `any`.
- Small functions that do one thing. Logic lives in `core/` with no browser dependencies.
- Clear names over short names.
- Commit messages use the form `type(scope): summary`, for example `feat(core): count filler words`.
- Secrets are never committed. The AI key lives only in server environment variables. Keys are never pasted into chat (see setup-requirements.md).
- Colors, fonts, and spacing come from theme roles only. A test fails if a component contains a raw color (see design/design-system.md).
- Model names live in one config file.

## 6. Spikes (throwaway experiments)

A spike answers one question, such as "does browser transcription work on this phone?" Spikes are the only code exempt from test-first.

- Spike code lives in a `spikes/` folder and still follows the comment rule.
- It is deleted before the milestone ends. Only the findings are kept, written into `architecture/decisions.md`.
- Nothing in `src/` may import from `spikes/`.

## 7. Checkpoints

Work stops or continues at human checkpoints as defined in [../checkpoints.md](../checkpoints.md). A blocking checkpoint is never skipped. A non-blocking one proceeds on its stated default and is flagged.

## 8. Definition of done

A task is done only when all of these are true:

- [ ] Tests were written first and are shown passing
- [ ] Lint, type check, and the full test suite pass with no warnings
- [ ] Every line carries a comment per section 4
- [ ] The documents in this folder still match the code
- [ ] Checkpoints for this milestone are answered, or defaulted and flagged
- [ ] The change is small enough to review in one sitting
