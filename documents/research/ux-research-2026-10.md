# UX research, October 2026

**What this is:** findings from a UX review done on 2026-10-17, as VoiceLab neared its MVP. Two parts: a walkthrough of the app as a brand-new user on a phone-sized screen (375 by 740 pixels, stand-in microphone), and web research on comparable apps and on the evidence about feedback, habits, onboarding, self-review, navigation and accessibility. The design changes that follow from it are in [design/ux-improvements-plan.md](../design/ux-improvements-plan.md).

**Evidence marks:** **[S]** strong (a study or an official guideline), **[A]** anecdote (reviews, blogs, vendor pages). Independent reviews of speaking apps were thin and mostly old, so section 2 leans on anecdote.

## 1. What the walkthrough found

1. **Welcome leads to a section, not a recording.** The three answers open Talks, Practice or Skills; nothing gets a first recording made. "Skip" is small.
2. **The microphone prompt arrives cold.** The browser asks on the first Start, with no explanation from the app first.
3. **Day one asks a lot.** A new user's second step is a 2 to 4 minute prepared speech with 2 minutes of planning.
4. **About a fifth of a phone screen is taken by the action band and the tab bar** on every page; Today's "on your own" tiles sit half under them. Keyboard hints ("space to start", "esc to leave") show on phones and wrap the masthead.
5. **Stopping a reading early reads as failure:** "You read 19% of the words", "107 not heard". The results page has a large empty middle and four links squeezed into narrow columns at the foot.
6. **Without the coach there is no next step.** The page says "Add your passphrase in Settings" (a setup detail) and gives no one change.
7. **"Done for today" has no moment of completion** and leads each step's summary with its filler count.
8. **History shows numbers without units** ("5.0") and mixes readings with speeches.
9. **Six tabs.** Practice largely repeats Today's tiles; on a session page inside today's practice the Skills tab is marked current.
10. **Settings reads like an admin screen:** the passphrase, "sessions waiting for feedback", the retention select.
11. **The listen-back form is long:** two text boxes and twelve tags before the keep-recording choice.

## 2. Speaking-practice apps

- **[S] More feedback is not always better.** In a review of 607 feedback studies, feedback helped on average but made performance worse in over a third of cases, mostly when it drew attention to the person rather than the task. ([Kluger and DeNisi 1996](https://mrbartonmaths.com/resourcesnew/8.%20Research/Marking%20and%20Feedback/The%20effects%20of%20feedback%20interventions.pdf))
- **[A] Yoodli** is praised for private, judgement-free practice and a quick record, feedback, retry loop; the main reported worry is privacy (an unverified claim that speeches trained its AI without clear consent). ([summary of Reddit threads](https://www.aitooldiscovery.com/guides/yoodli-ai-reddit))
- **[A] ELSA Speak's** biggest complaint is scoring valid accents as wrong, which costs trust. ([justuseapp](https://justuseapp.com/en/app/1083804886/elsa-speak-accent-coach/reviews), [Headway](https://makeheadway.com/blog/elsa-speak-review/))
- **[A] Orai** users liked thorough feedback but drifted away; blunt pace notes were found useful. ([Capterra](https://www.capterra.com/p/190231/Orai/reviews/), [Smithsonian](https://www.smithsonianmag.com/innovation/app-make-you-better-public-speaker-180963384/))
- **[A] Speeko** is built around about 5 minutes a day in 2-minute exercises; pop-ups drive uninstalls. ([Setapp](https://setapp.com/apps/speeko))
- **[A] Duolingo** offers "Can't speak now", pausing speaking exercises for 15 minutes. ([Android Authority](https://androidauthority.com/duolingo-undo-skip-speaking-button-3696590))

## 3. Habits and streaks

- **[S] An unbroken streak keeps people going; a broken one makes them likely to quit,** less so when the streak can be repaired or the break was not their fault. Pointing at the failure backfires. ([Silverman and Barasch 2023](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions))
- **[S] Streaks can become the goal:** some developers stopped daily commits when GitHub removed its streak counter. ([arXiv](https://arxiv.org/pdf/2006.02371))
- **[A] Duolingo** offers streak freezes and repairs because losing a long streak to outside events hurts motivation. ([Android Authority](https://androidauthority.com/duolingo-revive-broken-streak-event-3673004/))
- **[S] Smarter reminders give modest gains** (Duolingo: +2% new-user retention). ([Yancey and Settles 2020](https://research.Duolingo.com/papers/yancey.kdd20.pdf))
- **[S] Calm users who stuck with it averaged about 4 minutes a day.** ([PMC6928287](https://pmc.ncbi.nlm.nih.gov/articles/PMC6928287))
- **[A] Tiny Habits (BJ Fogg):** keep the action tiny, tie it to a routine, celebrate straight away. ([summary](https://themeaningmovement.com/tiny-habits))

## 4. Onboarding and the microphone

- **[A] Babbel** asks for the microphone at the first speaking exercise, after showing value. ([Appcues](https://www.appcues.com/blog/mobile-permission-priming))
- **[S] Google Meet** cut friction by explaining in its own screen before triggering the browser prompt. ([web.dev](https://web.dev/case-studies/google-meet-permissions-best-practices))
- **[A] An explanation screen first means a "not now" does not use up the browser's one prompt.** ([Dolfy](https://www.dolfy.ai/blog/permission-prompt-problem-push-notification-opt-in-timing))
- **[A] Reach the first moment of value fast; three onboarding screens at most.** ([trysonar](https://trysonar.app/blog/app-onboarding-that-protects-day-1-retention))
- **[S] Disliking your own recorded voice is common,** and people who dislike it rate it worse than others do. ([voice confrontation](https://en.wikipedia.org/wiki/Voice_confrontation))

## 5. Self-review

- **[S] Reviewing your own recording after a short preparation step corrects overly harsh self-views,** especially for self-critical people; it does not by itself reduce anxiety. ([Rodebaugh and colleagues](https://labs.la.utexas.edu/telch/files/2015/02/The-ef%EF%AC%81cacy-of-videotape-feedback.pdf))
- **[S] Self-assessment has a small positive effect on learning.** ([meta-analysis](https://ijres.net/index.php/ijres/article/view/2344/pdf))
- **[S] Self-assessing around feedback:** a checklist plus outside feedback worked best. ([Panadero and colleagues 2023](https://link.springer.com/10.1007/s10212-022-00639-4))
- **[S] People misjudge themselves,** and being told how accurate their self-ratings were did not make them more accurate. ([Maastricht](https://cris.maastrichtuniversity.nl/en/publications/effects-of-self-assessment-feedback-on-self-assessment-and-task-s))
- **[S, preprint] Guided prompts give fewer but deeper reflections than free writing.** ([arXiv](https://arxiv.org/pdf/2604.06477))

## 6. Navigation

- **[S] Apple:** fewer tabs are easier; avoid the overflow "More" tab. ([Apple HIG](https://developer-rno.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars))
- **[S] Google Material:** a bottom bar holds 3 to 5 destinations. ([Android](https://developer.android.com/develop/ui/compose/components/navigation-bar))
- **[A] Icons need text labels;** hiding labels is criticised as mystery navigation. ([freeCodeCamp](https://www.freecodecamp.org/news/material-design-and-the-mystery-meat-navigation-problem-65425fb5b52e/))

## 7. Accessibility and inclusive language

- **[S] Stammering guidance (STAMMA):** do not assume people want to sound fluent; avoid "overcome" language. ([STAMMA](https://stamma.org/about-stammering/editorial-guidelines))
- **[S] Speech recognition mistranscribes stammered speech,** so a filler count can penalise it. ([Interspeech 2024](https://www.isca-archive.org/interspeech_2024/mujtaba24_interspeech.html))
- **[S] Speech recognition was about twice as error-prone for Black speakers,** with similar gaps expected for other accents. ([Koenecke and colleagues 2020](https://news.stanford.edu/2020/03/23/automated-speech-recognition-less-accurate-blacks/))
- **[S] "Um" and "uh" are real words** that signal a pause to listeners. ([Clark and Fox Tree](https://arxiv.org/pdf/2301.10761))
- **[S] Respect reduced motion:** for read-along, change colour only. ([W3C](https://w3c.github.io/wcag/understanding/animation-from-interactions))

## 8. Community and daily prompts

- **[S] BeReal's random daily prompt reduced pressure to stage posts,** but teenagers also called it limiting and at times toxic. ([Kim and colleagues 2024](https://arxiv.org/html/2408.02883v3))
- **[S, small studies] Anonymous, structured peer feedback lowered speaking anxiety.** ([JALT](https://jalt-publications.org/articles/27749-using-peereval-peer-feedback-oral-presentations), [GEMA](https://ejournal.ukm.my/gema/article/view/36106))
- **[A] Short online comments can wound;** Toastmasters uses structured evaluation guides. ([MIT Press](https://readingthecomments.mitpress.mit.edu/pub/ujeil296))
- **No evidence was found** that shared daily prompts help solo practice apps. Privacy is the main risk.
