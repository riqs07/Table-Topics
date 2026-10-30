// Stop freezing's lesson clips (decision 147): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const STOP_FREEZING_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, Buy a beat: a pause sounds sure, an "um" sounds lost, with the blob's own breath before "Autumn"
  {
    id: "stop-freezing-beat",
    partId: "sf-beat-1",
    label: "Stop freezing · Lesson 1",
    tile: "buy-a-beat",
    title: "Pause, don’t fill",
    lines: [
      { text: "Someone asks you a question out of nowhere.", mood: "wow", tag: "[curious]" },
      { text: "And out comes “um, so, uh…”", mood: "worried", tag: "[playful]" },
      { text: "Here’s the thing.", mood: "ready", tag: "[warm]" },
      { text: "A pause sounds sure.", mood: "ready" },
      { text: "An “um” sounds lost.", mood: "worried" },
      { text: "Silence feels long to you, and short to everyone else.", mood: "ready", tag: "[thoughtful]" },
      { text: "So buy a beat.", mood: "happy" },
      { text: "Take one breath before your first word.", mood: "closed", tag: "[calm]" },
      { text: "Then, when you reach for “um”, close your mouth and pause.", mood: "closed" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "Someone asked me my favourite season.", mood: "ready" },
      { text: "I breathed in, and said: “Autumn. Easily.”", mood: "happy" },
      { text: "No um. Just a beat, then the answer.", mood: "happy", tag: "[confident]" },
      { text: "Try it on your next question.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The surprise, and the fillers
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "um" } },
      // An "um" sounds lost; a pause sounds sure
      { from: 2, to: 5, ground: "art-plum", visual: { kind: "contrast", instead: "“Um, so, uh, I think…”", tryThis: "(a breath) “I think…”", tryAt: 3 } },
      // The lesson's name
      { from: 6, to: 6, ground: "art-sun", visual: { kind: "tile" } },
      // What to do
      { from: 7, to: 8, ground: "art-coral", visual: { kind: "steps", items: [{ label: "Breathe in", at: 7 }, { label: "Pause, not “um”", at: 8 }] } },
      // The blob's own answer
      { from: 9, to: 13, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "(a breath) “Autumn. Easily.”" } },
    ],
    close: { heading: "Before you answer", items: [{ sign: "1", label: "Take a breath" }, { sign: "2", label: "Then speak" }, { sign: "…", label: "Pause, not “um”" }], action: "Try it on your next answer" },
  },
  // Lesson 2, Point first: the answer in the first sentence, with the blob's own "Yes, the basics"
  {
    id: "stop-freezing-point",
    partId: "sf-point-1",
    label: "Stop freezing · Lesson 2",
    tile: "point-first",
    title: "Answer first",
    lines: [
      { text: "When a question surprises you, what do you do?", mood: "up", tag: "[curious]" },
      { text: "Most of us warm up out loud.", mood: "ready", tag: "[playful]" },
      { text: "“So, basically, it kind of depends…”", mood: "worried" },
      { text: "But listeners decide what you think from your first sentence.", mood: "ready", tag: "[thoughtful]" },
      { text: "So put your answer there.", mood: "happy", tag: "[confident]" },
      { text: "Answer first. Explain after.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "Someone asked: should everyone learn to cook?", mood: "ready" },
      { text: "I said, “Yes, the basics.”", mood: "happy" },
      { text: "Then why: five meals you can make without a recipe.", mood: "ready" },
      { text: "The answer came first, in three words.", mood: "happy" },
      { text: "Try the headline test.", mood: "ready", tag: "[warm]" },
      { text: "If they heard only your first sentence, would they know your answer?", mood: "up" },
    ],
    beats: [
      // The question
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // Warming up out loud
      { from: 2, to: 3, ground: "art-plum", visual: { kind: "struck", text: "IT DEPENDS…" } },
      // The lesson's name
      { from: 4, to: 5, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own answer
      { from: 6, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "“Yes, the basics.” Then why." } },
      // The headline test
      { from: 11, to: 12, ground: "art-coral", visual: { kind: "contrast", instead: "“So, I guess it depends on a lot of things…”", tryThis: "“Autumn. The light is better.”", tryAt: 12 } },
    ],
    close: { heading: "Point first", items: [{ sign: "1", label: "Your answer" }, { sign: "2", label: "Then why" }], action: "Pass the headline test" },
  },
  // Lesson 3, Point, reason, example: three beats fill a minute, with the blob's own boat named Second Wind
  {
    id: "stop-freezing-pre",
    partId: "sf-pre-1",
    label: "Stop freezing · Lesson 3",
    tile: "point-reason-example",
    title: "Three beats",
    lines: [
      { text: "Got a minute to fill, and no plan?", mood: "up", tag: "[curious]" },
      { text: "Use three beats.", mood: "ready", tag: "[warm]" },
      { text: "Your point.", mood: "ready" },
      { text: "A reason.", mood: "ready" },
      { text: "And one example from your own life.", mood: "happy" },
      { text: "Three beats fill a minute, and keep you from wandering.", mood: "ready", tag: "[thoughtful]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "What would I name a boat?", mood: "up" },
      { text: "Second Wind.", mood: "happy" },
      { text: "Because boats are for people who finally have time again.", mood: "ready" },
      { text: "My uncle bought his the year he retired, and called it exactly that.", mood: "happy" },
      { text: "Run dry?", mood: "up", tag: "[warm]" },
      { text: "Go back into your example.", mood: "ready" },
      { text: "Where you were, who was there, what someone said.", mood: "ready" },
      { text: "Then say your point again, and stop.", mood: "happy", tag: "[confident]" },
    ],
    beats: [
      // The empty minute
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The three beats
      { from: 2, to: 4, ground: "art-sun", visual: { kind: "steps", items: [{ label: "Point", at: 2 }, { label: "Reason", at: 3 }, { label: "Example", at: 4 }] } },
      // The lesson's name
      { from: 5, to: 5, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own answer
      { from: 6, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "Second Wind. Time again. My uncle’s boat." } },
      // Making it a minute
      { from: 11, to: 14, ground: "art-coral", visual: { kind: "list", title: "Make it a minute", items: [{ label: "Where", text: "The harbour, at dawn", at: 13 }, { label: "Who", text: "My uncle, grinning", at: 13 }, { label: "Said", text: "“Finally.”", at: 13 }] } },
    ],
    close: { heading: "Three beats", items: [{ sign: "1", label: "Point" }, { sign: "2", label: "Reason" }, { sign: "3", label: "Example" }], action: "Then your point again" },
  },
  // Lesson 4, Land it: finish where you started, then stop, with the blob's own "So: crisps. Every time."
  {
    id: "stop-freezing-land",
    partId: "sf-land-1",
    label: "Stop freezing · Lesson 4",
    tile: "land-it",
    title: "End on purpose",
    lines: [
      { text: "You’ve made a good point. Now, how do you stop?", mood: "up", tag: "[curious]" },
      { text: "Most answers trail off.", mood: "ready", tag: "[playful]" },
      { text: "“…so yeah, I don’t know, that’s kind of it.”", mood: "worried" },
      { text: "That undoes a good answer.", mood: "ready" },
      { text: "Instead, finish where you started.", mood: "ready", tag: "[warm]" },
      { text: "Say your point once more, in a few words.", mood: "happy" },
      { text: "Then stop.", mood: "closed", tag: "[calm]" },
      { text: "Let the silence mark the end.", mood: "closed" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "Asked for the best snack, I talked about crisps for a minute.", mood: "ready" },
      { text: "Then I landed it: “So: crisps. Every time.”", mood: "happy" },
      { text: "And I stopped.", mood: "happy", tag: "[confident]" },
      { text: "The quiet after feels long to you.", mood: "ready" },
      { text: "To them, it sounds like a full stop.", mood: "happy" },
    ],
    beats: [
      // How to stop
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // Trailing off, and landing it instead
      { from: 2, to: 5, ground: "art-plum", visual: { kind: "contrast", instead: "“…so yeah, that’s kind of it.”", tryThis: "Your point again, in a few words.", tryAt: 4 } },
      // The lesson's name
      { from: 6, to: 7, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own landing
      { from: 8, to: 11, ground: "art-sun", visual: { kind: "example", title: "How I landed it", quote: "“So: crisps. Every time.”" } },
      // The quiet after
      { from: 12, to: 13, ground: "art-coral", visual: { kind: "cards", items: [{ sign: "…", label: "Long to you", at: 12 }, { sign: ".", label: "Full stop to them", at: 13 }] } },
    ],
    close: { heading: "Land it", items: [{ sign: "1", label: "Point again" }, { sign: "2", label: "Then stop" }], action: "End on purpose today" },
  },
  // Lesson 5, Back on track: blank? say your point again, with the blob's own lighthouse keeper
  {
    id: "stop-freezing-back",
    partId: "sf-back-1",
    label: "Stop freezing · Lesson 5",
    tile: "back-on-track",
    title: "Go back to your point",
    lines: [
      { text: "Mid-answer, your mind goes blank.", mood: "worried", tag: "[worried]" },
      { text: "It happens to everyone.", mood: "ready", tag: "[warm]" },
      { text: "Don’t search in silence for something new.", mood: "ready" },
      { text: "Go back instead.", mood: "happy", tag: "[confident]" },
      { text: "Breathe, and say your last point again, in a few words.", mood: "closed", tag: "[calm]" },
      { text: "The next sentence usually follows.", mood: "ready" },
      { text: "To listeners, it sounds like emphasis.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I was describing a dream job, and lost my thread.", mood: "worried" },
      { text: "So I said, “A week as a lighthouse keeper. A week of quiet.”", mood: "ready" },
      { text: "And there it was: the next thing to say.", mood: "happy" },
      { text: "Still stuck? Say “for example”, and your memory finds one.", mood: "ready", tag: "[warm]" },
      { text: "A stumble feels big. Hardly anyone notices.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The blank
      { from: 0, to: 1, ground: "art-plum", visual: { kind: "bubble", text: "…" } },
      // Searching, and going back instead
      { from: 2, to: 3, ground: "art-sky", visual: { kind: "contrast", instead: "“Sorry, I’ve lost it…”", tryThis: "Breathe. Say your point again.", tryAt: 3 } },
      // The lesson's name
      { from: 4, to: 6, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own way back
      { from: 7, to: 10, ground: "art-bloom", visual: { kind: "example", title: "Back on track", quote: "“A week as a lighthouse keeper. A week of quiet.”" } },
      // Two more ways on
      { from: 11, to: 12, ground: "art-coral", visual: { kind: "cards", items: [{ sign: "…", label: "For example…", at: 11 }, { sign: "tick", label: "Carry on", at: 12 }] } },
    ],
    close: { heading: "When you go blank", items: [{ sign: "1", label: "Breathe" }, { sign: "2", label: "Point again" }, { sign: "3", label: "Carry on" }], action: "Keep going, no apology" },
  },
  // Lesson 6, The run: breathe, point, example, land, twice, with the blob's own tea answer
  {
    id: "stop-freezing-run",
    partId: "sf-run-1",
    label: "Stop freezing · Lesson 6",
    tile: "the-run",
    title: "Two in a row",
    lines: [
      { text: "Ready to put it all together?", mood: "happy", tag: "[cheerful]" },
      { text: "Here’s the whole run, in four moves.", mood: "ready", tag: "[warm]" },
      { text: "Breathe.", mood: "closed" },
      { text: "Point first.", mood: "ready" },
      { text: "One example.", mood: "ready" },
      { text: "Land it.", mood: "happy" },
      { text: "Then do it again, straight away.", mood: "ready", tag: "[confident]" },
      { text: "The second go is usually the better one.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "Tea or coffee?", mood: "up" },
      { text: "A breath.", mood: "closed" },
      { text: "“Tea. Strong, one sugar.”", mood: "happy" },
      { text: "Because it’s what my gran made me after school.", mood: "happy" },
      { text: "So: tea.", mood: "happy", tag: "[confident]" },
      { text: "Every time.", mood: "happy" },
      { text: "Now you. Two in a row, out loud.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Ready
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "!" } },
      // The four moves
      { from: 2, to: 5, ground: "art-sun", visual: { kind: "steps", items: [{ label: "Breathe", at: 2 }, { label: "Point first", at: 3 }, { label: "One example", at: 4 }, { label: "Land it", at: 5 }] } },
      // The lesson's name
      { from: 6, to: 7, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own run
      { from: 8, to: 15, ground: "art-bloom", visual: { kind: "example", title: "My run", quote: "“Tea. Strong, one sugar.” … So: tea." } },
    ],
    close: { heading: "The run", items: [{ sign: "1", label: "Breathe, point" }, { sign: "2", label: "One example" }, { sign: "3", label: "Land it" }], action: "Two in a row, out loud" },
  },
];
