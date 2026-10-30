// Ready by the day's lesson clips (decision 147): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const READY_BY_THE_DAY_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, One message: say it in one sentence, then three points at most, with the blob's sentence for a leaving do
  {
    id: "ready-by-the-day-message",
    partId: "rd-msg-1",
    label: "Ready by the day · Lesson 1",
    tile: "one-message",
    title: "The one sentence",
    lines: [
      { text: "Got a talk coming up, and no idea where to start?", mood: "up", tag: "[curious]" },
      { text: "Start with one sentence.", mood: "ready", tag: "[warm]" },
      { text: "If they remember just one thing, what is it?", mood: "ready" },
      { text: "Not “my talk is about our year”.", mood: "worried" },
      { text: "But “small, fast tests beat big launches”.", mood: "happy" },
      { text: "Here’s mine, for a friend’s leaving do.", mood: "happy", tag: "[cheerful]" },
      { text: "My sentence: Sam makes every room braver.", mood: "happy" },
      { text: "Every story I tell has to show that.", mood: "ready" },
      { text: "Then pick three points that back it up.", mood: "ready", tag: "[warm]" },
      { text: "Three is plenty. A fourth makes people doubt the rest.", mood: "ready" },
      { text: "Cut it, however good it is.", mood: "ready" },
      { text: "So write your one sentence first.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Where to start
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The one thing they remember
      { from: 2, to: 2, ground: "art-leaf", visual: { kind: "tile" } },
      // A topic, then a message
      { from: 3, to: 4, ground: "art-plum", visual: { kind: "contrast", instead: "“My talk is about our year.”", tryThis: "“Small, fast tests beat big launches.”", tryAt: 4 } },
      // The blob's own sentence
      { from: 5, to: 7, ground: "art-bloom", visual: { kind: "example", title: "My one sentence", quote: "“Sam makes every room braver.”" } },
      // Three points
      { from: 8, to: 8, ground: "art-sun", visual: { kind: "steps", items: [{ label: "Point one", at: 8 }, { label: "Point two", at: 8 }, { label: "Point three", at: 8 }] } },
      // Not a fourth
      { from: 9, to: 10, ground: "art-coral", visual: { kind: "struck", text: "POINT FOUR" } },
      // Write it first
      { from: 11, to: 11, ground: "art-sky", visual: { kind: "bubble", text: "1" } },
    ],
    close: { heading: "Before you write", items: [{ sign: "1", label: "One sentence" }, { sign: "3", label: "Three points" }], action: "Write your one sentence" },
  },
  // Lesson 2, Open strong: a hook, not your name, with the blob's opening for a gardening talk
  {
    id: "ready-by-the-day-open",
    partId: "rd-open-1",
    label: "Ready by the day · Lesson 2",
    tile: "open-strong",
    title: "Skip the throat-clearing",
    lines: [
      { text: "How do most talks start?", mood: "up", tag: "[curious]" },
      { text: "“Hi, I’m Sam, and today I’ll be talking about…”", mood: "worried", tag: "[flat]" },
      { text: "That spends your best moment on nothing.", mood: "ready" },
      { text: "Open with a hook instead.", mood: "happy", tag: "[warm]" },
      { text: "A question.", mood: "ready" },
      { text: "A moment.", mood: "wow" },
      { text: "Or a number.", mood: "ready" },
      { text: "Then say why it matters to them.", mood: "ready" },
      { text: "Here’s how I’d open a talk on gardening.", mood: "happy", tag: "[cheerful]" },
      { text: "“Last spring, I killed eleven tomato plants.”", mood: "wow", tag: "[playful]" },
      { text: "“Here’s what the twelfth one taught me.”", mood: "happy" },
      { text: "Your name can wait till after.", mood: "ready", tag: "[warm]" },
      { text: "And learn those first lines by heart. Nerves peak at the start.", mood: "closed", tag: "[calm]" },
      { text: "Hook first. Then why it matters.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // How talks start
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "Hi…" } },
      // Throat-clearing, then a hook
      { from: 1, to: 3, ground: "art-plum", visual: { kind: "contrast", instead: "“Hi, I’m Sam, and today I’ll talk about…”", tryThis: "“Last night, a third of you slept under six hours.”", tryAt: 3 } },
      // Three kinds of hook
      { from: 4, to: 7, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "?", label: "A question", at: 4 }, { sign: "!", label: "A moment", at: 5 }, { sign: "11", label: "A number", at: 6 }] } },
      // The blob's own opening
      { from: 8, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My opening", quote: "“Last spring, I killed eleven tomato plants.”" } },
      // Name later, opening by heart
      { from: 11, to: 13, ground: "art-leaf", visual: { kind: "tile" } },
    ],
    close: { heading: "Your first line", items: [{ sign: "?", label: "A question" }, { sign: "!", label: "A moment" }, { sign: "11", label: "A number" }], action: "Learn your opening by heart" },
  },
  // Lesson 3, Close on purpose: come back to the start, questions before the last line, with the blob's close for the gardening talk
  {
    id: "ready-by-the-day-close",
    partId: "rd-close-1",
    label: "Ready by the day · Lesson 3",
    tile: "close-on-purpose",
    title: "Come back to the start",
    lines: [
      { text: "How does your talk end?", mood: "up", tag: "[curious]" },
      { text: "Too often, it just fades out.", mood: "worried" },
      { text: "“So, yeah, that’s it. Any questions?”", mood: "worried", tag: "[flat]" },
      { text: "Instead, end where you began.", mood: "ready", tag: "[warm]" },
      { text: "Bring back your opening: the question, the moment or the number.", mood: "ready" },
      { text: "It tells them the talk is complete.", mood: "happy" },
      { text: "Here’s mine, from that gardening talk.", mood: "happy", tag: "[cheerful]" },
      { text: "I opened with eleven dead tomato plants.", mood: "ready", tag: "[playful]" },
      { text: "So I close: “Twelve plants. One survivor. Go and grow something.”", mood: "happy" },
      { text: "And take questions before your close, not after.", mood: "ready", tag: "[warm]" },
      { text: "Then your last line, a pause, and “Thank you.”", mood: "happy" },
      { text: "The last word should be yours.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // How it ends
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // Fading out
      { from: 1, to: 2, ground: "art-plum", visual: { kind: "struck", text: "So, yeah…" } },
      // Back to the start
      { from: 3, to: 5, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own close
      { from: 6, to: 8, ground: "art-bloom", visual: { kind: "example", title: "My last line", quote: "“Twelve plants. One survivor. Go and grow something.”" } },
      // The order at the end
      { from: 9, to: 10, ground: "art-sky", visual: { kind: "steps", items: [{ label: "Questions", at: 9 }, { label: "Last line", at: 10 }, { label: "Pause", at: 10 }, { label: "Thank you", at: 10 }] } },
      // Yours
      { from: 11, to: 11, ground: "art-coral", visual: { kind: "bubble", text: "Fin" } },
    ],
    close: { heading: "End on purpose", items: [{ sign: "1", label: "Echo the start" }, { sign: "?", label: "Questions first" }, { sign: "!", label: "Last word yours" }], action: "Plan your last line now" },
  },
  // Lesson 4, Off the page: the memory ladder and signposts, with the blob's three keywords for a toast
  {
    id: "ready-by-the-day-ladder",
    partId: "rd-ladder-1",
    label: "Ready by the day · Lesson 4",
    tile: "memory-ladder",
    title: "The memory ladder",
    lines: [
      { text: "Reading a script out loud?", mood: "up", tag: "[curious]" },
      { text: "It sounds like reading. People can tell.", mood: "worried" },
      { text: "So climb down a ladder instead.", mood: "ready", tag: "[warm]" },
      { text: "Rung one: the full script.", mood: "ready" },
      { text: "Rung two: a few keywords for each part.", mood: "ready" },
      { text: "Rung three: nothing at all.", mood: "wow" },
      { text: "Each rung is harder. That’s what makes it stick.", mood: "happy", tag: "[thoughtful]" },
      { text: "Here’s mine, for a two-minute toast.", mood: "happy", tag: "[cheerful]" },
      { text: "Three keywords: met at uni, the flat fire, raise a glass.", mood: "ready" },
      { text: "And the whole toast comes back.", mood: "happy" },
      { text: "Then mark your way: “First… The second thing… Finally.”", mood: "ready", tag: "[warm]" },
      { text: "Signposts keep them with you, and you on track.", mood: "happy" },
      { text: "Today, try your talk from keywords only.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Reading aloud
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // The ladder
      { from: 2, to: 2, ground: "art-plum", visual: { kind: "tile" } },
      // Its three rungs
      { from: 3, to: 6, ground: "art-sun", visual: { kind: "steps", items: [{ label: "Full script", at: 3 }, { label: "Keywords", at: 4 }, { label: "Nothing", at: 5 }] } },
      // The blob's own keywords
      { from: 7, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My keywords", quote: "Met at uni · The flat fire · Raise a glass" } },
      // Signposts
      { from: 10, to: 12, ground: "art-coral", visual: { kind: "list", title: "Signposts", items: [{ label: "1", text: "“First…”", at: 10 }, { label: "2", text: "“The second thing…”", at: 10 }, { label: "3", text: "“Finally…”", at: 10 }] } },
    ],
    close: { heading: "Off the page", items: [{ sign: "1", label: "Full script" }, { sign: "2", label: "Keywords" }, { sign: "3", label: "Nothing" }], action: "Try it from keywords only" },
  },
  // Lesson 5, Nerves on the day: they can't see most of it, a warm-up and a way back if it wobbles, with the blob's last minute before a talk
  {
    id: "ready-by-the-day-nerves",
    partId: "rd-nerves-1",
    label: "Ready by the day · Lesson 5",
    tile: "nerves-on-the-day",
    title: "They can’t see most of it",
    lines: [
      { text: "Heart racing before you speak?", mood: "worried", tag: "[curious]" },
      { text: "Here’s something that helps.", mood: "ready", tag: "[warm]" },
      { text: "You look far less nervous than you feel.", mood: "happy" },
      { text: "Speakers rate their nerves far higher than audiences do.", mood: "ready" },
      { text: "Just knowing that made them calmer, and their talks were rated better.", mood: "happy" },
      { text: "Here’s what I do before a talk.", mood: "happy", tag: "[cheerful]" },
      { text: "I drop my shoulders and take one slow breath.", mood: "closed", tag: "[calm]" },
      { text: "Then I tell myself, by name: “Blob, you know this.”", mood: "ready" },
      { text: "And if it wobbles on the day?", mood: "up", tag: "[curious]" },
      { text: "Pause. Breathe. Say your last point again.", mood: "closed", tag: "[calm]" },
      { text: "Then carry on. Most people won’t even notice.", mood: "happy" },
      { text: "They see far less than you feel.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The racing heart
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "!" } },
      // Less than you feel
      { from: 2, to: 2, ground: "art-leaf", visual: { kind: "tile" } },
      // What you think, and what is true
      { from: 3, to: 4, ground: "art-plum", visual: { kind: "contrast", instead: "“Everyone can see how nervous I am.”", tryThis: "“They can’t see most of this.”", tryAt: 4 } },
      // The blob's own last minute
      { from: 5, to: 7, ground: "art-bloom", visual: { kind: "example", title: "My last minute", quote: "Shoulders down. One breath. “Blob, you know this.”" } },
      // If it wobbles
      { from: 8, to: 10, ground: "art-sun", visual: { kind: "steps", items: [{ label: "Pause", at: 9 }, { label: "Breathe", at: 9 }, { label: "Last point", at: 9 }] } },
      // Less than you feel
      { from: 11, to: 11, ground: "art-coral", visual: { kind: "bubble", text: "phew" } },
    ],
    close: { heading: "Before you speak", items: [{ sign: "tick", label: "Shoulders down" }, { sign: "1", label: "One slow breath" }, { sign: "!", label: "Coach by name" }], action: "Breathe, then your first line" },
  },
  // Lesson 6, The dress rehearsal: stand up and time it, then one trusted listener, with the blob's own dry run
  {
    id: "ready-by-the-day-dress",
    partId: "rd-dress-1",
    label: "Ready by the day · Lesson 6",
    tile: "dress-rehearsal",
    title: "Stand up and time it",
    lines: [
      { text: "Rehearsing your talk in your head?", mood: "up", tag: "[curious]" },
      { text: "It always feels shorter than it is.", mood: "ready" },
      { text: "So rehearse it the way you’ll give it.", mood: "ready", tag: "[warm]" },
      { text: "Stand up.", mood: "ready" },
      { text: "Use your full voice.", mood: "happy" },
      { text: "And time the whole thing.", mood: "ready" },
      { text: "If it runs long, cut a point. Don’t plan to speak faster.", mood: "ready" },
      { text: "Here’s my dry run from last week.", mood: "happy", tag: "[cheerful]" },
      { text: "Four minutes over. So I cut my second story.", mood: "wow" },
      { text: "It hurt. The talk got better.", mood: "happy" },
      { text: "Then give it once to someone you trust.", mood: "ready", tag: "[warm]" },
      { text: "Ask them what they remember,", mood: "ready" },
      { text: "and where they drifted.", mood: "ready" },
      { text: "That’s your message check, and your cutting list.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // In your head
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // The way you'll give it
      { from: 2, to: 2, ground: "art-leaf", visual: { kind: "tile" } },
      // Stand, voice, time
      { from: 3, to: 6, ground: "art-sun", visual: { kind: "steps", items: [{ label: "Stand up", at: 3 }, { label: "Full voice", at: 4 }, { label: "Time it", at: 5 }] } },
      // The blob's own dry run
      { from: 7, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My dry run", quote: "Four minutes over. I cut my second story." } },
      // One trusted listener
      { from: 10, to: 13, ground: "art-plum", visual: { kind: "cards", items: [{ sign: "!", label: "What they remember", at: 11 }, { sign: "?", label: "Where they drifted", at: 12 }] } },
    ],
    close: { heading: "Dress rehearsal", items: [{ sign: "tick", label: "Stand and time it" }, { sign: "1", label: "One listener" }], action: "Do one full run today" },
  },
];
