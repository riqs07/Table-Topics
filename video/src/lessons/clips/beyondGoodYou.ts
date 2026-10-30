// Beyond “good, you?”'s lesson clips (decision 147): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const BEYOND_GOOD_YOU_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, Answer with a hook: past the one-word answer, with the blob's own weekend
  {
    id: "beyond-good-you-hook",
    partId: "bg-hook-1",
    label: "Beyond “good, you?” · Lesson 1",
    tile: "answer-with-a-hook",
    title: "The dead end",
    lines: [
      { text: "Someone asks, “How was your weekend?”", mood: "ready", tag: "[curious]" },
      { text: "And you say, “Good, you?”", mood: "worried", tag: "[flat]" },
      { text: "That closes the door, and hands the work back.", mood: "ready", tag: "[warm]" },
      { text: "Instead, answer with a hook.", mood: "happy", tag: "[cheerful]" },
      { text: "One thing that happened, with a detail they can ask about.", mood: "ready" },
      { text: "A name.", mood: "wow" },
      { text: "A place.", mood: "ready" },
      { text: "Or a number.", mood: "happy" },
      { text: "Here’s mine from last weekend.", mood: "happy", tag: "[cheerful]" },
      { text: "“Good, actually. I tried the climbing wall on King Street, and got stuck halfway up.”", mood: "ready" },
      { text: "Now they’ve got two things to ask about.", mood: "happy" },
      { text: "Then hand it back: “Have you ever tried it?”", mood: "ready", tag: "[warm]" },
      { text: "Next time someone asks, give them one thing to grab.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The dead end, then the hook
      { from: 2, to: 3, ground: "art-plum", visual: { kind: "contrast", instead: "“Good, you?”", tryThis: "“Good, actually. I tried the climbing wall.”", tryAt: 3 } },
      // The lesson
      { from: 4, to: 4, ground: "art-leaf", visual: { kind: "tile" } },
      // The kinds of detail
      { from: 5, to: 7, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "Sam", label: "A name", at: 5 }, { sign: "St", label: "A place", at: 6 }, { sign: "3", label: "A number", at: 7 }] } },
      // The blob's own answer
      { from: 8, to: 11, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "Climbing wall, King Street. Stuck halfway up!" } },
      // The habit
      { from: 12, to: 12, ground: "art-coral", visual: { kind: "bubble", text: "hook" } },
    ],
    close: { heading: "Next time, add a hook", items: [{ sign: "1", label: "One moment" }, { sign: "Sam", label: "A detail to ask" }, { sign: "?", label: "Hand it back" }], action: "Give them one thing to grab" },
  },
  // Lesson 2, Ask the second question: the follow-up is in what they just said, with the blob's Lisbon question
  {
    id: "beyond-good-you-ask",
    partId: "bg-ask-1",
    label: "Beyond “good, you?” · Lesson 2",
    tile: "second-question",
    title: "Follow their detail",
    lines: [
      { text: "Ever stuck for what to say next?", mood: "up", tag: "[curious]" },
      { text: "The next question is usually hiding in plain sight.", mood: "ready", tag: "[warm]" },
      { text: "It’s in what they just said.", mood: "happy" },
      { text: "People who ask follow-up questions are liked more.", mood: "ready" },
      { text: "So listen for one detail, and ask about it.", mood: "ready" },
      { text: "Here’s one I had yesterday.", mood: "happy", tag: "[cheerful]" },
      { text: "My neighbour said, “I just got back from Lisbon.”", mood: "ready" },
      { text: "I nearly said, “Oh, I went to Spain once.”", mood: "worried", tag: "[playful]" },
      { text: "Instead I asked, “What took you to Lisbon?”", mood: "happy" },
      { text: "Twenty minutes later, I knew all about her sister’s café.", mood: "wow" },
      { text: "Ask one open question.", mood: "ready", tag: "[warm]" },
      { text: "One at a time.", mood: "ready" },
      { text: "And keep it about them.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Stuck
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // The lesson: the question is in what they said
      { from: 1, to: 4, ground: "art-plum", visual: { kind: "tile" } },
      // The blob's neighbour
      { from: 5, to: 6, ground: "art-bloom", visual: { kind: "example", title: "What she said", quote: "“I just got back from Lisbon.”" } },
      // About me, then about her
      { from: 7, to: 9, ground: "art-sun", visual: { kind: "contrast", instead: "“Oh, I went to Spain once.”", tryThis: "“What took you to Lisbon?”", tryAt: 8 } },
      // How to ask
      { from: 10, to: 12, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "One open question", at: 10 }, { label: "One at a time", at: 11 }, { label: "About them", at: 12 }] } },
    ],
    close: { heading: "Your next question", items: [{ sign: "?", label: "One detail" }, { sign: "1", label: "One question" }, { sign: "tick", label: "About them" }], action: "Ask about what they just said" },
  },
  // Lesson 3, Listen out loud: react to the story, with the blob's friend in the rain
  {
    id: "beyond-good-you-listen",
    partId: "bg-listen-1",
    label: "Beyond “good, you?” · Lesson 3",
    tile: "listen-out-loud",
    title: "React to the story",
    lines: [
      { text: "When someone tells you a story, what do you do?", mood: "up", tag: "[curious]" },
      { text: "Most of us wait for our turn.", mood: "ready" },
      { text: "But listeners shape the story.", mood: "ready", tag: "[warm]" },
      { text: "React as it happens, and they tell it better.", mood: "happy" },
      { text: "A wince.", mood: "wow" },
      { text: "A laugh.", mood: "happy" },
      { text: "A “wait, really?”", mood: "wow" },
      { text: "Last week my friend told me her car broke down in the rain.", mood: "ready", tag: "[cheerful]" },
      { text: "I said, “Two hours? In the rain? That sounds miserable.”", mood: "worried" },
      { text: "And then, “Who stopped to help?”", mood: "ready" },
      { text: "She lit up, and told me the whole thing.", mood: "happy" },
      { text: "React first. Ask about the moment.", mood: "ready", tag: "[warm]" },
      { text: "Your own story can wait.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The lesson
      { from: 2, to: 3, ground: "art-plum", visual: { kind: "tile" } },
      // Three ways to react
      { from: 4, to: 6, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "Ow", label: "A wince", at: 4 }, { sign: "Ha", label: "A laugh", at: 5 }, { sign: "?!", label: "“Wait, really?”", at: 6 }] } },
      // The blob's friend
      { from: 7, to: 10, ground: "art-bloom", visual: { kind: "example", title: "What I said", quote: "“Two hours? In the rain? That sounds miserable.”" } },
      // What to do
      { from: 11, to: 12, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "React first", at: 11 }, { label: "Ask about it", at: 11 }, { label: "Save your story", at: 12 }] } },
    ],
    close: { heading: "When they tell a story", items: [{ sign: "Ha", label: "React" }, { sign: "?", label: "Ask about it" }, { sign: "…", label: "Save yours" }], action: "React before you share yours" },
  },
  // Lesson 4, One level deeper: from what to why, with the blob's bakery question
  {
    id: "beyond-good-you-deeper",
    partId: "bg-deep-1",
    label: "Beyond “good, you?” · Lesson 4",
    tile: "one-level-deeper",
    title: "From what to why",
    lines: [
      { text: "Ever feel stuck on the surface?", mood: "up", tag: "[curious]" },
      { text: "“How long have you lived here?” “Three years.”", mood: "ready" },
      { text: "And that’s that.", mood: "worried" },
      { text: "Fact questions get facts.", mood: "ready", tag: "[warm]" },
      { text: "Ask why, or how it felt, and you get a story.", mood: "happy" },
      { text: "Deeper talk goes better than people expect.", mood: "ready" },
      { text: "For both of you.", mood: "happy" },
      { text: "Here’s mine from a class last month.", mood: "happy", tag: "[cheerful]" },
      { text: "Someone said they’d moved here from the coast.", mood: "ready" },
      { text: "I asked, “What made you choose here?”", mood: "ready" },
      { text: "She laughed and said, “Honestly? A really good bakery.”", mood: "wow" },
      { text: "And we talked for an hour.", mood: "happy" },
      { text: "So swap one fact question for a why.", mood: "ready", tag: "[warm]" },
    ],
    beats: [
      // Stuck
      { from: 0, to: 2, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // A fact question, then a why
      { from: 3, to: 4, ground: "art-plum", visual: { kind: "contrast", instead: "“How long have you lived here?”", tryThis: "“What made you choose here?”", tryAt: 4 } },
      // The lesson
      { from: 5, to: 6, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's why question
      { from: 7, to: 11, ground: "art-bloom", visual: { kind: "example", title: "My why question", quote: "“What made you choose here?” “A good bakery.”" } },
      // The habit
      { from: 12, to: 12, ground: "art-coral", visual: { kind: "bubble", text: "why?" } },
    ],
    close: { heading: "Go one level deeper", items: [{ sign: "?", label: "Ask why" }, { sign: "tick", label: "Ask how it felt" }, { sign: "…", label: "Share a little" }], action: "Swap one fact question for a why" },
  },
  // Lesson 5, Start and leave well: an easy way in and a warm way out, with how the blob left a party chat
  {
    id: "beyond-good-you-edges",
    partId: "bg-edge-1",
    label: "Beyond “good, you?” · Lesson 5",
    tile: "start-and-leave",
    title: "Open on what’s around you",
    lines: [
      { text: "Starting a chat can feel hard.", mood: "worried", tag: "[curious]" },
      { text: "Leaving one can feel harder.", mood: "worried" },
      { text: "Here’s the easy way in.", mood: "ready", tag: "[warm]" },
      { text: "Start with something you can both see.", mood: "happy" },
      { text: "The slow kettle.", mood: "ready" },
      { text: "The new menu.", mood: "ready" },
      { text: "The puppy.", mood: "happy" },
      { text: "And the easy way out.", mood: "ready", tag: "[warm]" },
      { text: "Leave on a high point.", mood: "happy" },
      { text: "Say what you enjoyed.", mood: "ready" },
      { text: "Give a reason to go.", mood: "ready" },
      { text: "Here’s how I left a chat at a party last week.", mood: "happy", tag: "[cheerful]" },
      { text: "“This was great. I’m going to grab some food, but let’s pick this up.”", mood: "happy" },
      { text: "Easy in, warm out.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The worry
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // The lesson
      { from: 2, to: 3, ground: "art-plum", visual: { kind: "tile" } },
      // Openers you can both see
      { from: 4, to: 6, ground: "art-sun", visual: { kind: "list", title: "You can both see", items: [{ label: "1", text: "The slow kettle", at: 4 }, { label: "2", text: "The new menu", at: 5 }, { label: "3", text: "The puppy", at: 6 }] } },
      // The way out
      { from: 7, to: 10, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "A high point", at: 8 }, { label: "What you enjoyed", at: 9 }, { label: "A reason to go", at: 10 }] } },
      // The blob's own exit
      { from: 11, to: 12, ground: "art-bloom", visual: { kind: "example", title: "How I left", quote: "“This was great. Let’s pick this up.”" } },
      // In and out
      { from: 13, to: 13, ground: "art-coral", visual: { kind: "bubble", text: "bye!" } },
    ],
    close: { heading: "Easy in, warm out", items: [{ sign: "1", label: "Something you see" }, { sign: "tick", label: "What you enjoyed" }, { sign: "…", label: "A reason to go" }], action: "Leave while it’s good" },
  },
  // Lesson 6, The run: the whole answer in about thirty seconds, with the blob's bike
  {
    id: "beyond-good-you-run",
    partId: "bg-run-1",
    label: "Beyond “good, you?” · Lesson 6",
    tile: "whole-conversation",
    title: "All together",
    lines: [
      { text: "Let’s put it all together.", mood: "happy", tag: "[cheerful]" },
      { text: "Someone asks, “How was your week?”", mood: "ready", tag: "[curious]" },
      { text: "Here’s how I’d answer.", mood: "happy", tag: "[warm]" },
      { text: "“Busy, but fun. I finally fixed my bike.”", mood: "happy" },
      { text: "“It took three videos and one very patient neighbour.”", mood: "wow" },
      { text: "“Honestly, I felt like a genius.”", mood: "happy" },
      { text: "“Have you ever fixed anything yourself?”", mood: "ready" },
      { text: "One moment.", mood: "happy", tag: "[warm]" },
      { text: "A detail to ask about.", mood: "ready" },
      { text: "How it felt.", mood: "happy" },
      { text: "And a question back.", mood: "ready" },
      { text: "All in about thirty seconds.", mood: "wow" },
      { text: "Then listen for their details, and follow one.", mood: "ready", tag: "[warm]" },
      { text: "That’s a conversation.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The blob's answer
      { from: 2, to: 6, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "Busy, but fun. I finally fixed my bike." } },
      // The four beats of an answer
      { from: 7, to: 11, ground: "art-sun", visual: { kind: "steps", items: [{ label: "One moment", at: 7 }, { label: "A detail", at: 8 }, { label: "How it felt", at: 9 }, { label: "A question back", at: 10 }] } },
      // The lesson: back and forth
      { from: 12, to: 13, ground: "art-leaf", visual: { kind: "tile" } },
    ],
    close: { heading: "Put it together", items: [{ sign: "1", label: "One moment" }, { sign: "?", label: "A detail to ask" }, { sign: "tick", label: "A question back" }], action: "Then follow one of their details" },
  },
];
