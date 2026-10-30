// Stories that land's lesson clips (decision 147): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const STORIES_THAT_LAND_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, You have stories: small moments count, with the blob's own from this morning
  {
    id: "stories-that-land-find",
    partId: "sl-find-1",
    label: "Stories that land · Lesson 1",
    tile: "small-moments",
    title: "Small moments count",
    lines: [
      { text: "Think nothing interesting ever happens to you?", mood: "up", tag: "[curious]" },
      { text: "Most people do.", mood: "ready", tag: "[warm]" },
      { text: "But good stories aren’t big events.", mood: "ready" },
      { text: "They’re small moments, when something changed.", mood: "happy", tag: "[thoughtful]" },
      { text: "Here’s one of mine from this morning.", mood: "happy", tag: "[cheerful]" },
      { text: "I was at the bus stop, soaking wet, with no change.", mood: "worried", tag: "[playful]" },
      { text: "The driver just waved me on and said, “Keep it, love.”", mood: "wow" },
      { text: "Tiny. But I smiled all day.", mood: "happy" },
      { text: "So today, notice three kinds.", mood: "ready", tag: "[warm]" },
      { text: "A surprise.", mood: "wow" },
      { text: "A small win.", mood: "happy" },
      { text: "And a line someone said.", mood: "ready" },
      { text: "Tonight, write one of them down. Just one line.", mood: "closed", tag: "[calm]" },
      { text: "Do that for a week, and you’ll have more stories than you can tell.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The doubt
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // Not big events
      { from: 2, to: 2, ground: "art-plum", visual: { kind: "struck", text: "BIG EVENT" } },
      // Small moments
      { from: 3, to: 3, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own moment
      { from: 4, to: 7, ground: "art-bloom", visual: { kind: "example", title: "My moment", quote: "Soaking wet, no change. “Keep it, love.”" } },
      // The three kinds
      { from: 8, to: 11, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "!", label: "A surprise", at: 9 }, { sign: "tick", label: "A small win", at: 10 }, { sign: "“ ”", label: "Something said", at: 11 }] } },
      // One line tonight, then a week of them
      { from: 12, to: 13, ground: "art-coral", visual: { kind: "list", title: "Tonight", items: [{ label: "Mon", text: "Bus driver: “Keep it, love.”", at: 12 }, ...["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, at: 13 }))] } },
    ],
    close: { heading: "Today, notice", items: [{ sign: "!", label: "A surprise" }, { sign: "tick", label: "A small win" }, { sign: "“ ”", label: "Something said" }], action: "Tonight: write one line" },
  },
  // Lesson 2, Start in the middle: open in the action, with the blob's own opening
  {
    id: "stories-that-land-middle",
    partId: "sl-mid-1",
    label: "Stories that land · Lesson 2",
    tile: "start-in-the-middle",
    title: "Skip the run-up",
    lines: [
      { text: "Ever noticed how most stories start too early?", mood: "up", tag: "[curious]" },
      { text: "The alarm. The commute. The weather.", mood: "worried" },
      { text: "By the time it gets good, they’ve drifted off.", mood: "worried" },
      { text: "So start in the middle, where things were happening.", mood: "ready", tag: "[warm]" },
      { text: "Not, “So I’d been meaning to go camping for ages…”", mood: "ready" },
      { text: "But, “The tent was already floating when I woke up.”", mood: "wow", tag: "[playful]" },
      { text: "Here’s one of mine.", mood: "happy", tag: "[cheerful]" },
      { text: "“The fire alarm went off, and I was still in the shower.”", mood: "wow" },
      { text: "Now you want to know what happened next.", mood: "happy" },
      { text: "And say what’s at stake, early on.", mood: "ready", tag: "[warm]" },
      { text: "No problem, no story.", mood: "ready" },
      { text: "Find your first moment of action, and open with it.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The slow start
      { from: 0, to: 2, ground: "art-sky", visual: { kind: "bubble", text: "zzz" } },
      // Start in the middle
      { from: 3, to: 3, ground: "art-plum", visual: { kind: "tile" } },
      // The run-up, then the action
      { from: 4, to: 5, ground: "art-leaf", visual: { kind: "contrast", instead: "“So I’d been meaning to go camping for ages…”", tryThis: "“The tent was already floating when I woke up.”", tryAt: 5 } },
      // The blob's own opening
      { from: 6, to: 8, ground: "art-bloom", visual: { kind: "example", title: "My opening", quote: "“The fire alarm went off. I was in the shower.”" } },
      // Something at stake
      { from: 9, to: 10, ground: "art-plum", visual: { kind: "struck", text: "NO PROBLEM" } },
      // What to do
      { from: 11, to: 11, ground: "art-sun", visual: { kind: "steps", items: [{ label: "Find the moment", at: 11 }, { label: "Open with it", at: 11 }] } },
    ],
    close: { heading: "Next time you tell one", items: [{ sign: "1", label: "Open in the action" }, { sign: "!", label: "Name the stakes" }], action: "Open with the moment" },
  },
  // Lesson 3, But, and so: tension instead of a list, with the blob's bread story
  {
    id: "stories-that-land-turns",
    partId: "sl-but-1",
    label: "Stories that land · Lesson 3",
    tile: "but-and-so",
    title: "“But” and “so”, not “and then”",
    lines: [
      { text: "Does your story sound like a shopping list?", mood: "up", tag: "[curious]" },
      { text: "And then… and then… and then…", mood: "worried" },
      { text: "Try joining the steps with “but” and “so” instead.", mood: "ready", tag: "[warm]" },
      { text: "“But” adds a problem.", mood: "ready" },
      { text: "“So” shows what it caused.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I baked bread for my gran’s birthday, but used salt, not sugar.", mood: "worried" },
      { text: "So I had to start again, but the shops were shut.", mood: "wow" },
      { text: "So we had pancakes. Best birthday bread she never had.", mood: "happy" },
      { text: "If a step only fits with “and then”, it can probably go.", mood: "ready", tag: "[warm]" },
      { text: "Next time, listen for your “and then”, and swap one.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The list
      { from: 0, to: 1, ground: "art-plum", visual: { kind: "struck", text: "AND THEN…" } },
      // But and so
      { from: 2, to: 2, ground: "art-sky", visual: { kind: "tile" } },
      // What each word does
      { from: 3, to: 4, ground: "art-leaf", visual: { kind: "cards", items: [{ sign: "but", label: "Adds a problem", at: 3 }, { sign: "so", label: "Shows the result", at: 4 }] } },
      // The blob's own story
      { from: 5, to: 8, ground: "art-bloom", visual: { kind: "example", title: "My story", quote: "Salt, not sugar. So… pancakes." } },
      // Swap one
      { from: 9, to: 10, ground: "art-sun", visual: { kind: "contrast", instead: "“…and then we got home, and then we ate.”", tryThis: "“…but the shops were shut, so we had pancakes.”", tryAt: 10 } },
    ],
    close: { heading: "Join your steps with", items: [{ sign: "but", label: "A problem" }, { sign: "so", label: "What it caused" }], action: "Swap one “and then” today" },
  },
  // Lesson 4, Bring it to life: one detail and one line someone said, with the blob's boss moment
  {
    id: "stories-that-land-alive",
    partId: "sl-alive-1",
    label: "Stories that land · Lesson 4",
    tile: "bring-it-to-life",
    title: "One vivid detail",
    lines: [
      { text: "Ever told a story that felt a bit flat?", mood: "up", tag: "[curious]" },
      { text: "Two small things bring it to life.", mood: "ready", tag: "[warm]" },
      { text: "One small, true detail people can see or hear.", mood: "ready" },
      { text: "And one line someone said, in their own words.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "Not, “My boss said it wasn’t good enough.”", mood: "worried" },
      { text: "But, “At four fifty-nine, my boss slid it back across the desk.”", mood: "wow", tag: "[playful]" },
      { text: "“Again. Shorter.”", mood: "wow" },
      { text: "The time makes it real. The words make it a scene.", mood: "happy", tag: "[warm]" },
      { text: "One detail is enough. Five is a list.", mood: "ready" },
      { text: "Next time, add one detail and one line. Then watch them lean in.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The flat story
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // Bring it to life
      { from: 1, to: 1, ground: "art-plum", visual: { kind: "tile" } },
      // The two things
      { from: 2, to: 3, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "4:59", label: "One true detail", at: 2 }, { sign: "“ ”", label: "One line they said", at: 3 }] } },
      // The blob's own moment
      { from: 4, to: 8, ground: "art-bloom", visual: { kind: "example", title: "My moment", quote: "4:59. Slid it back. “Again. Shorter.”" } },
      // Not a list
      { from: 9, to: 9, ground: "art-coral", visual: { kind: "struck", text: "FIVE DETAILS" } },
      // What to do
      { from: 10, to: 10, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Add one detail", at: 10 }, { label: "Add one line", at: 10 }] } },
    ],
    close: { heading: "Bring it to life", items: [{ sign: "4:59", label: "One true detail" }, { sign: "“ ”", label: "One line they said" }], action: "Add one of each next time" },
  },
  // Lesson 5, End on the point: know the last line, say it, stop, with the blob's own ending
  {
    id: "stories-that-land-point",
    partId: "sl-end-1",
    label: "Stories that land · Lesson 5",
    tile: "end-on-the-point",
    title: "Why you’re telling it",
    lines: [
      { text: "How do you know when a story’s finished?", mood: "up", tag: "[curious]" },
      { text: "“So yeah… that was that.”", mood: "worried", tag: "[playful]" },
      { text: "A story that trails off undoes its own ending.", mood: "ready", tag: "[warm]" },
      { text: "So know your last line before you start.", mood: "ready" },
      { text: "It’s the change, the lesson, or the laugh. Pick one.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I told the bread story at work last week.", mood: "happy" },
      { text: "My last line was, “Now I label the sugar.”", mood: "happy" },
      { text: "Then I paused, and stopped talking.", mood: "closed", tag: "[calm]" },
      { text: "The silence did the rest. They laughed.", mood: "happy", tag: "[warm]" },
      { text: "Next time, say your last line, pause, and stop.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The trailing end
      { from: 1, to: 2, ground: "art-plum", visual: { kind: "struck", text: "SO YEAH…" } },
      // End on the point
      { from: 3, to: 3, ground: "art-leaf", visual: { kind: "tile" } },
      // The three kinds of last line
      { from: 4, to: 4, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "!", label: "The change", at: 4 }, { sign: "tick", label: "The lesson", at: 4 }, { sign: "ha", label: "The laugh", at: 4 }] } },
      // The blob's own ending
      { from: 5, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My last line", quote: "“Now I label the sugar.”" } },
      // What to do
      { from: 10, to: 10, ground: "art-sky", visual: { kind: "steps", items: [{ label: "Last line", at: 10 }, { label: "Pause", at: 10 }, { label: "Stop", at: 10 }] } },
    ],
    close: { heading: "End on the point", items: [{ sign: "1", label: "Last line" }, { sign: "2", label: "Pause" }, { sign: "3", label: "Stop" }], action: "Know your last line first" },
  },
  // Lesson 6, The run: under a minute, and the 4/3/2 retell, with how the blob practises
  {
    id: "stories-that-land-run",
    partId: "sl-run-1",
    label: "Stories that land · Lesson 6",
    tile: "tell-it-shorter",
    title: "Under a minute",
    lines: [
      { text: "How long should a story be?", mood: "up", tag: "[curious]" },
      { text: "In conversation, under a minute.", mood: "ready", tag: "[warm]" },
      { text: "Most stories get better when they get shorter.", mood: "ready" },
      { text: "Because what’s left is the good part.", mood: "happy" },
      { text: "Cut the background. Keep the detail, the turn, and the last line.", mood: "ready" },
      { text: "Here’s how I practise mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I tell it once in a minute.", mood: "ready" },
      { text: "Then in forty-five seconds.", mood: "ready" },
      { text: "Then in thirty.", mood: "wow" },
      { text: "By the third time, it just flows.", mood: "happy" },
      { text: "Pick one story today, and tell it three times, shorter each time.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // Tell it shorter
      { from: 1, to: 3, ground: "art-leaf", visual: { kind: "tile" } },
      // What to keep
      { from: 4, to: 4, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "tick", label: "The detail", at: 4 }, { sign: "tick", label: "The turn", at: 4 }, { sign: "tick", label: "The last line", at: 4 }] } },
      // The blob's own practice
      { from: 5, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My practice", quote: "One minute. Then 45 seconds. Then 30." } },
      // What to do
      { from: 10, to: 10, ground: "art-coral", visual: { kind: "steps", items: [{ label: "1 minute", at: 10 }, { label: "45 seconds", at: 10 }, { label: "30 seconds", at: 10 }] } },
    ],
    close: { heading: "Tell it shorter", items: [{ sign: "60", label: "First telling" }, { sign: "45", label: "Second" }, { sign: "30", label: "Third" }], action: "Three times, shorter each time" },
  },
];
