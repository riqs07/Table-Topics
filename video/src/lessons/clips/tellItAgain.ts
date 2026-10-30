// Tell it again, better's lesson clips (decision 155): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const TELL_IT_AGAIN_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, Find your five: one line a day, with the blob's own line about the bus that waited
  {
    id: "tell-it-again-find",
    partId: "ta-find-1",
    label: "Tell it again, better · Lesson 1",
    tile: "five-stories",
    title: "One line a day",
    lines: [
      { text: "Think you don’t have any stories?", mood: "up", tag: "[curious]" },
      { text: "You do. You just forget them by Friday.", mood: "happy", tag: "[playful]" },
      { text: "So catch them while they’re fresh.", mood: "ready", tag: "[warm]" },
      { text: "Each evening, write one line.", mood: "ready" },
      { text: "The moment from today most worth telling.", mood: "ready", tag: "[thoughtful]" },
      { text: "Not a diary. Just one line.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "Tuesday: “The bus waited for the man with the cake.”", mood: "ready" },
      { text: "Reading it back, I could see the whole thing again.", mood: "happy" },
      { text: "A week of lines, and you have seven stories.", mood: "happy", tag: "[confident]" },
      { text: "Then pick the few worth telling again and again.", mood: "ready" },
      { text: "Five is a good start.", mood: "happy" },
      { text: "Tonight, write your first line.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // No stories?
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The habit
      { from: 2, to: 5, ground: "art-plum", visual: { kind: "steps", items: [{ label: "Each evening", at: 3 }, { label: "One moment", at: 4 }, { label: "One line", at: 5 }] } },
      // The blob's own line
      { from: 6, to: 8, ground: "art-bloom", visual: { kind: "example", title: "My line", quote: "“The bus waited for the man with the cake.”" } },
      // Seven lines, five stories
      { from: 9, to: 10, ground: "art-coral", visual: { kind: "cards", items: [{ sign: "7", label: "A week of lines", at: 9 }, { sign: "5", label: "Your five stories", at: 10 }] } },
      // The lesson's name
      { from: 11, to: 12, ground: "art-sun", visual: { kind: "tile" } },
    ],
    close: { heading: "Find your stories", items: [{ sign: "1", label: "One line a day" }, { sign: "5", label: "Pick your five" }], action: "Tonight, write one line" },
  },
  // Lesson 2, Start close to the change: find the moment it changed and begin just before it, with the blob's story that now starts at the gate
  {
    id: "tell-it-again-close",
    partId: "ta-close-1",
    label: "Tell it again, better · Lesson 2",
    tile: "close-to-the-change",
    title: "Find the change first",
    lines: [
      { text: "Where does your story start?", mood: "up", tag: "[curious]" },
      { text: "For most of us, far too early.", mood: "worried", tag: "[playful]" },
      { text: "The alarm. The traffic. The weather.", mood: "worried" },
      { text: "Every story turns on one moment when something changed.", mood: "ready", tag: "[thoughtful]" },
      { text: "Find that moment first.", mood: "ready" },
      { text: "Then start as close to it as you can.", mood: "happy", tag: "[confident]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I used to start with booking the flight, months before.", mood: "ready" },
      { text: "Now I start at the gate: “Your seat’s been given away.”", mood: "wow" },
      { text: "Same story. A minute shorter.", mood: "happy" },
      { text: "So ask: where did it change?", mood: "ready", tag: "[warm]" },
      { text: "Then start one line before it.", mood: "happy" },
    ],
    beats: [
      // Starting far too early
      { from: 0, to: 2, ground: "art-plum", visual: { kind: "struck", text: "THE ALARM…" } },
      // The lesson's name
      { from: 3, to: 5, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own opening
      { from: 6, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My opening", quote: "At the gate: “Your seat’s been given away.”" } },
      // What to do
      { from: 10, to: 11, ground: "art-coral", visual: { kind: "steps", items: [{ label: "Find the change", at: 10 }, { label: "One line before", at: 11 }] } },
    ],
    close: { heading: "Start close", items: [{ sign: "1", label: "Find the change" }, { sign: "2", label: "Start just before" }], action: "Move your first line closer" },
  },
  // Lesson 3, Slow down the moment: rush the run-up and slow the few seconds that matter, with the blob's email moment on the stairs
  {
    id: "tell-it-again-slow",
    partId: "ta-slow-1",
    label: "Tell it again, better · Lesson 3",
    tile: "slow-the-moment",
    title: "The five seconds",
    lines: [
      { text: "Most stories rush the best part.", mood: "worried", tag: "[thoughtful]" },
      { text: "Three minutes of run-up, then the moment in one breath.", mood: "worried", tag: "[playful]" },
      { text: "Flip it.", mood: "happy", tag: "[confident]" },
      { text: "Every story turns on a few seconds.", mood: "ready" },
      { text: "That’s where your listeners want to be.", mood: "ready", tag: "[warm]" },
      { text: "So cut the run-up to a line.", mood: "ready" },
      { text: "And spend the time you saved on the moment.", mood: "happy" },
      { text: "What you saw. What you thought. What you felt.", mood: "closed", tag: "[calm]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "The email said, “We’re delighted…”", mood: "wow" },
      { text: "I read that line three times. Then I sat down on the stairs.", mood: "happy" },
      { text: "Five seconds, told slowly.", mood: "happy" },
      { text: "Find your five seconds, and slow down there.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Rushing the best part
      { from: 0, to: 1, ground: "art-plum", visual: { kind: "struck", text: "RUN-UP…" } },
      // The lesson's name
      { from: 2, to: 4, ground: "art-sky", visual: { kind: "tile" } },
      // What to do
      { from: 5, to: 7, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Cut the run-up", at: 5 }, { label: "Slow the moment", at: 6 }, { label: "See, think, feel", at: 7 }] } },
      // The blob's own moment
      { from: 8, to: 12, ground: "art-bloom", visual: { kind: "example", title: "My moment", quote: "“We’re delighted…” I read it three times." } },
    ],
    close: { heading: "Slow the moment", items: [{ sign: "1", label: "Cut the run-up" }, { sign: "5s", label: "Slow down there" }], action: "Find your five seconds" },
  },
  // Lesson 4, Let them speak: their words needn't be exact, only sound like them, with the blob's grandad after the driving test
  {
    id: "tell-it-again-said",
    partId: "ta-said-1",
    label: "Tell it again, better · Lesson 4",
    tile: "in-their-words",
    title: "Your version of their words",
    lines: [
      { text: "“She told me not to worry.”", mood: "ready", tag: "[thoughtful]" },
      { text: "That’s a summary. We hear about her.", mood: "ready" },
      { text: "Now try: “She laughed. ‘Worry? About that?’”", mood: "happy", tag: "[playful]" },
      { text: "Now we hear her.", mood: "wow" },
      { text: "Everyday storytellers do this all the time.", mood: "ready", tag: "[thoughtful]" },
      { text: "And here’s the freeing part.", mood: "happy", tag: "[warm]" },
      { text: "It doesn’t have to be word for word.", mood: "happy" },
      { text: "Just words that sound like them, at the moment that matters.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "My grandad, the day I failed my driving test:", mood: "ready" },
      { text: "“Good. Now you know where the kerb is.”", mood: "happy", tag: "[playful]" },
      { text: "I can’t swear those were his words. But that was his voice.", mood: "happy", tag: "[warm]" },
      { text: "Find the turn in your story, and let someone speak.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // A summary, then their words
      { from: 0, to: 3, ground: "art-plum", visual: { kind: "contrast", instead: "“She told me not to worry.”", tryThis: "“She laughed. ‘Worry? About that?’”", tryAt: 2 } },
      // The lesson's name
      { from: 4, to: 5, ground: "art-sun", visual: { kind: "tile" } },
      // Not word for word
      { from: 6, to: 7, ground: "art-coral", visual: { kind: "cards", items: [{ sign: "1", label: "Not word for word", at: 6 }, { sign: "2", label: "Sounds like them", at: 7 }] } },
      // The blob's own line
      { from: 8, to: 12, ground: "art-bloom", visual: { kind: "example", title: "My line", quote: "“Good. Now you know where the kerb is.”" } },
    ],
    close: { heading: "Let them speak", items: [{ sign: "1", label: "Find the turn" }, { sign: "2", label: "Words like theirs" }], action: "Give one person one line" },
  },
  // Lesson 5, End on what it meant: say why it mattered, then tell it again with one thing to fix, with the blob's last line about directions
  {
    id: "tell-it-again-meant",
    partId: "ta-meant-1",
    label: "Tell it again, better · Lesson 5",
    tile: "what-it-meant",
    title: "Say why it mattered",
    lines: [
      { text: "Ever finished a story and heard: “And…?”", mood: "worried", tag: "[playful]" },
      { text: "Something was missing.", mood: "worried" },
      { text: "The line that says why it mattered.", mood: "ready", tag: "[thoughtful]" },
      { text: "It’s the part most stories leave out.", mood: "ready" },
      { text: "So end on what’s different now.", mood: "happy", tag: "[confident]" },
      { text: "“Ever since then…”", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I got lost in a new city, and a stranger walked me all the way back.", mood: "ready" },
      { text: "My last line: “Ever since then, I ask before I’m lost.”", mood: "happy" },
      { text: "Then tell it again.", mood: "ready", tag: "[warm]" },
      { text: "Each time, fix one thing. Just one.", mood: "happy" },
      { text: "It gets shorter, and it gets better.", mood: "happy", tag: "[confident]" },
      { text: "Tonight, find your last line.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // "And…?"
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "And…?" } },
      // The lesson's name
      { from: 2, to: 5, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own last line
      { from: 6, to: 8, ground: "art-bloom", visual: { kind: "example", title: "My last line", quote: "“Ever since then, I ask before I’m lost.”" } },
      // Tell it again
      { from: 9, to: 12, ground: "art-coral", visual: { kind: "steps", items: [{ label: "Tell it again", at: 9 }, { label: "Fix one thing", at: 10 }, { label: "Shorter, better", at: 11 }] } },
    ],
    close: { heading: "Why it mattered", items: [{ sign: "1", label: "Say what it meant" }, { sign: "2", label: "Tell it again" }], action: "Find your last line tonight" },
  },
];
