// Explain it simply's lesson clips (decision 147): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const EXPLAIN_IT_SIMPLY_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, Bottom line first: the news before the history, with the blob's own late-project update
  {
    id: "explain-it-simply-bottom",
    partId: "ex-bottom-1",
    label: "Explain it simply · Lesson 1",
    tile: "bottom-line",
    title: "Lead with the news",
    lines: [
      { text: "Ever been asked how it’s going, and given the whole history?", mood: "up", tag: "[curious]" },
      { text: "Busy people decide in your first sentence.", mood: "ready", tag: "[warm]" },
      { text: "So put the news first.", mood: "ready" },
      { text: "Where it stands, or what you need.", mood: "ready" },
      { text: "Then the detail, only if they ask.", mood: "ready" },
      { text: "Here’s mine, from this week.", mood: "happy", tag: "[cheerful]" },
      { text: "My manager asked about the new menu.", mood: "ready", tag: "[playful]" },
      { text: "I didn’t start with Monday’s meeting.", mood: "worried" },
      { text: "I said, “We’re a week late. I need one more tester.”", mood: "happy", tag: "[confident]" },
      { text: "Then I stopped.", mood: "happy" },
      { text: "She said, “Done. Thanks for the heads-up.”", mood: "wow" },
      { text: "So next update, say one sentence first.", mood: "ready", tag: "[warm]" },
      { text: "If they could act on it, you’ve led with the news.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The whole history
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // The first sentence decides
      { from: 1, to: 1, ground: "art-leaf", visual: { kind: "tile" } },
      // The history, then the news
      { from: 2, to: 4, ground: "art-sun", visual: { kind: "contrast", instead: "“So on Monday we met the supplier, and then on Tuesday…”", tryThis: "“We’re a week late. I need one more tester.”", tryAt: 3 } },
      // The blob's own update
      { from: 5, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My update", quote: "“A week late. I need one more tester.”" } },
      // The order to say it in
      { from: 11, to: 12, ground: "art-plum", visual: { kind: "steps", items: [{ label: "Where it stands", at: 11 }, { label: "What you need", at: 11 }, { label: "Detail if asked", at: 12 }] } },
    ],
    close: { heading: "Lead with the news", items: [{ sign: "1", label: "Where it stands" }, { sign: "2", label: "What you need" }, { sign: "3", label: "Detail, if asked" }], action: "Next update: news first" },
  },
  // Lesson 2, The 60-second update: done, next, need, with the blob's own Monday update
  {
    id: "explain-it-simply-update",
    partId: "ex-update-1",
    label: "Explain it simply · Lesson 2",
    tile: "done-next-need",
    title: "Done, next, need",
    lines: [
      { text: "Got thirty seconds to give an update?", mood: "up", tag: "[curious]" },
      { text: "Here’s a shape that fits almost any.", mood: "ready", tag: "[warm]" },
      { text: "Done. What’s finished.", mood: "ready" },
      { text: "Next. What comes next, and when.", mood: "ready" },
      { text: "Need. What you need, and from whom.", mood: "ready" },
      { text: "Say the three out loud, so they can follow.", mood: "happy" },
      { text: "Here’s mine from Monday.", mood: "happy", tag: "[cheerful]" },
      { text: "“Three things. Done: the new form is live.”", mood: "ready", tag: "[confident]" },
      { text: "“Next: two bug fixes, by Friday.”", mood: "ready" },
      { text: "“Need: ten minutes with Priya.”", mood: "happy" },
      { text: "Short, clear, and everyone knew what to do.", mood: "happy", tag: "[warm]" },
      { text: "And slow down for the numbers and names.", mood: "ready", tag: "[calm]" },
      { text: "That’s the part people need most.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Thirty seconds
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "0:30" } },
      // The shape
      { from: 1, to: 1, ground: "art-sun", visual: { kind: "tile" } },
      // Done, next, need
      { from: 2, to: 5, ground: "art-plum", visual: { kind: "steps", items: [{ label: "Done", at: 2 }, { label: "Next", at: 3 }, { label: "Need", at: 4 }] } },
      // The blob's own update
      { from: 6, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My update", quote: "Done: form live. Next: fixes. Need: Priya." } },
      // Numbers and names
      { from: 11, to: 12, ground: "art-coral", visual: { kind: "cards", items: [{ sign: "14", label: "Numbers", at: 11 }, { sign: "Aa", label: "Names", at: 12 }] } },
    ],
    close: { heading: "Done, next, need", items: [{ sign: "1", label: "Done" }, { sign: "2", label: "Next" }, { sign: "3", label: "Need" }], action: "Name the slots out loud" },
  },
  // Lesson 3, Explain it to a friend: plain words, with the blob's own job, explained plainly
  {
    id: "explain-it-simply-simple",
    partId: "ex-simple-1",
    label: "Explain it simply · Lesson 3",
    tile: "plain-words",
    title: "Plain words",
    lines: [
      { text: "Ever explained your job and watched eyes glaze over?", mood: "up", tag: "[curious]" },
      { text: "Jargon feels precise to you.", mood: "ready", tag: "[warm]" },
      { text: "To everyone else, it sounds like fog.", mood: "worried" },
      { text: "Plain words don’t make you sound simple.", mood: "ready" },
      { text: "People tend to judge plain writing as smarter, not simpler.", mood: "wow" },
      { text: "So if a word needs explaining, swap it.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I used to say, “I optimise cross-functional workflows.”", mood: "worried", tag: "[playful]" },
      { text: "Now I say, “I help two teams share one to-do list.”", mood: "happy" },
      { text: "People ask me more about it now, not less.", mood: "wow" },
      { text: "Try it today. Explain what you do to a ten-year-old.", mood: "ready", tag: "[warm]" },
      { text: "If they’d get it, so will everyone else.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The glazed eyes
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // Jargon is fog
      { from: 1, to: 2, ground: "art-plum", visual: { kind: "struck", text: "JARGON" } },
      // The fog, then plain words
      { from: 3, to: 5, ground: "art-sun", visual: { kind: "contrast", instead: "“We’re leveraging cross-functional synergies.”", tryThis: "“Two teams now share one queue.”", tryAt: 5 } },
      // The blob's own job, said plainly
      { from: 6, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "“I help two teams share one to-do list.”" } },
      // The ten-year-old test
      { from: 10, to: 11, ground: "art-leaf", visual: { kind: "tile" } },
    ],
    close: { heading: "Plain words", items: [{ sign: "tick", label: "Short words" }, { sign: "10", label: "Ten-year-old test" }], action: "Explain your job, plainly" },
  },
  // Lesson 4, Speak up in meetings: say something early, with the blob's own first minutes in a meeting
  {
    id: "explain-it-simply-meetings",
    partId: "ex-meet-1",
    label: "Explain it simply · Lesson 4",
    tile: "speak-up",
    title: "Say something early",
    lines: [
      { text: "Ever sat through a meeting waiting for the right moment?", mood: "up", tag: "[curious]" },
      { text: "The longer you wait, the higher the bar feels.", mood: "worried", tag: "[warm]" },
      { text: "So say something in the first few minutes.", mood: "ready" },
      { text: "A question counts.", mood: "ready" },
      { text: "So does a quick “Yes, and…”", mood: "happy" },
      { text: "Or a problem, with a way forward.", mood: "ready" },
      { text: "Here’s mine, from Tuesday.", mood: "happy", tag: "[cheerful]" },
      { text: "Five minutes in, I said, “The handover is slow.”", mood: "ready", tag: "[playful]" },
      { text: "“What if we kept one shared checklist?”", mood: "happy" },
      { text: "We tried it that week, and I was in the conversation all hour.", mood: "wow" },
      { text: "Next meeting, aim to speak before minute five.", mood: "ready", tag: "[warm]" },
      { text: "Early beats perfect.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Waiting
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // The first few minutes
      { from: 1, to: 2, ground: "art-leaf", visual: { kind: "tile" } },
      // Three ways in
      { from: 3, to: 5, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "?", label: "A question", at: 3 }, { sign: "+", label: "Yes, and…", at: 4 }, { sign: "tick", label: "A way forward", at: 5 }] } },
      // The blob's own first minutes
      { from: 6, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My meeting", quote: "“The handover is slow. What if we…?”" } },
      // Not waiting
      { from: 10, to: 11, ground: "art-plum", visual: { kind: "struck", text: "WAITING" } },
    ],
    close: { heading: "Speak early", items: [{ sign: "?", label: "A question" }, { sign: "+", label: "Yes, and…" }, { sign: "tick", label: "A way forward" }], action: "Speak before minute five" },
  },
  // Lesson 5, When you don't know: say so, then say when, with the blob's own answer on a client call
  {
    id: "explain-it-simply-dontknow",
    partId: "ex-know-1",
    label: "Explain it simply · Lesson 5",
    tile: "dont-know-yet",
    title: "Say so, then say when",
    lines: [
      { text: "What do you say when you don’t know the answer?", mood: "up", tag: "[curious]" },
      { text: "Guessing to fill the silence feels safer.", mood: "worried", tag: "[warm]" },
      { text: "It isn’t. That’s how small mistakes grow.", mood: "ready" },
      { text: "Try three steps instead.", mood: "ready" },
      { text: "Say what you don’t know.", mood: "ready" },
      { text: "Say what you do know.", mood: "ready" },
      { text: "And say when you’ll have the rest.", mood: "happy" },
      { text: "Here’s mine, from a client call.", mood: "happy", tag: "[cheerful]" },
      { text: "They asked how many customers it would affect.", mood: "wow", tag: "[playful]" },
      { text: "I said, “I don’t know the exact number yet.”", mood: "ready", tag: "[confident]" },
      { text: "“It’s only people on the old plan. I’ll have it by Thursday.”", mood: "happy" },
      { text: "They thanked me. Nobody wanted a guess.", mood: "happy" },
      { text: "It sounds more capable, not less.", mood: "happy", tag: "[warm]" },
    ],
    beats: [
      // The question
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // Not a guess
      { from: 1, to: 2, ground: "art-plum", visual: { kind: "struck", text: "A GUESS" } },
      // Three steps
      { from: 3, to: 6, ground: "art-sun", visual: { kind: "steps", items: [{ label: "Don’t know yet", at: 4 }, { label: "What I know", at: 5 }, { label: "When I’ll know", at: 6 }] } },
      // The blob's own answer
      { from: 7, to: 11, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "“Not sure yet. I’ll have it by Thursday.”" } },
      // Capable
      { from: 12, to: 12, ground: "art-leaf", visual: { kind: "tile" } },
    ],
    close: { heading: "When you don’t know", items: [{ sign: "?", label: "Don’t know yet" }, { sign: "tick", label: "What I know" }, { sign: "Thu", label: "When I’ll know" }], action: "Give a date, not a guess" },
  },
  // Lesson 6, The run: pitch an idea in problem, idea, ask, with the blob's own pitch
  {
    id: "explain-it-simply-run",
    partId: "ex-run-1",
    label: "Explain it simply · Lesson 6",
    tile: "pitch-it",
    title: "Problem, idea, ask",
    lines: [
      { text: "Got an idea that would make work easier?", mood: "wow", tag: "[curious]" },
      { text: "Here’s how to get a yes in a minute.", mood: "ready", tag: "[warm]" },
      { text: "First, the problem, in a line people feel.", mood: "ready" },
      { text: "Then your idea, in a line they can picture.", mood: "ready" },
      { text: "Then exactly what you’re asking for.", mood: "ready" },
      { text: "Three strong reasons are plenty. A fourth weak one makes people doubt.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "“Every Monday we lose an hour hunting for last week’s notes.”", mood: "worried", tag: "[playful]" },
      { text: "“If we keep them on one shared page, that hour comes back.”", mood: "happy" },
      { text: "“Can we try it for a month, starting next week?”", mood: "ready" },
      { text: "They said yes before I’d finished my coffee.", mood: "happy" },
      { text: "Your turn.", mood: "happy", tag: "[warm]" },
      { text: "Problem, idea, ask.", mood: "happy" },
    ],
    beats: [
      // The idea
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "!" } },
      // A yes in a minute
      { from: 1, to: 1, ground: "art-leaf", visual: { kind: "tile" } },
      // Problem, idea, ask
      { from: 2, to: 5, ground: "art-plum", visual: { kind: "steps", items: [{ label: "Problem", at: 2 }, { label: "Idea", at: 3 }, { label: "Ask", at: 4 }] } },
      // The blob's own pitch
      { from: 6, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My pitch", quote: "Lost hour. One shared page. Try it for a month?" } },
      // Your turn
      { from: 11, to: 12, ground: "art-coral", visual: { kind: "bubble", text: "yes!" } },
    ],
    close: { heading: "Problem, idea, ask", items: [{ sign: "1", label: "The problem" }, { sign: "2", label: "Your idea" }, { sign: "3", label: "Your ask" }], action: "Pitch one small idea" },
  },
];
