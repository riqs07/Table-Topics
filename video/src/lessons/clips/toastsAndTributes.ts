// Toasts and tributes's lesson clips (decision 155): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const TOASTS_AND_TRIBUTES_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, One story, one quality: one moment instead of a list of virtues, with the blob's own toast to a patient friend
  {
    id: "toasts-and-tributes-story",
    partId: "tt-story-1",
    label: "Toasts and tributes · Lesson 1",
    tile: "one-story-one-quality",
    title: "One story, not a list",
    lines: [
      { text: "Someone’s asked you to say a few words.", mood: "wow", tag: "[curious]" },
      { text: "So you reach for a list.", mood: "ready", tag: "[playful]" },
      { text: "“Kind, funny, generous…”", mood: "worried" },
      { text: "But lists slide past.", mood: "ready", tag: "[thoughtful]" },
      { text: "One story sticks.", mood: "happy", tag: "[confident]" },
      { text: "One moment with them that shows one thing.", mood: "ready", tag: "[warm]" },
      { text: "Don’t say he’s patient. Show it.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "For my friend’s birthday, I skipped the list.", mood: "ready" },
      { text: "I told the night he taught me to drive.", mood: "ready" },
      { text: "I stalled eleven times. He just said, “Again.”", mood: "happy", tag: "[playful]" },
      { text: "Everyone laughed. And everyone got it.", mood: "happy", tag: "[warm]" },
      { text: "So before you write a word, pick the story.", mood: "ready", tag: "[confident]" },
      { text: "One moment. One quality. That’s your toast.", mood: "happy" },
    ],
    beats: [
      // Asked to speak
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The list of virtues
      { from: 2, to: 3, ground: "art-plum", visual: { kind: "struck", text: "KIND, FUNNY…" } },
      // The lesson's name
      { from: 4, to: 6, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own toast
      { from: 7, to: 11, ground: "art-bloom", visual: { kind: "example", title: "My toast", quote: "Eleven stalls. One word: “Again.”" } },
      // What to do
      { from: 12, to: 13, ground: "art-coral", visual: { kind: "steps", items: [{ label: "Pick one moment", at: 12 }, { label: "Show one quality", at: 13 }] } },
    ],
    close: { heading: "One story", items: [{ sign: "1", label: "One moment" }, { sign: "2", label: "One quality" }], action: "Pick your story first" },
  },
  // Lesson 2, Open on them: no apology for nerves, with the blob's own first line at its sister's wedding
  {
    id: "toasts-and-tributes-open",
    partId: "tt-open-1",
    label: "Toasts and tributes · Lesson 2",
    tile: "open-on-them",
    title: "Not “I’m not good at this”",
    lines: [
      { text: "You stand up. Everyone turns to look.", mood: "wow", tag: "[curious]" },
      { text: "And the first thing out is…", mood: "worried", tag: "[playful]" },
      { text: "“Sorry, I’m terrible at this.”", mood: "worried" },
      { text: "Now everyone’s looking at your nerves.", mood: "ready", tag: "[thoughtful]" },
      { text: "And they barely showed until you said so.", mood: "ready" },
      { text: "So open on them, not on you.", mood: "happy", tag: "[warm]" },
      { text: "Their name, and how you know them.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "At my sister’s wedding, my knees were shaking.", mood: "worried" },
      { text: "I didn’t mention it.", mood: "ready" },
      { text: "I said, “I shared a room with Ana for eighteen years.”", mood: "happy" },
      { text: "Everyone smiled at her, not at me.", mood: "happy", tag: "[warm]" },
      { text: "Write your first line now.", mood: "ready", tag: "[confident]" },
      { text: "Start it with their name.", mood: "happy" },
    ],
    beats: [
      // Standing up
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // The apology
      { from: 2, to: 4, ground: "art-plum", visual: { kind: "struck", text: "I’M TERRIBLE AT THIS" } },
      // The lesson's name
      { from: 5, to: 6, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own first line
      { from: 7, to: 11, ground: "art-sun", visual: { kind: "example", title: "My first line", quote: "“I shared a room with Ana for eighteen years.”" } },
      // What to do
      { from: 12, to: 13, ground: "art-coral", visual: { kind: "cards", items: [{ sign: "1", label: "Their name", at: 12 }, { sign: "2", label: "How you know them", at: 13 }] } },
    ],
    close: { heading: "Your first line", items: [{ sign: "1", label: "Their name" }, { sign: "2", label: "How you know them" }], action: "No apology needed" },
  },
  // Lesson 3, Short and sweet: two or three minutes, with the blob cutting its leaving toast from four stories to one
  {
    id: "toasts-and-tributes-short",
    partId: "tt-short-1",
    label: "Toasts and tributes · Lesson 3",
    tile: "short-and-sweet",
    title: "Two or three minutes",
    lines: [
      { text: "How long should a toast be?", mood: "up", tag: "[curious]" },
      { text: "Shorter than you think.", mood: "happy", tag: "[playful]" },
      { text: "Most run two to five minutes.", mood: "ready", tag: "[thoughtful]" },
      { text: "Aim for the short end.", mood: "ready" },
      { text: "One story. One line on what it shows. One raised glass.", mood: "ready", tag: "[confident]" },
      { text: "That fits in three minutes.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "For a friend’s leaving drinks, I wrote four stories.", mood: "worried" },
      { text: "Too long. So I kept just one.", mood: "ready" },
      { text: "The day she rescued our picnic in the rain.", mood: "happy" },
      { text: "Two minutes, start to finish.", mood: "happy", tag: "[warm]" },
      { text: "If yours runs long, cut a story.", mood: "ready", tag: "[confident]" },
      { text: "Never the ending.", mood: "happy" },
    ],
    beats: [
      // The question
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The lesson's name
      { from: 2, to: 3, ground: "art-plum", visual: { kind: "tile" } },
      // What fits
      { from: 4, to: 5, ground: "art-coral", visual: { kind: "cards", items: [{ sign: "1", label: "One story", at: 4 }, { sign: "2", label: "What it shows", at: 4 }, { sign: "3", label: "Raise a glass", at: 5 }] } },
      // The blob's own leaving toast
      { from: 6, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My leaving toast", quote: "Four stories in. One kept. Two minutes." } },
      // Cut a story, never the ending
      { from: 11, to: 12, ground: "art-sun", visual: { kind: "contrast", instead: "A second story, a third, a fourth…", tryThis: "One story, then the glass.", tryAt: 12 } },
    ],
    close: { heading: "Short and sweet", items: [{ sign: "1", label: "Story" }, { sign: "3", label: "Minutes at most" }], action: "Time yours out loud today" },
  },
  // Lesson 4, Raise the glass: a clean ending, with the blob's own last line to its team
  {
    id: "toasts-and-tributes-glass",
    partId: "tt-glass-1",
    label: "Toasts and tributes · Lesson 4",
    tile: "raise-the-glass",
    title: "End with the glass",
    lines: [
      { text: "The story’s told. Now what?", mood: "up", tag: "[curious]" },
      { text: "This is where toasts fizzle out.", mood: "worried", tag: "[playful]" },
      { text: "“So yeah, anyway, that’s about it.”", mood: "worried" },
      { text: "But a toast has the cleanest ending there is.", mood: "happy", tag: "[warm]" },
      { text: "Say what the story shows.", mood: "ready" },
      { text: "Ask everyone to raise their glasses.", mood: "happy" },
      { text: "Say their name. Then stop.", mood: "happy", tag: "[confident]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "When our team finished a long project, I gave the toast.", mood: "ready" },
      { text: "I ended: “We made it because nobody let go. To the team!”", mood: "happy" },
      { text: "Then I sat down. Glasses up, done.", mood: "happy", tag: "[warm]" },
      { text: "Write your last line before anything else.", mood: "ready", tag: "[confident]" },
      { text: "And end it on their name.", mood: "happy" },
    ],
    beats: [
      // Fizzling out
      { from: 0, to: 2, ground: "art-sky", visual: { kind: "struck", text: "SO YEAH, ANYWAY…" } },
      // The lesson's name
      { from: 3, to: 3, ground: "art-plum", visual: { kind: "tile" } },
      // The three steps of the ending
      { from: 4, to: 6, ground: "art-sun", visual: { kind: "steps", items: [{ label: "What it shows", at: 4 }, { label: "Glasses up", at: 5 }, { label: "Their name", at: 6 }] } },
      // The blob's own last line
      { from: 7, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My last line", quote: "“Nobody let go. To the team!”" } },
      // A trailing end against a clean one
      { from: 11, to: 12, ground: "art-leaf", visual: { kind: "contrast", instead: "“So yeah, that’s about it.”", tryThis: "“Please raise your glasses. To Sam!”", tryAt: 12 } },
    ],
    close: { heading: "The last line", items: [{ sign: "1", label: "What it shows" }, { sign: "2", label: "Glasses up" }, { sign: "3", label: "Their name" }], action: "Then sit down" },
  },
  // Lesson 5, On the day: "I'm excited" instead of "calm down", with the blob's own two words before a wedding toast
  {
    id: "toasts-and-tributes-day",
    partId: "tt-day-1",
    label: "Toasts and tributes · Lesson 5",
    tile: "toast-on-the-day",
    title: "Call it excitement",
    lines: [
      { text: "It’s the day. Your heart is racing.", mood: "worried", tag: "[playful]" },
      { text: "You could tell yourself to calm down.", mood: "closed", tag: "[calm]" },
      { text: "Or you could try two other words.", mood: "up", tag: "[curious]" },
      { text: "“I’m excited.”", mood: "happy", tag: "[cheerful]" },
      { text: "Nerves and excitement feel much the same in the body.", mood: "ready", tag: "[thoughtful]" },
      { text: "In studies, saying “I’m excited” helped people feel more excited.", mood: "ready" },
      { text: "It didn’t change how the speeches were rated. Just how they felt.", mood: "ready", tag: "[calm]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "Before my best friend’s wedding toast, my hands were shaking.", mood: "worried" },
      { text: "I said, out loud, “I’m excited.”", mood: "happy" },
      { text: "Then I looked at her, and began.", mood: "happy", tag: "[warm]" },
      { text: "Try it before your toast.", mood: "ready", tag: "[confident]" },
      { text: "Two words, out loud, then their name.", mood: "happy" },
    ],
    beats: [
      // The racing heart, and "calm down"
      { from: 0, to: 1, ground: "art-plum", visual: { kind: "struck", text: "CALM DOWN!" } },
      // Two other words
      { from: 2, to: 3, ground: "art-coral", visual: { kind: "bubble", text: "I’m excited!" } },
      // The lesson's name
      { from: 4, to: 6, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own wedding toast
      { from: 7, to: 10, ground: "art-bloom", visual: { kind: "example", title: "Before my toast", quote: "“I’m excited.” Then I looked at her." } },
      // What to do
      { from: 11, to: 12, ground: "art-sun", visual: { kind: "steps", items: [{ label: "“I’m excited”", at: 11 }, { label: "Their name", at: 12 }] } },
    ],
    close: { heading: "On the day", items: [{ sign: "1", label: "“I’m excited”" }, { sign: "2", label: "Look at them" }, { sign: "3", label: "Their name" }], action: "Then begin" },
  },
];
