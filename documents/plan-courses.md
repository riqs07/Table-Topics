# Plan: guided courses

**Status:** The flow is built with draft content (decision 131, 2026-10-29). The real lessons, more courses and the videos come next. Mockups: the "Guided courses: Thinking on my feet" canvas (approved in conversation on 2026-10-28, with the changes below).

## The idea

A course guides the user through modes the app already has, with short teaching in between. It belongs to one focus area, so the welcome question ("What do you want to get better at most?") decides which course is offered first. The first course is **Stop freezing**, for thinking on your feet.

## What the user decided (2026-10-28)

| Question | Decision |
|----------|----------|
| Does a course replace Today? | **No.** The course's next part is an added step on Today. The usual steps stay as they are |
| One lesson a day? | **No.** Every lesson and part is open straight away; people go as far as they like |
| A step to show a video | **Kept.** Some parts have a video, some a model answer, some neither; the step shows only when the part has something |
| Two tries every time? | **Only where it fits.** Each part says whether it has one try or two |
| A real-world mission at the end | **Removed** |
| A recall question | **No.** Instead, the part's **same prompt comes back** a few days later, and both answers are shown side by side |
| Lesson length | **Can be longer than 8 minutes.** A lesson is made of a few short parts (chapters), so it can be done over several sittings or all at once |
| A feelings check | **Left out** |

## The shape

| Level | What it is |
|-------|------------|
| Course | One focus, a few lessons, a list of what you can do by the end |
| Lesson | One skill, in a few parts |
| Part | A few minutes: **Learn** → **See it** (when there is a video or a model answer) → **Try it** (once or twice, on a mode the app already has) → **Wrap up** |
| Coming back | Three days after a part with practice is finished, its prompt comes back on Today ("Back again"); the answer is compared with the earlier one |
| Course end | Every part done: the first course take against the latest, and the next course for the same focus |

## How it is built

- **Content:** `src/content/courses.ts`. A part has `learn` (headline, body, an optional "instead of / try"), an optional `see` (a YouTube video with its start and end, a model answer with its highlight, or both), and an optional `practice` (the mode, a fixed prompt so it can come back, the goal, one or two tries, and the measure the tries are compared on: pause words, pace or length).
- **Rules:** `src/core/courses.ts` (the next part, which course to offer, the steps, addresses, comebacks due, comparing two takes).
- **Progress:** `courses` in the settings record, one entry per finished part (`src/data/courses.ts`); each take recorded inside a course carries `course: { part, attempt, revisit? }`.
- **Pages:** `/courses` (every course), `/courses/course?id=…` (lessons and parts, all open, the next marked; the before-and-after once done), `/courses/part?id=…&step=…&try=…` (one step at a time), `/courses/revisit?id=…&take=…` (both answers side by side). Practice lists the courses at the top, the focus's first.
- **Recording:** the usual recording page, opened with `&course=…&try=…` (or `&revisit=1`). It shows the course line and the goal, saves the course take, and goes back to the part (the next try or the wrap-up) instead of the results.
- **Today:** a course already started, or else the first course for one of the user's focus areas, adds its next part as a step of its own (lane `course`); a part finished today keeps the step and marks it done, so the plan stays the same all day. A comeback due shows as a "Back again" card under the steps.
- **Videos:** YouTube's privacy-enhanced player (`youtube-nocookie.com`), the only site the app frames; the content policy allows it.

## Still to do

1. **The real content.** The draft course's words are placeholders, marked "draft lessons" on the course page. Each part needs its final teaching, model answers, and where they fit, videos (with the stretch to play).
2. **More courses** for the other focus areas. All six are outlined in [course-outlines.md](course-outlines.md), for review before the words are written.
3. **Better measures.** Time to the first word and time to the point would suit "Stop freezing" better than pause words; both need the word times kept with the readings.
4. **Course pages on Today.** Whether a finished course should offer the next one on Today, not only on its own page.

## Open questions

- Should Today pick up mid-lesson (it does now: the next unfinished part), or always start a lesson from its first part?
- Should a comeback's comparison appear on History as well?
