// The tough question's lesson clips (decision 155): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const THE_TOUGH_QUESTION_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, Say it back: say a sharp question back in calm words, with the blob's own "So, why change it?"
  {
    id: "the-tough-question-back",
    partId: "tq-back-1",
    label: "The tough question · Lesson 1",
    tile: "say-it-back",
    title: "Take the edge off",
    lines: [
      { text: "Someone asks you a question with an edge.", mood: "wow", tag: "[curious]" },
      { text: "“Why would anyone pay for this?”", mood: "worried", tag: "[playful]" },
      { text: "And you snap back, a bit too fast.", mood: "worried" },
      { text: "Here’s a better first move.", mood: "ready", tag: "[warm]" },
      { text: "Say it back, in calm words.", mood: "ready", tag: "[calm]" },
      { text: "Without the jab.", mood: "ready" },
      { text: "It buys you a moment, and checks you heard it right.", mood: "ready", tag: "[thoughtful]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "After my talk, someone asked why we’d bothered with the new plan.", mood: "ready" },
      { text: "I said: “So, why change it? Fair question.”", mood: "closed" },
      { text: "One breath, and my answer was ready.", mood: "happy" },
      { text: "Next time a question has an edge,", mood: "ready", tag: "[warm]" },
      { text: "say it back first, then answer.", mood: "happy", tag: "[confident]" },
    ],
    beats: [
      // The sharp question
      { from: 0, to: 1, ground: "art-plum", visual: { kind: "bubble", text: "?!" } },
      // Snapping back, then saying it back
      { from: 2, to: 3, ground: "art-coral", visual: { kind: "contrast", instead: "“Why pay? Well, um, obviously…”", tryThis: "“So: why pay? (a breath) Here’s why.”", tryAt: 3 } },
      // The lesson's name
      { from: 4, to: 6, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own answer
      { from: 7, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "“So, why change it?” (a breath) Then the answer." } },
      // What to do
      { from: 11, to: 12, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Say it back", at: 11 }, { label: "Then answer", at: 12 }] } },
    ],
    close: { heading: "A sharp question", items: [{ sign: "1", label: "Say it back" }, { sign: "2", label: "Take a breath" }, { sign: "3", label: "Answer it" }], action: "Say it back first, then answer" },
  },
  // Lesson 2, Find the doubt: hear the worry under the words, with the blob's own gym question
  {
    id: "the-tough-question-doubt",
    partId: "tq-doubt-1",
    label: "The tough question · Lesson 2",
    tile: "find-the-doubt",
    title: "Hear the worry",
    lines: [
      { text: "Some questions sound like an attack.", mood: "worried", tag: "[curious]" },
      { text: "“Isn’t this a waste of money?”", mood: "worried" },
      { text: "But listen under the words.", mood: "ready", tag: "[thoughtful]" },
      { text: "There’s usually a worry.", mood: "ready" },
      { text: "Here, it’s: is it worth it?", mood: "up" },
      { text: "So find the doubt, and answer that.", mood: "happy", tag: "[confident]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "A friend asked why I’d ever pay for a gym.", mood: "ready" },
      { text: "The worry was the cost, so I said:", mood: "ready" },
      { text: "“You’re wondering if it’s worth it. I go four times a week.”", mood: "happy" },
      { text: "No defending. Just the worry, answered.", mood: "happy" },
      { text: "Next time a question stings,", mood: "ready", tag: "[warm]" },
      { text: "ask yourself: what are they worried about?", mood: "up" },
    ],
    beats: [
      // The question that sounds like an attack
      { from: 0, to: 1, ground: "art-plum", visual: { kind: "bubble", text: "?!" } },
      // The words, and the worry under them
      { from: 2, to: 4, ground: "art-sky", visual: { kind: "cards", items: [{ sign: "?", label: "The words", at: 2 }, { sign: "!", label: "The worry", at: 3 }] } },
      // The lesson's name
      { from: 5, to: 5, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own answer
      { from: 6, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "“You’re wondering if it’s worth it.”" } },
      // What to ask yourself
      { from: 11, to: 12, ground: "art-coral", visual: { kind: "list", title: "Ask yourself", items: [{ label: "What’s the worry?", at: 11 }, { label: "Answer that", at: 12 }] } },
    ],
    close: { heading: "Find the doubt", items: [{ sign: "?", label: "Hear the words" }, { sign: "!", label: "Find the worry" }, { sign: "tick", label: "Answer that" }], action: "Answer the worry, not just the words" },
  },
  // Lesson 3, Agree with what's true: the fair part first, then where you differ, with the blob's own audiobooks
  {
    id: "the-tough-question-agree",
    partId: "tq-agree-1",
    label: "The tough question · Lesson 3",
    tile: "agree-then-differ",
    title: "Give them the fair part",
    lines: [
      { text: "Someone pushes back on what you said.", mood: "wow", tag: "[curious]" },
      { text: "Your first urge? “No, that’s wrong.”", mood: "worried", tag: "[playful]" },
      { text: "But there’s usually something fair in what they said.", mood: "ready", tag: "[thoughtful]" },
      { text: "Say that part first.", mood: "ready" },
      { text: "Then give your view, with one reason.", mood: "happy", tag: "[confident]" },
      { text: "Agree with what’s true. Then differ, calmly.", mood: "ready", tag: "[calm]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "A friend said audiobooks aren’t real reading.", mood: "ready" },
      { text: "I said: “You’re right, it’s easier to drift off.”", mood: "ready" },
      { text: "“But I still finish more books that way.”", mood: "happy" },
      { text: "We laughed, and kept talking.", mood: "happy" },
      { text: "People who disagree this way get heard more.", mood: "ready", tag: "[warm]" },
      { text: "Try it next time someone pushes back.", mood: "happy" },
    ],
    beats: [
      // The flat contradiction
      { from: 0, to: 1, ground: "art-plum", visual: { kind: "struck", text: "NO, THAT’S WRONG" } },
      // The fair part, then your view
      { from: 2, to: 4, ground: "art-sky", visual: { kind: "steps", items: [{ label: "The fair part", at: 3 }, { label: "Your view", at: 4 }] } },
      // The lesson's name
      { from: 5, to: 5, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own answer
      { from: 6, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "“You’re right… But I still finish more books.”" } },
      // Heard more
      { from: 11, to: 12, ground: "art-coral", visual: { kind: "bubble", text: "fair" } },
    ],
    close: { heading: "When they push back", items: [{ sign: "tick", label: "What’s fair" }, { sign: "→", label: "Where you differ" }, { sign: "1", label: "One reason" }], action: "Give them the fair part first" },
  },
  // Lesson 4, Say "I don't know" well: no bluffing, with the blob's own missing number
  {
    id: "the-tough-question-unknown",
    partId: "tq-unknown-1",
    label: "The tough question · Lesson 4",
    tile: "admit-it-well",
    title: "Don’t bluff",
    lines: [
      { text: "Someone asks for a number you don’t have.", mood: "wow", tag: "[curious]" },
      { text: "And they’re watching to see if you know.", mood: "worried" },
      { text: "The urge is to guess, and sound sure.", mood: "worried", tag: "[playful]" },
      { text: "But someone testing you will spot a guess.", mood: "ready", tag: "[thoughtful]" },
      { text: "So say it plainly.", mood: "ready", tag: "[calm]" },
      { text: "What you don’t know.", mood: "ready" },
      { text: "What you do know.", mood: "ready" },
      { text: "And how you’ll find out.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "In a meeting, I was asked how many people used our new form.", mood: "ready" },
      { text: "I said: “I don’t have that number.", mood: "closed" },
      { text: "I know it’s more than last month. I’ll check by tomorrow.”", mood: "happy" },
      { text: "Others judge a small admission more kindly than you do.", mood: "ready", tag: "[warm]" },
      { text: "So next time you don’t know, say so, well.", mood: "happy", tag: "[confident]" },
    ],
    beats: [
      // The question you can't answer, and the urge to guess
      { from: 0, to: 3, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The lesson's name
      { from: 4, to: 4, ground: "art-sun", visual: { kind: "tile" } },
      // The three parts of a good "I don't know"
      { from: 5, to: 7, ground: "art-leaf", visual: { kind: "cards", items: [{ sign: "?", label: "What I don’t know", at: 5 }, { sign: "tick", label: "What I do know", at: 6 }, { sign: "→", label: "How I’ll find out", at: 7 }] } },
      // The blob's own answer
      { from: 8, to: 11, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "“I don’t have that number. I’ll check by tomorrow.”" } },
      // A guess, then the honest answer
      { from: 12, to: 13, ground: "art-coral", visual: { kind: "contrast", instead: "“Er, about thirty per cent, I think.”", tryThis: "“I don’t know yet. I’ll find out by tomorrow.”", tryAt: 13 } },
    ],
    close: { heading: "When you don’t know", items: [{ sign: "?", label: "Say so" }, { sign: "tick", label: "What you know" }, { sign: "→", label: "When you’ll know" }], action: "No bluffing: the honest answer" },
  },
  // Lesson 5, Short, then stop: answer in a few sentences and let the silence be the full stop, with the blob's own late project
  {
    id: "the-tough-question-short",
    partId: "tq-short-1",
    label: "The tough question · Lesson 5",
    tile: "short-then-stop",
    title: "Answer, then stop",
    lines: [
      { text: "A question stings.", mood: "worried", tag: "[curious]" },
      { text: "So you explain. And explain. And explain.", mood: "worried", tag: "[playful]" },
      { text: "Until it feels safe.", mood: "worried" },
      { text: "But a long defence sounds less sure, not more.", mood: "ready", tag: "[thoughtful]" },
      { text: "It fills up with hedges and hesitations.", mood: "ready" },
      { text: "So answer in two or three sentences.", mood: "happy", tag: "[confident]" },
      { text: "Then stop.", mood: "closed", tag: "[calm]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "Someone asked why my project ran late.", mood: "ready" },
      { text: "I said: “We added testing. It was worth it. The launch went smoothly.”", mood: "happy" },
      { text: "Then I stopped, and let the silence sit.", mood: "closed" },
      { text: "It felt long to me. To them, it was a full stop.", mood: "happy", tag: "[warm]" },
      { text: "Short answer. Then stop.", mood: "happy", tag: "[confident]" },
    ],
    beats: [
      // Explaining and explaining
      { from: 0, to: 2, ground: "art-plum", visual: { kind: "bubble", text: "…and…" } },
      // The long defence
      { from: 3, to: 4, ground: "art-coral", visual: { kind: "struck", text: "LONG DEFENCE" } },
      // The lesson's name
      { from: 5, to: 6, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own answer
      { from: 7, to: 10, ground: "art-sky", visual: { kind: "example", title: "My answer", quote: "“We added testing. It was worth it.” Then quiet." } },
      // What to do
      { from: 11, to: 12, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Two sentences", at: 11 }, { label: "Then stop", at: 12 }] } },
    ],
    close: { heading: "Short, then stop", items: [{ sign: "1", label: "Answer it" }, { sign: "2", label: "One reason" }, { sign: ".", label: "Then stop" }], action: "Let the silence be the full stop" },
  },
];
