// Listen like you mean it's lesson clips (decision 155): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const LISTEN_LIKE_YOU_MEAN_IT_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, React to the moment: a specific reaction beats "mm-hmm", with the blob's neighbour and her keys
  {
    id: "listen-like-you-mean-it-moment",
    partId: "ll-moment-1",
    label: "Listen like you mean it · Lesson 1",
    tile: "react-to-the-moment",
    title: "Specific beats “mm-hmm”",
    lines: [
      { text: "When a friend tells you a story, what do you say?", mood: "up", tag: "[curious]" },
      { text: "“Mm-hmm. Oh, nice. Yeah.”", mood: "ready", tag: "[playful]" },
      { text: "Those help, a little.", mood: "ready" },
      { text: "But storytellers tell it better when you react to one exact moment.", mood: "ready", tag: "[thoughtful]" },
      { text: "So listen for the moment that surprised you.", mood: "happy", tag: "[warm]" },
      { text: "And react to that.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "My neighbour told me she lost her keys at the beach.", mood: "ready" },
      { text: "A boy found them in the sand, and ran half a mile to catch her.", mood: "wow" },
      { text: "I said, “He ran half a mile? For your keys?”", mood: "wow" },
      { text: "She laughed, and told me the rest.", mood: "happy" },
      { text: "One exact moment beats a general “nice”.", mood: "ready", tag: "[confident]" },
      { text: "Next story you hear, catch the moment, and say it back.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "mm-hmm" } },
      // General, then specific
      { from: 2, to: 3, ground: "art-plum", visual: { kind: "contrast", instead: "“Mm-hmm. Oh, nice.”", tryThis: "“Wait, he ran half a mile?”", tryAt: 3 } },
      // The lesson's name
      { from: 4, to: 5, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own neighbour
      { from: 6, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My moment", quote: "“He ran half a mile? For your keys?”" } },
      // What to do
      { from: 11, to: 12, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Catch the moment", at: 11 }, { label: "Say it back", at: 12 }] } },
    ],
    close: { heading: "When they tell a story", items: [{ sign: "!", label: "Catch the moment" }, { sign: "?", label: "React to that" }], action: "React to one exact moment today" },
  },
  // Lesson 2, Their words, their feeling: the feeling under the facts, with the blob's friend and her cake
  {
    id: "listen-like-you-mean-it-feeling",
    partId: "ll-feeling-1",
    label: "Listen like you mean it · Lesson 2",
    tile: "their-feeling",
    title: "The feeling, not the facts",
    lines: [
      { text: "Someone tells you something hard.", mood: "ready", tag: "[thoughtful]" },
      { text: "And you say back the facts.", mood: "ready" },
      { text: "“So you walked the last mile.”", mood: "worried", tag: "[playful]" },
      { text: "It’s accurate. But it can sound like a technique.", mood: "worried" },
      { text: "On its own, repeating the facts doesn’t make people feel understood.", mood: "ready", tag: "[thoughtful]" },
      { text: "So what does?", mood: "up", tag: "[curious]" },
      { text: "Showing you got how it felt.", mood: "happy", tag: "[warm]" },
      { text: "Take one of their words, then name the feeling under it.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "A friend told me her cake collapsed an hour before the party.", mood: "ready" },
      { text: "I said, “An hour before? That must have been a sinking feeling.”", mood: "worried" },
      { text: "She said, “Sinking is exactly it!”", mood: "happy" },
      { text: "Then she told me how she saved it.", mood: "happy" },
      { text: "Their word, then their feeling.", mood: "ready", tag: "[warm]" },
      { text: "Try it the next time someone tells you their news.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Something hard
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // Only the facts
      { from: 2, to: 4, ground: "art-coral", visual: { kind: "struck", text: "JUST THE FACTS" } },
      // The lesson's name
      { from: 5, to: 7, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own friend
      { from: 8, to: 12, ground: "art-bloom", visual: { kind: "example", title: "What I said", quote: "“An hour before? That must have been a sinking feeling.”" } },
      // What to do
      { from: 13, to: 14, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Their word", at: 13 }, { label: "Their feeling", at: 13 }] } },
    ],
    close: { heading: "Say it back", items: [{ sign: "1", label: "One of their words" }, { sign: "2", label: "Name the feeling" }], action: "Say back a feeling, not a fact" },
  },
  // Lesson 3, Stay on their story: support, don't shift, with the blob's train story kept for later
  {
    id: "listen-like-you-mean-it-stay",
    partId: "ll-stay-1",
    label: "Listen like you mean it · Lesson 3",
    tile: "stay-on-their-story",
    title: "Support, don’t shift",
    lines: [
      { text: "Your friend says, “I got lost hiking on Sunday.”", mood: "ready", tag: "[curious]" },
      { text: "And you say, “Oh, me too! Once, in the hills…”", mood: "happy", tag: "[playful]" },
      { text: "It feels like connecting.", mood: "ready" },
      { text: "But the story just moved to you.", mood: "worried", tag: "[thoughtful]" },
      { text: "That’s a shift.", mood: "worried" },
      { text: "A support stays with them.", mood: "ready", tag: "[warm]" },
      { text: "It asks what happened next.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "A colleague told me his train broke down in a tunnel.", mood: "ready" },
      { text: "I had a train story ready. A good one.", mood: "wow", tag: "[playful]" },
      { text: "I kept it, and asked, “How long were you stuck?”", mood: "ready" },
      { text: "Forty minutes, it turned out, and a stranger shared her snacks.", mood: "happy" },
      { text: "My story can wait. His was better anyway.", mood: "happy", tag: "[cheerful]" },
      { text: "Next time you feel a “me too” coming,", mood: "ready", tag: "[warm]" },
      { text: "ask one more question first.", mood: "happy" },
    ],
    beats: [
      // The "me too"
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "me too!" } },
      // The shift
      { from: 2, to: 4, ground: "art-coral", visual: { kind: "struck", text: "SHIFT" } },
      // The lesson's name
      { from: 5, to: 6, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own colleague
      { from: 7, to: 12, ground: "art-bloom", visual: { kind: "example", title: "What I asked", quote: "“How long were you stuck?”" } },
      // What to do
      { from: 13, to: 14, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Spot the me too", at: 13 }, { label: "Ask one more", at: 14 }] } },
    ],
    close: { heading: "Stay on their story", items: [{ sign: "?", label: "Ask what next" }, { sign: "…", label: "Save yours" }], action: "Catch one “me too” today" },
  },
  // Lesson 4, Hold the advice: understood before advice, with the blob's brother and his flat
  {
    id: "listen-like-you-mean-it-advice",
    partId: "ll-advice-1",
    label: "Listen like you mean it · Lesson 4",
    tile: "hold-the-advice",
    title: "Hold the fix",
    lines: [
      { text: "Someone tells you about a problem.", mood: "ready", tag: "[thoughtful]" },
      { text: "And you know just how to fix it.", mood: "happy", tag: "[playful]" },
      { text: "“Have you tried…?”", mood: "ready" },
      { text: "It feels kind. It might even be right.", mood: "ready" },
      { text: "But in a study comparing the two,", mood: "ready", tag: "[thoughtful]" },
      { text: "being listened to made people feel more understood than advice did.", mood: "up" },
      { text: "So hold the fix.", mood: "happy", tag: "[warm]" },
      { text: "Show you got it, then ask about them.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "My brother said his landlord was selling his flat.", mood: "worried" },
      { text: "I had three ideas before he’d finished.", mood: "wow", tag: "[playful]" },
      { text: "Instead I said, “Oh no. You love that place. How are you feeling?”", mood: "ready", tag: "[warm]" },
      { text: "He talked for ten minutes. Then he asked what I thought.", mood: "happy" },
      { text: "That’s when advice is welcome.", mood: "happy", tag: "[confident]" },
      { text: "Next time, ask one question before any fix.", mood: "ready", tag: "[warm]" },
    ],
    beats: [
      // The problem
      { from: 0, to: 1, ground: "art-plum", visual: { kind: "bubble", text: "!" } },
      // The quick fix
      { from: 2, to: 5, ground: "art-coral", visual: { kind: "struck", text: "HAVE YOU TRIED…" } },
      // The lesson's name
      { from: 6, to: 7, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own brother
      { from: 8, to: 13, ground: "art-bloom", visual: { kind: "example", title: "What I said", quote: "“Oh no. You love that place. How are you feeling?”" } },
      // What to do
      { from: 14, to: 14, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Ask first", at: 14 }, { label: "Fix if asked", at: 14 }] } },
    ],
    close: { heading: "Before any advice", items: [{ sign: "1", label: "Show you got it" }, { sign: "?", label: "Ask about them" }], action: "Ask one question before any fix" },
  },
  // Lesson 5, Ask about what mattered: the follow-up that goes to the heart of it, with the blob's friend at the open mic
  {
    id: "listen-like-you-mean-it-matter",
    partId: "ll-matter-1",
    label: "Listen like you mean it · Lesson 5",
    tile: "ask-what-mattered",
    title: "Find the heart of it",
    lines: [
      { text: "Most stories have one part that matters to the teller.", mood: "ready", tag: "[thoughtful]" },
      { text: "And lots of side facts.", mood: "ready" },
      { text: "Ask about a side fact, and the story goes flat.", mood: "worried" },
      { text: "“What time was that?”", mood: "worried", tag: "[playful]" },
      { text: "Ask about the part that mattered, and it opens up.", mood: "happy", tag: "[warm]" },
      { text: "People who ask follow-up questions are liked more.", mood: "ready" },
      { text: "The best ones go to the heart of it.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "A friend told me about her first time singing at an open mic.", mood: "ready" },
      { text: "The room was half empty, the mic squeaked,", mood: "ready" },
      { text: "and her dad was in the front row.", mood: "wow" },
      { text: "I asked, “Your dad came? What did he say after?”", mood: "up", tag: "[curious]" },
      { text: "Her whole face changed.", mood: "happy" },
      { text: "Listen for the part they care about.", mood: "ready", tag: "[warm]" },
      { text: "Then ask about that.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Side facts, then the heart
      { from: 0, to: 4, ground: "art-sky", visual: { kind: "contrast", instead: "“What time was that?”", tryThis: "“Wait, how did that feel?”", tryAt: 4 } },
      // The lesson's name
      { from: 5, to: 6, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own friend
      { from: 7, to: 12, ground: "art-bloom", visual: { kind: "example", title: "What I asked", quote: "“Your dad came? What did he say after?”" } },
      // What to do
      { from: 13, to: 14, ground: "art-coral", visual: { kind: "steps", items: [{ label: "Hear what counts", at: 13 }, { label: "Ask about that", at: 14 }] } },
    ],
    close: { heading: "The heart of it", items: [{ sign: "1", label: "Hear what mattered" }, { sign: "?", label: "Ask about that" }], action: "Ask about the part that mattered" },
  },
];
